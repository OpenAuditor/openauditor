# Production Readiness Audit Skill

**A systematic security audit for shipping confidently. Use this skill one week before launch.**

This skill guides you through a comprehensive 18-domain security audit. It asks questions, reviews code, identifies findings, and gives you a priority list and a verdict: ship it, ship with caution, or don't ship yet.

---

## How to Use This Skill

1. **Before you start:** Have your codebase, config files, and deployment setup ready
2. **Load into your agent:** Copy the audit prompt into Claude Code, Cursor, GitHub Copilot, Gemini CLI, OpenAI Codex, Windsurf, Cline, Aider, Lovable, Base44, Emergent, or Replit Agent
3. **Answer the questions:** The agent will ask you about your app in Phase 1
4. **Review findings:** The agent audits each domain and flags issues
5. **Get a verdict:** You'll receive a score, a traffic light (RED/AMBER/GREEN), and a remediation list
6. **Re-audit failed domains:** After fixes, run just the failed domains again

---

## Phase 1: Discovery Interview

The agent asks these questions conversationally. Answer as fully as you can. If you can't answer, that's a finding.

### Application Context

- What does your app do? (One-sentence description)
- Who are your users? (Public internet, paying customers, internal team, etc.)
- What's your MVP launch date? (Is it already live?)
- Does your app handle sensitive data? (PII, payment info, health data, etc.)
- Who has access to your codebase? (Just you, 3 developers, 50+ people?)
- What's your team size? (Solo, small team, enterprise?)

### Stack and Infrastructure

- Frontend: Next.js, React, Vue, Svelte, or something else?
- Backend: Node.js, Python, Go, Rust, or serverless?
- Database: PostgreSQL, MongoDB, Supabase, Firebase, or something else?
- Hosting: Vercel, Render, AWS, DigitalOcean, or on-premise?
- Does your app use APIs? (Third-party APIs, your own, both?)
- Do you have a CI/CD pipeline? (GitHub Actions, GitLab CI, Jenkins, or manual?)
- Do you use Docker or containers?
- Do you have preview/staging deployments?

### Current Security Posture

- Do you have any security testing in place? (SAST, DAST, unit tests?)
- Do you have pre-commit hooks? (Secrets detection, linting?)
- Have you audited dependencies for vulnerabilities?
- Do you know what secrets are in your codebase right now?
- Have you run a security scan before?
- Do you have a security policy or incident response plan?
- Is there a person responsible for security?

### Data and Privacy

- Do you collect user data? (If yes, what kind?)
- Do you comply with GDPR, CCPA, HIPAA, or other regulations?
- Where is user data stored? (Same region, multi-region?)
- How long do you retain user data?
- Do you have a privacy policy?
- Can users request deletion of their data?

### Team and Process

- Do you have code reviews before deploying?
- Does your team have security training?
- What's your deployment frequency? (Daily, weekly, on-demand?)
- Who can deploy to production?
- Do you have rollback capability?
- Is there a runbook for security incidents?

---

## Phase 2: Systematic Audit Domains

The agent audits 18 domains. For each domain, it reviews your code, config, and setup, then marks each check as:

- ✓ **PASS** — This is secure and correct
- ~ **PARTIAL** — This is partially implemented or has gaps
- ✗ **FAIL** — This is missing or misconfigured
- — **NOT APPLICABLE** — This doesn't apply to your app

For every FAIL or PARTIAL, the agent provides:
1. **Severity** — Critical, High, Medium, or Low
2. **Plain-English risk explanation** — What breaks if you ignore this
3. **The exact fix** — Code, config, or steps to fix it
4. **Why it matters** — Real-world consequences and examples
5. **Learn more** — Link to the relevant OpenAuditor section

### Domain 1: Secrets and Environment Configuration

- [ ] No secrets in `.env` files committed to git
- [ ] Production `.env` is never committed
- [ ] All secrets use environment variables or a secret manager
- [ ] Database credentials are never hardcoded
- [ ] API keys are never hardcoded or in version control
- [ ] JWT signing keys are stored securely (not in code)
- [ ] Secrets are rotated regularly (quarterly minimum)
- [ ] Different secrets for dev/staging/production
- [ ] No secrets in docker images or container registries
- [ ] `.gitignore` excludes all secret files

**Real-world example:** Twitch accidentally exposed internal authentication tokens in a public repository (2020). They had to rotate all credentials, issue patches, and audit who had access. Cost: millions in remediation and reputation damage.

### Domain 2: Dependencies and Supply Chain

- [ ] No outdated or vulnerable dependencies (npm audit, pip audit)
- [ ] Lockfile (package-lock.json, yarn.lock, Pipfile.lock) is committed
- [ ] No unused dependencies in package.json
- [ ] No typosquatting attacks on package names (common misspellings)
- [ ] Supply chain scanning is enabled (Dependabot, Snyk)
- [ ] Critical CVEs trigger alerts and block deployment
- [ ] You've audited top 10 dependencies manually
- [ ] No security-critical packages are transitive (hidden) dependencies
- [ ] Dependencies come from official sources (npm, PyPI, etc.)
- [ ] Dependency updates are tested before deploying to production

**Real-world example:** The ua-parser-js library was compromised (2021). Attackers injected malicious code that attempted to steal crypto wallets. Thousands of projects were affected within hours.

### Domain 3: Authentication and Session Management

- [ ] Authentication exists (not everything is public)
- [ ] Passwords are hashed with bcrypt, Argon2, or PBKDF2 (never MD5, SHA1, or plain text)
- [ ] Passwords have minimum 8 characters and character-set requirements
- [ ] Session tokens are secure, random, and unguessable
- [ ] Sessions expire after 30 minutes of inactivity (or your app's policy)
- [ ] Session cookies are HttpOnly and Secure flags set
- [ ] No sessions stored in localStorage or sessionStorage
- [ ] MFA/2FA is implemented for sensitive accounts
- [ ] Forgot password flow doesn't leak if email exists
- [ ] Login rate limiting prevents brute force (max 5 attempts per minute)

**Real-world example:** The 2012 LinkedIn breach exposed 6.5 million password hashes. LinkedIn was using unsalted SHA1, which was cracked in a matter of days. Modern hashing would have made the breach useless.

### Domain 4: Authorisation and Access Control

- [ ] Authorisation checks are on every route (not just frontend)
- [ ] Users can't access data belonging to other users
- [ ] Users can't escalate to admin without authorization
- [ ] API endpoints check user permissions before returning data
- [ ] Database row-level security (RLS) is configured in Supabase / equivalent
- [ ] Public APIs don't expose private data
- [ ] Free tier users can't access paid features
- [ ] Admin panels are protected and logged
- [ ] Permissions are checked on every sensitive action (not just display)
- [ ] Authorisation logic is centralized (not duplicated across routes)

**Real-world example:** The 2019 Capital One breach exposed 100 million credit applications. The attacker exploited a misconfigured web application firewall that allowed access to AWS metadata, which contained credentials for a role that had overly broad permissions.

### Domain 5: Input Validation and Injection Prevention

- [ ] All user input is validated on the server (not just frontend)
- [ ] No SQL injection — using parameterized queries or ORMs
- [ ] No command injection — shell commands never use unsanitized input
- [ ] No template injection — template engines don't eval user input
- [ ] No XML/XXE injection — XML parsers have DTD disabled
- [ ] Input length limits are enforced (prevent DoS)
- [ ] Special characters are escaped or stripped
- [ ] File uploads validate file type and size
- [ ] File uploads are stored outside web root (not served directly)
- [ ] Validation errors don't leak system information

**Real-world example:** The 2019 Equifax breach started with an unpatched Apache Struts vulnerability (CVE-2017-5638). Attackers exploited RCE via a manipulated Content-Type HTTP header. The company had known about the patch for 2 months but hadn't applied it.

### Domain 6: Security Headers and CORS

- [ ] `Content-Security-Policy` header prevents XSS
- [ ] `X-Frame-Options: DENY` prevents clickjacking
- [ ] `X-Content-Type-Options: nosniff` prevents MIME type sniffing
- [ ] `Strict-Transport-Security` forces HTTPS (preload list included)
- [ ] `Referrer-Policy` restricts information leakage
- [ ] CORS is not `* / Access-Control-Allow-Origin: *`
- [ ] CORS credentials are only sent to trusted origins
- [ ] CORS preflight requests are handled correctly
- [ ] Cookies don't have overly permissive SameSite attributes
- [ ] Headers are tested in security scanning tools

**Real-world example:** The 2016 Uber breach involved CORS misconfiguration. Attackers could make requests on behalf of users to Uber's APIs by exploiting overly permissive CORS settings.

### Domain 7: Database Security and RLS

- [ ] Database is not publicly accessible (no port 5432 open to 0.0.0.0)
- [ ] Database credentials are not in code
- [ ] Row-level security (RLS) is enabled in Supabase / PostgreSQL
- [ ] RLS policies prevent users from seeing others' data
- [ ] Least-privilege principle: app role has only needed permissions
- [ ] Sensitive columns (passwords, keys) are never queried unnecessarily
- [ ] Database backups are encrypted and tested
- [ ] Database connections use SSL/TLS
- [ ] No admin credentials hardcoded in app code
- [ ] Database logs are monitored for suspicious queries

**Real-world example:** The 2018 MongoDB hack affected thousands of databases. Many MongoDB instances were left exposed on the internet with default credentials. Attackers wiped data and demanded ransom.

### Domain 8: API Security

- [ ] APIs require authentication (unless intentionally public)
- [ ] APIs have rate limiting (per user and global)
- [ ] APIs validate input strictly
- [ ] APIs don't expose sensitive information (IDs, internal data)
- [ ] APIs return consistent error messages (don't leak system info)
- [ ] APIs use versioning or deprecation strategy
- [ ] Sensitive endpoints log all access
- [ ] APIs don't allow method confusion (POST treated as GET, etc.)
- [ ] APIs use pagination to prevent data dumps
- [ ] API documentation doesn't expose secrets or internal paths

**Real-world example:** The 2021 Parler data breach occurred because the API was not rate-limited. Attackers scraped millions of posts, videos, and metadata by making sequential API requests.

### Domain 9: File Upload Security

- [ ] File uploads are validated for type and size
- [ ] File uploads are scanned for malware (if handling user files)
- [ ] Uploaded files are stored outside the web root
- [ ] Uploaded files are served with `Content-Disposition: attachment`
- [ ] File names are sanitized (no path traversal attacks)
- [ ] Uploads are scanned for embedded executables
- [ ] Uploaded images are re-encoded (prevents embedded code)
- [ ] Quota limits prevent disk exhaustion attacks
- [ ] Upload endpoints are rate-limited
- [ ] Uploads are logged for audit trail

**Real-world example:** The 2020 Pantheon CMS vulnerability allowed arbitrary file uploads. Attackers uploaded PHP shells, gained shell access, and could have accessed other websites on the server.

### Domain 10: Error Handling and Information Disclosure

- [ ] Production errors don't expose stack traces to users
- [ ] Debug mode is off in production
- [ ] Sensitive information is never in error messages
- [ ] 404 / 500 errors are generic (don't leak system info)
- [ ] SQL errors are caught and logged, but not shown to users
- [ ] File path information is hidden in error responses
- [ ] Exception details are logged server-side for debugging
- [ ] Error logs are monitored for patterns
- [ ] Sensitive data is never logged (PII, tokens, passwords)
- [ ] Log retention policy is defined and enforced

**Real-world example:** The 2021 LinkedIn data breach was partly enabled because exposed error pages leaked SQL query patterns, helping attackers understand the database structure.

### Domain 11: Logging and Monitoring

- [ ] Security events are logged (login, logout, permission changes)
- [ ] Failed authentication attempts are logged
- [ ] Unauthorized access attempts are logged
- [ ] Data access is logged (especially sensitive data)
- [ ] Admin actions are logged with audit trails
- [ ] Logs are sent to a centralized system (not just local files)
- [ ] Logs are retained for 90+ days
- [ ] Log access is restricted (not publicly readable)
- [ ] Logs are monitored for anomalies (unusual login patterns, etc.)
- [ ] Alerts are triggered for critical security events

**Real-world example:** The 2015 Anthem breach went undetected for months. Attackers had access to 78.8 million records, but there were no alerts because logging was insufficient.

### Domain 12: CI/CD Pipeline Security

- [ ] CI/CD pipeline exists and runs on every commit
- [ ] Security scans run on every pull request (SAST, linting)
- [ ] Dependency checks block PRs with critical vulnerabilities
- [ ] Tests run before deployment (including security tests)
- [ ] Failed tests prevent deployment
- [ ] Secrets are never logged or output in CI/CD
- [ ] Only authorized people can deploy to production
- [ ] Deployments are logged and auditable
- [ ] Deployment runs the same code that was tested
- [ ] Rollback capability is tested and documented

**Real-world example:** The 2019 Capital One breach was partly possible because CI/CD pipeline security was weak. Attackers gained access to IAM credentials that weren't properly scoped.

### Domain 13: Preview and Staging Environment Security

- [ ] Preview deployments use separate secrets from production
- [ ] Staging databases don't contain production data
- [ ] Preview URLs are not indexed by search engines (robots.txt, meta tags)
- [ ] Preview deployments expire automatically after N days
- [ ] Staging environment is as close to production as possible
- [ ] Staging gets same security fixes as production
- [ ] Preview URLs are not shared publicly (internal team only)
- [ ] Access to preview environments is logged
- [ ] Preview deployments don't have elevated permissions
- [ ] Data in preview is anonymized (not real production data)

**Real-world example:** The 2021 Nextiva breach was enabled by exposed staging environment credentials. Attackers found staging AWS keys in GitHub, accessed production infrastructure, and exfiltrated millions of records.

### Domain 14: DNS and Domain Security

- [ ] Domain registrar account is protected with 2FA
- [ ] DNS records are protected (not editable by attackers)
- [ ] SPF/DKIM/DMARC are configured (prevents email spoofing)
- [ ] DNSSEC is enabled (prevents DNS hijacking)
- [ ] CAA records restrict who can issue certificates
- [ ] Domain renewal is automated (doesn't expire)
- [ ] Domain is locked against unauthorized transfer
- [ ] No typosquatting domains registered by attackers
- [ ] Subdomains are documented and scanned
- [ ] Unused DNS records are removed

**Real-world example:** The 2019 AWS Route 53 hijacking affected multiple companies. Attackers gained access to AWS credentials, modified DNS records, and redirected traffic to malicious sites.

### Domain 15: Third-Party Scripts and Integrations

- [ ] Third-party scripts are vetted before inclusion
- [ ] Third-party script integrity is verified (SRI hashes)
- [ ] Scripts are loaded from official sources only
- [ ] Script permissions are minimal (limited to required scope)
- [ ] Third-party data processing is understood
- [ ] Third-party service terms are reviewed
- [ ] Data sent to third parties is minimal
- [ ] Compromised scripts are monitored for
- [ ] Script dependencies are tracked and updated
- [ ] Fallbacks exist if third-party services are unavailable

**Real-world example:** The 2021 Solarwinds supply chain attack affected thousands of companies. Attackers compromised the software update mechanism, injecting malicious code into legitimate updates that were trusted by enterprises.

### Domain 16: Privacy and Data Handling

- [ ] Privacy policy exists and is accurate
- [ ] Consent is obtained before collecting personal data
- [ ] Data minimisation principle is followed (collect only what you need)
- [ ] Data retention policy is defined (not kept forever)
- [ ] Right to erasure is implemented (GDPR)
- [ ] Data subject access requests are handled within 30 days
- [ ] Sensitive data is not logged or cached unnecessarily
- [ ] Data is encrypted at rest and in transit
- [ ] Data sharing with third parties is transparent
- [ ] Breach notification process is in place

**Real-world example:** The 2018 Clearview AI breach exposed facial recognition data of millions. The company scraped billions of photos from social media without consent, violating GDPR and CCPA.

### Domain 17: Backup and Recovery

- [ ] Backups are automated and scheduled
- [ ] Backups are encrypted and stored securely
- [ ] Backups are geographically distributed
- [ ] Backup restoration is tested regularly (not just assumed to work)
- [ ] Backups are kept offline or immutable (prevent ransomware)
- [ ] Backup retention policy is defined
- [ ] Recovery time objective (RTO) is documented
- [ ] Recovery point objective (RPO) is acceptable for your data
- [ ] Backup access is restricted to authorized people
- [ ] Backup status is monitored and alerted

**Real-world example:** The 2021 Ransomware attack on Florida hospital systems crippled operations. They had no viable backups, forcing them to pay the ransom and divert emergency patients.

### Domain 18: Incident Response Readiness

- [ ] Incident response plan exists and is documented
- [ ] Security contacts are defined (on-call engineer, legal, PR)
- [ ] Incident severity levels are defined
- [ ] Escalation path is clear
- [ ] Forensics capability is available (preserve logs, evidence)
- [ ] Communication plan exists (internal, customer notification, PR)
- [ ] Timeline for user notification is defined (GDPR: 72 hours)
- [ ] Post-incident review process is in place
- [ ] Security team can access production logs in an incident
- [ ] Incident response is regularly tested (tabletop exercises)

**Real-world example:** The 2013 Target breach cost $18.5M in damages partly because the company lacked a coordinated incident response. Investigation took weeks, and they didn't notify customers promptly.

---

## Phase 3: Scoring and Report

After auditing all 18 domains, the agent calculates:

1. **Readiness Score** (0–100)
   - 90–100: GREEN ✓ — Ship it confidently
   - 70–89: AMBER ⚠️ — Ship with caution, fix these first
   - 0–69: RED ✗ — Don't ship yet

2. **Traffic Light Verdict**
   - **GREEN**: All critical findings are fixed. Non-critical findings can wait.
   - **AMBER**: Critical findings exist, but you have a plan to fix them before launch.
   - **RED**: Critical findings exist with no fix planned. You're not ready to launch.

3. **Remediation List** (sorted by severity)
   - Every FAIL and PARTIAL finding
   - Grouped by severity: Critical, High, Medium, Low
   - Actionable steps to fix each one
   - Estimated time to fix

4. **Re-audit Protocol**
   - Run this audit again, checking only the domains you fixed
   - Verify each fix is actually working
   - Move finding from FAIL to PASS

---

## Phase 4: CI/CD and Preview Deployment Specific Checks

Because this is where modern apps live, the agent audits these in depth:

### CI/CD Pipeline

- Does a CI/CD pipeline exist? (GitHub Actions, GitLab CI, Jenkins, etc.)
- What security checks run on every PR? (List them)
- Do security scans block PRs with critical findings?
- Are dependency checks in place? (npm audit, Dependabot, Snyk?)
- Do secrets get detected before commit? (Pre-commit hook, CI scan?)
- How long does the full security pipeline take? (Should be <5 minutes)
- What happens if a security scan fails? (PR blocked? Developer notified?)
- Can only authorized people deploy? (Role-based access?)
- Are deployments logged and auditable? (Audit trail of who deployed what?)
- Is there automated rollback on deployment failure?

**Why this matters:** A weak CI/CD pipeline is how vulnerabilities slip into production. The 2017 Equifax breach started with an unpatched vulnerability. A proper CI/CD pipeline would have detected and blocked it.

### Preview Deployments

- Do you have preview deployments for every pull request?
- Are preview databases separate from production? (If not: CRITICAL)
- Do preview deployments get production secrets? (If yes: CRITICAL)
- Are preview URLs protected from search engine indexing?
- Do preview deployments auto-expire? (After 7 days, deleted?)
- Can you delete a preview deployment immediately if hacked?
- Is there a password or auth on preview URLs?
- Are preview deployments monitored for attacks?
- Do preview deployments have the same security headers as production?
- Is data in preview anonymized? (Or real production data? RED flag.)

**Why this matters:** Preview deployments are huge attack surface. The 2021 GitLab incident started with exposed CI/CD credentials in a preview environment. Attackers gained access and could have accessed production.

---

## Phase 5: Failure Handling

The agent is instructed to handle these scenarios:

### Scenario 1: File/Config Not Found

**If the agent can't access a file it needs:**
- Ask the user to provide it
- Note this as a finding: "Unable to audit X. Provide config or codebase access."
- Don't assume it's secure just because you can't see it
- Mark related checks as FAIL if code is not accessible

### Scenario 2: Ambiguous Answer

**If the developer gives a vague answer like "It's probably secure":**
- Mark it as PARTIAL, not PASS
- Ask a specific follow-up question
- Explain why specificity matters
- Don't proceed to the next domain until you understand the current one

### Scenario 3: Critical Finding

**If a critical finding emerges (e.g., hardcoded API key, no auth):**
- Stop the audit and flag this immediately
- Explain the real-world risk in plain language
- Provide the exact fix
- Recommend not shipping until this is resolved
- Move to RED verdict

### Scenario 4: Developer Pushback

**If the developer disagrees with a recommendation:**
- Acknowledge their perspective
- Explain the real-world breach or incident that leads to this recommendation
- Offer to link to relevant OpenAuditor sections
- Don't back down on critical findings
- Suggest a risk acceptance process if they choose to ignore it anyway

---

## Using This Skill

### As a Cursor / Copilot User

```
Open a new chat in your IDE.
Copy the agent prompt below.
Ask your AI to run the Production Readiness Audit on your app.
```

### As a Claude User

```
Paste the entire audit prompt into Claude.
Let it guide you through the discovery interview.
Answer questions fully.
Follow the remediation list it provides.
```

### As a Cline / Aider User

```
Load this skill into your agent.
Give it access to your codebase.
Let it examine config files, environment setup, and code.
Review findings and implement fixes.
```

### Re-auditing After Fixes

```
Run the audit again, but focus only on domains with failures.
Verify each fix by showing the agent the updated code.
Update the finding status from FAIL/PARTIAL to PASS.
Get a new score.
```

---

## Real-World Example: How This Plays Out

**Developer:** "I'm launching my SaaS app next week. Run the audit."

**Audit Phase 1:** The agent asks about the app. Developer answers: "Next.js + Supabase, handles payment info, 3 developers, no security testing yet."

**Audit Domains 1-5:** Agent reviews code:
- ✗ FAIL: Secrets in `next.config.js` (API key hardcoded)
- ~ PARTIAL: Password hashing uses Node's crypto, not bcrypt
- ✓ PASS: Supabase RLS is configured correctly
- ✗ FAIL: No rate limiting on API endpoints
- ✗ FAIL: File uploads don't validate type

**Phase 3 Verdict:**
- **Score:** 42/100
- **Verdict:** RED ✗
- **Remediation:**
  1. (Critical) Extract hardcoded API key → Use `process.env`
  2. (Critical) Implement rate limiting → Use `express-rate-limit`
  3. (High) Switch to bcrypt for password hashing
  4. (High) Validate file uploads → Check MIME type
  5. (Medium) Add security headers → CSP, X-Frame-Options

**Developer fixes these, re-runs audit.**

**New Score:** 78/100
**Verdict:** AMBER ⚠️ (Ready to ship, but fix medium findings within a month)

---

## Next Steps After Audit

1. **Fix critical findings** before launching
2. **Fix high findings** before or immediately after launch
3. **Fix medium findings** within 30 days
4. **Fix low findings** within 90 days
5. **Re-audit quarterly** to catch new issues

---

## Learn More

- [Threat Modelling 101](../../00-foundations/threat-modeling-101.md) — Why security matters
- [OWASP Top 10](../../02-owasp/README.md) — Real vulnerabilities explained
- [Pre-Launch Checklist](../../16-checklists/pre-launch-checklist.md) — Condensed checklist version
