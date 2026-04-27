# Security Testing

Testing is the only way to know if your security controls actually work. This section covers the full spectrum: static analysis, dynamic testing, manual testing, and fuzzing.

---

## Why This Matters

You can read every guide in OpenAuditor and still have vulnerabilities if you don't test. Security controls fail silently. A misplaced middleware, a misconfigured CSP, or a forgotten auth check won't announce itself — you have to look.

---

## Testing Approaches

| Approach | What It Finds | When to Use |
|----------|--------------|-------------|
| **SAST (Static)** | Code-level issues | Every commit, in CI |
| **DAST (Dynamic)** | Runtime vulnerabilities | Pre-launch, quarterly |
| **Manual testing** | Logic flaws, business logic | Pre-launch, after major changes |
| **Fuzzing** | Edge cases, unexpected inputs | API endpoints, form inputs |
| **Dependency scanning** | Vulnerable libraries | Every commit, in CI |

---

## What's Covered

| Guide | What You'll Learn |
|-------|-----------------|
| [SAST Overview](./sast-overview.md) | Static analysis tools and setup |
| [DAST Overview](./dast-overview.md) | Dynamic testing with OWASP ZAP, Burp |
| [Manual Testing Guide](./manual-testing-guide.md) | Hands-on testing checklist |
| [Testing Your Auth](./testing-your-auth.md) | Auth-specific test cases |
| [Fuzzing Inputs](./fuzzing-inputs.md) | Input fuzzing for APIs and forms |
| [OWASP ZAP Guide](./owasp-zap-guide.md) | Step-by-step ZAP setup |
| [Vulnerable Sample Apps](./vulnerable-sample-apps.md) | Practice targets |

### Agent Prompts

- [Run SAST Scan](./prompts/run-sast-scan.md)
- [Test Auth Flows](./prompts/test-auth-flows.md)
- [Fuzz API Inputs](./prompts/fuzz-api-inputs.md)

---

## Minimal Security Testing Setup (1 Day)

1. Add Semgrep to your CI/CD (20 minutes)
2. Run `npm audit` on every build (5 minutes)
3. Use the manual testing checklist before launch (2 hours)
4. Run OWASP ZAP against your staging environment (1 hour)
