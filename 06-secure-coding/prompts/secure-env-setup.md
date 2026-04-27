# Prompt: Secure Environment Variable Setup

## When to use this

Use this when starting a new project, onboarding a new developer, or auditing how secrets are currently managed in your codebase. It's also useful after a secret leak — to understand what's exposed and fix the configuration.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit and fix the environment variable and secrets management in this codebase.

**Step 1: Scan for hardcoded secrets**
Search every file for patterns that suggest hardcoded secrets:
- Strings starting with: `sk_`, `pk_`, `eyJ`, `Bearer `, `ghp_`, `xoxb-`, `SG.`
- Variables named: API_KEY, SECRET, PASSWORD, TOKEN, KEY
- Database connection strings with credentials embedded
- Any string with "password", "passwd", "secret" near an assignment

List every finding with: file path, line number, what it looks like, and severity.

**Step 2: Check .gitignore**
Verify these patterns exist in .gitignore:
- `.env`
- `.env.local`
- `.env.*.local`
- `.env.production`
- `*.pem`
- `*.key`

Report any missing patterns.

**Step 3: Verify .env.example exists**
Check if `.env.example` (or `.env.sample`) exists. If not, create one with all required environment variables using placeholder values. Never put real values in this file.

**Step 4: Check for NEXT_PUBLIC_ prefix misuse (Next.js only)**
Search for any secret variables prefixed with `NEXT_PUBLIC_`. These are bundled into the client-side JavaScript and exposed to all users.

Report: which variables are incorrectly prefixed as public.

**Step 5: Verify environment-specific separation**
Check if different secrets exist for different environments (dev/staging/prod). Look for:
- Single .env used for everything
- Production credentials in development config
- Staging databases pointing to production

**Findings format:**
For each finding:
- **Severity:** Critical / High / Medium / Low
- **File:** path/to/file.js:line
- **Issue:** What's wrong
- **Fix:** Exact code or config change to resolve it

**Step 6: Implement fixes**
For each Critical or High finding:
1. Move the secret to the correct environment variable
2. Update .gitignore if needed
3. Create/update .env.example
4. If a secret was committed to git: flag it as "ROTATED REQUIRED" — the secret must be rotated since it's in git history

---

## What to expect

A list of all secret-related issues in the codebase, with severities, and specific fixes for each. Expect to see: any hardcoded keys, missing gitignore entries, incorrectly scoped public variables, and a completed .env.example file.

## Learn more

[Environment Secrets Management](../env-secrets-management.md)
