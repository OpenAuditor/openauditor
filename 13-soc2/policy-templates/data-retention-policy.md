# Data Retention Policy

**Version:** 1.0  
**Effective Date:** [DATE]  
**Owner:** [Name/Role]  
**Review Schedule:** Annual

---

> **Instructions:** Replace all `[PLACEHOLDER]` text before finalising. This template covers SOC 2 Trust Service Criteria CC6.5, CC6.7, and Privacy Criteria P4.

---

## 1. Purpose

This policy establishes how long [COMPANY NAME] retains different categories of data, and how data is securely disposed of when it is no longer needed. It balances legal obligations, business needs, and individual privacy rights.

## 2. Scope

This policy applies to all data created, collected, or processed by [COMPANY NAME], across all storage systems: databases, file storage, backups, email, logs, and third-party systems.

## 3. Retention Schedule

### 3.1 Customer and User Data

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| User account data | Duration of account + 90 days after deletion request | Contract performance |
| Transaction records | 7 years from transaction date | UK tax law |
| Support ticket content | 3 years from ticket closure | Legitimate interest |
| User-generated content | Duration of account + 30 days | Contract performance |
| Marketing preferences | Until unsubscribe + 1 year | Consent |
| Usage analytics (identifiable) | 13 months | Legitimate interest |
| Usage analytics (anonymised) | Indefinite | N/A |

### 3.2 Security and Audit Logs

| Log Type | Retention Period | Reason |
|----------|-----------------|--------|
| Application access logs | 12 months | Security investigation, SOC 2 |
| Authentication logs | 12 months | Security, compliance |
| Admin/privileged action logs | 24 months | SOC 2, audit trail |
| Security incident records | 5 years | Legal, compliance |
| GDPR consent records | Account duration + 3 years | GDPR accountability |

### 3.3 Business Records

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Financial records | 7 years | UK Companies Act |
| Contracts and agreements | Duration + 7 years | Limitation Act 1980 |
| Employee records | Duration of employment + 7 years | Employment law |
| Insurance records | 7 years minimum | Legal requirement |
| Board minutes and resolutions | Permanent | Companies Act |
| Marketing campaign data | 3 years from campaign end | Legitimate interest |

### 3.4 Backups

| Backup Type | Retention Period |
|-------------|-----------------|
| Daily database backups | 30 days |
| Weekly backups | 90 days |
| Monthly backups | 12 months |
| Annual backups | 7 years (for compliance) |

---

## 4. Data Deletion and Anonymisation

### 4.1 Right to Erasure (GDPR Article 17)

When a user submits a deletion request:

1. Account is flagged for deletion in the system
2. Within [30 days]: active account data deleted from production database
3. Data is removed from backups when those backups cycle out (within 90 days for daily backups)
4. Anonymised analytics data is retained (no personal identifiers)
5. Financial records are retained as required by law (7 years), detached from the user identity where possible
6. User is notified when deletion is complete

The deletion process is documented in [LINK TO RIGHT TO ERASURE PROCEDURE].

### 4.2 Routine Data Purging

Automated deletion jobs run to enforce retention periods:

```sql
-- Example: Delete old authentication logs beyond retention period
DELETE FROM auth_logs 
WHERE created_at < NOW() - INTERVAL '12 months';

-- Example: Anonymise old analytics beyond 13 months
UPDATE analytics_events 
SET user_id = NULL, ip_address = NULL, session_id = 'anonymised'
WHERE created_at < NOW() - INTERVAL '13 months'
  AND user_id IS NOT NULL;
```

Deletion jobs are:
- Scheduled via [CRON JOB / TASK SCHEDULER]
- Logged with record counts for audit purposes
- Reviewed quarterly by [DATA OWNER]

### 4.3 Secure Disposal

When data is deleted:
- **Database records:** Overwritten by the database engine; logs confirm deletion
- **File storage (S3, GCS):** Objects are permanently deleted (not just marked deleted)
- **Physical media (decommissioned hardware):** Cryptographic erasure or physical destruction; certificate of destruction retained
- **Third-party systems:** Deletion requested via their data deletion API or support process; confirmation retained

---

## 5. Third-Party Data Retention

Third parties that process our data on our behalf (sub-processors) must:
- Maintain their own data retention policies consistent with GDPR
- Delete our data on request within 30 days of contract termination
- Provide confirmation of deletion

Current sub-processors and their retention policies are documented in [DATA PROCESSING REGISTER].

---

## 6. Special Categories

### 6.1 Personal Data of Children

[COMPANY NAME] does not knowingly collect data from individuals under 13 (or 16 where applicable under UK GDPR). If such data is discovered, it is deleted immediately without retention.

### 6.2 Health or Sensitive Data (if applicable)

[Describe any special categories of personal data you process, e.g., health data, and any additional retention controls.]

---

## 7. Compliance Monitoring

- **Quarterly:** Review deletion job logs; verify purging is running correctly
- **Annual:** Full retention schedule review; update for regulatory changes
- **On request:** Users can request confirmation that their data has been deleted

---

## 8. Policy Review

This policy is reviewed annually by [OWNER] or when regulatory requirements change.

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [DATE] | [NAME] | Initial version |
