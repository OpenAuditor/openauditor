# Deprecation and Version Hygiene

> **30-second summary:** Outdated APIs, deprecated patterns, and pinned-too-old package versions are a leading source of security vulnerabilities and subtle bugs. AI coding assistants are particularly prone to generating deprecated code because their training data contains years of old Stack Overflow answers, outdated tutorials, and pre-breaking-change documentation. Verify everything against current official docs before shipping.

## The AI-Generated Deprecated Code Problem

AI coding assistants (Claude, Cursor, Copilot, Gemini, Codex, Lovable, Replit Agent) are trained on code spanning many years. They confidently generate patterns that were correct 2–3 years ago but are now:

- **Deprecated** — still works but officially discouraged
- **Removed** — causes runtime errors in current versions
- **Insecure** — the old pattern had a known vulnerability that the new API fixes
- **Superseded** — the ecosystem moved on; your code is now the odd one out

**Rule:** Always verify AI-generated code against the **current official documentation** for the library or service, not against older tutorials or the AI's own explanation.

## Known Stale Patterns by Stack

### Supabase

```typescript
// ❌ DEPRECATED (pre-2023) — service_role key accessed in multiple ways
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY) // still works but naming discouraged

// ✅ CURRENT — use SUPABASE_SECRET_KEY for server-side admin operations
// This follows Supabase's recommended naming convention (docs 2024+)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!  // Never expose to frontend
)

// ❌ DEPRECATED — old auth helpers package
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'  // deprecated
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs' // deprecated

// ✅ CURRENT (Supabase 2024+) — use @supabase/ssr
import { createServerClient } from '@supabase/ssr'
// See: https://supabase.com/docs/guides/auth/server-side/nextjs

// ❌ OLD — supabase.auth.session() (Supabase v1 pattern)
const session = supabase.auth.session()

// ✅ CURRENT (Supabase v2) — async method
const { data: { session } } = await supabase.auth.getSession()

// ❌ OLD — supabase.auth.user() (Supabase v1 pattern)
const user = supabase.auth.user()

// ✅ CURRENT — getUser() verifies server-side
const { data: { user } } = await supabase.auth.getUser()
```

**Official reference:** Always check [supabase.com/docs](https://supabase.com/docs) — the migration guides are authoritative.

### Next.js

```typescript
// ❌ DEPRECATED — Pages Router patterns (Next.js 12 and earlier)
// Many AI tools still generate this for new projects
export async function getServerSideProps(context) { ... }
export async function getStaticProps() { ... }
// These still work in Next.js 13+ but are not the recommended approach for new code

// ✅ CURRENT (Next.js 13+ App Router)
// Server Components fetch data directly
async function Page() {
  const data = await fetch('https://api.example.com/data')
  // ...
}

// ❌ OLD — next/router for App Router pages
import { useRouter } from 'next/router' // Pages Router only

// ✅ CURRENT — next/navigation for App Router
import { useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'

// ❌ DEPRECATED — _app.js wrapping (App Router projects)
// ✅ CURRENT — layout.tsx at root

// ❌ OLD — next.config.js (still works, but TypeScript not supported inline)
// ✅ CURRENT — next.config.ts (Next.js 15+)
```

**AI risk:** Copilot and older Cursor/Claude instances frequently generate Pages Router patterns for new App Router projects. Always specify "using Next.js 15 App Router" in your prompt.

**Official reference:** [nextjs.org/docs](https://nextjs.org/docs)

### Node.js / Express

```javascript
// ❌ REMOVED — require() in ES module context
const express = require('express') // Works in CommonJS; error in pure ESM

// ✅ CURRENT — ESM import
import express from 'express'

// ❌ DEPRECATED — callback-style async in Express 4
app.get('/users', (req, res, next) => {
  db.getUsers((err, users) => {
    if (err) return next(err)
    res.json(users)
  })
})

// ✅ CURRENT (Express 5 / with wrapper) — async/await
app.get('/users', async (req, res) => {
  const users = await db.getUsers()
  res.json(users)
})
// Note: Express 5 handles async errors natively; Express 4 requires express-async-errors

// ❌ OLD — body-parser as separate package (Express 4.16+ includes it)
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// ✅ CURRENT — built-in
app.use(express.json())
```

**Official reference:** [expressjs.com/en/guide](https://expressjs.com/en/guide/routing.html)

### Python / FastAPI / Django

```python
# ❌ DEPRECATED — FastAPI old dependency style
from fastapi import Depends
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# (This pattern is still valid but newer SQLAlchemy async sessions are preferred)

# ❌ OLD — Flask before-request session handling
# Many AI tools still generate Flask 1.x patterns for Flask 2.x+ projects

# ❌ REMOVED — Python 2 print statement and unicode handling
print "hello"  # Python 2 only
unicode("text")  # Python 2 only

# ✅ CURRENT — async by default in modern FastAPI
from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown
app = FastAPI(lifespan=lifespan)
```

**Official reference:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com/), [docs.djangoproject.com](https://docs.djangoproject.com/en/stable/)

### JWT Libraries

```typescript
// ❌ VULNERABLE — old jsonwebtoken pattern without algorithm check
const payload = jwt.verify(token, secret)  // CVE-2022-23529: alg:none attack possible

// ✅ CURRENT — explicit algorithm allowlist
const payload = jwt.verify(token, secret, { algorithms: ['HS256'] })

// ❌ DEPRECATED — jose package v3 API
// Many tutorials use jose v3 which has breaking changes in v4+
import { JWTExpired } from 'jose/errors'  // v3 (wrong for v4)

// ✅ CURRENT — jose v4+ API
import { jwtVerify } from 'jose'
```

## Prompting AI Assistants to Use Current Versions

When asking any AI tool to generate code, include version context:

```
Context for this session:
- Next.js 15 (App Router, TypeScript)
- Supabase JS v2 (using @supabase/ssr, not @supabase/auth-helpers-nextjs)
- Node.js 22 LTS
- React 19
- TypeScript 5.x strict mode

When generating code:
1. Always use async/await, never callbacks
2. Use App Router patterns (layouts, server components), not Pages Router
3. Reference the CURRENT official documentation for each library
4. If you are unsure whether a pattern is current, say so and suggest I verify at [docs URL]
5. Flag any patterns that may have changed in recent major versions
```

## Checking for Deprecated Patterns in Your Codebase

```bash
# Supabase deprecated imports
grep -rn "auth-helpers-nextjs\|auth-helpers-shared\|supabase-js.*v1\|supabase\.auth\.session()\|supabase\.auth\.user()" \
  --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Next.js Pages Router in App Router project
# (Check if you have both /app and /pages directories)
ls app pages 2>/dev/null

# Old Express patterns
grep -rn "require('body-parser')\|require(\"body-parser\")" \
  --include="*.js" --include="*.ts" . | grep -v node_modules

# JWT without algorithm spec
grep -rn "jwt\.verify(" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v "algorithms"

# Deprecated createCipher (no IV — ECB mode)
grep -rn "createCipher\b" --include="*.ts" --include="*.js" . | grep -v node_modules
```

## The "Check the Docs" Habit

Before shipping any AI-generated code that touches:
- Authentication / authorisation
- Cryptography
- Database queries
- External API integration
- File uploads
- Environment variables

Open the official documentation and verify the pattern is current. This takes 2 minutes and prevents hours of debugging and potential security incidents.

**Bookmark these:**
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Node.js: https://nodejs.org/docs/latest/api/
- Express: https://expressjs.com/en/guide/routing.html
- FastAPI: https://fastapi.tiangolo.com/
- Django: https://docs.djangoproject.com/en/stable/
- Prisma: https://www.prisma.io/docs
- Stripe: https://stripe.com/docs/api

## Learn More

- [Secure by Default](./secure-by-default.md)
- [CVE Awareness — Staying Current](../04-cve-awareness/staying-current.md)
- [Prompt: Check for Deprecated Patterns](./prompts/check-deprecated-patterns.md)
