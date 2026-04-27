# Incident Response Runbook

**Step-by-step procedures for responding to security incidents**

Use this runbook when a security incident is suspected or confirmed. Follow the timeline carefully: immediate actions (0-30 min) → investigation (30 min - 4 hours) → recovery (4+ hours) → post-incident review.

---

## Immediate Actions (0-30 Minutes)

### Step 1: Activate Incident Response (0-5 minutes)

- [ ] **Page the incident commander** (if on-call system exists)
  - Contact method: Slack, PagerDuty, phone
  - Message template: "SECURITY INCIDENT: [Brief description]. Activating incident response. Join #incident-response channel."

- [ ] **Notify key stakeholders**:
  - Incident Commander (lead for this incident)
  - Security Lead
  - Engineering Lead
  - Ops/Infrastructure Lead
  - Product Manager (for customer communications)
  - Executive (VP Eng, CEO, or per policy)

- [ ] **Create incident ticket/channel**
  - Slack channel: `#incident-response-2026-04-25-01`
  - Jira/Linear ticket: "SEC-001: Unauthorized access on 2026-04-25"
  - Include: Time detected, brief description, incident commander, channel link

- [ ] **Establish communication channel**
  - Use: Dedicated Slack channel or war room call
  - Frequency: Updates every 15-30 minutes
  - Log all decisions and timelines

**Incident Commander Responsibilities:**
- Coordinate all response activities
- Make escalation/emergency decisions
- Own communication timeline
- Assign work to team members
- Document decisions and actions

---

### Step 2: Verify the Incident (5-10 minutes)

- [ ] **Confirm the incident is real** (not false alarm)
  - Check alerts/logs for confirmation
  - Talk to person who reported it (what did they observe?)
  - Has the issue been reproduced?
  - Is it happening now or was it historical?

- [ ] **Classify incident severity**:

| Severity | Example | Response Time | Escalation |
|----------|---------|---|---|
| **Critical** | Data breach, system down, customer data exposed | Immediate | Executive, legal |
| **High** | Unauthorized access, attempted attack, service degradation | 15 minutes | Security + Engineering leads |
| **Medium** | Suspicious activity, potential vulnerability, minor attack | 1 hour | Security team |
| **Low** | Failed login attempts, minor config issue, informational | Next business day | Can log and track |

**Examples of incident classification:**
- Critical: Ransomware detected, customer passwords stolen, payment processing down
- High: Attacker gained shell access, database accessible from internet, DDoS attack ongoing
- Medium: Unusual spike in failed logins from one IP, suspicious API activity, new vulnerability in dependency
- Low: Misconfigured logging, old API key found in git, spam in support emails

- [ ] **Assign severity label** to incident ticket

- [ ] **Determine if customer impact**:
  - Are customers affected?
  - Is data at risk?
  - Should customers be notified?
  - Create communication timeline if needed

---

### Step 3: Contain the Threat (10-20 minutes)

**Immediate containment actions (do not wait for investigation):**

#### If Unauthorized Access Suspected
- [ ] **Revoke suspicious access immediately**:
  - Kill all active sessions: `SELECT * FROM sessions WHERE suspicious_flag = true`
  - Reset credentials: Change passwords for affected accounts
  - Revoke API tokens: Delete or rotate any exposed API keys
  - Remove compromised SSH keys from `authorized_keys`
  - Remove any added user accounts

- [ ] **Isolate compromised systems** (if severity is critical):
  - Move database to different subnet (if possible)
  - Disable public internet access to affected systems
  - Disconnect from CI/CD pipeline
  - Keep logs running (for forensics)

- [ ] **Check for persistence mechanisms**:
  - New user accounts created in OS
  - New SSH keys added
  - New cron jobs
  - New firewall rules
  - New IAM roles (AWS/GCP/Azure)
  - Run: `last`, `lastlog`, `w`, `who`, `auditctl -l`

#### If Malware/Ransomware Suspected
- [ ] **Isolate affected systems immediately**:
  - Disconnect from network
  - Stop all running applications
  - Do NOT reboot (preserves memory forensics)
  - Notify security team before any actions

- [ ] **Quarantine backups**:
  - Disconnect backup storage from network (if ransomware)
  - Verify backups are not encrypted/corrupted

#### If Data Breach Suspected
- [ ] **Review data access logs** (who accessed what):
  - Database query logs: `SELECT * FROM audit_log WHERE created_at > now() - interval '24 hours'`
  - API access logs: `grep -i "suspicious" app.log | tail -100`
  - Export/download logs: `SELECT * FROM data_exports WHERE created_at > ...`

- [ ] **Identify exposed data**:
  - What customer data was accessed?
  - How much data (number of records)?
  - What fields (names, emails, SSNs, passwords)?
  - Who accessed it and when?

- [ ] **Stop ongoing access** (if leak is active):
  - Revoke API credentials that may be leaking data
  - Disable data export functionality temporarily
  - Restrict access to sensitive tables

#### If DDoS Attack
- [ ] **Enable DDoS protection**:
  - Activate Cloudflare, AWS Shield Advanced, or equivalent
  - Enable rate limiting on all endpoints
  - Consider going into "maintenance mode" (non-essential services down, keep core services up)

- [ ] **Notify hosting provider/CDN**:
  - Inform AWS, GCP, Cloudflare of attack
  - Request DDoS mitigation (they usually activate automatically)

#### If Service Degradation/Outage
- [ ] **Identify root cause** (preliminary):
  - Database: Check CPU, memory, connections
  - Application: Check error logs, recent deployments
  - Infrastructure: Check network, firewall, load balancer
  - Dependencies: Check status of third-party services

- [ ] **Implement temporary workaround** (if possible):
  - Scale up resources (add servers, increase memory)
  - Roll back recent deployment
  - Failover to backup system
  - Put read-only mode (disable writes temporarily)

---

### Step 4: Notify Customers (if needed) (20-30 minutes)

- [ ] **Determine if notification is required**:
  - Was customer data exposed/at risk?
  - Are customers currently unable to use service?
  - Is the incident affecting service quality?

- [ ] **Draft customer communication** (use template below)
  - Be honest but don't speculate
  - Include: What happened, timeline, impact, resolution ETA
  - Do NOT include: Technical details, root cause (yet), blame

- [ ] **Notify customers via multiple channels**:
  - In-app banner / status page
  - Email notification (if emails available)
  - Status page (status.example.com)
  - Twitter / official channels
  - Support team (brief them to handle incoming questions)

**Customer notification templates:**

**Template 1 - Service Degradation:**
```
INCIDENT NOTIFICATION

We're experiencing service degradation starting at 2026-04-25 14:35 UTC.

IMPACT: Some customers may experience slow load times or temporary unavailability.

TIMELINE:
- 14:35 UTC: Issue detected
- 14:40 UTC: Investigation underway
- [Ongoing] We're working to restore service

EXPECTED RESOLUTION: Within 2 hours

We'll provide updates every 30 minutes. For support, contact support@example.com or check status.example.com.

We apologize for the inconvenience.
```

**Template 2 - Data Security Incident:**
```
SECURITY INCIDENT NOTIFICATION

We detected unauthorized access to a limited set of customer accounts. We've immediately revoked access and are investigating.

WHAT HAPPENED:
- Unauthorized access occurred from [date/time]
- Affected accounts: [number] customers
- Data accessed: Email addresses, usernames (NOT passwords, payment info, or SSN)

WHAT WE'RE DOING:
- All unauthorized access stopped
- Affected customers notified separately
- Passwords reset (you'll receive reset link)
- We're investigating root cause

WHAT YOU SHOULD DO:
- Reset your password immediately
- Check your account for unfamiliar activity
- If you see suspicious activity, contact us immediately

We take security seriously and are committed to protecting your data.
```

- [ ] **Approve communication** with Product/Legal before sending
- [ ] **Send communication** to customers
- [ ] **Log communication time** in incident ticket

---

## Investigation (30 Minutes - 4 Hours)

### Step 5: Collect Forensic Evidence (Ongoing)

**Do this in parallel with containment actions.**

- [ ] **Preserve logs and data**:
  - Export application logs (all levels, not just errors): `tail -100000 app.log > app.log.backup`
  - Export database query logs: `mysqldump --all-databases > backup.sql`
  - Export system logs: `journalctl --since "6 hours ago" > system.log`
  - Export access logs: `tail -100000 /var/log/apache2/access.log > access.log.backup`
  - Export firewall logs (if available)
  - Export authentication logs: `grep "Failed password\|Accepted publickey" /var/log/auth.log`

- [ ] **Document the timeline**:
  - When was incident first detected?
  - When did attacker get access (based on logs)?
  - When did containment actions happen?
  - When was access finally stopped?

**Timeline example:**
```
2026-04-25 12:00 - Automated alert: 500+ failed logins in 1 hour
2026-04-25 12:05 - Security team notified
2026-04-25 12:10 - Confirmed: attacker brute-forcing admin account
2026-04-25 12:12 - CONTAINMENT: Admin account locked, password reset
2026-04-25 12:15 - INVESTIGATION: Checking database access logs
2026-04-25 12:30 - Found: 2,341 customer records queried between 12:00-12:12
2026-04-25 13:00 - Notification sent to affected customers
2026-04-25 14:00 - Root cause identified: Weak password on admin account
```

- [ ] **Identify attacker/source**:
  - Source IP address: Check access logs for login source
  - User account: Which account was compromised?
  - Attack method: Brute force, phishing, malware, insider?
  - Tools used: Automated scripts, publicly known exploits?
  - Motive: Random, targeted, competitor, insider?

---

### Step 6: Determine Root Cause (1-2 hours)

- [ ] **Answer: How did attacker get in?**
  - Weak password? (If admin: why weak password was allowed)
  - Phishing email? (Check if org-wide email compromise)
  - Malware on developer machine? (Check endpoint security)
  - Compromised third-party dependency? (Check supply chain)
  - Unpatched vulnerability? (Check version numbers)
  - Misconfigured cloud access? (Check IAM roles, bucket policies)
  - Insider threat? (Check which employee, management involvement)

- [ ] **Answer: What did attacker do?**
  - Download data? (How much, what data?)
  - Modify data? (What was changed, can it be rolled back?)
  - Install backdoor? (Check for persistence mechanisms)
  - Create accounts? (Check system users, database users, API keys)
  - Steal credentials? (Check for new API keys, ssh keys, tokens)
  - Lateral movement? (Check access to other systems, databases, services)

- [ ] **Measure impact**:
  - Number of records affected
  - Sensitivity of data (names, emails, SSNs, passwords, payment info)
  - Duration of unauthorized access
  - Affected customers (percentage, names)

- [ ] **Document findings** in incident ticket with evidence references

---

### Step 7: Prevent Recurrence (1-2 hours)

**What will prevent this specific attack in the future?**

- [ ] **Implement immediate mitigations** (do before closing incident):
  - For weak password: Enforce strong password policy going forward
  - For brute force: Implement rate limiting on login endpoint
  - For phishing: Send security awareness training
  - For unpatched vulnerability: Patch immediately + add to scanning
  - For malware: Add signatures to endpoint protection
  - For cloud misconfiguration: Fix IAM roles + add automated scanning

- [ ] **Create tickets for longer-term fixes**:
  - Implement MFA for all admin accounts
  - Add missing security monitoring
  - Update incident response runbook
  - Security training for team
  - Dependency update automation
  - Automated vulnerability scanning

- [ ] **Assign ownership** for each follow-up item
- [ ] **Set target dates** for fixes (critical within 48h, high within 1 week)

---

## Recovery (4+ Hours)

### Step 8: Restore Service (if needed)

- [ ] **Verify systems are operational**:
  - Application servers responding: `curl https://api.example.com/health`
  - Database responding: `mysql -h db.example.com -u user -p -e "SELECT 1"`
  - External services functional: Check integrations (Stripe, SendGrid, Auth0)
  - Load balancer healthy: Check target health in AWS/GCP console

- [ ] **Restore from backup** (if data was corrupted):
  - Identify last-known-good backup (before compromise)
  - Restore to staging environment first (test)
  - Verify data integrity in staging (sample checks)
  - Perform restore to production during maintenance window
  - Notify customers once restored

- [ ] **Monitor closely after recovery**:
  - Watch error logs for next 2 hours
  - Monitor API response times
  - Check database performance
  - Monitor customer support tickets
  - Have incident team on standby

---

### Step 9: Customer Communication (Ongoing)

- [ ] **Send resolution notification** (once confirmed fixed):
  ```
  INCIDENT RESOLVED

  The incident that began at 2026-04-25 14:35 UTC has been resolved.

  WHAT WE DID:
  - Identified and contained unauthorized access
  - Reset affected customer accounts
  - Verified all unauthorized access stopped
  - Reviewed logs to prevent recurrence

  NEXT STEPS:
  - We'll investigate root cause and share findings
  - We'll implement security improvements
  - Monthly security updates will be shared

  We appreciate your patience.
  ```

- [ ] **Provide transparency** (if major incident):
  - Post-incident report within 5 business days
  - Share findings and lessons learned
  - Explain prevention measures implemented
  - Offer credit/compensation if necessary (per policy)

- [ ] **Update status page**: Mark incident as resolved

---

## Post-Incident Review (Next Business Day - 1 Week)

### Step 10: Conduct Post-Incident Review (Blameless Retrospective)

**Goal: Learn from incident, improve processes, prevent recurrence**

**Schedule meeting** with:
- Incident Commander
- Security Lead
- Engineering Lead (who discovered/fixed issue)
- Ops (who did containment)
- Product (who handled customer comms)
- Other responders
- Optional: Affected team members

**Timing**: Within 48 hours (while details are fresh)
**Duration**: 60-90 minutes
**Facilitation**: Senior engineer or security lead (neutral facilitator)

**Agenda:**

1. **Timeline review** (10 minutes)
   - Walk through exactly what happened, when
   - No blame, focus on facts and process gaps

2. **Root cause analysis** (15 minutes)
   - Why did this happen? (What conditions allowed it?)
   - Ask "why" 5 times to get to root cause
   - Was this a process failure, technical failure, or both?

**Example 5-Why Analysis:**
```
Issue: Attacker gained admin access with brute force

1. Why? Admin password was weak (password123)
2. Why? No password policy enforced
3. Why? Password policy not implemented
4. Why? It wasn't prioritized (team didn't know it was needed)
5. Why? No security requirements in onboarding process

ROOT CAUSE: Lack of documented security requirements
SOLUTION: Add security checklist to onboarding, enforce in code review
```

3. **Lessons learned** (15 minutes)
   - What went well? (Keep doing this)
   - What could be improved? (Process, tools, training)
   - What surprised us? (Should have been expected)

**Example lessons:**
- ✅ Went well: Fast detection (within 5 minutes of attack)
- ✅ Went well: Good communication to customers
- ❌ Could improve: No automated response (manual steps took time)
- ❌ Could improve: Admin account didn't have MFA
- ❌ Surprised us: Attack was from common botnet (could have been blocked by WAF)

4. **Action items** (15 minutes)
   - List specific improvements
   - Assign owners, set target dates
   - Categorize: immediate (this week), short-term (this month), long-term (this quarter)

**Priority action items:**
- [ ] Implement password policy immediately (Security Lead, by tomorrow)
- [ ] Enable MFA for admin accounts (Ops Lead, by end of week)
- [ ] Add WAF rules for brute force (Ops Lead, by Friday)
- [ ] Create onboarding security checklist (Security Lead, by next week)
- [ ] Implement automated incident response (Ops Lead, target 2 weeks)

5. **Documentation** (5 minutes)
   - Update incident response runbook with lessons
   - Share post-incident report with organization
   - Update security training materials

---

### Step 11: Update Incident Response Program

- [ ] **Update this runbook** with lessons learned
- [ ] **Update escalation contacts** (if contact info changed)
- [ ] **Update on-call schedule** (if gaps identified)
- [ ] **Conduct security training** on incident type
  - How to prevent similar incidents
  - How to recognize if it's happening
  - Who to contact
- [ ] **Test incident response** annually (tabletop exercises)

---

## Incident Response Contacts

**Update this before an incident happens.**

| Role | Name | Email | Phone | Backup |
|------|------|-------|-------|--------|
| Incident Commander | | | | |
| Security Lead | | | | |
| Engineering Lead | | | | |
| Ops/Infrastructure | | | | |
| Product Manager | | | | |
| Legal/Compliance | | | | |
| Executive (VP Eng) | | | | |
| Executive (CEO) | | | | |
| Public Relations | | | | |
| Customer Support Lead | | | | |

---

## Incident Response Checklist (Quick Reference)

**Print or bookmark this for quick reference during incident.**

### FIRST 5 MINUTES
- [ ] Declare incident (assign incident commander)
- [ ] Notify key people
- [ ] Create incident channel/ticket

### FIRST 30 MINUTES
- [ ] Confirm incident is real
- [ ] Classify severity (Critical/High/Medium/Low)
- [ ] Implement immediate containment
- [ ] Preserve forensic evidence
- [ ] Determine if customer notification needed

### FIRST 2 HOURS
- [ ] Complete investigation
- [ ] Determine root cause
- [ ] Identify attack vector
- [ ] Measure impact
- [ ] Plan recovery steps

### FIRST 4 HOURS
- [ ] Recover/restore systems
- [ ] Notify customers (if needed)
- [ ] Verify systems operational
- [ ] Document timeline

### NEXT BUSINESS DAY
- [ ] Conduct post-incident review
- [ ] Create improvement action items
- [ ] Update runbook
- [ ] Share lessons learned

---

## Communication Templates

### Internal Escalation (to executives)
```
SECURITY INCIDENT ALERT

Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Status: [Investigating/Contained/Resolved]

INCIDENT: [Brief description]
DETECTED: [Time] UTC
IMPACT: [System/customer impact]
AFFECTED CUSTOMERS: [Number or percentage]

IMMEDIATE ACTIONS TAKEN:
- [Action 1]
- [Action 2]

NEXT STEPS:
- [Next step 1]
- [Next step 2]

ESTIMATED TIME TO RESOLUTION: [Time]
INCIDENT COMMANDER: [Name]
UPDATES: Every 30 minutes in #incident-response-2026-04-25

Contact [Incident Commander] for details.
```

### Customer Communication (Confirmed Impact)
```
SECURITY ALERT: We Detected Unauthorized Access

We're writing to inform you of a security incident affecting your account.

WHAT HAPPENED:
We detected unauthorized access to approximately [X] customer accounts, including yours, on [date] at [time] UTC. An attacker attempted to access account data using [attack method].

DATA AFFECTED:
- Email address
- Username
- [Other fields if applicable - NOT including passwords or payment info]

WHAT WE'RE DOING:
- We've immediately revoked the unauthorized access
- We've reset passwords for affected accounts (see instructions below)
- We're investigating the root cause
- We're implementing additional security measures

WHAT YOU SHOULD DO:
1. Reset your password using the link below (will arrive separately)
2. Review your account for any suspicious activity
3. Contact us immediately if you notice anything unusual
4. Enable two-factor authentication for additional protection

SUPPORT:
If you have questions or concerns, please contact us at [support email] or call [number].

We take your security seriously.
```

---

## Metrics to Review Post-Incident

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Time to detect | <15 minutes | | Was detection automated? |
| Time to contain | <30 minutes | | Were manual steps slow? |
| Time to investigate | <2 hours | | Do we have good logs? |
| Time to notify customer | <1 hour | | Was process clear? |
| Mean time to resolve (MTTR) | <4 hours | | Could we automate? |
| Customer notification delay | <30 minutes | | Did comms go smoothly? |
| All-hands notification | <5 minutes | | Was escalation quick? |

---

**Runbook version**: 2.0  
**Last updated**: 2026-04-25  
**Next review**: Quarterly (March, June, September, December)  
**Last drill**: [Date]  
**Next drill**: [Date + 3 months]

---

## Additional Resources

- **NIST Incident Response**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
- **SANS Incident Handling**: https://www.sans.org/white-papers/
- **AWS Security Incident Response**: https://aws.amazon.com/security/security-best-practices/
- **PagerDuty Incident Response**: https://www.pagerduty.com/incident-response/
- **Atlassian Incident Management**: https://www.atlassian.com/incident-management
