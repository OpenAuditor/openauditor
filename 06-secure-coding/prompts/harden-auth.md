# Prompt: Harden Authentication

## When to use this

Use this when building auth from scratch, auditing existing auth, or after a failed login attempt. Authentication is the front door — it must be solid.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit and harden the authentication system in this application.

**Step 1: Audit password storage**
Find where passwords are hashed and stored. Check:
- What hashing algorithm is used? (Must be bcrypt, Argon2, or PBKDF2)
- Is MD5, SHA1, SHA256, or plain text being used anywhere? (CRITICAL if yes)
- What is the cost factor? (Bcrypt: should be ≥12, Argon2: default settings)
- Are passwords salted? (bcrypt and Argon2 do this automatically)

**Step 2: Audit session management**
How are sessions managed?
- Are session tokens stored in HttpOnly, Secure cookies? (Required)
- Are tokens stored in localStorage? (CRITICAL vulnerability if yes)
- Do sessions expire? (Should expire on inactivity and absolutely)
- Are sessions invalidated on logout server-side?

**Step 3: Check JWT configuration (if used)**
- What algorithm is used? (Must be HS256 with strong secret, or RS256)
- Is `alg: none` possible? (CRITICAL if yes)
- What is the expiry? (Should be ≤1 hour for access tokens)
- Is the signing secret strong and from environment variables?

**Step 4: Check brute-force protection**
On the login endpoint:
- Is rate limiting applied? (10 attempts per 15 minutes minimum)
- Is there account lockout after repeated failures?
- Are failed attempts logged?

**Step 5: Check password reset**
- Is the reset token random and unguessable? (crypto.randomBytes(32))
- Does the reset token expire? (15 minutes maximum)
- Is the token stored hashed in the database?
- Does the "forgot password" response reveal if the email exists?

**Step 6: Check registration**
- Are passwords validated for minimum strength? (≥8 chars minimum)
- Is email verified before the account is active?
- Is registration rate-limited to prevent bot signups?

**Step 7: Fix every issue found**
For each finding:
- Severity: Critical / High / Medium / Low
- What's wrong
- The exact code fix
- Confirm the fix doesn't break existing functionality

Focus on Critical and High first. Show working, tested code for each fix.

---

## What to expect

A complete auth security audit with specific code fixes. Expect to see: password hashing upgraded if needed, session storage corrected, rate limiting added, brute-force protection implemented, and password reset flow secured.

## Learn more

[Authentication Best Practices](../auth-best-practices.md)
