# The Human Layer: Why Training and Process Matter

In 30 seconds: Security isn't just code—it's people. The best encryption won't save you if someone leaves the database password in a git commit. Or if an employee falls for a phishing email. Or if your team doesn't know what to do during an attack. This section covers training, incident response, and the processes that make security stick across your entire organization.

## The hardest part of security is people

Data shows: **Most breaches involve human error.** 

- 88% of data breaches caused by human error
- Phishing is the entry vector for 90% of attacks
- Insider threats account for 30% of breaches
- Misconfigured cloud storage loses more data than sophisticated attacks

You can build the most secure code possible, but if:
- An employee writes their password on a sticky note
- Someone falls for a phishing email
- A developer commits secrets to GitHub
- Your team doesn't know how to respond to an attack

...then your security is broken.

## Security training: What everyone needs

Everyone on your team—developers, designers, product, ops, even leadership—needs basic security training.

### Level 1: Everyone (30 minutes, annual)

**Topics:**
- Why security matters (show them [Why Security Matters](./why-security-matters.md))
- Phishing recognition and reporting
- Password safety (unique passwords, password manager)
- Handling confidential information
- When to escalate security issues

**Format:** Online course, lunch-and-learn, or read + quiz.

**Cost:** Free (DIY) to $5/person/year (Coursera, Pluralsight, etc.).

**ROI:** Prevents most social engineering attacks.

**Example phishing emails to recognize:**
```
From: "IT Support" <it_support@example.com>
Subject: Urgent: Verify your account

Click here immediately to verify your account:
http://example-account-verify.com/login

Your account will be locked in 24 hours if not verified.
```

🚩 **Red flags:**
- Urgent language with threats
- Misspelled domain (example-account-verify vs. example)
- Asks for password via email/link
- Generic greeting ("Dear User" instead of "Hi Alice")

### Level 2: Developers (2 hours, quarterly)

**Topics:**
- OWASP Top 10 (what to avoid)
- Secure coding practices for your framework
- Dependency management and vulnerability scanning
- Secrets management (how to NOT leak API keys)
- How to report security bugs

**Format:** Interactive workshop, code review exercise, attack simulation.

**Cost:** Internal time or external trainer ($2k-$10k per session).

**ROI:** Prevents vulnerability introduction.

**Example: Secrets management workshop**
```
BEFORE (❌ vulnerable):
// hardcoded key in source code
const STRIPE_KEY = "sk_live_123456789";

AFTER (✅ secure):
// environment variable
const STRIPE_KEY = process.env.STRIPE_API_KEY;

// or secrets manager
const secrets = await secretsManager.get("stripe-api-key");
```

### Level 3: Operations/DevOps (4 hours, quarterly)

**Topics:**
- Infrastructure security
- IAM (Identity & Access Management) best practices
- Secrets management and rotation
- Monitoring and alerting
- Incident response procedures

**Format:** Hands-on lab with your actual infrastructure.

**Cost:** Internal time + lab environment.

**ROI:** Prevents most configuration-based breaches.

### Level 4: Leadership (1 hour, annually)

**Topics:**
- Risk appetite and business trade-offs
- Compliance and regulatory requirements
- Incident response and communication
- Security budget allocation
- Board/investor reporting

**Format:** Executive briefing.

**Cost:** Internal time.

**ROI:** Ensures security is resourced and supported.

## Red teams: Testing your defenses

A red team is your internal attackers. They try to break into your system to find weaknesses before real attackers do.

**Red team activities:**
- Phishing campaigns (send fake phishing emails to employees; track who clicks)
- Physical security testing (try to get into the office without a badge)
- Code review hunting for vulnerabilities
- Penetration testing (simulate attacker compromising systems)
- Social engineering (call employees pretending to be IT, see who gives up passwords)

**Starting simple:**
1. **Month 1:** Run phishing simulation. Track who clicks. Train them.
2. **Month 2:** Have your security engineer review code for SQL injection.
3. **Month 3:** Have your DevOps try to get admin access to production (should fail with strong controls).

**Frequency:** Quarterly for growing companies.

**Cost:** Internal (DIY) to $50k+ for external red team.

**ROI:** Finds vulnerabilities before they're exploited.

**Important:** Make it safe to fail. If an employee clicks a phishing email, that's a learning moment, not a firing offense. If you punish people for security mistakes, they'll hide them.

## Incident response: Having a plan

An incident is when something bad happens: Data is breached, service goes down, attacker gets access, etc.

Most companies don't have an incident response plan. When something happens, they panic, make mistakes, and make the breach worse.

**Your incident response plan should include:**

1. **Detection:** How do you know something happened?
   - Monitoring alerts ("Unusual login from unknown IP")
   - User reports ("I didn't authorize that transaction")
   - Security scan ("Found unencrypted database")

2. **Containment:** Stop the bleeding.
   - Disable compromised account
   - Kill attacker's access
   - Stop data exfiltration

3. **Investigation:** Understand what happened.
   - Look at logs ("When did attacker first get access?")
   - Determine scope ("What data was accessed?")
   - Find root cause ("How did they get in?")

4. **Recovery:** Fix it.
   - Patch the vulnerability
   - Reset passwords
   - Restore from backups if needed

5. **Post-mortem:** Learn and improve.
   - Document what happened
   - Identify gaps in detection/prevention
   - Update processes

**Example incident response procedure:**

```
IF incident detected:
  1. Declare incident (slack: #incident)
  2. Assemble team (security + eng + ops + product)
  3. Activate war room (video call + shared doc)
  4. Assign roles:
     - Incident commander (runs the meeting)
     - Scribe (documents timeline)
     - Comms (updates leadership/customers)
     - Tech lead (coordinates fixes)

FIRST HOUR:
  - [ ] Confirm it's real (not false alarm)
  - [ ] Contain damage (kill attacker access)
  - [ ] Assess scope (how bad is it?)
  - [ ] Notify leadership
  - [ ] Start logging everything

NEXT HOURS:
  - [ ] Investigate root cause
  - [ ] Implement fixes
  - [ ] Notify affected users (if required)
  - [ ] Coordinate with legal/PR if needed

AFTER RESOLVED:
  - [ ] Post-mortem (what happened, how to prevent)
  - [ ] Update processes
  - [ ] Follow up with affected users
```

**Key contacts (your incident response team):**
- Security lead
- Engineering lead
- DevOps lead
- CEO/leadership
- Legal
- PR/comms
- Customer success

Make a contact list. Practice calling them. You don't want to figure out who to call when an attack is happening.

## Security policies: Making it stick

Policies are written rules about security. They're not exciting, but they prevent chaos.

**Policies every team should have:**

### 1. Password policy
```
- Minimum 12 characters
- No dictionary words
- Use password manager (we provide [tool])
- Never share passwords via email
- Change if compromised
- MFA required for sensitive systems
```

### 2. Device security policy
```
- Company devices must have:
  - Full disk encryption
  - Firewall enabled
  - Automatic screen lock (5 min)
  - Antivirus/malware detection
  - Automatic OS/software updates
- No personal data on company devices
- Devices lost/stolen: immediately report
```

### 3. Remote work security policy
```
- Use VPN for all company network access
- Public WiFi: VPN required
- Don't work from shared/unsecured networks
- Close apps when stepping away
- Lock screen when idle > 5 min
```

### 4. Data handling policy
```
- Only store PII you need
- Encrypt sensitive data at rest and in transit
- Never email passwords or API keys
- Delete data when retention period ends
- Classify data by sensitivity level
```

### 5. Third-party access policy
```
- All third-party access requires approval
- Access granted with least privilege
- Regular review of access rights
- Automatic revocation when contractor leaves
- Monitoring of third-party activity
```

### 6. Incident reporting policy
```
- Report security issues immediately
- Use security@company.com or [form]
- No retaliation for good-faith reports
- Security team investigates
- Response time: within 24 hours for critical
```

**Making policies stick:**
- Don't make policies too restrictive (engineers will ignore them)
- Explain the "why" (why MFA matters)
- Make compliance easy (provide password manager, VPN software)
- Review policies regularly (keep them relevant)
- Train on policies (don't assume people read them)

## Security culture: Making it everyone's job

The best security happens when everyone cares.

**Signs of good security culture:**
- Engineers propose security improvements
- People report security concerns without fear
- Security reviews happen before deployment
- Security is part of code review checklist
- Team celebrates security improvements
- People feel comfortable admitting mistakes

**Building security culture:**
1. **Make it visible:** Post security tips in Slack, include in standup, celebrate wins
2. **Make it easy:** Provide tools (password manager, VPN, secrets manager)
3. **Make it valued:** Include security in performance reviews
4. **Make it safe:** Never punish good-faith security mistakes
5. **Make it collaborative:** Security team works *with* engineering, not policing them

**Example: Security in code review**
```
Review checklist:
- [ ] Input validation on all user-facing endpoints
- [ ] No SQL injection vectors (parameterized queries)
- [ ] No hardcoded secrets
- [ ] Sensitive data encrypted in transit (HTTPS) and at rest
- [ ] Authorization checks before returning data
- [ ] Rate limiting where needed
- [ ] Errors don't leak sensitive info
```

## Compliance and regulations

Depending on where you operate and what you do, you may have legal requirements.

**Common regulations:**
- **GDPR (EU):** If you have EU customers, you must comply. Fines up to €20M.
- **HIPAA (US healthcare):** If you handle medical data, you must encrypt and audit.
- **PCI-DSS (payments):** If you process credit cards, strict requirements.
- **SOX (public companies):** Financial data must be secure and audited.
- **CCPA (California):** Similar to GDPR; privacy rights for California residents.

**If regulated:**
- Get a compliance checklist (GDPR has a 90-point checklist)
- Assign someone to own compliance
- Audit regularly (annual at minimum)
- Document everything (audits require documentation)
- Budget for compliance (it's not free)

**If not regulated:**
- Still follow best practices (customers expect it)
- Document your security measures (builds trust)
- Have a data privacy policy (even if not legally required)

## Security metrics: Measure what matters

You can't improve what you don't measure.

**Metrics to track:**

| Metric | Good | Concerning |
|--------|------|-----------|
| Vulnerability scanning coverage | 100% of code scanned | < 50% scanned |
| Critical vulnerabilities | 0 in production | Any |
| Time to patch critical vulnerability | < 24 hours | > 1 week |
| Security training completion | > 90% | < 50% |
| Phishing click rate | < 5% | > 15% |
| Password reuse | 0% (no password reuse) | > 10% |
| MFA adoption | > 80% for sensitive systems | < 30% |
| Incident detection time | < 1 day | > 1 week |
| Code review security checklist | 100% of PRs | < 50% of PRs |

**Dashboards:** Share metrics with the team weekly. Make security visible.

## Why this matters

Companies with strong human-layer security:
- Have far fewer breaches
- Recover faster from incidents
- Build customer trust
- Lose fewer employees to burnout (security-aware teams don't panic)
- Sleep better

Companies that neglect this layer:
- Get breached because of phishing, human error, or misconfigurations
- Panic during incidents and make things worse
- Lose customer trust after breaches
- Have high turnover (people don't feel supported)
- Lose money and reputation

## Implementation roadmap

**Month 1:**
- [ ] Basic security training for all staff
- [ ] Create incident response plan
- [ ] Document core policies (password, device, data handling)

**Month 2-3:**
- [ ] Implement secrets management
- [ ] Run first security code review
- [ ] Phishing simulation campaign

**Month 4-6:**
- [ ] Developer security training (quarterly)
- [ ] Red team exercise (code review for vulns)
- [ ] Security metrics dashboard

**Month 6+:**
- [ ] Quarterly training and exercises
- [ ] Annual penetration test
- [ ] Continuous improvement based on metrics

## What comes next

- **[Why Security Matters](./why-security-matters.md)** — Understand the business case for security culture
- **[Risk Appetite Framework](./risk-appetite-framework.md)** — Use this to prioritize human-layer investments
- **01-architecture/** — Design systems that are easy to operate securely
- **02-code/** — Code review practices that catch vulnerabilities

---

**Related:**
- [Secure by Default](./secure-by-default.md)
- [Threat Modeling 101](./threat-modeling-101.md)
- [Glossary](./glossary.md) (look up: incident, phishing, social engineering, penetration testing)
