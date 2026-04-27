# Incident Response Policy

**Version:** 1.0  
**Effective Date:** [DATE]  
**Owner:** [Name/Role]  
**Review Schedule:** Annual

---

> **Instructions:** Replace all `[PLACEHOLDER]` text before finalising. This template covers SOC 2 Trust Service Criteria CC7.3, CC7.4, CC7.5, and A1.3.

---

## 1. Purpose

This policy defines [COMPANY NAME]'s approach to identifying, containing, investigating, and recovering from security incidents. It ensures a consistent, effective response that minimises damage and supports regulatory obligations.

## 2. Scope

This policy applies to all security incidents affecting [COMPANY NAME]'s systems, data, or operations — including those caused by third-party service providers.

## 3. Definitions

**Security Incident:** Any event that threatens the confidentiality, integrity, or availability of company or customer data, or violates security policies. Includes data breaches, malware infections, unauthorised access, and service outages caused by security events.

**Data Breach:** A security incident involving the unauthorised access, disclosure, or loss of personal data.

**Severity Levels:**

| Level | Definition | Example |
|-------|-----------|---------|
| P0 — Critical | Active breach, data exfiltration, complete service outage | Confirmed ransomware; database dump on dark web |
| P1 — High | Significant security event requiring immediate action | Credential compromise; major service degradation |
| P2 — Medium | Security event requiring prompt response | Suspicious access patterns; minor vulnerability exploited |
| P3 — Low | Minor security event | Single failed login; low-severity CVE discovered |

## 4. Incident Response Team

**Incident Commander:** [ROLE — usually CISO or CTO]  
Responsibilities: Overall response coordination, external communications, final decisions

**Technical Lead:** [ROLE — usually Senior Engineer or DevOps Lead]  
Responsibilities: Technical investigation, containment, remediation

**Communications Lead:** [ROLE — usually CEO or Head of Marketing]  
Responsibilities: Customer and stakeholder communications, PR

**Legal/Privacy Lead:** [ROLE — DPO or Legal Counsel]  
Responsibilities: Regulatory notifications, legal obligations

## 5. Incident Response Process

### Phase 1: Detection and Reporting

Security incidents can be detected via:
- Automated monitoring alerts (Datadog, AWS CloudWatch, Snyk)
- Employee reports (any employee who suspects an incident must report immediately)
- Customer reports
- Third-party notification (vendor breach, bug bounty)
- External security researcher disclosure

**To report an incident:**
- Internal: [SLACK CHANNEL: #security-incidents] or email [SECURITY EMAIL]
- Out of hours: Call/text [ON-CALL NUMBER]
- Security researchers: [SECURITY.TXT URL]

### Phase 2: Initial Assessment

Within [30 minutes] of detection:

1. Incident Commander is notified and takes ownership
2. Severity level is assigned
3. Incident channel created in Slack (#incident-YYYY-MM-DD-description)
4. Initial assessment documented:
   - What systems are affected?
   - Is data involved? Whose?
   - Is the incident ongoing or contained?
   - What is the potential impact?

### Phase 3: Containment

Immediate containment actions (within [1-4 hours] depending on severity):

**For active breaches:**
- Isolate compromised systems (take offline, revoke credentials)
- Block attacker's access vector (IP block, disable compromised account)
- Preserve evidence before taking remediation actions

**For compromised credentials:**
- Immediately rotate all affected credentials
- Invalidate all active sessions
- Enable additional monitoring on the account

**Evidence preservation:**
- Do not wipe or reimage systems until forensic evidence is secured
- Export relevant logs before containment actions remove access
- Document timeline with timestamps

### Phase 4: Investigation

**Root cause analysis:**
1. Identify the initial attack vector (how did this happen?)
2. Identify the timeline (when did it start? how long was access maintained?)
3. Identify affected systems and data (scope of impact)
4. Identify how it was detected (or why it wasn't detected sooner)

**Evidence to collect:**
- Server logs (access logs, error logs, auth logs)
- Cloud provider audit logs (CloudTrail, GCP Audit Logs)
- Network flow logs
- Application logs
- Any attacker-left files or artefacts

### Phase 5: Notification

**Internal notification:**
- P0/P1: Notify all executives within 1 hour of confirmation
- P0/P1: Notify relevant department leads within 2 hours
- All staff: Notify on a need-to-know basis

**Regulatory notification (if personal data is involved):**
- UK GDPR: Notify ICO within 72 hours of becoming aware of a breach (if risk to individuals)
- See [GDPR Breach Notification guide](../../12-privacy-and-gdpr/breach-notification.md)
- EU GDPR: Notify lead supervisory authority within 72 hours

**Customer notification:**
- P0 breaches involving customer data: Notify affected customers within [24-72 hours]
- Notification content: what happened, what data was affected, what we're doing, what customers should do
- See [User Notification Guide](../../15-post-breach/user-notification-guide.md)

### Phase 6: Recovery

1. Remediate the root cause (patch vulnerability, rotate credentials, fix misconfiguration)
2. Restore service from clean backups where necessary
3. Implement additional controls to prevent recurrence
4. Enhanced monitoring during recovery period
5. Verify systems are clean before returning to production

### Phase 7: Post-Incident Review

Within [5 business days] of incident resolution:

1. Post-mortem document completed:
   - Timeline of events
   - Root cause
   - Impact assessment
   - Actions taken
   - What went well
   - What needs improvement
   - Action items with owners and deadlines

2. Action items tracked to completion
3. Policy or process updates implemented
4. Lessons shared with engineering team (without blame culture)

## 6. Communication Templates

### Initial Customer Notification

```
Subject: Important security notice from [COMPANY NAME]

Dear [Customer name],

We are writing to inform you of a security incident that may have affected your account.

What happened: [Plain English description]

What information was involved: [Specific data types]

What we are doing: [Containment, remediation steps]

What you should do: [Specific actions — password reset, monitor account, etc.]

We take the security of your information seriously. We are sorry this happened.

If you have questions, please contact [SUPPORT EMAIL] or [SUPPORT PHONE].

[COMPANY NAME] Security Team
```

## 7. Annual Testing

The incident response plan is tested annually via:
- **Tabletop exercise:** Simulate a breach scenario with the response team
- **Communication test:** Verify on-call numbers, escalation paths, and contact lists are current
- **Recovery test:** Test restoration from backups

## 8. Policy Review

This policy is reviewed annually by [OWNER] or after any significant security incident.

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [DATE] | [NAME] | Initial version |
