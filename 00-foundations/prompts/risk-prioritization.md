# Risk Prioritization Agent

**When to use:** After threat discovery or STRIDE analysis, you have a list of threats and need to decide which ones to fix first. Use this to prioritize by likelihood and impact.

**Works with:** [Risk Appetite Framework](../risk-appetite-framework.md), [Threat Modeling 101](../threat-modeling-101.md)

**Time required:** 10-15 minutes

**Output:** Threats prioritized by risk level (Critical, High, Medium, Low) with recommendations on implementation order

---

## The Prompt

Copy and paste this into Claude:

```
You are a security risk prioritization expert. Your job is to help teams decide 
which security threats to fix first when resources are limited.

I'm going to give you a list of threats. Your job is to:
1. Ask about your company's risk appetite (what risks are acceptable?)
2. Evaluate each threat by likelihood and impact
3. Prioritize them (what should we fix first?)
4. Suggest implementation order (critical → high → medium)
5. Help identify risks you can "accept" vs. "mitigate"

For each threat, you'll help estimate:
- **Likelihood:** How easy/likely is the attack?
  - Critical: Publicly known exploit, minimal skill, automated tools
  - High: Known technique, moderate skill, common attack
  - Medium: Possible but requires some skill/luck
  - Low: Rare; requires specific conditions or advanced skill

- **Impact:** What happens if exploited?
  - Critical: Company failure, massive data loss, regulatory action
  - High: Significant operational disruption, customer loss
  - Medium: Manageable disruption, fixable within days
  - Low: Minor annoyance, easily recovered

Risk = Likelihood × Impact:
- Critical likelihood + Critical impact = FIX IMMEDIATELY
- High likelihood + High impact = FIX FIRST SPRINT
- Medium likelihood + Medium impact = FIX WITHIN 3 MONTHS
- Low likelihood + Low impact = ACCEPT or FIX IF TIME

Let's start:
1. What type of app/business are you? (startup, enterprise, regulated industry)
2. What's your team size? (how much can you fix at once?)
3. What risks are you willing to accept? (time to market vs. security)
4. Give me your threat list (copy from threat modeling)
```

---

## Example conversation

**You describe your situation:**
```
Series A SaaS startup, $2M funding. Building expense management app.
Team: 2 engineers, 1 DevOps, 1 product manager. No dedicated security person.

Timeline: Public beta in 3 months.

Threats from threat modeling:
1. Tenant data isolation bypass (could see other companies' expenses)
2. File upload RCE (malicious file uploads)
3. SQL injection in search
4. Session token hijacking
5. Weak password policy
6. Unencrypted database
7. Missing rate limiting
8. Error messages leak info
9. Credentials in git
10. XSS vulnerability in frontend

What should we fix first?
```

**Agent asks clarifying questions:**

```
Great! Let me understand your risk appetite:

1. **Revenue impact:** How much revenue would you lose if:
   - Service was down for 1 hour? (maybe $100)
   - Service was down for 1 day? (maybe $1k)
   - Customer data was breached? (probably fail the company)

2. **Regulatory/compliance:** 
   - Are you HIPAA/GDPR/PCI-DSS regulated? (no - good, that simplifies)
   - Do enterprise customers require SOC 2? (eventually, but not now)

3. **Data sensitivity:**
   - What's the worst that could happen if customer data is stolen?
   - Would customers leave forever, or is trust recoverable?

4. **Investor expectations:**
   - Would a breach kill your funding/partnership opportunities?
   - Is security a sales differentiator? (do customers ask about it?)

5. **Team constraints:**
   - 3 engineers can probably handle 2-3 security fixes per sprint
   - How much time can you allocate? (full sprint? 20% of time?)
   - Can you hire security contractor if needed? (maybe for audit)

Based on my sense:
- You're pre-product-market-fit, so speed matters
- But a major breach now (tenant isolation, RCE) kills the company
- You can accept some risks (missing rate limiting) temporarily
- You must prevent catastrophic risks (data breaches)
```

**You answer:**
```
1. Breach would be company-killing. Customers are handling real business expenses 
   (money/tax records). They'd never trust us again.

2. Not regulated yet, but customers ask about data security. Some have mentioned 
   SOC 2 requirements (though not for beta).

3. If we lose customer data, we're done. But minor issues (slow API, missing MFA) 
   are OK for now.

4. Investor would be OK with security compromises to ship fast, but NOT with a 
   preventable breach.

5. We can allocate 1 engineer for 1 month pre-launch for security hardening. 
   Can also spend $5k on external security review.
```

**Agent prioritizes threats:**

```
Based on your situation, here's your risk matrix:

# RISK MATRIX

## CRITICAL RISK (Fix before launch at all costs)
These threaten company viability. A breach here = game over.

### 1. Tenant data isolation bypass
- **Likelihood:** HIGH (if not implemented carefully)
- **Impact:** CRITICAL (customer sues, loses all trust, fails company)
- **Risk:** CRITICAL
- **Why:** A customer seeing another company's expense data is a lawsuit
- **Fix effort:** 2-3 days
- **Test plan:** Security review checklist + penetration test
- **Recommendation:** FIX IMMEDIATELY (sprint 1)

### 2. SQL injection in search
- **Likelihood:** HIGH (common attack, automated scanners find it)
- **Impact:** CRITICAL (attacker reads/modifies all data)
- **Risk:** CRITICAL
- **Why:** Your entire database is at risk
- **Fix effort:** 1-2 days (code review + parameterized queries)
- **Test plan:** Attempt injection in search, verify it fails
- **Recommendation:** FIX IMMEDIATELY (sprint 1)

### 3. File upload RCE
- **Likelihood:** HIGH (common attack if not done right)
- **Impact:** CRITICAL (attacker gains server access)
- **Risk:** CRITICAL
- **Why:** RCE lets attacker do anything
- **Fix effort:** 2-3 days (validation, safe storage, permissions)
- **Test plan:** Try uploading .php, .exe, polyglot file; verify rejection
- **Recommendation:** FIX IMMEDIATELY (sprint 1)

---

## HIGH RISK (Fix before beta launch)
These are significant but not catastrophic. Fix in first month.

### 4. Unencrypted database
- **Likelihood:** MEDIUM (attacker would need database access)
- **Impact:** CRITICAL (all customer data exposed)
- **Risk:** HIGH (mitigated by defense-in-depth, but important)
- **Why:** If RDS is breached, encryption is your last line of defense
- **Fix effort:** 1 hour (enable RDS encryption, re-encrypt existing data)
- **Test plan:** Verify encryption is enabled in RDS console
- **Recommendation:** FIX IN SPRINT 2

### 5. Credentials in git history
- **Likelihood:** MEDIUM (easy to accidentally do)
- **Impact:** CRITICAL (attacker uses your AWS keys, etc.)
- **Risk:** HIGH
- **Why:** If any credentials are committed, attacker can use them
- **Fix effort:** 3-4 hours
  - [ ] Use git-secrets or trufflehog to scan history
  - [ ] Rotate any exposed credentials
  - [ ] Set up pre-commit hook to prevent future commits
- **Test plan:** Run trufflehog on your repo
- **Recommendation:** DO THIS WEEK (before anyone gets access to repo)

### 6. Session token hijacking (via localStorage XSS)
- **Likelihood:** MEDIUM (if you have XSS vulnerabilities)
- **Impact:** HIGH (attacker reads user's data)
- **Risk:** HIGH
- **Why:** XSS + localStorage = token theft = account compromise
- **Fix effort:** 4-6 hours
  - [ ] Move token from localStorage to httpOnly cookie
  - [ ] Add Content-Security-Policy header
  - [ ] Escape all user input in templates
- **Test plan:** Try to read token from localStorage (should fail)
- **Recommendation:** FIX IN SPRINT 2

### 7. Weak password policy
- **Likelihood:** HIGH (users pick weak passwords)
- **Impact:** MEDIUM (if user is compromised, not all customers)
- **Risk:** HIGH (but mitigated by defense-in-depth)
- **Why:** Weak passwords → brute force → account compromise
- **Fix effort:** 2-3 hours
  - [ ] Min 12 characters
  - [ ] Check against Have I Been Pwned API
  - [ ] Rate limit login (5 attempts per minute max)
- **Test plan:** Try logging in with password123 (should fail)
- **Recommendation:** FIX IN SPRINT 2

---

## MEDIUM RISK (Fix within 3 months)
These are important but not urgent. Can delay if tight on time.

### 8. Missing rate limiting
- **Likelihood:** MEDIUM (easy to do once auth is working)
- **Impact:** HIGH (DoS attack makes API unavailable)
- **Risk:** MEDIUM (depends on your scale)
- **Why:** Without rate limiting, 1 attacker can take down your API
- **Fix effort:** 4-6 hours (add rate limiter middleware)
- **Test plan:** Rapid-fire requests to API (should be throttled)
- **Recommendation:** FIX BEFORE PUBLIC BETA (1st month)

### 9. Error messages leak info
- **Likelihood:** LOW (accidental in development)
- **Impact:** MEDIUM (helps attackers understand system)
- **Risk:** MEDIUM
- **Why:** Stack traces and database errors teach attackers
- **Fix effort:** 2-3 hours
  - [ ] Catch errors, log server-side, return generic response
  - [ ] Include request ID in error message
- **Test plan:** Trigger errors, verify you see generic messages
- **Recommendation:** FIX BEFORE BETA

### 10. XSS vulnerability
- **Likelihood:** MEDIUM (easy to make in React if not careful)
- **Impact:** MEDIUM (allows token hijacking, defacement)
- **Risk:** MEDIUM
- **Why:** XSS + localStorage = token theft
- **Fix effort:** Ongoing (code review during development)
- **Test plan:** Try to inject <script> tag in user input
- **Recommendation:** PREVENT DURING DEVELOPMENT (code review + linting)

---

## LOW RISK (Accept or fix if time permits)
These are nice-to-have but not critical for launch.

### 11. Lack of audit logging
- **Likelihood:** LOW (not exploited unless company mature)
- **Impact:** MEDIUM (can't prove what happened)
- **Risk:** LOW (important for future, not critical now)
- **Why:** For SOC 2, you'll need this. For beta, customers don't expect it.
- **Fix effort:** 8-12 hours (logging infrastructure)
- **Recommendation:** DEFER TO SPRINT 3+ (do before SOC 2 audit)

---

# IMPLEMENTATION ROADMAP

## Before launch (Week 1-2, assign 1 engineer)
1. [x] Scan git history for credentials (git-secrets)
2. [x] Rotate any exposed credentials
3. [x] Tenant isolation code review (verify every endpoint filters by tenant)
4. [x] SQL injection review (parameterized queries everywhere)
5. [x] File upload validation (magic bytes, safe storage)
6. [x] Token security (httpOnly cookies)
7. [x] Enable RDS encryption

## Sprint 1 (Week 3-4)
1. [x] Rate limiting (middleware)
2. [x] Password policy (validation + HIBP API)
3. [x] Error message handling (generic errors)
4. [x] CSP header (prevent XSS)
5. [x] HTTPS everywhere + HSTS header

## Sprint 2 (Weeks 5-8)
1. [x] Security code review (find remaining issues)
2. [x] Dependency scanning (npm audit, Snyk)
3. [x] Penetration test (external security firm)
4. [x] Incident response plan (written)
5. [x] Security training (team)

## Defer to post-launch
- Audit logging (needed for SOC 2, not beta)
- DDoS protection (Cloudflare, only if attack happens)
- Advanced monitoring (after finding baseline)
- Security team hire (after revenue validates model)

---

# RISKS YOU'RE ACCEPTING (Explicitly)

Document these decisions (you'll need them for investors):

```
Expense Management SaaS - Risk Acceptance Statement

CRITICAL RISKS WE DO NOT ACCEPT:
- Tenant data isolation failure (would cause data breach)
- SQL injection (would compromise database)
- File upload RCE (would give attacker server access)

HIGH RISKS WE ACCEPT FOR SPEED:
- Lack of DDoS protection (small user base, low likelihood)
  - Mitigation: We can spin up Cloudflare in 2 hours if attacked
  
- Lack of audit logging (not SOC 2 compliant yet)
  - Mitigation: Will implement before enterprise sales

- No MFA (optional)
  - Mitigation: Added to Q2 roadmap after beta

MONITORING:
- Daily security scans for vulnerabilities (Snyk)
- Monthly security reviews
- Incident response plan in place

REVIEW DATE: After beta launch or if threat landscape changes
```

---

# IMPLEMENTATION CHECKLIST

## Week 1 (Credentials & Isolation)
- [ ] Run trufflehog on entire git history
- [ ] Rotate any exposed credentials
- [ ] Code review: every endpoint filters by tenant_id
- [ ] Every database query includes tenant filter
- [ ] Test: attempt to access other tenant's data (should fail)

## Week 2 (SQL + Upload + Token)
- [ ] Code review: all SQL uses parameterized queries
- [ ] Scan for string concatenation in SQL (grep for common patterns)
- [ ] File upload: validate magic bytes, disable scripts
- [ ] Test: upload .php, .exe, .sh (should reject)
- [ ] Token: move from localStorage to httpOnly cookie
- [ ] Test: open console, verify can't read token

## Week 3 (Rate limiting + Password + Errors)
- [ ] Add rate limiting middleware (express-rate-limit)
- [ ] Password validation: min 12 chars, HIBP check
- [ ] Error handling: catch all errors, return generic message
- [ ] Error logging: log detailed errors server-side
- [ ] HTTPS everywhere + HSTS header

## Week 4 (Encryption + Testing)
- [ ] Enable RDS encryption
- [ ] HTTPS certificate (free from Let's Encrypt)
- [ ] Run npm audit, fix high/critical
- [ ] Penetration test (hire external)
- [ ] Incident response plan (document)

---

## NEXT STEPS

1. **Get stakeholder buy-in:** Show team this roadmap
2. **Assign owner:** Who's responsible for each item?
3. **Track progress:** Weekly check-in on completion
4. **Document decisions:** Write risk acceptance statement
5. **Plan post-launch security:** Audit logging, monitoring, SOC 2 path

---

## Q&A

**Q: Can we launch without all of this?**
A: No. The Critical risks (tenant isolation, SQL injection, RCE) must be fixed before 
launch. The High risks (encryption, rate limiting) should be fixed before public beta. 
The Medium risks can be deferred slightly but not long.

**Q: How long does this take?**
A: 1 engineer for 3-4 weeks of focused security work. Alternatively, 20% time for 
2-3 months. The faster path (3-4 weeks) is better; prevents security from being forgotten.

**Q: What if we don't have time?**
A: Hire a security contractor ($5-10k) to do code review and penetration test. 
They'll catch most issues in 1-2 weeks.

**Q: Should we hire a security person?**
A: Not yet. Post-launch, when you have revenue. For now, spend money on:
  1. External security review
  2. Automated scanning (Snyk, GitHub security)
  3. Security training for team
  In that order.

**Q: What about SOC 2 / compliance?**
A: Not needed for beta. Plan for it in 6-12 months when enterprise sales start.
```

---

## What to expect

The agent will:
- Ask about your risk appetite and constraints
- Evaluate each threat by likelihood and impact
- Prioritize by risk level
- Suggest implementation order
- Help you document "risks you accept"

You should:
- Give honest answers about business pressure/constraints
- Describe your team size and available time
- Be clear about what "company failure" means for your business
- Be prepared to document accepted risks

---

## Learn more

- [Risk Appetite Framework](../risk-appetite-framework.md) — How to think about risk acceptance
- [Threat Modeling 101](../threat-modeling-101.md) — Where these threats come from
- [Threat Discovery Agent](./threat-discovery.md) — How to generate this threat list
- [STRIDE Analysis Agent](./stride-analysis.md) — Systematic threat analysis

---

**Pro tip:** Share the "Risk Acceptance Statement" with your team and investors. It shows you've thought about security and made conscious trade-offs. It's better than "we're fixing everything" (unrealistic) or "we're ignoring security" (scary).
