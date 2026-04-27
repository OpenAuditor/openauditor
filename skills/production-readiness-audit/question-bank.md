# Question Bank

Reference guide for all discovery interview questions. Use this to prep answers before running the audit.

---

## Application Context

1. **What does your app do?** (One-sentence description of functionality)
2. **Who are your users?** (Public internet, paying customers, internal only, enterprises?)
3. **What's your MVP launch date?** (Is it already live?)
4. **Does your app handle sensitive data?** 
   - PII (names, email, phone, address)?
   - Payment information?
   - Health data?
   - Government IDs?
   - Financial records?
   - Passwords or secrets?
5. **Who has access to your codebase?** (Solo, 3 developers, 30+?)
6. **What's your team size?** (Just you, small startup, scaleup, enterprise?)
7. **Is this a regulated industry?** (Finance, healthcare, telecom, etc.?)

---

## Stack and Infrastructure

8. **Frontend stack?** (Next.js, React, Vue, Svelte, plain HTML, etc.)
9. **Backend stack?** (Node.js, Python, Go, Rust, .NET, serverless?)
10. **Database?** (PostgreSQL, MongoDB, Supabase, Firebase, DynamoDB, etc.)
11. **Hosting/deployment?** (Vercel, Netlify, Heroku, AWS, DigitalOcean, self-hosted?)
12. **Third-party APIs in use?** (Payment (Stripe, etc.), auth (Auth0, etc.), analytics?)
13. **Do you have a CI/CD pipeline?** (GitHub Actions, GitLab CI, Jenkins, CircleCI?)
14. **Using Docker/containers?** (Yes/no, and why?)
15. **Preview/staging deployments?** (Automatic per PR, manual, none?)

---

## Current Security Posture

16. **Security testing in place?**
    - SAST (static analysis)?
    - DAST (dynamic/runtime scanning)?
    - Unit tests with security focus?
    - Manual penetration testing?
    - Dependency scanning?
17. **Pre-commit hooks?** (Secrets detection, linting, format checks?)
18. **Dependency auditing?** (npm audit, pip audit, Snyk, Dependabot?)
19. **What secrets exist in your codebase right now?** (Be honest.)
    - Database credentials?
    - API keys?
    - JWT signing keys?
    - Third-party service tokens?
    - Encryption keys?
20. **Security scan history?** (Ever run a security tool? Results?)
21. **Security policy?** (Document defining your approach?)
22. **Incident response plan?** (What do you do if hacked?)
23. **Security lead/owner?** (Who's responsible?)

---

## Data and Privacy

24. **What user data do you collect?** (List specific types.)
25. **Regulatory compliance scope?**
    - GDPR (EU users)?
    - CCPA (California users)?
    - HIPAA (health data)?
    - PCI DSS (payment data)?
    - SOC 2 (for B2B SaaS)?
26. **Data storage location?** (Single region, multi-region, specific country?)
27. **Data retention policy?** (Keep for 30 days? Forever? User-defined?)
28. **Privacy policy?** (Public? Accurate? Updated?)
29. **User data deletion?** (Can users request erasure? How?)
30. **Third-party data sharing?** (Shared with analytics, ads, etc.?)

---

## Team and Process

31. **Code review process?** (Every PR reviewed before merge?)
32. **Security training?** (Team trained on OWASP, secure coding?)
33. **Deployment frequency?** (Daily, weekly, on-demand?)
34. **Who can deploy to production?** (Just you? Whole team? Ops only?)
35. **Rollback capability?** (Can you revert a bad deployment?)
36. **Change management?** (Process for deploying changes?)
37. **On-call support?** (Who responds to incidents?)

---

## How to Use This

1. **Before the audit:** Read through all questions and write down answers
2. **During the audit:** Agent will ask these (maybe rephrased for conversational flow)
3. **Be specific:** "It's probably secure" doesn't count as an answer
4. **Be honest:** If you don't know, say so. The agent will mark this as a gap.
5. **Provide evidence:** "We use bcrypt for passwords" is better than "Passwords are hashed"

---

## Sample Answers (Not Actual Recommendations)

**Question 4: Does your app handle sensitive data?**
- ❌ "Yeah, some data"
- ✓ "We handle user email, payment info via Stripe (we don't store card details), and user posts."

**Question 16: Security testing in place?**
- ❌ "Not really"
- ✓ "We run npm audit in CI, and we have unit tests. We haven't run SAST or DAST yet."

**Question 19: What secrets exist in your codebase right now?**
- ❌ "None, it's all secure"
- ✓ "We have database credentials in .env (not committed), Stripe keys in environment, and a JWT signing key in a secret manager."

---

## Red Flags (Watch For These)

If you answer "yes" to any of these, the audit will likely flag them:

- "Secrets are hardcoded in source files"
- "We don't have a staging environment"
- "I don't know what dependencies we use"
- "No code review process"
- "Everyone can deploy to production"
- "We've never run a security scan"
- "We don't have backups"
- "We don't log security events"
- "No one is responsible for security"

---

## Next: Run the Audit

Ready? Load the [SKILL.md](./SKILL.md) into your agent and start.
