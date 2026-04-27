# Security Glossary: Terms for Developers

In 30 seconds: 30+ security terms explained in plain English for developers who don't have a security background. Each term includes what it means, why it matters, and how it applies to building web apps and SaaS systems.

---

## A

### Authentication
**What it is:** Proving you are who you claim to be.

**Example:** Logging in with your username and password.

**Why it matters:** Without authentication, anyone can pretend to be you and access your data.

**In code:** Check the password, issue a session token, validate the token on future requests.

---

### Authorization
**What it is:** Checking if you're allowed to do what you're asking.

**Example:** You're authenticated (logged in), but are you allowed to delete this post? (Only if you wrote it.)

**Why it matters:** Authentication without authorization lets authenticated users do anything (read others' data, delete accounts, etc.).

**In code:** Check `if user.id != post.owner_id: reject()` before allowing deletion.

---

### Attack surface
**What it is:** All the ways an attacker could get into your system.

**Example:** Login endpoint, API endpoints, file upload, third-party integrations, employees with admin access.

**Why it matters:** Smaller attack surface = fewer ways to get in. Eliminate what you don't need.

**In code:** Remove unused endpoints. Disable features you're not using yet.

---

### Audit log
**What it is:** A record of who did what when.

**Example:** `2026-04-25 14:30:02 | user=alice@example.com | action=DELETE_POST | post_id=123`

**Why it matters:** Helps you detect attacks after they happen and prove you weren't the one who did something.

**In code:** Log authentication events, admin actions, and data modifications.

---

## B

### Breach (or Data Breach)
**What it is:** Unauthorized access to your data by an attacker.

**Example:** Attacker reads your customer database.

**Why it matters:** Breaches lead to fines, lawsuits, lost customers, company failure.

**Prevention:** Most principles in [Secure by Default](./secure-by-default.md).

---

### Brute force attack
**What it is:** Trying many passwords/keys quickly to guess the right one.

**Example:** Attacker tries 10,000 common passwords against your login.

**Why it matters:** Weak defenses let attackers succeed quickly.

**Defense:** Rate limiting (max 5 login attempts per minute), account lockout, MFA.

---

## C

### CAPTCHA
**What it is:** A test you solve to prove you're human (prove you're not a bot).

**Example:** Clicking images that contain cars, typing distorted text.

**Why it matters:** Stops bots from brute-forcing, spamming, or scraping.

**Note:** Some CAPTCHA systems are better than others; reCAPTCHA and hCaptcha are industry standard.

---

### Certificate (SSL/TLS)
**What it is:** A digital document proving you own a domain and enabling HTTPS.

**Example:** `example.com` has a certificate from Let's Encrypt proving I own the domain.

**Why it matters:** Without certificates, anyone could impersonate your domain and intercept traffic.

**In practice:** Get free certificates from Let's Encrypt. Renew automatically before expiration.

---

### Cipher
**What it is:** An algorithm that encrypts and decrypts data.

**Example:** AES-256, RSA, ChaCha20.

**Why it matters:** Different ciphers have different security levels. Avoid old/broken ones (DES, RC4).

**In code:** Most libraries pick good defaults; avoid implementing your own.

---

### Clickjacking
**What it is:** Attacker hides your UI under invisible buttons and tricks you into clicking.

**Example:** You think you're clicking "Play video" but you're actually authorizing something.

**Prevention:** `X-Frame-Options: DENY` header prevents embedding your site in iframes.

---

### Cold storage
**What it is:** Keeping backups offline (not connected to the internet).

**Example:** Backup tapes locked in a vault.

**Why it matters:** If your data center is ransomware-infected, offline backups are your recovery option.

**In practice:** Regular companies: daily; critical infrastructure: probably.

---

### CORS (Cross-Origin Resource Sharing)
**What it is:** Rules for which websites can talk to your API.

**Example:** Your frontend at `app.example.com` needs permission to call `api.example.com`.

**Why it matters:** Without CORS restrictions, any website could steal your user's data.

**In code:**
```python
# Allow only your frontend
@app.after_request
def set_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'https://app.example.com'
    return response
```

---

### Cryptography / Crypto
**What it is:** The practice of encoding data so only authorized people can read it.

**Example:** Encrypting passwords, encrypting data at rest, using TLS for transit.

**Why it matters:** Encrypted data is useless to an attacker who steals it.

**Good ciphers:** AES-256, ChaCha20, RSA-2048+.

---

## D

### Data exfiltration
**What it is:** Stealing data (moving it out of your system to the attacker's).

**Example:** Attacker downloads your entire customer database to a cloud storage they control.

**Prevention:** Monitor for unusual data access. Alert on large exports. Limit batch operations.

---

### Defense in depth
**What it is:** Multiple layers of security so if one fails, others catch the attack.

**Example:** Password + MFA + account lockout after failed attempts + unusual login alerts.

**Why it matters:** No single security measure is perfect.

**In practice:** See [Secure by Default, Principle 6](./secure-by-default.md).

---

### Denial of Service (DoS)
**What it is:** Attacking your service to make it unavailable.

**Example:** Sending millions of requests to overload your servers.

**Why it matters:** Downtime = lost revenue, angry customers, potential SLA violations.

**Defense:** Rate limiting, DDoS protection (Cloudflare, AWS Shield), auto-scaling.

---

### DDoS (Distributed Denial of Service)
**What it is:** DoS attack from many sources at once.

**Example:** Attacker uses botnet (100k compromised computers) to attack you.

**Why it matters:** Single-source blocking doesn't help; requires service-level mitigation.

**Defense:** Professional DDoS mitigation (Cloudflare, AWS Shield, Akamai).

---

## E

### Encryption
**What it is:** Converting data into unreadable form using a key.

**Example:** `hello` + encryption key → `x7k9@#mZ` (only someone with the key can decrypt back to `hello`).

**Why it matters:** Without encryption, attackers who steal data can read it immediately.

**Types:**
- **Symmetric:** Same key encrypts and decrypts (AES, ChaCha20)
- **Asymmetric:** Different keys for encryption and decryption (RSA, ECC)

---

### Exploit
**What it is:** Code or technique that takes advantage of a vulnerability.

**Example:** SQL injection is a vulnerability; sending `' OR '1'='1` is an exploit.

**Why it matters:** Vulnerability doesn't matter until someone exploits it.

---

## F

### Firewall
**What it is:** Software or hardware that filters network traffic.

**Example:** Blocks connections on certain ports, allows only whitelisted IPs.

**Why it matters:** Prevents unauthenticated network access to your servers.

**In practice:** AWS Security Groups, iptables, WAF (Web Application Firewall).

---

## G

### Glossary
**What it is:** This document.

---

## H

### Hash / Hashing
**What it is:** Converting data into a fixed-length string that can't be reversed.

**Example:** `password123` hashed = `$2b$12$K1...` (can't get password back from hash).

**Why it matters:** Never store passwords in plaintext. Store hashes instead.

**Good algorithms:** bcrypt, Argon2, scrypt. **Bad:** SHA1, MD5 (fast to crack).

---

### HTTPS
**What it is:** HTTP (web traffic) encrypted with TLS.

**Example:** `https://example.com` instead of `http://example.com`.

**Why it matters:** Without HTTPS, anyone on the network can read your traffic.

**In practice:** Use HTTPS everywhere. Redirect HTTP to HTTPS. Set HSTS header.

---

### HSTS (HTTP Strict Transport Security)
**What it is:** Header telling browsers to always use HTTPS for your domain.

**Example:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`

**Why it matters:** Prevents downgrades to HTTP (man-in-the-middle attack).

---

## I

### Incident
**What it is:** A security event that impacts confidentiality, integrity, or availability.

**Example:** Attacker gets access to customer data. Your database is corrupted. Service goes down.

**Response:** Detection → Containment → Investigation → Recovery → Post-mortem.

---

### Injection
**What it is:** Inserting malicious code/data into a system.

**Types:**
- **SQL injection:** Inserting SQL into a query (`' OR '1'='1`)
- **Command injection:** Inserting shell commands
- **XSS injection:** Inserting JavaScript into web pages

**Prevention:** Parameterized queries, input validation, escaping output.

---

## J

### JWT (JSON Web Token)
**What it is:** A token format for authentication. Contains claims (who you are) and is signed.

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIn0.
signature
```

**Why it matters:** Stateless authentication; server doesn't need to store sessions.

**Caution:** Store JWTs securely (not in localStorage; use httpOnly cookies).

---

## K

### Key (encryption key)
**What it is:** A secret string used to encrypt and decrypt data.

**Example:** 256-bit random string.

**Why it matters:** If the key is stolen, encrypted data becomes readable.

**Management:** Never hardcode keys. Use a secrets manager.

---

## L

### Lateral movement
**What it is:** Moving from one compromised system to another within your network.

**Example:** Attacker gets into your HVAC contractor's account, then moves to your main network.

**Prevention:** Network segmentation. Least privilege. Monitoring.

---

## M

### Man-in-the-middle (MITM)
**What it is:** Attacker intercepts traffic between you and the server, reading/modifying it.

**Example:** Attacker on coffee shop WiFi reads unencrypted passwords.

**Prevention:** HTTPS, TLS 1.2+, certificate pinning on mobile.

---

### Mitigation
**What it is:** A control or fix that reduces risk.

**Example:** MFA mitigates account takeover risk.

**In practice:** Every threat should have mitigations identified before shipping.

---

### MFA / 2FA (Multi-Factor Authentication / Two-Factor Authentication)
**What it is:** Requiring more than one form of ID to log in.

**Example:** Password + code from your phone.

**Why it matters:** Even if password is stolen, attacker still can't log in.

**Types:** TOTP (Google Authenticator), SMS codes, hardware keys (YubiKey), biometrics.

---

## N

### Nonce (Number used once)
**What it is:** A random value used once to prevent replay attacks.

**Example:** API request includes nonce; if attacker replays the request, nonce doesn't match.

**Why it matters:** Prevents attackers from replaying captured requests.

---

## O

### OWASP
**What it is:** Open Web Application Security Project. Community-driven security standards.

**Famous list:** OWASP Top 10 (most critical web vulnerabilities).

**Example:** #1 Broken Access Control, #2 Cryptographic Failures.

**Use it:** Reference for security priorities.

---

## P

### Penetration testing (Pen testing)
**What it is:** Hiring security professionals to attack your system.

**Why it matters:** Finds vulnerabilities before attackers do.

**Cost:** $5k-$50k+ per test (worth it for serious apps).

---

### Principle of least privilege
**What it is:** Give users/services only the permissions they need, nothing more.

**Example:** Database user for your app only has SELECT/INSERT on specific tables, not DROP or ALTER.

**Why it matters:** Limits damage if credentials are compromised.

---

### Public Key Infrastructure (PKI)
**What it is:** System for issuing, managing, and validating digital certificates.

**Example:** Let's Encrypt is PKI; they issue certificates; browsers trust them.

**Why it matters:** Enables HTTPS and proves you own your domain.

---

## Q

### Quantum computing
**What it is:** Future computing paradigm that could break current encryption.

**Why it matters:** Lots of encryption we rely on today might not be secure in 20 years.

**Action:** Not urgent for startups, but something to keep an eye on.

---

## R

### Rate limiting
**What it is:** Limiting how often something can happen (e.g., login attempts per minute).

**Example:** Max 5 failed logins per minute per IP.

**Why it matters:** Slows down brute force attacks, bot attacks, spam.

---

### Risk
**What it is:** The combination of likelihood and impact.

**Example:** Risk = (high likelihood of brute force) × (critical impact of account takeover).

**In practice:** See [Risk Appetite Framework](./risk-appetite-framework.md).

---

### Risk appetite
**What it is:** How much risk your organization is willing to accept.

**Example:** "We accept optional MFA (high risk) but not unencrypted data (critical risk)."

**Why it matters:** Helps prioritize security spending.

---

## S

### Salt (in hashing)
**What it is:** Random data added to a password before hashing.

**Example:** password=`hello`, salt=`abc123`, hash=`bcrypt(hello+abc123)`.

**Why it matters:** Prevents rainbow table attacks (precomputed hash tables).

**In practice:** Use bcrypt or Argon2 (they handle salt).

---

### Secrets
**What it is:** Sensitive values like API keys, passwords, encryption keys.

**Example:** AWS secret key, database password, Stripe API key.

**Never:** Hardcode in source code or commit to git.

**Use:** Environment variables or secrets manager.

---

### Security audit
**What it is:** Expert review of your security posture.

**Example:** Check code, architecture, processes, infrastructure.

**Cost:** $10k-$100k+ (varies by size).

**Worth it:** For any app with user data or revenue.

---

### Session
**What it is:** A temporary connection that keeps you authenticated after login.

**Example:** Browser stores session cookie; server has session data.

**Why it matters:** Without sessions, you'd need to log in on every request.

**Security:** Sessions should be invalidated on logout, expire over time, and be signed/encrypted.

---

### Signature (digital signature)
**What it is:** Proof that data was created/modified by someone with a specific key.

**Example:** API request signed with your private key; receiver verifies with your public key.

**Why it matters:** Proves authenticity and non-repudiation.

---

### Social engineering
**What it is:** Manipulating people (not technology) to compromise security.

**Example:** Phishing email tricking you into entering your password.

**Why it matters:** Users are the weakest link. Technical security is useless if humans bypass it.

**Defense:** User training, email filtering, zero-trust verification.

---

### SQL injection
**What it is:** Inserting SQL code into user input to execute unintended queries.

**Example:** Input `'; DROP TABLE users; --` could delete your table.

**Prevention:** Parameterized queries, input validation.

---

## T

### Threat
**What it is:** Something bad that could happen to your system.

**Example:** "Attacker could guess weak passwords" or "Database could be corrupted."

**In practice:** See [Threat Modeling 101](./threat-modeling-101.md).

---

### Threat actor
**What it is:** Someone/something trying to exploit your system.

**Types:** Nation-state, criminal, competitor, malicious insider, unskilled attacker.

**Why it matters:** Threat modeling considers different actors.

---

### Threat modeling
**What it is:** Systematic process of identifying what could go wrong.

**Example:** Draw your system, ask "what could go wrong?", find mitigations.

**Why it matters:** Prevents vulnerabilities before they cause damage.

---

### TLS (Transport Layer Security)
**What it is:** Protocol that encrypts traffic between client and server.

**Example:** HTTPS uses TLS.

**Version:** Use TLS 1.2 or 1.3. Avoid TLS 1.0, 1.1.

**Certificates:** Needed for TLS; free from Let's Encrypt.

---

### Token
**What it is:** A credential proving you're authenticated.

**Example:** JWT, OAuth token, API token.

**Security:** Should be signed, short-lived, and stored securely.

---

## U

### URL (Uniform Resource Locator)
**What it is:** Web address.

**Security note:** Don't put secrets in URLs (`api.example.com/data?token=secret`); querystrings are logged.

---

## V

### Validation
**What it is:** Checking that data is what it claims to be.

**Example:** Email field must contain `@`, age field must be integer 0-150.

**Why it matters:** Prevents injection, type errors, and unexpected behavior.

**Where:** Server-side (client-side validation is for UX only).

---

### Vulnerability
**What it is:** A weakness that could be exploited.

**Example:** SQL injection vulnerability, weak password hashing, unencrypted data.

**Not inherently a breach:** A vulnerability only matters if someone exploits it.

---

### Vulnerability disclosure
**What it is:** Process of reporting security vulnerabilities responsibly.

**Responsible:** Tell company first, give them time to fix, then disclose publicly.

**Irresponsible:** Publicly announce before company can fix.

---

## W

### WAF (Web Application Firewall)
**What it is:** Software that filters web traffic to block known attacks.

**Example:** Blocks SQL injection, XSS, DDoS.

**Providers:** Cloudflare, AWS WAF, ModSecurity.

---

### Whitelist / Allowlist
**What it is:** A list of allowed values (opposite of blocklist/denylist).

**Example:** Allow emails from `@company.com`, deny all others.

**Why it matters:** More secure than denylists (you explicitly allow; everything else is blocked).

---

## X

### XSS (Cross-Site Scripting)
**What it is:** Injecting JavaScript into web pages.

**Example:** User input `<script>alert('hacked')</script>` runs in victims' browsers.

**Prevention:** Escape user input when displaying in HTML; use Content Security Policy.

---

## Z

### Zero-day
**What it is:** A vulnerability unknown to the vendor and public.

**Example:** Attacker finds a flaw in a popular library before the vendor knows.

**Why it matters:** No patch available; everyone is vulnerable.

**Defense:** Stay updated with security advisories; use defense in depth.

---

## Quick reference by domain

### Authentication & Authorization
- Authentication, Authorization, MFA, JWT, Token, Session, Password hashing, Salt

### Encryption & Cryptography
- Encryption, Hash, Cipher, TLS, HTTPS, Certificate, Key, HSTS, Public Key Infrastructure

### Attacks
- Brute force, DDoS, Injection, SQL injection, XSS, Clickjacking, Man-in-the-middle, Social engineering, Zero-day

### Defense
- Firewall, WAF, Rate limiting, Defense in depth, Validation, Whitelist, Principle of least privilege, Nonce

### Incidents
- Breach, Incident, Penetration testing, Audit, Vulnerability disclosure, Threat modeling

### Risk & Strategy
- Risk, Risk appetite, Threat, Mitigation, Vulnerability

---

**Related:**
- [Why Security Matters](./why-security-matters.md)
- [Secure by Default](./secure-by-default.md)
- [Threat Modeling 101](./threat-modeling-101.md)
