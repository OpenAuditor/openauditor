# Key Rotation

> **30-second summary:** Cryptographic keys and secrets must be rotated on a schedule, after any potential exposure, and when personnel with access leave. Rotation limits the blast radius of a compromised key and is required by SOC 2, PCI DSS, and most compliance frameworks.

## Why Key Rotation Matters

**Without rotation:** A key compromised in January — but not discovered until September — gives attackers 8 months of access. Rotation ensures that even undiscovered compromises have a bounded impact window.

**Real incident:** In 2023, Microsoft's cloud signing key was compromised and used to forge authentication tokens for US government email services. The key had been valid for years without rotation. Had quarterly rotation been in place, the attack window would have been 3 months maximum instead of indeterminate.

## What Needs Rotating

| Secret Type | Recommended Rotation | Trigger Immediately When |
|-------------|---------------------|--------------------------|
| API keys (third-party) | Quarterly | Developer leaves, key exposed in logs/git |
| JWT signing secrets | Annually or when exposed | Any suspected compromise |
| Database passwords | Quarterly | Access revoked for a user who knew it |
| Encryption keys (AES) | Annually | Key material stored insecurely |
| OAuth client secrets | Annually | Secret visible in any log or error |
| SSH keys | Annually | Developer leaves organisation |
| TLS certificates | Before expiry (≤1yr) | Certificate transparency log anomaly |
| Session secrets | Quarterly | Framework upgrade, security incident |

## Rotation Without Downtime

The critical challenge in key rotation is the transition period — you cannot simply swap a key if outstanding tokens, sessions, or encrypted data use the old key.

### Pattern 1: Versioned Keys

```typescript
// Store multiple key versions; decrypt with the matching version
// Encrypt new data with the current (latest) version

interface KeyVersion {
  id: string;
  key: string;
  createdAt: Date;
  retiredAt?: Date;
}

class VersionedKeyStore {
  private keys: Map<string, KeyVersion>;
  private currentKeyId: string;

  constructor(keyConfig: KeyVersion[]) {
    this.keys = new Map(keyConfig.map(k => [k.id, k]));
    // Current key = latest active key
    this.currentKeyId = keyConfig
      .filter(k => !k.retiredAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].id;
  }

  getCurrentKey(): KeyVersion {
    return this.keys.get(this.currentKeyId)!;
  }

  getKey(id: string): KeyVersion | undefined {
    return this.keys.get(id);
  }
}

// When encrypting: use current key, store key ID with ciphertext
async function encrypt(plaintext: string, keyStore: VersionedKeyStore): Promise<string> {
  const { id, key } = keyStore.getCurrentKey();
  const encrypted = await encryptWithAES(plaintext, key);
  
  return JSON.stringify({
    keyId: id,
    ciphertext: encrypted,
  });
}

// When decrypting: look up key by ID stored alongside ciphertext
async function decrypt(payload: string, keyStore: VersionedKeyStore): Promise<string> {
  const { keyId, ciphertext } = JSON.parse(payload);
  const keyVersion = keyStore.getKey(keyId);
  
  if (!keyVersion) {
    throw new Error(`Key version ${keyId} not found — may have been purged`);
  }
  
  return decryptWithAES(ciphertext, keyVersion.key);
}
```

### Pattern 2: JWT with Multiple Valid Keys

```typescript
import jwt from 'jsonwebtoken';

interface JWTKeySet {
  current: { kid: string; secret: string };
  previous: { kid: string; secret: string } | null;
}

function signToken(payload: object, keys: JWTKeySet): string {
  return jwt.sign(payload, keys.current.secret, {
    algorithm: 'HS256',
    keyid: keys.current.kid,
    expiresIn: '1h',
  });
}

function verifyToken(token: string, keys: JWTKeySet): jwt.JwtPayload {
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) throw new Error('Invalid token');
  
  const kid = decoded.header.kid;
  
  // Try current key first
  if (kid === keys.current.kid) {
    return jwt.verify(token, keys.current.secret) as jwt.JwtPayload;
  }
  
  // Fall back to previous key (for tokens issued before rotation)
  if (keys.previous && kid === keys.previous.kid) {
    return jwt.verify(token, keys.previous.secret) as jwt.JwtPayload;
  }
  
  throw new Error(`Unknown key ID: ${kid}`);
}

// Configuration loaded from environment:
const keys: JWTKeySet = {
  current: {
    kid: process.env.JWT_KEY_ID_CURRENT!,
    secret: process.env.JWT_SECRET_CURRENT!,
  },
  previous: process.env.JWT_KEY_ID_PREVIOUS ? {
    kid: process.env.JWT_KEY_ID_PREVIOUS,
    secret: process.env.JWT_SECRET_PREVIOUS!,
  } : null,
};
```

During rotation:
1. Generate new key (`JWT_SECRET_NEW`)
2. Deploy with `current = new`, `previous = old`
3. Wait for old tokens to expire (1 hour in example above)
4. Remove `previous` in next deploy

### Pattern 3: Database Password Rotation with Zero Downtime

```typescript
// Use a connection pool that can be refreshed without dropping connections

import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class RotatingConnectionPool {
  private pool: Pool;
  private lastRotationCheck: Date = new Date(0);
  private readonly CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds

  async getConnection() {
    await this.refreshIfNeeded();
    return this.pool.connect();
  }

  private async refreshIfNeeded() {
    const now = new Date();
    
    if (now.getTime() - this.lastRotationCheck.getTime() < this.CHECK_INTERVAL_MS) {
      return;
    }
    
    this.lastRotationCheck = now;
    
    // Fetch current password from secrets manager
    const client = new SecretsManagerClient({ region: 'us-east-1' });
    const response = await client.send(new GetSecretValueCommand({
      SecretId: 'prod/database/password',
    }));
    
    const secret = JSON.parse(response.SecretString!);
    
    // If password has changed, create a new pool
    if (secret.password !== this.pool.options.password) {
      const newPool = new Pool({
        host: secret.host,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        ssl: { rejectUnauthorized: true },
      });
      
      // Drain old pool and replace
      const oldPool = this.pool;
      this.pool = newPool;
      await oldPool.end(); // Waits for all connections to be released
      
      console.log('Database connection pool refreshed after credential rotation');
    }
  }
}
```

## Automated Rotation

### AWS Secrets Manager Automatic Rotation

```json
{
  "SecretId": "prod/app/jwt-secret",
  "RotationRules": {
    "AutomaticallyAfterDays": 90
  },
  "RotationLambdaARN": "arn:aws:lambda:us-east-1:123456789:function:SecretRotation"
}
```

### GitHub Actions Rotation Reminder

```yaml
# .github/workflows/key-rotation-reminder.yml
name: Key Rotation Reminder
on:
  schedule:
    - cron: '0 9 1 */3 *'  # First day of every 3rd month

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Check key ages and notify
        run: |
          echo "Quarterly key rotation reminder. Review:"
          echo "- API keys: Stripe, SendGrid, Twilio"
          echo "- JWT signing secrets"
          echo "- Database passwords"
          echo "- Service account credentials"
          echo "Last rotation: check SECURITY.md rotation log"

      - name: Create GitHub Issue
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[Security] Quarterly Key Rotation Due - ${new Date().toISOString().slice(0,7)}`,
              body: `## Quarterly Key Rotation Checklist\n\n` +
                `- [ ] Rotate Stripe API keys\n` +
                `- [ ] Rotate SendGrid API key\n` +
                `- [ ] Rotate JWT_SECRET\n` +
                `- [ ] Rotate database password\n` +
                `- [ ] Update SECURITY.md with rotation dates\n\n` +
                `Assign to on-call engineer.`,
              labels: ['security', 'maintenance'],
            });
```

### Supabase JWT Secret Rotation

```bash
# Supabase JWT secret rotation via CLI
supabase secrets set JWT_SECRET=$(openssl rand -base64 32)

# Or via API
curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"jwt_secret\": \"$(openssl rand -base64 32)\"}"
```

Note: Rotating Supabase's JWT secret invalidates all existing sessions — plan for a maintenance window or use the versioned key pattern above.

## Rotation Log Template

Maintain a rotation log (in a private document, not the public repo):

```markdown
# Secret Rotation Log

| Secret | Environment | Last Rotated | Next Due | Rotated By | Trigger |
|--------|-------------|--------------|----------|------------|---------|
| JWT_SECRET | Production | 2024-01-15 | 2025-01-15 | @alice | Scheduled |
| STRIPE_SECRET_KEY | Production | 2024-03-01 | 2024-06-01 | @bob | Scheduled |
| DATABASE_URL | Production | 2024-02-10 | 2024-05-10 | @alice | Developer offboarding |
| SENDGRID_API_KEY | Production | 2024-01-20 | 2024-04-20 | @charlie | Scheduled |
```

## Emergency Rotation Procedure

When a key is suspected or confirmed compromised:

```bash
# Step 1: Generate new key immediately
NEW_SECRET=$(openssl rand -base64 32)

# Step 2: Deploy new key to all environments (with old key as fallback if applicable)
# This is environment-specific — use your secrets manager (Vercel, AWS, Doppler)

# Step 3: Invalidate ALL existing sessions/tokens issued with the old key
# For JWT: change the secret (all existing tokens become invalid)
# For sessions: clear the session store
# For API keys: revoke in the third-party provider dashboard

# Step 4: Monitor for continued use of old key
# (Check logs for auth failures that spike after rotation)

# Step 5: Remove the old key fallback after all legitimate sessions have expired
# (Typically 1-24 hours after rotation)

# Step 6: Update the rotation log with incident details
```

## Learn More

- [Never Roll Your Own Crypto](./never-roll-your-own.md)
- [Audit Crypto Usage](./prompts/audit-crypto-usage.md)
- [A02: Cryptographic Failures](../02-owasp/web-top10/A02-crypto-failures.md)
- [SOC 2 Access Control Policy](../13-soc2/policy-templates/access-control-policy.md)
