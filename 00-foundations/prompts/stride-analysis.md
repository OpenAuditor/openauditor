# STRIDE Analysis Agent

**When to use:** When you want to systematically analyze threats using the STRIDE framework. Use this after threat discovery to ensure you haven't missed categories of threats.

**Works with:** [Threat Modeling 101](../threat-modeling-101.md) (STRIDE is explained there)

**Time required:** 20-30 minutes

**Output:** Threats organized by STRIDE category (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## The Prompt

Copy and paste this into Claude:

```
You are a security expert using the STRIDE threat modeling framework. STRIDE is a 
systematic way to find threats across six categories:

- **Spoofing:** Pretending to be someone/something you're not
- **Tampering:** Modifying something (data, code, requests)
- **Repudiation:** Denying you did something (lack of logging/proof)
- **Information Disclosure:** Exposing data to unauthorized people
- **Denial of Service:** Making something unavailable
- **Elevation of Privilege:** Getting more permissions than you should have

Your job is to:
1. Ask me to describe my system/architecture
2. For EACH component (frontend, API, database, etc.):
   - Ask "What STRIDE threats apply here?"
   - Help me identify threats in each category
3. List all threats organized by STRIDE category
4. Suggest mitigations for each threat
5. Help prioritize by impact and likelihood

Rules:
- Be thorough; consider all 6 categories
- Consider threats from different attackers (external, insider, accidental)
- Be specific about attack vectors (how would someone actually do this?)
- Focus on threats relevant to the architecture (avoid generic threats)

Let's start. Please describe your system:
- What are the main components? (frontend, API, database, services, etc.)
- Who interacts with each component? (users, admins, systems, etc.)
- What data flows between components?
```

---

## Example conversation

**You describe your system:**
```
We're a healthcare app (HIPAA-regulated). Components:
- React web app (user-facing)
- Node.js/Express API
- PostgreSQL database with patient records
- Auth service (handles login)
- Payment processor (Stripe)
- Email service (sends appointment reminders)

Data: Patient names, medical histories, insurance info, appointment schedules.

Key flows:
1. User logs in -> auth service -> gets token -> uses API
2. User views medical records -> API queries database
3. Appointment -> system emails patient
```

**Agent walks through STRIDE for each component:**

```
Great! HIPAA adds security requirements. Let me go through each component 
and ask about STRIDE threats.

## FRONTEND (React app)

### Spoofing threats
Q: How do you prove to the frontend that the API response is legitimate?
Q: Could an attacker intercept API responses and send fake ones?

### Tampering threats
Q: What happens if an attacker modifies the request before sending to API?
Q: Could they modify the auth token in local storage?

### Repudiation threats
Q: Do you log user actions on the frontend?
Q: Could a user claim they didn't view sensitive data?

### Information Disclosure threats
Q: What happens if the frontend is accessed over HTTP (not HTTPS)?
Q: Are auth tokens stored in localStorage (accessible to XSS)?
Q: Do error messages leak information?

### Denial of Service threats
Q: Could an attacker prevent the frontend from loading?
Q: Are there rate limits on API requests?

### Elevation of Privilege threats
Q: Could a user modify their token to gain admin access?
Q: Are admin-only buttons checked client-side only?

---

## API (Node.js/Express)

### Spoofing threats
Q: How do you verify the user is who they claim to be?
Q: Do you validate the auth token on every request?
Q: Could someone use a forged/expired token?

### Tampering threats
Q: Could an attacker modify patient IDs to access other patients' records?
Q: Could they modify medication records before sending to database?

### Repudiation threats
Q: Do you log who accessed patient data and when?
Q: Would you be able to prove what data a user accessed?

### Information Disclosure threats
Q: Are all API calls required to use HTTPS?
Q: Do you encrypt sensitive fields (medical history)?
Q: Could error messages expose the database structure?
Q: Are logs secure? (anyone could read logs and see patient data)

### Denial of Service threats
Q: Are there rate limits per user and per IP?
Q: Could someone make expensive queries (e.g., join on million records)?

### Elevation of Privilege threats
Q: Could a regular user escalate to admin via API?
Q: Are authorization checks (user.role == 'admin') done server-side?

---

## DATABASE (PostgreSQL)

### Spoofing threats
Q: Who can connect to the database? (use IAM roles, not passwords)
Q: Could someone connect with another user's credentials?

### Tampering threats
Q: Could an attacker run SQL injection to modify records?
Q: Is there database replication? Could backups be tampered with?

### Repudiation threats
Q: Do you audit who changed patient records? (audit tables)
Q: Could someone claim a change never happened?

### Information Disclosure threats
Q: Is the database encrypted at rest?
Q: Could backups be accessed by unauthorized people?
Q: Are database logs secure? (they might contain queries with PII)

### Denial of Service threats
Q: Could queries be optimized to prevent resource exhaustion?
Q: Are there locks that could cause deadlocks?

### Elevation of Privilege threats
Q: Do different users have different database roles?
Q: Could a read-only user escalate to admin?

---

## AUTH SERVICE

### Spoofing threats
Q: Could someone forge an auth token?
Q: Is the token signing algorithm strong?

### Tampering threats
Q: Could someone modify a token to claim different identity?
Q: Could expired tokens be reused?

### Repudiation threats
Q: Do you log login attempts (successful and failed)?
Q: Can you prove who logged in when?

### Information Disclosure threats
Q: Are passwords hashed with salt? (bcrypt, argon2)
Q: Could someone recover passwords from the database?

### Denial of Service threats
Q: Are there rate limits on login attempts?
Q: Could someone lock out a user with failed logins?

### Elevation of Privilege threats
Q: Could a regular user get admin token?
Q: Is token validation done properly?

---

## EMAIL SERVICE

### Spoofing threats
Q: Could someone spoof emails claiming to be from your system?
Q: Do you sign emails with DKIM/SPF?

### Tampering threats
Q: Could someone intercept emails and modify appointment details?

### Information Disclosure threats
Q: Are emails sent over encrypted channels (TLS)?
Q: Could someone read emails during transmission?
Q: Are appointment details exposed in email preview?

---

## PAYMENT PROCESSOR

### Spoofing threats
Q: Could someone forge a Stripe webhook?

### Tampering threats
Q: Could someone modify payment amount before processing?

### Information Disclosure threats
Q: Do you handle/store credit card numbers? (you shouldn't; use Stripe tokens)

---

Now let me organize all threats by STRIDE category...
```

**Agent produces comprehensive threat list:**

```
# STRIDE Analysis: Healthcare App

## SPOOFING (Pretending to be someone else)

### 1. Forged auth token
**Component:** API, Frontend
**How:** Attacker creates a fake token with patient_id=999
**Impact:** Access another patient's records
**Likelihood:** Medium (if token validation is weak)
**Prevention:**
  - [ ] Sign tokens with strong key (RS256 or HS256 with 256-bit key)
  - [ ] Verify signature on every API request
  - [ ] Use standard library (jsonwebtoken, not homemade)
  - [ ] Short expiration time (15-60 min)

### 2. Forged Stripe webhook
**Component:** Payment service
**How:** Attacker sends fake webhook claiming payment succeeded
**Impact:** User gets service without paying
**Likelihood:** Low (if webhook validation is strong)
**Prevention:**
  - [ ] Verify webhook signature with Stripe key
  - [ ] Check webhook timestamp (within 5 min of now)
  - [ ] Store processed webhook IDs to prevent duplicates

### 3. Impersonating auth service
**Component:** API calling Auth service
**How:** Attacker intercepts and replaces auth responses
**Impact:** Gets valid token without logging in
**Likelihood:** Low (if HTTPS is enforced)
**Prevention:**
  - [ ] HTTPS required for all auth service calls
  - [ ] Certificate pinning on backend (verify exact cert)
  - [ ] Mutual TLS (API authenticates to auth service)

---

## TAMPERING (Modifying data)

### 1. Modifying patient ID in API request
**Component:** API, Database
**How:** GET /api/patients/123 -> attacker changes to 456
**Impact:** Access another patient's records
**Likelihood:** High (if not validated server-side)
**Prevention:**
  - [ ] Never trust patient ID from client
  - [ ] Derive patient from auth token (who is logged in?)
  - [ ] Authorization check: patient.user_id == current_user.id
  - [ ] Code review: every endpoint checks this

### 2. Modifying medical records
**Component:** API, Database
**How:** POST /api/records with tampered medication data
**Impact:** Wrong medication prescribed; patient harmed
**Likelihood:** Medium (if not logged/audited)
**Prevention:**
  - [ ] Write-audit: log what changed, who changed it, when
  - [ ] Enable database triggers to create audit trail
  - [ ] Read-only access for non-doctors
  - [ ] Alerts on data modifications

### 3. SQL injection
**Component:** API, Database
**How:** Search for patients: name = "' OR '1'='1' DROP TABLE patients--"
**Impact:** Data corruption or theft
**Likelihood:** High (if queries are concatenated)
**Prevention:**
  - [ ] Use parameterized queries for ALL database calls
  - [ ] Code review: verify no string concatenation
  - [ ] Never trust user input in SQL

### 4. Token modification
**Component:** Frontend, Auth
**How:** User modifies token in localStorage to claim admin role
**Impact:** User gains unauthorized privileges
**Likelihood:** Low (if signature is verified)
**Prevention:**
  - [ ] Never trust token contents; always verify signature
  - [ ] Don't put sensitive claims in token (role is OK; SSN is not)
  - [ ] Signature verification on every request

---

## REPUDIATION (Denying you did something)

### 1. User claims they didn't view sensitive data
**Component:** API, Database
**How:** User accessed medical records, then denies it
**Impact:** HIPAA violation; no proof of access
**Likelihood:** Medium (if logging is incomplete)
**Prevention:**
  - [ ] Audit log every read of sensitive data: who, what, when, result
  - [ ] Immutable audit logs (append-only, no deletion)
  - [ ] HIPAA requirement: maintain audit trail for 6+ years
  - [ ] Hash audit logs to detect tampering

### 2. Admin denies making data changes
**Component:** API, Database
**How:** Admin deletes a patient's allergy info, claims it wasn't them
**Impact:** Can't prove who made the change
**Likelihood:** Medium (if logging is weak)
**Prevention:**
  - [ ] Log who made every data change (admin name, not just ID)
  - [ ] Digital signatures on important changes
  - [ ] Immutable audit trail

---

## INFORMATION DISCLOSURE (Exposing data)

### 1. Data in transit (HTTPS not enforced)
**Component:** Frontend, API
**How:** Patient accesses app over HTTP; attacker on network reads password
**Impact:** Account compromise; data breach
**Likelihood:** Medium (if redirects not enforced)
**Prevention:**
  - [ ] Force HTTPS everywhere (HTTP redirects to HTTPS)
  - [ ] HSTS header: "Strict-Transport-Security: max-age=31536000"
  - [ ] TLS 1.2 or higher; disable older versions
  - [ ] Certificate pinning on mobile app

### 2. Data at rest (unencrypted database)
**Component:** Database
**How:** Attacker gains database access; reads plaintext patient records
**Impact:** Mass data breach; HIPAA fines
**Likelihood:** Low (if security is reasonable)
**Prevention:**
  - [ ] RDS encryption at rest (AES-256)
  - [ ] Column-level encryption for extra-sensitive fields (SSN, insurance #)
  - [ ] Encryption key: store separately, rotate regularly
  - [ ] Verify encryption is enabled (audit it)

### 3. Data in logs
**Component:** API, Monitoring
**How:** Attacker reads application logs; sees patient names, medical info
**Impact:** Data breach via logs
**Likelihood:** Medium (logs are often forgotten in security)
**Prevention:**
  - [ ] Never log PII (names, SSNs, medical data)
  - [ ] Log request ID, not request body
  - [ ] Scrub logs: remove sensitive fields before storing
  - [ ] Encrypt logs in transit and at rest
  - [ ] Restrict who can read logs (access control)

### 4. Data in error messages
**Component:** API, Frontend
**How:** 500 error exposes database structure or patient data
**Impact:** Information leak
**Likelihood:** Low (if errors are handled)
**Prevention:**
  - [ ] Return generic errors to client ("Something went wrong")
  - [ ] Include request ID for debugging
  - [ ] Log detailed errors server-side (with request ID)
  - [ ] Never expose stack traces in production

### 5. Credentials in source code
**Component:** All
**How:** Attacker finds API keys hardcoded in git history
**Impact:** Complete system compromise
**Likelihood:** Medium (if secrets aren't managed)
**Prevention:**
  - [ ] Use environment variables for all secrets
  - [ ] Git hooks to prevent commits with secrets
  - [ ] Scan git history for exposed keys (e.g., trufflehog)
  - [ ] Rotate any compromised keys immediately

### 6. Auth tokens in localStorage (XSS risk)
**Component:** Frontend
**How:** Malicious script on page reads localStorage and steals token
**Impact:** Account compromise
**Likelihood:** Medium (if XSS not prevented)
**Prevention:**
  - [ ] Store tokens in httpOnly cookies (JavaScript can't read)
  - [ ] Set Secure flag (HTTPS only)
  - [ ] Prevent XSS: escape all user input in HTML
  - [ ] Content Security Policy header (restrict script sources)

### 7. Patient data accessible to other tenants
**Component:** API, Database
**How:** Multi-tenant system; attacker accesses other hospital's patient data
**Impact:** HIPAA breach; massive liability
**Likelihood:** Low (if isolation is correct) but CRITICAL if it happens
**Prevention:**
  - [ ] Every query filters by tenant_id (hospital ID)
  - [ ] Database: foreign key constraints on tenant_id
  - [ ] Code review: verify tenant_id check on every endpoint
  - [ ] Test: attempt to access other tenants (should get 403)

---

## DENIAL OF SERVICE (Making unavailable)

### 1. API rate limiting bypass
**Component:** API
**How:** Attacker makes 100k requests per second; API goes down
**Impact:** System unavailable; patients can't access records
**Likelihood:** Medium (easy to implement, often forgotten)
**Prevention:**
  - [ ] Rate limiting: max requests per IP per minute
  - [ ] Per-user rate limiting: slower for normal users
  - [ ] DDoS protection (Cloudflare, AWS Shield)
  - [ ] Auto-scaling (add servers if load spikes)

### 2. Expensive database queries
**Component:** API, Database
**How:** Attacker crafts query that takes minutes to run; DB locks up
**Impact:** System unavailable
**Likelihood:** Low (depends on query design)
**Prevention:**
  - [ ] Query optimization: use indexes
  - [ ] Query timeouts: cancel queries running >10 seconds
  - [ ] Limits on result sets: max 1000 rows per query
  - [ ] Avoid full table scans

### 3. Email flooding
**Component:** Email service
**How:** Attacker makes many API calls triggering emails
**Impact:** Spam outgoing emails; email delivery issues
**Likelihood:** Medium
**Prevention:**
  - [ ] Rate limit email sending per user
  - [ ] Alert on unusual email volume
  - [ ] Email service rate limits

---

## ELEVATION OF PRIVILEGE (Getting unauthorized permissions)

### 1. User modifies token to claim admin role
**Component:** Frontend, API
**How:** User changes token from role='user' to role='admin'
**Impact:** User gets all admin powers
**Likelihood:** Low (if signature verified)
**Prevention:**
  - [ ] Never trust token contents; verify signature
  - [ ] Admin checks done server-side: query database, don't trust token
  - [ ] Authorization checks on every endpoint

### 2. Database user escalation
**Component:** Database
**How:** Read-only DB user exploits SQL injection to gain write access
**Impact:** Attacker modifies data
**Likelihood:** Very low (proper DB design prevents this)
**Prevention:**
  - [ ] Different database roles by privilege level
  - [ ] Least privilege: app uses read-only user where possible
  - [ ] Admin tasks use separate admin connection

### 3. Auth token reuse for escalation
**Component:** Auth service, API
**How:** Attacker finds old token, uses it to make API calls
**Impact:** Unauthorized data access
**Likelihood:** Low (if expiration enforced)
**Prevention:**
  - [ ] Short token expiration (15-60 min)
  - [ ] Token revocation: logout invalidates token
  - [ ] Token blacklist: revoked tokens can't be used
  - [ ] Refresh token rotation: new refresh = old one invalid

---

## Summary: Top threats by severity

### CRITICAL (Fix before launch)
1. Tenant isolation (multi-tenant breach)
2. SQL injection (data corruption)
3. Auth token forgery (unauthorized access)
4. Unencrypted database (breach impact)
5. Missing audit logging (HIPAA violation)

### HIGH (Fix first sprint)
6. XSS / token theft (from localStorage)
7. Weak password policy
8. Data in logs
9. Rate limiting
10. HTTPS not enforced

### MEDIUM (Fix within 3 months)
11. Error messages leaking info
12. Credential exposure in git
13. DDoS protection
14. Dependency vulnerabilities
15. Email spoofing

### NEXT STEPS
1. Prioritize using [Risk Prioritization Agent](./risk-prioritization.md)
2. Assign ownership to engineers
3. Implement and test mitigations
4. Document compliance in HIPAA audit checklist
```

---

## What to expect

The agent will:
- Walk through each STRIDE category systematically
- Ask about each component and threat category
- Give specific, actionable threats
- Link threats to attack vectors
- Suggest mitigations

You should:
- Describe your architecture (components, data flows)
- Answer questions about features and assumptions
- Be honest about what you don't know yet
- Identify which threats matter most for your compliance/risk

---

## Learn more

- [Threat Modeling 101](../threat-modeling-101.md) — STRIDE explained in detail
- [Threat Discovery Agent](./threat-discovery.md) — Similar but less structured
- [Risk Prioritization Agent](./risk-prioritization.md) — Help deciding what to fix first
- [Secure by Default](../secure-by-default.md) — Principles to prevent these threats

---

**Pro tip:** Use STRIDE after threat discovery to make sure you haven't missed any categories. Some threats (like repudiation) are easy to overlook but critical for regulated industries.
