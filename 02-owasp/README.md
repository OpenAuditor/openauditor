# OWASP Top 10 — Overview

The Open Web Application Security Project (OWASP) publishes the Top 10 as a consensus document representing the most critical security risks to web applications, APIs, and large language model integrations. It is updated roughly every three to four years based on real-world data from hundreds of organisations.

This section covers three Top 10 lists. Each maps to a different attack surface. Use the relevant list for your application type.

---

## Sub-sections

| Sub-section | What It Covers |
|-------------|---------------|
| [Web Top 10 (2021)](./web-top10/README.md) | Classic web application vulnerabilities — broken access control, injection, misconfigurations, and more |
| [API Top 10 (2023)](./api-top10/README.md) | API-specific risks — broken object-level authorisation, excessive data exposure, mass assignment |
| [LLM Top 10 (2025)](./llm-top10/README.md) | Risks specific to large language model integrations — prompt injection, insecure output handling, training data poisoning |

---

## How to Use This Section

1. **Identify your attack surface.** A traditional web app? Start with Web Top 10. An API-first backend? Start with API Top 10. Shipping an AI feature? Add LLM Top 10.
2. **Work through the checklist** in each vulnerability file. Each file includes a short checklist you can complete in under 30 minutes.
3. **Fix before you ship.** The Web Top 10 alone accounts for the majority of breaches in small-to-medium web applications.

---

## Related Sections

- [06 Secure Coding](../06-secure-coding/) — Implementation guidance for auth, validation, headers, database security
- [10 Security Testing](../10-security-testing/) — How to test for OWASP vulnerabilities using SAST, DAST, and manual methods
- [16 Checklists](../16-checklists/) — Pre-launch and production hardening checklists that cross-reference OWASP

---

> **Note:** OWASP Top 10 is not a security standard. It is an awareness document. Passing it does not mean your application is secure. Use it as a baseline, not a ceiling.
