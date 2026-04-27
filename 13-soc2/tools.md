# SOC 2 Tooling

You don't need an enterprise budget to prepare for SOC 2. This guide covers the tools — from free open source to commercial platforms — that make evidence collection, policy management, and audit preparation manageable.

---

## 30-Second Summary

SOC 2 Type II audits require continuous evidence: logs, access reviews, vulnerability scans, change management records. The right tools automate evidence collection so you're not scrambling for screenshots six months after the fact.

---

## Compliance Automation Platforms

These platforms automate evidence collection and connect to your cloud infrastructure, code repos, and HR systems:

### Vanta (Popular for startups)
- **Cost:** ~$15,000–40,000/year
- **Covers:** SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS
- **Integrations:** AWS, GCP, Azure, GitHub, Google Workspace, Okta, Jira
- **Best for:** Series A+ startups that need to move fast
- **Automates:** Access reviews, vulnerability scans, background check tracking, employee security training

### Drata
- **Cost:** ~$10,000–30,000/year
- **Covers:** SOC 2, ISO 27001, HIPAA, PCI DSS
- **Best for:** Companies that want strong automation and a polished audit experience
- **Notable:** Strong integration with common SaaS tools

### Secureframe
- **Cost:** ~$12,000–35,000/year
- **Covers:** SOC 2, ISO 27001, HIPAA, PCI DSS, GDPR
- **Best for:** Mid-market companies; good customer support reputation

### Sprinto (Good value)
- **Cost:** ~$8,000–20,000/year
- **Covers:** SOC 2, ISO 27001, GDPR, HIPAA
- **Best for:** Startups wanting good automation at lower price point

### Free / DIY Route
For early-stage startups not yet ready for a compliance platform:
- Use this repository for policies and procedures
- Collect evidence manually (screenshots, exports, logs)
- Use a shared Google Drive or Notion for evidence storage
- Budget 3-6 months and significant founder/engineering time

---

## Specific Tools by Evidence Category

### Access Control Evidence

**Okta (Identity Provider)**
- Single sign-on for all company tools
- Automatic access logs — SOC 2 auditors love Okta exports
- MFA enforcement (required for SOC 2)
- Automated access reviews via Okta Lifecycle Management
- ~$6/user/month

**Google Workspace Admin**
- User lifecycle management (joiners, movers, leavers)
- 2-step verification enforcement
- Admin activity logs
- Free with Google Workspace subscription

**Evidence needed:** User access list, access review records (quarterly minimum), terminated user access removal logs.

### Vulnerability Management Evidence

**Dependabot (Free, GitHub)**
- Automated dependency vulnerability alerts
- Audit trail of vulnerabilities found and remediated
- Evidence: Dependabot alert history and closed PRs

**Snyk**
- Free tier: 200 open source tests/month
- Evidence: Scan reports, remediation records
- SOC 2 auditors accept Snyk reports as vulnerability evidence

**AWS Inspector / Google Container Analysis**
- Infrastructure and container vulnerability scanning
- Automatic, continuous — strong SOC 2 evidence

### Change Management Evidence

**GitHub Pull Requests**
- Required PR reviews before merge = change management
- Branch protection rules = enforced approval
- Evidence: GitHub audit log, PR merge history

**Jira / Linear**
- Ticket-based change tracking
- Audit trail of who approved what changes
- Links to deployment records

### Incident Management Evidence

**PagerDuty / OpsGenie**
- On-call rotation documentation
- Incident response time records
- Post-mortem documentation
- Required: documented incident response plan, exercises

**StatusPage (Atlassian)**
- Public uptime history
- Incident disclosure records — evidence of transparency

### Logging Evidence

**Datadog / Logtail / Axiom**
- Centralised log management
- Evidence: Log retention configuration (≥90 days), security event logs
- SOC 2 CC7.2 specifically asks about logging and monitoring

**Cloudtrail / Google Cloud Audit Logs**
- Infrastructure-level audit trail
- Who did what to which cloud resource and when
- Essential for SOC 2 CC6.8 (logical access controls)

### Security Training Evidence

**KnowBe4**
- Security awareness training with completion tracking
- Phishing simulation
- Evidence: Training completion rates, certificates

**SecurityAwareness.io (cheaper alternative)**
- Similar features, lower cost
- Certificate generation for each employee

### Background Checks

**Checkr**
- Background checks with audit trail
- Integrates with Vanta/Drata
- Evidence: Background check completion records for all personnel

---

## Free Evidence Collection Toolkit

If you're not using a compliance platform, collect this evidence manually:

```
Monthly:
- Export list of all active users from each cloud provider
- Screenshot of MFA enforcement settings
- Dependabot or npm audit report
- Access review (confirm access is still appropriate for each user)

Quarterly:
- Formal access review: confirm each person's access is still required
- Vulnerability scan report (Snyk, npm audit, pip-audit)
- Review of security policies (still current?)
- Penetration test results (annual minimum)

Annually:
- Full access review including service accounts
- Penetration test
- Security policy review and update
- Business continuity plan test
- Employee security training completion records
- Background check records for new hires
```

Store everything in a Google Drive or Notion folder structure:
```
/SOC2-Evidence
  /CC6-Logical-Access
    2026-Q1-access-review.pdf
    2026-Q1-user-list.csv
    mfa-settings-screenshot.png
  /CC7-Monitoring
    2026-03-security-logs-sample.json
    dependabot-alerts-2026-Q1.pdf
  /CC8-Change-Management
    github-branch-protection-config.png
    sample-pr-with-approval.pdf
```

---

## Choosing Your Approach

| Stage | Recommended Approach |
|-------|---------------------|
| Pre-seed / early seed | DIY with this guide + Google Drive evidence folder |
| Late seed / Series A | Sprinto or Secureframe (good value) |
| Series A+ | Vanta or Drata (strong integrations, auditor relationships) |
| Enterprise | Vanta, Drata, or A-LIGN directly |

---

## Learn More

- [SOC 2 README](./README.md)
- [Policy Templates](./policy-templates/access-control-policy.md)
- [SOC 2 Readiness Audit prompt](./prompts/soc2-readiness-audit.md)
- [Monitoring and Observability](../11-monitoring-and-observability/README.md)
