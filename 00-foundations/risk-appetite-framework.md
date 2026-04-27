# Risk Appetite Framework: Accept Risk Consciously

In 30 seconds: Every system has risk. You can't eliminate it all—you'd never ship anything. This framework helps you decide what level of risk is acceptable for your app. What risks are worth taking? What risks must you avoid? Document your decisions, monitor them, and change course if reality doesn't match your appetite.

## What is risk appetite?

Risk appetite is **the amount and type of risk your organization is willing to accept** in pursuit of strategic goals.

Example: A startup with $5M in funding might accept high operational risk (MVP can go down, data isn't backed up yet) to ship fast. A bank can't accept high operational risk—downtime loses millions per minute.

Both are rational. Both require different security investments.

## The framework: Likelihood × Impact

Every risk has two dimensions:

**Likelihood:** How probable is the attack?
- **Critical/High** — Attackers actively exploit this; tooling is public
- **Medium** — Exploit possible but requires more skill/luck
- **Low** — Possible but rare; would require targeted effort

**Impact:** What happens if you're breached?
- **Critical** — Company failure, major data loss, regulatory action
- **High** — Significant operational disruption, media coverage, customer loss
- **Medium** — Manageable operational impact, fixable within days
- **Low** — Minor annoyance, easily recovered

**Risk = Likelihood × Impact**

## Risk matrix: What to accept?

| | **Critical Impact** | **High Impact** | **Medium Impact** | **Low Impact** |
|---|---|---|---|---|
| **Critical Likelihood** | Mitigate immediately | Mitigate immediately | Mitigate soon | Accept or mitigate |
| **High Likelihood** | Mitigate immediately | Mitigate soon | Mitigate within sprint | Accept or monitor |
| **Medium Likelihood** | Mitigate soon | Mitigate within sprint | Accept or mitigate | Accept |
| **Low Likelihood** | Mitigate within sprint | Accept or mitigate | Accept | Accept |

**Rules:**
- **Red zone (top-left):** Unacceptable. Mitigate now or don't build.
- **Yellow zone (diagonal):** Depends on business context. Document why you accept it.
- **Green zone (bottom-right):** Acceptable. Monitor but don't over-invest.

## Building your risk appetite statement

Document this for your organization:

```
# Risk Appetite Statement for [App]

## What we build
We are a [SaaS/marketplace/social network] serving [users/businesses].

## Critical risks we do NOT accept
- User data theft (personal information, passwords, payment methods)
- Unauthorized access to accounts (authentication bypass)
- Service unavailability for > [X hours] (financial impact)
- Data loss (no recovery possible)

## High risks we minimize but accept
- [Example: temporary API slowness during peak load]
- [Example: 3rd party integration failures we can't control]
- [Example: browser-based attacks against specific browsers]

## Monitoring and review
- We review this quarterly
- If a critical risk becomes reality, we [escalate to leadership / pause feature development / allocate emergency resources]
- If threat landscape changes, we update this statement
```

## Examples by app type

### Example 1: Early-stage startup (MVP)

**Can accept:**
- Data backup failures (small dataset, willing to rebuild)
- Occasional downtime (low user base)
- Unencrypted data at rest (just starting)
- Limited monitoring (cost-prohibitive)

**Cannot accept:**
- User data theft (breaks trust immediately)
- Authentication bypass (competitors steal your users)
- Hardcoded secrets in git (will become public)

**Approach:** Minimal security spending. Focus on basics: HTTPS, parameterized queries, no hardcoded secrets. Accept operational risk to move fast.

### Example 2: Growth-stage SaaS ($10M ARR)

**Can accept:**
- Occasional non-critical service degradation
- Slower feature velocity due to security reviews
- Third-party library vulnerabilities (with active monitoring)

**Cannot accept:**
- Customer data breaches (regulatory fines, customer loss)
- Account takeover (customers won't pay)
- Service down during business hours (SLA violations)

**Approach:** Invest in security posture. Add encryption, monitoring, access controls. Hire a security person. Implement threat modeling.

### Example 3: Regulated company (fintech, healthcare)

**Can accept:**
- Slightly slower shipping (security review time)
- Higher infrastructure costs (redundancy, encryption)

**Cannot accept:**
- Most of what earlier stages accept. Regulations are your risk appetite statement.

**Approach:** Follow the regulations. HIPAA, PCI-DSS, GLBA, etc. are non-negotiable. Audits, logging, encryption, segregation are requirements, not options.

## Common risk decisions and trade-offs

### Authentication: MFA or not?

**Risk:** Account takeover (passwords are weak)
- **Likelihood:** High (billions of password databases leaked)
- **Impact:** Critical (attacker gets access to all user data)

**Options:**
- Optional MFA (users choose) — Low overhead, but 90% of users skip it
- Required MFA (everyone) — Prevents account takeover; some user friction
- Risk acceptance (no MFA) — Fast registration; hope your customer base is small enough that breaches don't matter

**Typical appetite:** 
- Startups: Optional MFA
- SaaS: Required MFA for admins/sensitive actions; optional for users
- Healthcare/Finance: Required MFA for everyone

### Data backup: How often? How long to keep?

**Risk:** Data loss (corruption, ransomware, accidental deletion)
- **Likelihood:** Medium (backups do fail)
- **Impact:** Critical (complete data loss)

**Options:**
- No backups (cheap, unacceptable for most apps)
- Daily backups, kept 7 days (cheaps; some data loss possible)
- Hourly backups, kept 30 days (standard SaaS)
- Continuous replication, kept 90 days (enterprise)

**Typical appetite:**
- Startups: Daily, 7 days
- SaaS: Hourly, 30 days
- Enterprise: Hourly with off-site replication, 90 days

### Secrets management: How to store API keys?

**Risk:** Secret exposure (hardcoded keys, logged values, leaked configs)
- **Likelihood:** High (tons of GitHub leaks every month)
- **Impact:** Critical (attacker can impersonate your system)

**Options:**
- Hardcoded in `.env` (unacceptable; will leak)
- Hardcoded in config files (unacceptable; committed to git)
- Environment variables (acceptable for small teams; risky at scale)
- Secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.) (best practice; extra cost/complexity)

**Typical appetite:**
- All: Never hardcoded
- Startups: Environment variables
- SaaS/Enterprise: Secrets manager

## Risk monitoring: How to track acceptance

Once you've decided what risks you accept, monitor them:

```python
# Example: monitoring for high-likelihood, high-impact risks

def monitor_critical_risks():
    """Alert if we breach our risk appetite"""
    
    # Risk: Account takeover
    failed_logins = count_failed_logins(last_hour=60)
    if failed_logins > 100:
        alert("High brute-force activity detected")
    
    # Risk: Data exfiltration
    large_exports = db.query("""
        SELECT * FROM audit_log 
        WHERE action = 'BULK_EXPORT' AND timestamp > now() - interval 1 hour
    """)
    if len(large_exports) > 5:
        alert("Unusual number of data exports")
    
    # Risk: Unauthorized access
    access_denials = count_authorization_failures(last_hour=60)
    if access_denials > 50:
        alert("High authorization failure rate; possible attack")

# Run this every 5 minutes
schedule(monitor_critical_risks, interval="5m")
```

## Risk decisions you must document

For each risk you *accept* (don't mitigate), document:

1. **What is the risk?** (be specific)
2. **Why are we accepting it?** (business reason, not just laziness)
3. **How likely is it?** (rough estimate)
4. **What's the impact?** (be honest)
5. **How will we know if it happens?** (monitoring/alerting)
6. **When will we revisit?** (quarterly, annually, etc.)

**Example:**
```
## Accepted Risk: Optional MFA for regular users

**Risk:** Account takeover via password theft
**Likelihood:** High (billions of leaked passwords)
**Impact:** High (user loses access to their data; we lose their trust)
**Why we accept it:** Reducing signup friction is critical to our growth. 
                     Admin users and power users are required to use MFA.
**Monitoring:** Weekly alert on failed login attempts > 100/day
**Revisit:** Quarterly; will require MFA for all users if:
             - More than 2 accounts are compromised (high-impact users)
             - We have 100k+ users (scale makes attacks more likely)
             - Competitor implements required MFA (market pressure)
```

## Risk appetite by security domain

### Infrastructure & Operations
- [ ] We accept risks: [list]
- [ ] We do not accept risks: [list]

### Application Security
- [ ] Input validation gaps in non-critical features?
- [ ] Weak encryption in non-sensitive fields?
- [ ] Lack of monitoring in certain services?

### Identity & Access
- [ ] Weak authentication for non-admin users?
- [ ] Limited authorization checks in internal tools?
- [ ] Lack of MFA for most users?

### Data
- [ ] Unencrypted logs?
- [ ] Retention of data we don't need?
- [ ] Lack of backup redundancy?

### Compliance
- [ ] We operate under [regulations]: [HIPAA/GDPR/PCI-DSS/SOX]
- [ ] These are non-negotiable (not appetites, requirements)

## Updating your risk appetite

Your risk appetite changes over time:

**Triggers for review:**
- Market changes (e.g., new regulation)
- Growth (50 users → 50k users changes acceptable risk)
- Incidents (a competitor was breached; adjust your appetite)
- Technology changes (easier MFA → may want to require it)
- Business changes (series funding → higher accountability)

**Review process:**
1. Quarterly risk review (leadership + security + engineering)
2. Update risk appetite statement
3. Communicate changes to the team
4. Adjust controls/monitoring accordingly

## Why this matters

**Without a risk appetite framework:**
- Every security decision becomes a fight (is this necessary?)
- You over-invest in low-risk items and under-invest in critical ones
- You can't onboard new team members (they don't know what you care about)
- When breaches happen, you have no documented decision (legal liability)

**With a risk appetite framework:**
- Decisions are transparent and documented
- Team aligns on priorities
- You can justify security spending to leadership
- When incidents happen, you have a clear plan (we decided this was acceptable risk)

## What comes next

- **[Threat Modeling 101](./threat-modeling-101.md)** — Use this framework to prioritize your threat model
- **[The Human Layer](./the-human-layer.md)** — Risk appetite requires buy-in from the whole team
- **01-architecture/** — Design decisions should be checked against your risk appetite
- **02-code/** — Implementation decisions should follow your risk appetite

---

**Related:**
- [Secure by Default](./secure-by-default.md)
- [Threat Modeling 101](./threat-modeling-101.md)
- [Glossary](./glossary.md) (look up: likelihood, impact, risk, mitigation, acceptance)
