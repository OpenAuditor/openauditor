# Negative Prompts: What NOT to Do

A collection of anti-patterns for AI coding assistants — common patterns that produce insecure code. Use these as negative examples in your context window, or as a checklist when reviewing AI-generated code.

---

## Purpose

When using AI coding assistants for security-sensitive code, explicitly telling the model what NOT to do is as important as telling it what TO do. Paste relevant sections into your prompt to reduce the chance of vulnerable patterns appearing in generated code.

---

## Authentication Anti-Patterns

```
DO NOT:
- Hash passwords with MD5, SHA1, SHA256, or any fast hash
- Store plaintext passwords in any form (including logs)
- Use the same error message for "email not found" and "wrong password" if the distinction is logged — but DO return the same error to the user in both cases
- Create sessions without regenerating the session ID after login
- Accept the user-provided role claim from the JWT payload without server-side verification
- Set cookies without HttpOnly, Secure, and SameSite flags
- Allow unlimited login attempts without rate limiting
- Generate password reset tokens using Math.random() or Date.now()
- Accept password reset tokens after they have been used once
- Use short JWT expiry without implementing refresh token rotation
```

## SQL and Database Anti-Patterns

```
DO NOT:
- Concatenate user input directly into SQL queries (SQL injection)
- Use string interpolation in database queries — always use parameterised queries
- Select * from tables in production queries (exposes all columns including sensitive ones)
- Log database query results that may contain PII or sensitive data
- Disable Supabase Row Level Security (RLS) as a "quick fix"
- Use the Supabase service_role key on the frontend or in client-accessible code
- Store secrets or API keys in the database as plain text
```

## File Upload Anti-Patterns

```
DO NOT:
- Trust the user-provided MIME type (Content-Type header) for security decisions
- Validate file type by extension only — validate by magic bytes
- Store uploaded files in a publicly web-accessible location without explicit opt-in
- Execute or include uploaded files server-side
- Allow filenames to include path traversal characters (../) without sanitisation
- Process uploaded images without limiting max pixel dimensions (decompression bomb)
- Allow SVG file uploads that will be rendered as images (SVG can contain JavaScript)
```

## API and Input Validation Anti-Patterns

```
DO NOT:
- Trust client-provided values for prices, quantities, or discounts without server-side validation
- Accept object IDs in requests without verifying the requesting user has permission to access that object (IDOR)
- Return different HTTP status codes for "resource not found" vs "resource exists but you can't access it" — always return 404 for both
- Use wildcard CORS (*) for APIs that require authentication
- Log request bodies that may contain passwords, tokens, or payment data
- Use eval() or Function() with user-controlled input
- Allow users to specify redirect URLs without validating against an allowlist
```

## Environment and Secret Anti-Patterns

```
DO NOT:
- Hardcode API keys, database URLs, or secrets in source code
- Use NEXT_PUBLIC_ prefix for secrets — this exposes them in the client bundle
- Commit .env files to version control
- Put the Supabase service_role key in any client-accessible code
- Use the same secrets across development, staging, and production environments
- Log environment variable values
- Include secrets in Docker images (use build args or runtime secrets instead)
```

## Session and Cookie Anti-Patterns

```
DO NOT:
- Store session tokens in localStorage (XSS-accessible)
- Set cookies without the HttpOnly flag (allows JavaScript access)
- Set cookies without the Secure flag in production (allows transmission over HTTP)
- Omit the SameSite attribute on cookies (CSRF risk)
- Store sensitive data in the JWT payload (it's only base64-encoded, not encrypted)
- Allow sessions to persist indefinitely without expiry
- Not invalidate sessions server-side on logout (only clearing the cookie is insufficient)
```

## Error Handling Anti-Patterns

```
DO NOT:
- Return stack traces in production error responses
- Include database error messages in API responses (reveals schema information)
- Return different response times for "user not found" vs "wrong password" (timing attacks)
- Log unhandled exceptions without sanitising them first (may contain user data)
- Use generic try/catch without proper error classification
- Expose internal service URLs or infrastructure details in error messages
```

## AI/LLM Anti-Patterns

```
DO NOT:
- Pass user input directly to an LLM without sanitisation or labelling as untrusted
- Use LLM output in innerHTML without sanitisation (XSS)
- Execute LLM-generated SQL without parameterisation
- Execute LLM-generated shell commands with shell=True
- Put API keys or secrets in the system prompt (they can be extracted)
- Give AI agents file system or shell access beyond what they strictly need
- Use eval() or exec() with LLM-generated code
- Trust LLM output for security decisions without human review
```

## Cryptography Anti-Patterns

```
DO NOT:
- Roll your own encryption — use established libraries
- Use ECB mode for block cipher encryption (reveals patterns)
- Reuse IVs/nonces for the same key
- Use a fixed or predictable salt for password hashing
- Use MD5 or SHA1 for any security purpose
- Store private keys in source code or environment variables accessible to the client
- Use Math.random() for security tokens — use crypto.getRandomValues() or crypto.randomBytes()
```

---

## How to Use These

### In a prompt:

```
You are writing authentication code for a production web application.

CONSTRAINTS — do not violate these:
[paste the relevant DO NOT sections]

Now write a login handler that...
```

### In a code review:

Check AI-generated code against each anti-pattern in the relevant section. If any are present, explicitly tell the model which pattern it violated and ask it to fix it.

### In a team guide:

Include this file in your team's onboarding materials. These patterns represent the most common security mistakes in AI-generated code.
