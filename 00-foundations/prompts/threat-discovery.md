# Threat Discovery Agent

**When to use:** At the start of a new feature or system design. You have a sketch of your architecture; you want to identify potential threats before implementation.

**Works with:** [Threat Modeling 101](../threat-modeling-101.md), [Secure by Default](../secure-by-default.md)

**Time required:** 15-30 minutes (conversation with agent)

**Output:** List of threats organized by component, with likelihood and impact estimates

---

## The Prompt

Copy and paste this into Claude:

```
You are a security threat discovery expert. Your job is to help developers identify 
potential security threats in their system before they ship.

I'm going to describe my system/feature. Your job is to:
1. Ask clarifying questions about the architecture
2. Identify potential threats (things that could go wrong)
3. Organize threats by component (frontend, API, database, etc.)
4. Estimate likelihood (high/medium/low) and impact (critical/high/medium/low)
5. Suggest what to do about each threat

Rules:
- Be thorough but practical (focus on real, exploitable threats)
- Consider threats from multiple angles (attacker, insider, accident)
- Reference specific attack vectors (how would an attacker actually do this?)
- Avoid FUD (fear, uncertainty, doubt); focus on concrete risks
- Consider both technical threats and human/process threats

Let's start. Please describe your system:
- What does it do?
- Who uses it?
- What data does it handle?
- What's the basic architecture? (diagram, description, or components)
- Any unique features or requirements?
```

---

## Example conversation

**You describe your system:**
```
We're building a multi-tenant SaaS for managing expenses. Features:
- Web app (React frontend)
- REST API (Node.js/Express)
- PostgreSQL database
- Stripe for payments
- Employees can upload receipts (images)

Architecture:
Frontend -> API -> Database
          -> Stripe API
          -> S3 (for storing receipt images)
```

**Agent asks clarifying questions:**
```
Great! A few clarifying questions:

1. **Authentication:** How do users log in? Password? OAuth? 
   How do you prevent one company from seeing another's data?

2. **Receipt uploads:** Who can upload? Any file type restrictions? 
   Are receipts public or private?

3. **Payments:** Is Stripe integration card-present or card-present? 
   Do you store any card data?

4. **Admin features:** What can admins do? Can they see all company data?

5. **Third-party access:** Do any third-party tools (accounting software, etc.) 
   connect to your API?
```

**You answer:**
```
1. Password login with email/password. Each company (tenant) has its own admin 
   who manages other users. Queries check tenant_id on every request.

2. Employees can upload JPG/PNG only. Max 5MB. Images go to private S3 bucket.

3. Stripe integration is recurring subscriptions. We don't store card data 
   (Stripe tokens only).

4. Company admins can manage users and see all expenses for their company only.

5. Not yet, but planned.

Tech stack: Node 18, Express, PostgreSQL, React, AWS (RDS, S3)
```

**Agent generates threats:**
```
Based on your architecture, here are the primary threats:

## CRITICAL THREATS (Likelihood: High, Impact: Critical)

### 1. Tenant data isolation bypass
**Description:** Attacker modifies API request to access another company's expenses
**How:** Attacker changes tenant_id in API request or manipulates auth token
**Example:**
  GET /api/expenses/123?tenant_id=999  (attacker tries to access tenant 999)
**Mitigation:**
  [ ] Never trust tenant_id from client. Always derive from current user's session
  [ ] Every endpoint: verify user.tenant_id == requested_tenant_id server-side
  [ ] Database: add foreign key constraints
  [ ] Test: attempt to access other tenants (should get 403)

### 2. Receipt file upload vulnerability
**Description:** Attacker uploads malicious file or accesses others' receipts
**How:** 
  - Upload shell.php (code execution)
  - Upload polyglot file (image + executable)
  - Access S3 bucket directly if permissions are wrong
**Example:** Attacker uploads "receipt.jpg.php" which executes as PHP
**Mitigation:**
  [ ] Validate file type server-side (check magic bytes, not extension)
  [ ] Store uploads outside webroot
  [ ] Disable script execution in S3 bucket
  [ ] Use Content-Disposition: attachment (forces download, not display)
  [ ] Serve from CDN (CloudFront) with restricted IAM role
  [ ] Store S3 object key in database; don't expose raw URLs

### 3. Payment/subscription tampering
**Description:** Attacker downgrades their subscription or stops paying
**How:** Attacker modifies local request or database directly
**Example:** SQL query: UPDATE subscriptions SET tier = 'free' WHERE user_id = 123
**Mitigation:**
  [ ] Subscription changes only via Stripe API, never local database
  [ ] Listen to Stripe webhooks and trust them, not client requests
  [ ] Validate all payment events with Stripe (idempotent processing)
  [ ] Log all subscription changes with timestamp and trigger

## HIGH THREATS (Likelihood: Medium-High, Impact: High)

### 4. SQL injection in search/filters
**Description:** Attacker injects SQL into expense search
**How:** Search for expenses by description: "'; DROP TABLE expenses; --"
**Mitigation:**
  [ ] Use parameterized queries for ALL database access
  [ ] Never concatenate user input into SQL strings
  [ ] Code review checklist: verify parameterized queries

### 5. Session/token hijacking
**Description:** Attacker steals user's session token and impersonates them
**How:** Token exposed in logs, in URL, via XSS, or on unsecured device
**Mitigation:**
  [ ] Store tokens in HttpOnly cookies (not localStorage)
  [ ] Set Secure flag (HTTPS only)
  [ ] Short expiration time (15 min to 1 hour)
  [ ] Implement refresh tokens (longer-lived, not stored in memory)
  [ ] IP pinning (optional but helpful: check request IP matches login IP)
  [ ] Audit logging: log all token usage

### 6. Weak password policy
**Description:** Users choose weak passwords; accounts compromised via brute force
**How:** Attacker tries common passwords (password123, company123, etc.)
**Mitigation:**
  [ ] Require minimum 12 characters
  [ ] Reject common passwords (use Have I Been Pwned API)
  [ ] Rate limit login attempts (5 attempts per minute max)
  [ ] Account lockout after N failed attempts (30 min lockout)
  [ ] Offer optional MFA (TOTP, WebAuthn)

## MEDIUM THREATS (Likelihood: Medium, Impact: Medium-High)

### 7. Unencrypted data at rest
**Description:** If database is stolen/breached, all data is readable
**How:** Database backup leaked, or attacker gains database access
**Mitigation:**
  [ ] Enable RDS encryption at rest (AES-256)
  [ ] Encrypt sensitive fields (SSNs, email if PII): use column encryption
  [ ] S3 encryption (AWS managed keys minimum, KMS for better control)

### 8. Insecure API endpoints (no rate limiting)
**Description:** Attacker floods API with requests (DoS) or scrapes all data
**How:** Write script making 10k requests per second
**Mitigation:**
  [ ] Global rate limiting: 100 requests per IP per minute
  [ ] Per-user rate limiting: 50 requests per authenticated user per minute
  [ ] Use AWS WAF or third-party (Cloudflare) for DDoS protection

### 9. Insider threat (employee steals data)
**Description:** Admin or employee with database access exports all company data
**How:** Direct database query or bulk API request
**Mitigation:**
  [ ] Audit logging: log who accessed what data and when
  [ ] Database access: use IAM roles (not long-lived passwords)
  [ ] Alert on suspicious activity (bulk exports, unusual hours)
  [ ] Principle of least privilege: admin users get only what they need
  [ ] Regular access reviews: quarterly audit of who has what access

### 10. Unvalidated redirects
**Description:** Attacker tricks user into redirecting to phishing site
**How:** API endpoint: GET /api/redirect?url=attacker.com
**Mitigation:**
  [ ] Never redirect to user-provided URLs
  [ ] If redirects needed, use allowlist of domains

## LOW THREATS (Likelihood: Low, Impact: Medium)

### 11. Dependency vulnerabilities
**Description:** A library you use has a security flaw
**How:** npm library has SQL injection; attacker exploits your code
**Mitigation:**
  [ ] Run npm audit monthly
  [ ] Automated scanning (Dependabot, Snyk)
  [ ] Keep dependencies updated
  [ ] Monitor security advisories

### 12. Exposed error messages
**Description:** Error messages leak sensitive info (database structure, paths)
**How:** Cause an error and read the response
**Mitigation:**
  [ ] Log detailed errors server-side (include request ID)
  [ ] Return generic errors to client ("Something went wrong")
  [ ] Don't expose stack traces in production

---

## Summary: Priority order

**Do immediately:**
1. Tenant isolation (verify server-side on every request)
2. File upload validation (magic bytes check, safe storage)
3. Parameterized queries (audit all database calls)

**Do soon (next sprint):**
4. Token security (HttpOnly cookies, expiration)
5. Password policy + rate limiting
6. Encryption at rest (RDS + S3)

**Do within 3 months:**
7. API rate limiting
8. Audit logging (especially for data access)
9. Dependency scanning
10. Error message handling

---

## Next steps

1. **Prioritize:** Which threats can you mitigate before launch?
2. **Assign:** Who will implement each mitigation?
3. **Test:** After implementation, have security audit the fixes
4. **Document:** Threat model becomes living document; update as you change

See [Risk Prioritization Agent](./risk-prioritization.md) for help prioritizing.
```

---

## What to expect

The agent will:
- Ask 5-10 clarifying questions (answer thoroughly and honestly)
- Organize threats by component and criticality
- Give specific, actionable mitigations
- Suggest testing/validation approaches
- Reference the architecture when explaining threats

You should:
- Have a sketch of your system (even rough is fine)
- Know your tech stack (languages, databases, third-party services)
- Be honest about what you don't know yet
- Be ready to document findings (save the conversation)

---

## Learn more

- [Threat Modeling 101](../threat-modeling-101.md) — The framework this uses
- [Risk Prioritization Agent](./risk-prioritization.md) — Help deciding what to fix first
- [STRIDE Analysis Agent](./stride-analysis.md) — Deeper analysis by threat category
- [Security Code Review Agent](./security-code-review.md) — Review code against threats

---

**Pro tip:** Run this prompt during feature design (before coding), not after. It's much cheaper to fix threats in design than in code.
