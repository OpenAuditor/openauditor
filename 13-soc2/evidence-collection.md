# SOC 2 Evidence Collection

This document lists exactly what SOC 2 auditors request and how to collect it. Use this as a pre-audit checklist.

---

## How Evidence Collection Works

Auditors typically send a PBC (Provided by Client) list 2–4 weeks before fieldwork begins. Each item requests either:
- A **population** — the complete list of something (e.g., all employees, all vendors)
- A **sample** — evidence for a subset of items drawn from the population
- A **document** — a policy, procedure, or configuration screenshot

For Type II, auditors sample across the full observation period. They want to see that controls worked consistently, not just that they worked once.

---

## Evidence by Control Area

### 1. Access Management

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Full list of users with access to production systems | Export from AWS IAM, GCP IAM, Okta, or equivalent |
| Role/permission assignments for each user | IAM policy export, RBAC configuration screenshot |
| Date access was granted for sampled users | Audit log export, ticket or approval record |
| Access review records (quarterly) | Spreadsheet or Jira tickets showing manager sign-off, dated |
| Evidence of access revocation for departed employees | HR offboarding ticket + IAM account deactivation timestamp |
| MFA enforcement configuration | Screenshot of IAM policy or SSO config showing MFA required |
| Privileged access list (admin accounts) | Filtered IAM export showing admin roles |

**Pro tips:**
- Run `aws iam generate-credential-report` monthly and store the output
- Keep a log of all offboarding events with timestamps — auditors love these
- Access review spreadsheets must show the reviewer's name, date, and their attestation

---

### 2. User Provisioning and Deprovisioning

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| New hire onboarding checklist with access grant date | HR system export or ticket |
| Leavers list with termination date and access revocation date | HR + IAM comparison |
| Evidence that access was revoked within policy timeframe (e.g., 24 hours) | Audit log timestamps |
| Background check records for employees in privileged roles | HR system or third-party screening provider records |

**Pro tips:**
- Automate deprovisioning via Okta/Azure AD connected to your HR system
- Keep a separate spreadsheet of "privileged access" employees if your HR system doesn't flag this

---

### 3. Security Awareness Training

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Training completion records for all current employees | Export from KnowBe4, Curricula, Notion, or your LMS |
| Training completion records for new hires (within 30 days of start) | Filter completion data by hire date |
| Training content (what was covered) | Course outline or curriculum document |
| Date of last training refresh/update | Version history of training material |
| Phishing simulation results (if applicable) | Platform report |

**Pro tips:**
- A spreadsheet showing [Employee Name] | [Hire Date] | [Training Completion Date] is sufficient
- Include contractors if they have access to production systems

---

### 4. Vendor Risk Assessments

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Complete list of critical vendors / sub-processors | Vendor register spreadsheet |
| Security review records for top-tier vendors | Questionnaire responses, SOC 2 reports, screenshots |
| Data processing agreements (DPAs) for vendors that handle personal data | Signed DPA copies |
| Annual vendor review evidence | Meeting notes, review dates, approval signatures |
| Process for approving new vendors | Policy document or approval workflow |

**Pro tips:**
- Tier your vendors: Tier 1 (critical), Tier 2 (important), Tier 3 (low risk). Auditors focus on Tier 1.
- Collect the SOC 2 reports of your key vendors (AWS, Stripe, Salesforce, etc.) — these are your assurance
- A Notion database or Airtable works well for a vendor register

---

### 5. Change Management

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Code review evidence for production changes | GitHub/GitLab PR history with approvals |
| Deployment approval records | CI/CD pipeline logs, deployment tickets |
| Evidence that no one deploys their own code without review | Branch protection rules screenshot |
| Change log or deployment history | Git log, deployment records |
| Emergency change procedure and example | Runbook + example ticket |

**Pro tips:**
- Enable branch protection on main/production and screenshot the settings
- GitHub PR reviews are excellent evidence — export or screenshot them
- Keep a log of emergency changes (hotfixes) with post-mortem notes

---

### 6. Incident Management

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Incident log for the full audit period | Jira tickets, PagerDuty export, spreadsheet |
| Incident response plan (documented) | Policy document |
| Evidence the IR plan was tested or reviewed | Meeting notes, table-top exercise record, annual review date |
| Post-mortem or root cause analysis for significant incidents | Post-mortem documents |
| Evidence of customer notification for applicable incidents | Email templates, sent notifications |

**Pro tips:**
- Log ALL incidents, even minor ones. "No incidents" looks suspicious for a full year
- A simple Notion table with columns for: Date, Severity, Description, Containment, Resolution, RCA is sufficient
- PagerDuty or OpsGenie exports make excellent population evidence

---

### 7. Vulnerability Management

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Vulnerability scan results (last scan) | Snyk report, AWS Inspector export, Nessus output |
| Scan frequency and schedule | Configuration screenshot or policy document |
| Remediation tracking for identified vulnerabilities | Ticket system showing CVEs tracked to resolution |
| Penetration test report | Third-party pen test report |
| Evidence that pen test findings were addressed | Remediation tickets linked to pen test findings |

**Pro tips:**
- Automated tools like Snyk, Dependabot, or GitHub Advanced Security can export CSV reports
- Even if you have open vulnerabilities, auditors want to see they are being tracked and prioritised
- The pen test report itself is evidence — you do not need a clean report, just evidence of response

---

### 8. Encryption and Data Protection

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| Encryption at rest configuration | AWS KMS / GCP CMEK / Azure Key Vault screenshot |
| Encryption in transit configuration | TLS certificate details, HTTPS enforcement screenshot |
| Key management procedures | Policy document or KMS configuration |
| Data classification policy | Policy document |

**Pro tips:**
- AWS Certificate Manager and S3 encryption settings export well as screenshots
- SSL Labs (ssllabs.com) report is useful supporting evidence for TLS configuration

---

### 9. Business Continuity and Disaster Recovery

**What auditors ask for:**

| Evidence Item | How to Collect |
|---|---|
| BCP/DR plan document | Policy document with defined RTO/RPO |
| Evidence of last DR test | Test report, meeting notes, dated |
| Backup configuration | AWS Backup / database backup settings screenshot |
| Backup restoration test evidence | Test record showing successful restoration |
| RTO/RPO definitions | Included in BCP/DR plan |

---

### 10. Physical and Environmental Security

For cloud-hosted companies:

| Evidence Item | How to Collect |
|---|---|
| Cloud provider SOC 2 report (AWS, GCP, Azure) | Download from provider's compliance portal |
| Evidence you reviewed the provider's report | Internal review note or sign-off |
| Office physical security (if applicable) | Visitor log, access card records |

**Pro tips:**
- AWS Artifact, Google Cloud Compliance Manager, and Azure Trust Center host SOC 2 reports for download
- Review and retain these annually — they cover the physical security controls for your infrastructure

---

## Evidence Collection Checklist

Use this before your audit fieldwork begins:

- [ ] IAM user export with roles and last login
- [ ] Access review records (all review cycles in audit period)
- [ ] Offboarding records for all leavers in audit period
- [ ] Security training completion records for all staff
- [ ] Vendor register with tier classifications
- [ ] DPAs / sub-processor agreements
- [ ] GitHub branch protection settings screenshot
- [ ] PR history showing code review approvals (sample 20–30)
- [ ] Incident log for full period
- [ ] Incident response plan + last review date
- [ ] Pen test report + remediation tracking
- [ ] Backup configuration + restoration test record
- [ ] Cloud provider SOC 2 reports (AWS/GCP/Azure)
- [ ] All 8 core policies reviewed and dated

---

## Organising Your Evidence

Use a shared folder (Google Drive, SharePoint, or your compliance platform) with folders matching the control areas above. Name files clearly:

```
/SOC2-Evidence/
  /Access-Management/
    iam-user-export-2025-Q1.csv
    access-review-Q1-2025-signed.pdf
    mfa-enforcement-screenshot-2025-01-15.png
  /Training/
    training-completion-all-staff-2025.xlsx
  /Incidents/
    incident-log-2025-full-year.xlsx
    incident-postmortem-2025-03-15.pdf
  ...
```

Compliance platforms (Vanta, Drata, Secureframe) automate most of this collection and organise it automatically.

---

> **Note:** Evidence requirements vary by auditor and scope. Your auditor will provide a specific PBC (Provided by Client) list. Use this document to prepare, not as a substitute for that list.
