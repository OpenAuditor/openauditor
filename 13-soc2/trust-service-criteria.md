# Trust Service Criteria (TSCs)

SOC 2 audits are structured around five Trust Service Criteria defined by the AICPA. Security is the only mandatory criterion. The others are included based on what your service promises to customers.

---

## 1. Security (CC — Common Criteria)

**What it covers:** Protection of systems and data against unauthorised access, disclosure, damage, or misuse.

**Always required.** Every SOC 2 audit includes the Security criterion.

### What auditors look for

| Control Area | Example Controls |
|---|---|
| Logical access | MFA on all production systems, role-based access control, access reviews every 90 days |
| Network security | Firewall rules, VPN for internal access, network segmentation |
| Monitoring | Centralised logging, intrusion detection, alerting on anomalies |
| Change management | Code review process, deployment approvals, change tickets |
| Risk assessment | Annual risk assessment, documented risk register |
| Vendor management | Security review of third-party vendors, BAAs where required |
| Incident response | Documented IR plan, tested annually, incident log |
| Physical security | Data centre SOC 2 report (AWS, GCP, Azure cover this for cloud) |

### Example controls that satisfy Security

- All engineers require hardware security keys (YubiKey) for production access
- Automated alerts fire when a new IAM user is created in AWS
- Quarterly access reviews: managers certify their team's access is appropriate
- Penetration test conducted annually by a third party; findings tracked to remediation
- Security awareness training completed by all staff on hire and annually

---

## 2. Availability

**What it covers:** Systems are available for operation and use as committed in your SLA.

**Include this if:** You make uptime commitments to customers (e.g., 99.9% SLA, financial services, infrastructure products).

### What auditors look for

| Control Area | Example Controls |
|---|---|
| Uptime monitoring | Real-time monitoring of all services, public status page |
| Incident response | RTO/RPO defined, runbooks for common failures |
| Capacity planning | Regular reviews of resource utilisation, auto-scaling policies |
| Backup and recovery | Automated backups, tested restoration, off-site copies |
| Business continuity | BCP documented, tested at least annually |
| Disaster recovery | DR plan with defined RTO/RPO, tested failover |

### Example controls that satisfy Availability

- Automated backups run every 6 hours; restoration tested monthly
- Runbooks exist for the top 10 failure scenarios, each with a defined owner
- Load testing conducted before major releases
- Status page (Statuspage.io or similar) updated within 5 minutes of an incident

---

## 3. Processing Integrity

**What it covers:** System processing is complete, valid, accurate, timely, and authorised.

**Include this if:** Your service processes transactions, payments, payroll, or other data where errors have direct business consequences.

### What auditors look for

| Control Area | Example Controls |
|---|---|
| Input validation | Data validation at all entry points, error logging |
| Processing controls | Automated reconciliation, exception reporting |
| Output verification | Output review processes, delivery confirmation |
| Error handling | Errors logged, investigated, and resolved in defined timeframes |

### Example controls that satisfy Processing Integrity

- All payment transactions are reconciled against bank records daily
- Failed processing jobs trigger an alert and are reviewed within 2 hours
- Data pipeline outputs are validated against checksums before delivery
- Customer-facing errors are logged with full context for debugging

---

## 4. Confidentiality

**What it covers:** Information designated as confidential is protected as committed.

**Include this if:** You handle confidential business information — trade secrets, financial data, legal documents, proprietary research.

### What auditors look for

| Control Area | Example Controls |
|---|---|
| Data classification | Documented data classification policy, labels applied |
| Encryption | Encryption at rest and in transit for confidential data |
| Access restriction | Need-to-know access, NDA requirements for employees |
| Disposal | Secure deletion procedures, media sanitisation |
| Sharing controls | DLP tools, controls on external sharing |

### Example controls that satisfy Confidentiality

- Data classification policy defines four tiers: Public, Internal, Confidential, Restricted
- All employees sign NDAs on hire; contractors sign before project start
- Confidential data is encrypted at rest using AES-256; all transmission uses TLS 1.2+
- Offboarding checklist requires revoking access and returning devices within 24 hours

---

## 5. Privacy

**What it covers:** Personal information is collected, used, retained, disclosed, and disposed of in line with your privacy notice and applicable law.

**Include this if:** You collect, store, or process personal information about individuals — particularly if you have GDPR, CCPA, or HIPAA obligations.

### What auditors look for

| Control Area | Example Controls |
|---|---|
| Notice and consent | Privacy policy published, consent collected where required |
| Collection limitation | Only data needed for stated purpose is collected |
| Use limitation | Data not used for purposes beyond what was disclosed |
| Data subject rights | Process to handle access, deletion, portability requests |
| Retention and disposal | Retention schedule, automated deletion |
| Disclosure controls | Data sharing agreements, processor contracts |

### Example controls that satisfy Privacy

- Privacy policy is reviewed and updated annually
- Data minimisation review conducted for each new feature
- DSAR (Data Subject Access Request) process is documented with a 30-day SLA
- Automated deletion jobs run monthly for data past its retention period
- All third-party processors have signed DPAs

---

## Choosing Which Criteria to Include

| Your Product Type | Recommended Criteria |
|---|---|
| General B2B SaaS | Security only (minimum), add Availability if you have SLAs |
| Payments / fintech | Security + Processing Integrity + Confidentiality |
| Healthcare / health data | Security + Confidentiality + Privacy |
| Infrastructure / hosting | Security + Availability |
| HR / payroll software | Security + Confidentiality + Privacy |
| Data analytics platform | Security + Confidentiality + Processing Integrity |

Adding more criteria increases audit scope and cost. Start with Security. Add others only if your customers require them or your service type makes them relevant.

---

> **Note:** The criteria descriptions above are simplified for practical use. The full AICPA Trust Services Criteria document (TSP 100) is the authoritative source.
