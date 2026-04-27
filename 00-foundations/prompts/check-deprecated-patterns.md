# Prompt: Check for Deprecated and Outdated Patterns

## When to use this

Use this when inheriting a codebase, after an AI coding assistant generates significant code, before a security audit, or when upgrading to a new major version of a framework. AI-generated code frequently uses patterns that were correct 1–3 years ago but are now deprecated, removed, or superseded by more secure alternatives.

## Works with

Claude Code, Cursor, GitHub Copilot, Gemini CLI, OpenAI Codex, Windsurf, Cline, Aider, Lovable, Base44, Emergent, Replit Agent

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a senior engineer reviewing a codebase for deprecated, outdated, and insecure patterns. AI coding assistants frequently generate code based on older training data — your job is to find patterns that need updating to current stable versions.

**First, identify the stack:**

```bash
# Check package.json for framework versions
cat package.json | python3 -m json.tool 2>/dev/null | grep -E '"next|"react|"supabase|"express|"fastapi|"django|"prisma"'

# Check Python dependencies
cat requirements.txt pyproject.toml 2>/dev/null | head -30

# Check Node version
node --version 2>/dev/null
cat .nvmrc .node-version 2>/dev/null
```

**Step 1: Check for deprecated Supabase patterns**

```bash
# Old auth helpers package (deprecated — use @supabase/ssr)
grep -rn "auth-helpers-nextjs\|auth-helpers-shared" \
  --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Old v1 sync methods (Supabase v2 is async)
grep -rn "supabase\.auth\.session()\|supabase\.auth\.user()\b" \
  --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Old service_role naming (check against project's convention)
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role" \
  --include="*.ts" --include="*.tsx" --include="*.env*" . | grep -v node_modules

# Missing RLS (direct table access without auth context)
grep -rn "createClient.*process\.env\.SUPABASE_ANON" \
  --include="*.ts" . | grep -v node_modules
# Check: is this client used server-side without RLS? That's a risk.
```

**Step 2: Check for deprecated Next.js patterns**

```bash
# Pages Router in App Router project (mixing is risky)
ls app/ pages/ 2>/dev/null
# If both exist: document intentional migration vs accidental mixing

# Old import paths (deprecated in Next.js 13+)
grep -rn "from 'next/router'" --include="*.ts" --include="*.tsx" . | grep -v node_modules
# In App Router: should use 'next/navigation', not 'next/router'

grep -rn "from 'next/head'" --include="*.tsx" . | grep -v node_modules
# In App Router: use <head> in layout.tsx or metadata exports

# Old data fetching patterns (still work, but not recommended for new code in App Router)
grep -rn "getServerSideProps\|getStaticProps\|getStaticPaths" \
  --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Old image component syntax
grep -rn "import Image from 'next/image'" --include="*.tsx" . | grep -v node_modules
# Check: is fill, width/height, or alt being used correctly?
```

**Step 3: Check for deprecated authentication patterns**

```bash
# JWT without algorithm specification (CVE-2022-23529 / alg:none vulnerability)
grep -rn "jwt\.verify(" --include="*.ts" --include="*.js" . | grep -v node_modules
# Each match should have { algorithms: ['HS256'] } or similar

# Old bcrypt import styles or insufficient cost factor
grep -rn "bcrypt\." --include="*.ts" --include="*.js" . | grep -v node_modules
# Check cost factor — should be >= 12

# Hardcoded secret fallbacks
grep -rn "|| 'secret'\||| \"secret\"\|| 'changeme'\|| \"development\"" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
# Pattern: const secret = process.env.JWT_SECRET || 'secret' — NEVER in production
```

**Step 4: Check for deprecated cryptography**

```bash
# Removed / ECB-mode cipher (no IV)
grep -rn "createCipher\b\|createDecipher\b" --include="*.ts" --include="*.js" . | grep -v node_modules
# Must be createCipheriv and createDecipheriv

# Weak algorithms for passwords
grep -rn "\.createHash('md5')\|\.createHash('sha1')\|\.createHash('sha256').*password" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Math.random() for security tokens
grep -rn "Math\.random()" --include="*.ts" --include="*.js" . | grep -v node_modules
# Flag any near: token, key, secret, id, nonce, salt
```

**Step 5: Check for deprecated package patterns**

```bash
# body-parser as separate package (built into Express 4.16+)
grep -rn "require('body-parser')\|from 'body-parser'" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Old Mongoose connection style
grep -rn "mongoose\.connect.*useNewUrlParser\|useUnifiedTopology" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
# These options were removed in Mongoose 6+

# Deprecated node-fetch v2 (v3+ is ESM-only; different API)
grep -rn "require('node-fetch')" --include="*.ts" --include="*.js" . | grep -v node_modules
# In Node 18+: use native fetch() instead

# Old uuid v3 import style
grep -rn "require('uuid/v4')\|require('uuid/v1')" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
# Should be: import { v4 as uuidv4 } from 'uuid'
```

**Step 6: Check for outdated environment variable patterns**

```bash
# Check .env files for old naming conventions
cat .env .env.local .env.example 2>/dev/null | grep -E "SERVICE_ROLE|ANON_KEY|JWT_SECRET"
# Compare against current provider documentation for recommended variable names

# Check for missing NEXT_PUBLIC_ prefix (exposes to client unintentionally)
grep -rn "process\.env\." --include="*.tsx" --include="*.ts" app/ 2>/dev/null | \
  grep -v "NEXT_PUBLIC_" | grep -v node_modules | head -20
# In App Router: server components can access all vars; client components can only see NEXT_PUBLIC_ ones
```

**Step 7: Check for outdated Python patterns**

```python
# Run if Python is in the stack:
```

```bash
grep -rn "from flask import request\|@app\.route" --include="*.py" . | grep -v __pycache__ | head -10
# Flask 1.x vs 2.x patterns differ significantly

grep -rn "db\.session\.query\|session\.query(" --include="*.py" . | grep -v __pycache__
# SQLAlchemy 1.x legacy query style — SQLAlchemy 2.0 uses select() statements

grep -rn "from sqlalchemy" --include="*.py" . | head -5
# Check version: SQLAlchemy 2.0 has breaking changes from 1.x
```

**Step 8: Verify against official documentation**

For each deprecated pattern found, verify the current approach:

```markdown
## Verification Checklist

For each finding, confirm the fix in official docs before implementing:

| Pattern | Deprecated Since | Current Approach | Docs URL |
|---------|-----------------|-----------------|----------|
| auth-helpers-nextjs | Supabase 2024 | @supabase/ssr | supabase.com/docs/guides/auth/server-side/nextjs |
| jwt.verify without algorithms | Always best practice | algorithms: ['HS256'] | github.com/auth0/node-jsonwebtoken |
| createCipher (no IV) | Node.js 10 | createCipheriv | nodejs.org/api/crypto |
| next/router in App Router | Next.js 13 | next/navigation | nextjs.org/docs/app/api-reference/functions/use-router |
```

**Step 9: Produce findings report**

| Category | File | Line | Deprecated Pattern | Current Pattern | Risk |
|----------|------|------|--------------------|-----------------|------|
| Supabase | lib/supabase.ts | 3 | auth-helpers-nextjs | @supabase/ssr | Medium |
| JWT | api/auth.ts | 45 | jwt.verify(t, s) | jwt.verify(t, s, {algorithms:['HS256']}) | High |
| Crypto | utils/encrypt.ts | 12 | createCipher | createCipheriv + AES-GCM | Critical |

Implement fixes for all Critical and High findings. For Medium findings, note the upgrade path but confirm with the team before changing (may require migration work).

---

## What to expect

A complete inventory of deprecated and outdated patterns in the codebase, with current alternatives verified against official documentation, and fixes implemented for security-impacting patterns.

## Learn more

[Deprecation and Version Hygiene](../deprecation-and-version-hygiene.md)
[Audit Crypto Usage](../../07-cryptography/prompts/audit-crypto-usage.md)
[Fix Authentication Failures](../../02-owasp/prompts/fix-auth-failures.md)
