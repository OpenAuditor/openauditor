# Prompt: Add Security Headers

## When to use this

Use this before launching, after a security audit, or when securityheaders.com gives you a low score. Security headers are free, fast to add, and prevent entire classes of attacks.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Add and configure HTTP security headers for this application.

**Step 1: Identify the framework**
Is this Next.js, Express, Django, FastAPI, or another framework? Identify where headers are set (next.config.js, middleware, app config, reverse proxy).

**Step 2: Implement these headers**

Add every header below. Explain what each one prevents.

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: [build appropriate policy for this app]
```

**Step 3: Build a correct CSP for this specific app**

Examine the app to identify:
- What external scripts are loaded? (Google Analytics, Stripe, etc.)
- What fonts are loaded? (Google Fonts?)
- What external APIs does the frontend call?
- Are there any inline scripts or inline styles?

Build a CSP that:
- Allows what this app legitimately uses
- Blocks everything else
- Is NOT `unsafe-eval` or `*` unless absolutely required (and explain why if so)

**Step 4: Configure CORS**
Check current CORS configuration. Ensure:
- `Access-Control-Allow-Origin` is NOT `*` for authenticated endpoints
- Only specific trusted origins are allowed
- `credentials: true` only where required

**Step 5: For Next.js — add to next.config.js**
Show the complete `async headers()` function with all security headers.

**Step 6: For Express — add Helmet**
Install and configure helmet with the appropriate options for this app.

**Step 7: Test**
After implementing, test headers at: https://securityheaders.com
Target: A or A+ rating.

Show any headers that couldn't be added and why.

---

## What to expect

All security headers implemented in the correct location for your framework. A working CSP that doesn't break any existing functionality. Corrected CORS configuration. You should get A or A+ on securityheaders.com after applying the changes.

## Learn more

[CORS and CSP Headers](../cors-csp-headers.md)
