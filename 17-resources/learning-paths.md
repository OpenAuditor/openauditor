# Security Learning Paths

Three structured paths based on where you are right now. Each resource is listed in the recommended order — earlier items build the foundation for later ones.

---

## Path 1 — Junior Developer (Starting Out)

**Goal:** Build a solid mental model of how attacks work and form safe coding habits before they become technical debt.

**Time commitment:** 3–6 months at a few hours per week.

### 1. OWASP Top 10 (read + lab)
Understand the ten most critical web vulnerabilities. Don't just read — do the labs.
- Read: https://owasp.org/www-project-top-ten/
- Hands-on: https://owasp.org/www-project-webgoat/ (WebGoat — intentionally insecure app)

### 2. PortSwigger Web Security Academy
Free, structured, hands-on labs for every major web vulnerability class. The best free resource that exists for practical web security.
- https://portswigger.net/web-security
- Start with: SQL injection → XSS → CSRF → Authentication → Access control

### 3. "The Web Application Hacker's Handbook" (book)
Dense but thorough. Read the first six chapters for a solid attacker's perspective. Skip nothing in chapters 1–3.
- Authors: Stuttard & Pinto (Wiley)

### 4. Secure Coding Practices Quick Reference (OWASP)
A checklist you can apply immediately to code you write today.
- https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/

### 5. TryHackMe — "Pre-Security" and "Jr Penetration Tester" paths
Gamified labs with clear progression. Good for building attacker intuition without needing your own lab environment.
- https://tryhackme.com/path/outline/presecurity
- https://tryhackme.com/path/outline/jrpenetrationtester

### 6. "Crypto 101" (free ebook)
Learn enough cryptography to avoid the most common mistakes (MD5 for passwords, ECB mode, rolling your own crypto).
- https://www.crypto101.io/

### 7. OWASP Cheat Sheet Series
Bookmark this. Refer to the specific cheat sheet for whatever you're building.
- https://cheatsheetseries.owasp.org/

### 8. Advent of Code + HackTheBox Starting Point
Once fundamentals are solid, build problem-solving instincts through practical challenges.
- https://www.hackthebox.com/hacker/starting-point

---

## Path 2 — Indie Hacker (MVP Focus)

**Goal:** Ship a secure-enough product fast. Cover the vulnerabilities most likely to get you breached, without going deep into offensive security.

**Time commitment:** 4–8 focused hours total, then ongoing 30-minute reviews per feature.

### 1. OWASP Top 10 — 30-minute read
Know the list, understand each item at a high level. This is your threat model.
- https://owasp.org/www-project-top-ten/

### 2. Authentication Security Cheat Sheet (OWASP)
Most indie SaaS breaches happen via authentication failures. Read this before building login.
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

### 3. "Hacking APIs" by Corey Ball (book) — chapters 1–4
If you're building an API (you are), understand how APIs are attacked. The first four chapters are the practical minimum.
- Available on No Starch Press: https://nostarch.com/hacking-apis

### 4. Dependabot + npm audit / pip-audit setup (1 hour)
Automate your dependency scanning today. This single step removes a huge category of risk with minimal effort.
- https://docs.github.com/en/code-security/dependabot/working-with-dependabot

### 5. "The 12-Factor App" — specifically factor III (Config)
Understand why you must never commit secrets and how to manage environment variables properly.
- https://12factor.net/config

### 6. Snyk's "10 npm Security Best Practices"
Quick, practical, and directly applicable to Node/Next.js projects.
- https://snyk.io/blog/ten-npm-security-best-practices/

### 7. OWASP ASVS Level 1 Checklist
Level 1 is the minimum verification standard. Use it as a launch checklist.
- https://github.com/OWASP/ASVS/raw/v4.0.3/4.0/OWASP%20Application%20Security%20Verification%20Standard%204.0.3-en.pdf

### 8. Troy Hunt's "Security for Developers" (YouTube playlist / blog)
Practical, no-jargon security advice from someone who built HaveIBeenPwned. Watch the first three videos.
- https://www.troyhunt.com/tag/security/

---

## Path 3 — Team Lead (Org-Wide Security)

**Goal:** Move your team from ad-hoc security to a repeatable, measurable programme. Cover threat modelling, security culture, tooling, and compliance basics.

**Time commitment:** Ongoing — 6–12 months to implement fully.

### 1. NIST Cybersecurity Framework (CSF 2.0)
The reference framework for organisational security programmes. Start with the "Identify" and "Protect" functions.
- https://www.nist.gov/cyberframework

### 2. Threat Modelling — "Threat Modeling: Designing for Security" (book)
Adam Shostack's definitive guide. Read chapters 1–5 to run your first threat modelling workshop.
- https://www.amazon.co.uk/Threat-Modeling-Designing-Adam-Shostack/dp/1118809998

### 3. OWASP SAMM (Software Assurance Maturity Model)
A model for assessing and improving your development team's security practices across five business functions.
- https://owaspsamm.org/

### 4. OWASP DevSecOps Guideline
How to integrate security into every stage of the CI/CD pipeline. Very practical.
- https://owasp.org/www-project-devsecops-guideline/

### 5. "Alice and Bob Learn Application Security" by Tanya Janca (book)
Written for developers and leads. Covers secure design, testing, culture, and tooling. Approachable.
- https://www.wiley.com/en-gb/Alice+and+Bob+Learn+Application+Security-p-9781119687405

### 6. Google's Building Secure and Reliable Systems (free book)
Google's SRE team's take on security. Free PDF available. Read the chapters on design patterns and incident response.
- https://sre.google/books/building-secure-reliable-systems/

### 7. OWASP Application Security Verification Standard (ASVS)
Use ASVS Level 2 as your team's baseline security requirement for all applications.
- https://owasp.org/www-project-application-security-verification-standard/

### 8. "Security Champions" programme guide
How to embed security culture by training internal champions in each team.
- https://owasp.org/www-project-security-culture/

---

## Cross-Path Resources

These are useful regardless of which path you're on:

| Resource | What it's for | Link |
|----------|--------------|------|
| CVE Details | Understand real-world vulnerabilities | https://cvedetails.com |
| Exploit Database | See how vulnerabilities are actually exploited | https://www.exploit-db.com |
| HaveIBeenPwned | Check credential exposure; useful for threat demonstrations | https://haveibeenpwned.com |
| SecurityHeaders.com | Instant HTTP security header audit | https://securityheaders.com |
| SSL Labs | Free TLS configuration grader | https://www.ssllabs.com/ssltest/ |

---

*Paths are reviewed periodically. Resource availability and pricing may change — check each link before sharing with your team.*
