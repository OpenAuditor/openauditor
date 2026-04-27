# Backup and Recovery

> **30-second summary:** Backups are your last line of defence against ransomware, accidental deletion, and catastrophic database corruption. A backup that has never been tested is not a backup — it's a file. Test your restores quarterly.

## The 3-2-1 Backup Rule

- **3** copies of your data
- **2** different storage media or services
- **1** copy offsite (or in a separate cloud region/account)

For SaaS applications, this typically means:
- 1 copy: your primary database (Supabase, Neon, PlanetScale)
- 2nd copy: automated daily backups in the same provider
- 3rd copy: exported backups in a separate cloud account or region

## Backup Strategy by Data Type

| Data Type | Backup Method | Frequency | Retention | RTO | RPO |
|-----------|--------------|-----------|-----------|-----|-----|
| Database (PostgreSQL) | pg_dump or managed backup | Hourly | 30 days | 1 hour | 1 hour |
| File uploads (S3/Storage) | S3 Cross-Region Replication | Continuous | 30 days | 15 min | Minutes |
| Application code | Git (GitHub) | On every commit | Indefinite | Minutes | Minutes |
| Configuration / Secrets | Secrets manager export | Weekly | 90 days | 30 min | 1 week |
| Audit logs | External log service | Continuous | 1 year | 1 hour | Minutes |

**RTO** (Recovery Time Objective): Maximum acceptable downtime  
**RPO** (Recovery Point Objective): Maximum acceptable data loss

## Database Backups

### Supabase

Supabase provides daily PITR (Point-in-Time Recovery) on paid plans:
- Free tier: no PITR
- Pro tier: 7-day PITR
- Team/Enterprise: 30-day PITR

For additional protection, run your own exports:

```bash
#!/bin/bash
# scripts/backup-supabase.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"
S3_BUCKET="your-backup-bucket"

echo "Starting Supabase backup: $DATE"

# Export via pg_dump (use connection pooler URL for backups)
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  --host="${SUPABASE_DB_HOST}" \
  --port=5432 \
  --username="postgres" \
  --dbname="postgres" \
  --no-owner \
  --clean \
  --if-exists \
  --format=custom \
  | gzip > "/tmp/${BACKUP_FILE}"

echo "Backup created: $(du -h /tmp/${BACKUP_FILE} | cut -f1)"

# Upload to S3 (in a different AWS account from production)
aws s3 cp "/tmp/${BACKUP_FILE}" "s3://${S3_BUCKET}/database/${BACKUP_FILE}" \
  --sse aws:kms

# Verify the upload
aws s3 ls "s3://${S3_BUCKET}/database/${BACKUP_FILE}"

# Clean up local file
rm "/tmp/${BACKUP_FILE}"

# Delete backups older than 30 days
aws s3 ls "s3://${S3_BUCKET}/database/" | \
  awk '{print $4}' | \
  while read key; do
    CREATED=$(aws s3api head-object --bucket "${S3_BUCKET}" --key "database/${key}" \
      --query LastModified --output text)
    AGE=$(( ($(date +%s) - $(date -d "$CREATED" +%s)) / 86400 ))
    if [ "$AGE" -gt 30 ]; then
      aws s3 rm "s3://${S3_BUCKET}/database/${key}"
      echo "Deleted old backup: ${key} (${AGE} days old)"
    fi
  done

echo "Backup complete."
```

Schedule via cron or GitHub Actions:

```yaml
# .github/workflows/database-backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2am UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - name: Install pg_dump
        run: sudo apt-get install -y postgresql-client

      - name: Run backup
        env:
          SUPABASE_DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_AWS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_AWS_SECRET }}
          AWS_DEFAULT_REGION: eu-west-2
        run: bash scripts/backup-supabase.sh
```

### PostgreSQL (Self-Managed)

```bash
# pg_dump with custom format (supports parallel restore)
pg_dump \
  --format=custom \
  --compress=9 \
  --no-acl \
  --no-owner \
  "postgresql://user:pass@localhost:5432/dbname" \
  > backup_$(date +%Y%m%d).dump

# Restore from custom format
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --jobs=4 \
  --dbname="postgresql://user:pass@localhost:5432/dbname" \
  backup_20240101.dump
```

## File Storage Backups

### Supabase Storage → S3 Replication

```typescript
// scripts/sync-storage-to-s3.ts
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
const s3 = new S3Client({ region: 'eu-west-2' });

async function syncBucket(bucketName: string) {
  const { data: files, error } = await supabase.storage.from(bucketName).list('', {
    limit: 1000,
  });
  
  if (error) throw error;
  
  for (const file of files ?? []) {
    const { data } = await supabase.storage.from(bucketName).download(file.name);
    if (!data) continue;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BACKUP_BUCKET!,
      Key: `storage/${bucketName}/${file.name}`,
      Body: Buffer.from(await data.arrayBuffer()),
      ServerSideEncryption: 'aws:kms',
    }));
  }
  
  console.log(`Synced ${files?.length ?? 0} files from ${bucketName}`);
}
```

### S3 Cross-Region Replication (AWS)

```json
{
  "Role": "arn:aws:iam::123456789:role/replication-role",
  "Rules": [
    {
      "Status": "Enabled",
      "Destination": {
        "Bucket": "arn:aws:s3:::backup-bucket-eu-west-2",
        "StorageClass": "STANDARD_IA",
        "ReplicationTime": { "Status": "Enabled", "Time": { "Minutes": 15 } }
      }
    }
  ]
}
```

## Disaster Recovery Runbook

```markdown
# Disaster Recovery Runbook

## Scenario 1: Database Corruption or Accidental Deletion

**Detection:** Application errors spike, database queries fail, data appears missing  
**RTO:** 1 hour | **RPO:** 24 hours (daily backup)

1. **Immediately**: Enable maintenance mode (block all writes)
2. **Assess scope**: Which tables? What time did corruption occur?
3. **Choose recovery method**:
   - Supabase PITR (Pro plan): Restore to point before corruption
   - Manual restore from latest backup: Continue to step 4
4. **Create a new database** (don't overwrite production until verified)
5. **Restore backup**:
   ```bash
   pg_restore --clean --no-owner --dbname=DATABASE_URL backup_20240101.dump
   ```
6. **Verify data integrity**: Row counts, spot checks on key tables
7. **Switch connection string** to restored database
8. **Disable maintenance mode**
9. **Post-incident review**: Why did corruption happen? How to prevent?

## Scenario 2: Ransomware (Files Encrypted)

**Detection:** Files inaccessible, ransom note present  
**RTO:** 4 hours | **RPO:** 24 hours

1. **Immediately**: Isolate affected systems (disconnect from network)
2. **Do NOT pay** the ransom (no guarantee of recovery, funds criminal activity)
3. **Assess scope**: Which systems affected? Are backups affected?
4. **Restore from offline/separate-account backups** (not backups on the same system)
5. **Scan for persistence**: The ransomware may have installed backdoors
6. **Rebuild from clean state** rather than cleaning infected systems
7. **Report to**: Law enforcement, your cyber insurance provider, affected users

## Scenario 3: Accidental Data Deletion by Code Bug

**Detection:** Users report missing data, monitoring alerts on unusual DELETE volume  
**RTO:** 30 minutes | **RPO:** 1 hour (with PITR)

1. **Immediately**: Kill the buggy process/deployment to stop further deletions
2. **Roll back deployment** to the previous version
3. **Use PITR** (if available) to restore to 5 minutes before the bug deployed
4. **If no PITR**: Restore deleted records from backup (may lose recent legitimate changes)
```

## Restore Testing

```bash
#!/bin/bash
# scripts/test-restore.sh — Run quarterly
# Tests that backups are actually restorable

LATEST_BACKUP=$(aws s3 ls s3://your-backup-bucket/database/ | sort | tail -1 | awk '{print $4}')
TEST_DB="restore_test_$(date +%Y%m%d)"

echo "Testing restore of: $LATEST_BACKUP"

# Download backup
aws s3 cp "s3://your-backup-bucket/database/${LATEST_BACKUP}" "/tmp/${LATEST_BACKUP}"

# Create test database
createdb "${TEST_DB}"

# Restore to test database
pg_restore \
  --no-owner \
  --dbname="${TEST_DB}" \
  "/tmp/${LATEST_BACKUP}"

# Verify: check row counts on key tables
psql "${TEST_DB}" -c "SELECT COUNT(*) as users FROM users;"
psql "${TEST_DB}" -c "SELECT COUNT(*) as orders FROM orders;"
psql "${TEST_DB}" -c "SELECT MAX(created_at) as latest_user FROM users;"

# Clean up
dropdb "${TEST_DB}"
rm "/tmp/${LATEST_BACKUP}"

echo "Restore test PASSED — backup is restorable"
```

## Monitoring Backup Health

```typescript
// Alert if backup hasn't run recently
async function checkBackupHealth() {
  const latestBackup = await s3.send(new ListObjectsV2Command({
    Bucket: 'your-backup-bucket',
    Prefix: 'database/',
  }));
  
  const objects = latestBackup.Contents ?? [];
  const latest = objects.sort((a, b) =>
    (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0)
  )[0];
  
  if (!latest) {
    await alertSlack('CRITICAL: No database backups found in backup bucket');
    return;
  }
  
  const ageHours = (Date.now() - (latest.LastModified?.getTime() ?? 0)) / 3_600_000;
  
  if (ageHours > 25) { // Over 25 hours = missed a daily backup
    await alertSlack(`WARNING: Latest database backup is ${Math.round(ageHours)} hours old`);
  }
}
```

## Learn More

- [Deployment Security README](./README.md)
- [DNS and Domain Security](./dns-domain-security.md)
- [Monitoring and Observability](../11-monitoring-and-observability/)
- [SOC 2 Data Retention Policy](../13-soc2/policy-templates/data-retention-policy.md)
