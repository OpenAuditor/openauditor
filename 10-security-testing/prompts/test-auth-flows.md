# Prompt: Test Authentication Flows

## When to use this

Use this before launch, after changing authentication code, or as part of a regular security review. Authentication is the highest-value target in any application.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer conducting an authentication security review. Analyse the authentication implementation and write security test cases.

**Step 1: Map the auth system**
Identify:
- How users register (form, OAuth, magic link?)
- How users log in (password, OAuth, SSO, 2FA?)
- How sessions are managed (cookie, JWT, session DB?)
- Where tokens are stored (cookie, localStorage, memory?)
- How password reset works
- How logout works (client-side only? server-side session invalidation?)

**Step 2: Review the implementation**
Check for these vulnerabilities:

**Password hashing:**
- What algorithm is used? Must be bcrypt, Argon2, or PBKDF2.
- Flag MD5, SHA1, SHA256, or plain text as Critical.
- What is the cost factor? Should be ≥12 for bcrypt.

**Session management:**
- Are cookies HttpOnly? Secure? SameSite?
- Are sessions stored server-side (required) or just as a signed cookie?
- Do sessions expire?
- Are sessions invalidated server-side on logout?

**Rate limiting:**
- Is the login endpoint rate-limited?
- Is the password reset endpoint rate-limited?
- What's the limit and window?

**Password reset:**
- Is the token cryptographically random?
- Does it expire? (Should be ≤15 minutes)
- Is the token invalidated after use?
- Does the response reveal if the email exists?

**Step 3: Write security tests**
For each vulnerability found, write an automated test:
- Rate limiting test (send N+1 requests, expect 429)
- Session invalidation test (logout then try old session)
- IDOR test (access another user's resource with different auth)
- Consistent error messages test (wrong email vs wrong password)
- Token expiry test (use expired reset token)

Use the framework already in use (Jest, pytest, etc.).

**Step 4: Findings and fixes**
For each issue:
- **Severity:** Critical / High / Medium / Low
- **Issue:** What's wrong
- **Test that would catch it:** Code for the security test
- **Fix:** Specific code to implement

---

## What to expect

An analysis of your auth implementation, security tests written in your testing framework, and specific code fixes for any vulnerabilities found. The tests serve as regression protection so the same bug can't return undetected.

## Learn more

[Testing Your Auth](../testing-your-auth.md)
