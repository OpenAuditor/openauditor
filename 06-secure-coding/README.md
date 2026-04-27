# Secure Coding

Practical security guidance for the code you write every day.

This section covers the most common areas where developers introduce vulnerabilities — not through ignorance, but through habit, speed, or following bad examples online. Each guide explains what to do, why it matters, and how to verify you've done it correctly.

---

## What's Covered

| Guide | What You'll Learn |
|-------|-------------------|
| [Environment & Secrets](./env-secrets-management.md) | .env files, secret managers, rotation |
| [Authentication](./auth-best-practices.md) | Password hashing, sessions, JWTs |
| [OAuth Deep Dive](./oauth-deep-dive.md) | OAuth 2.0, PKCE, implicit vs auth code |
| [Input Validation](./input-validation.md) | Server-side validation, sanitisation |
| [Rate Limiting](./rate-limiting.md) | Token bucket, sliding window, express-rate-limit |
| [CORS & CSP Headers](./cors-csp-headers.md) | Cross-origin, content security policy |
| [Database Security](./database-security.md) | RLS, least privilege, parameterised queries |
| [API Security](./api-security.md) | Auth on every endpoint, errors, versioning |
| [File Upload Security](./file-upload-security.md) | Type validation, size limits, safe storage |
| [Error Handling](./error-handling-and-disclosure.md) | What to show users vs what to log |
| [WebSocket Security](./websocket-security.md) | Auth for WebSocket connections |
| [Multi-Tenancy](./multi-tenancy-patterns.md) | Isolating customer data |
| [Third-Party Scripts](./third-party-scripts.md) | SRI hashes, monitoring for compromise |

### Known Insecure Patterns

Real mistakes, shown with WRONG code and RIGHT code:

- [Next.js Common Mistakes](./known-insecure-patterns/nextjs-common-mistakes.md)
- [Supabase Common Mistakes](./known-insecure-patterns/supabase-common-mistakes.md)
- [Python Common Mistakes](./known-insecure-patterns/python-common-mistakes.md)
- [Node.js Common Mistakes](./known-insecure-patterns/node-common-mistakes.md)

### Agent Prompts

Copy-paste prompts for implementing security fast:

- [Secure env setup](./prompts/secure-env-setup.md)
- [Add rate limiting](./prompts/add-rate-limiting.md)
- [Harden auth](./prompts/harden-auth.md)
- [Add input validation](./prompts/add-input-validation.md)
- [Secure Supabase RLS](./prompts/secure-supabase-rls.md)
- [Secure file uploads](./prompts/secure-file-uploads.md)
- [Add security headers](./prompts/add-security-headers.md)
- [Secure API routes](./prompts/secure-api-routes.md)

---

## Where to Start

- **New project?** Start with [env-secrets-management](./env-secrets-management.md) and [auth-best-practices](./auth-best-practices.md)
- **Existing project?** Check [known-insecure-patterns](./known-insecure-patterns/) for your stack first
- **Specific issue?** Use [PROMPTS.md](../PROMPTS.md) to find the right prompt
