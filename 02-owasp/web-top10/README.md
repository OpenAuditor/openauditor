# OWASP Web Top 10 (2021)

The OWASP Web Application Security Top 10 (2021 edition) lists the ten most critical vulnerability categories found in web applications based on data from over 500,000 real applications. It replaces the 2017 edition and reflects three years of new breach data.

---

## The Ten Categories

| ID | Name | Risk Level |
|----|------|------------|
| [A01](./A01-broken-access-control.md) | Broken Access Control | Critical |
| [A02](./A02-cryptographic-failures.md) | Cryptographic Failures | Critical |
| [A03](./A03-injection.md) | Injection | Critical |
| [A04](./A04-insecure-design.md) | Insecure Design | High |
| [A05](./A05-security-misconfiguration.md) | Security Misconfiguration | High |
| [A06](./A06-vulnerable-components.md) | Vulnerable and Outdated Components | High |
| [A07](./A07-auth-failures.md) | Identification and Authentication Failures | High |
| [A08](./A08-data-integrity-failures.md) | Software and Data Integrity Failures | High |
| [A09](./A09-logging-failures.md) | Security Logging and Monitoring Failures | Medium |
| [A10](./A10-ssrf.md) | Server-Side Request Forgery (SSRF) | Medium |

---

## What Changed from 2017

- **Broken Access Control** moved from A05 to A01 — it is now the most commonly found vulnerability in the dataset
- **Cryptographic Failures** (formerly "Sensitive Data Exposure") was renamed to focus on root cause rather than symptom
- **Injection** dropped from A01 to A03 as awareness and tooling improved
- **Insecure Design** is new in 2021 — addresses architectural and design-level flaws, not just implementation bugs
- **Software and Data Integrity Failures** is new — covers CI/CD pipeline attacks, auto-update poisoning, and deserialisation
- **SSRF** is new — elevated due to cloud infrastructure abuse and the prevalence of metadata endpoint attacks

---

## How to Work Through This

Each vulnerability file follows a consistent format:

1. **Summary** — what the vulnerability is in plain language
2. **Vulnerable pattern** — code showing the problem
3. **Fixed pattern** — code showing the correct approach
4. **Real-world breach** — a named incident with real impact figures
5. **How to test** — manual steps or tool commands you can run today
6. **Checklist** — 5–8 items to verify your application is not affected
7. **Why this matters** — consequences of ignoring it
8. **Learn more** — links to OWASP and related OpenAuditor sections

Work through them in order if you are auditing a new codebase. If you have a specific concern, jump directly to the relevant file.

---

## Quick Reference: Common Fixes

| Vulnerability | One-line fix |
|--------------|--------------|
| Broken Access Control | Check authorisation on every server-side route, not just in the UI |
| Cryptographic Failures | Never store sensitive data unencrypted; use TLS everywhere |
| Injection | Use parameterised queries and ORMs; never interpolate user input into queries |
| Insecure Design | Threat model before you build; enforce rate limits and business logic constraints |
| Security Misconfiguration | Disable debug mode, remove default credentials, lock down CORS |
| Vulnerable Components | Run `npm audit` and `pip-audit` on every dependency |
| Auth Failures | Use bcrypt for passwords; rotate sessions on privilege changes |
| Data Integrity Failures | Verify signatures on packages and CI artefacts |
| Logging Failures | Log authentication events, access control failures, and input validation errors |
| SSRF | Validate and allowlist outbound URLs; block internal IP ranges |

---

## Related Sections

- [02 OWASP API Top 10](../api-top10/README.md)
- [02 OWASP LLM Top 10](../llm-top10/README.md)
- [06 Secure Coding](../../06-secure-coding/)
- [10 Security Testing](../../10-security-testing/)
