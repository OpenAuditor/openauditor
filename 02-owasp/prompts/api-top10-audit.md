# Prompt: OWASP API Top 10 Audit

## When to use this

Use this before exposing a new API publicly, after adding new endpoints, when inheriting an existing API codebase, or as an annual security review. This covers all 10 OWASP API Security Top 10 2023 categories.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer conducting a full OWASP API Security Top 10 2023 audit. Review the API codebase systematically and produce a prioritised findings report with fixes.

**Step 1: Map the API surface**

Before auditing, understand what you're working with:
```bash
# Find all API route definitions
grep -rn "app\.get\|app\.post\|app\.put\|app\.patch\|app\.delete\|router\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -50

# Find Next.js API routes
find app/api pages/api -name "route.ts" -o -name "*.ts" 2>/dev/null | head -30

# Find Python route decorators
grep -rn "@app\.route\|@router\.\|@bp\." --include="*.py" . | head -30

# Find authentication middleware
grep -rn "authenticate\|requireAuth\|withAuth\|verifyToken\|getServerSession" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Find database access patterns
grep -rn "supabase\.\|prisma\.\|mongoose\.\|db\.query\|knex\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
```

What framework? What auth system? What database?

**Step 2: API1 — Broken Object Level Authorisation (BOLA/IDOR)**

This is the most common critical API vulnerability.

```bash
# Find endpoints that accept resource IDs
grep -rn "params\.id\|params\.\w*Id\|req\.params\.\w*" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find Supabase queries — check for auth.uid() in RLS
grep -rn "\.from(\|\.select(\|\.update(\|\.delete(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each endpoint that accepts a resource ID, verify:
- Does it check `userId === authenticatedUserId`?
- If using Supabase: is Row Level Security enabled on the table?
- Can User B access User A's resources by changing the ID?

Finding template:
- **API1 Status:** PASS / FAIL
- **IDOR vulnerabilities:** [list each endpoint]
- **Files:** [path:line]

**Step 3: API2 — Broken Authentication**

```bash
# Find authentication endpoints
grep -rn "login\|signin\|authenticate\|token\|refresh" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Check for rate limiting on auth endpoints
grep -rn "rateLimit\|Ratelimit\|rate_limit" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check JWT handling
grep -rn "jwt\.\|jsonwebtoken\|verify\|decode" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for algorithm allowlisting
grep -rn "algorithms:\|algorithm:" --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check:
- Is `algorithms: ['RS256']` or specific algorithm specified in JWT verify? (prevents alg:none attack)
- Is there rate limiting on login (max 5 attempts per 15 minutes)?
- Is the token invalidated on logout?

**Step 4: API3 — Broken Object Property Level Authorisation (Mass Assignment)**

```bash
# Find where request body is spread directly into objects
grep -rn "\.create(req\.body\|\.update(req\.body\|\.save(req\.body" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find Prisma operations with spread
grep -rn "data: req\.body\|data:.*req\.body" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find mongoose operations with req.body
grep -rn "new.*Model(req\.body\|\.set(req\.body" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Look for cases where fields like `role`, `isAdmin`, `verified`, `balance` could be set by users.

Fix pattern:
```typescript
// VULNERABLE
await prisma.user.update({ where: { id }, data: req.body });

// SECURE — explicit allowlist
const { name, email, preferences } = req.body;
await prisma.user.update({ where: { id }, data: { name, email, preferences } });
```

**Step 5: API4 — Unrestricted Resource Consumption**

```bash
# Find rate limiting on all endpoints (not just auth)
grep -rn "rateLimit\|Ratelimit" --include="*.ts" --include="*.js" . | grep -v node_modules

# Find pagination — check for missing limits
grep -rn "\.findMany\|\.find(\|\.all(\|SELECT \*" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for file upload size limits
grep -rn "multer\|formidable\|busboy\|limits:" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for LLM API calls (expensive)
grep -rn "openai\.\|anthropic\.\|completions\.create\|messages\.create" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Verify:
- Every endpoint has rate limiting (not just login)
- List endpoints have `limit` and `offset` (and maximum limit enforced)
- File uploads have size limits (max 10MB default)

**Step 6: API5 — Broken Function Level Authorisation**

```bash
# Find admin or management endpoints
grep -rn "admin\|management\|internal\|superuser\|staff" \
  --include="*.ts" --include="*.js" . | grep -v "node_modules\|comment\|string"

# Find role checks
grep -rn "role\|isAdmin\|hasPermission\|can(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find HTTP method differentiation (GET vs POST on same path)
grep -rn "router\.post\|router\.put\|router\.delete" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Verify that all sensitive operations check for admin/privileged role, not just authentication.

**Step 7: API6 — Unrestricted Access to Sensitive Business Flows**

```bash
# Find business-critical endpoints
grep -rn "purchase\|checkout\|payment\|transfer\|withdraw\|promo\|coupon\|vote\|subscribe" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for business logic rate limiting
grep -rn "perUser\|perAccount\|dailyLimit\|maxPerDay" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check: Are there limits on purchases per user, voucher codes per account, API calls per subscription tier?

**Step 8: API7 — Server Side Request Forgery**

```bash
# Find URL fetching that might accept user input
grep -rn "fetch(\|axios\.\|request(\|got(\|http\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Find webhook or URL parameter inputs
grep -rn "webhookUrl\|callbackUrl\|redirectUrl\|imageUrl\|url:" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each fetch call: does the URL come from user input? If so, is it validated against an allowlist?

**Step 9: API8 — Security Misconfiguration**

```bash
# Check CORS configuration
grep -rn "cors(\|CORS\|Access-Control" --include="*.ts" --include="*.js" . | grep -v node_modules

# Check error handling — does it expose stack traces?
grep -rn "err\.stack\|error\.stack\|console\.error" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for debug/test endpoints
grep -rn "\/debug\|\/test\|\/internal\|\/admin\|\/dump" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check security headers
grep -rn "helmet\|x-powered-by\|security.*header" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Is CORS restricted to specific origins? Are error messages sanitised in production?

**Step 10: API9 — Improper Inventory Management**

```bash
# Find API version routes
grep -rn "/v1/\|/v2/\|/v3/\|/beta/\|/legacy/" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check if old versions return proper 410 Gone
# (Run this manually against deployed API)
curl -s -o /dev/null -w "%{http_code}" https://api.example.com/v1/users

# Find staging/test endpoints
grep -rn "staging\|localhost\|127\.0\.0\.1\|dev\." .env* 2>/dev/null
```

**Step 11: API10 — Unsafe Consumption of Third-Party APIs**

```bash
# Find third-party API calls
grep -rn "stripe\.\|twilio\.\|sendgrid\.\|openai\.\|aws\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for response validation on third-party calls
grep -rn "\.parse(\|\.safeParse(\|Schema\." --include="*.ts" --include="*.js" . | grep -v node_modules

# Check webhook signature verification
grep -rn "webhookSecret\|validateWebhook\|verifySignature\|constructEvent" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Are third-party API responses validated with a schema before use? Are webhooks signature-verified?

**Step 12: Produce the audit report**

| Category | Status | Critical | High | Medium | Notes |
|----------|--------|----------|------|--------|-------|
| API1 BOLA/IDOR | | | | | |
| API2 Broken Auth | | | | | |
| API3 Mass Assignment | | | | | |
| API4 Resource Consumption | | | | | |
| API5 Function Auth | | | | | |
| API6 Business Flows | | | | | |
| API7 SSRF | | | | | |
| API8 Misconfiguration | | | | | |
| API9 Inventory | | | | | |
| API10 Third-Party APIs | | | | | |

Then list all findings by severity with file:line references, and implement fixes for all Critical and High findings.

---

## What to expect

A complete OWASP API Top 10 audit: status for all 10 categories, specific findings with file locations, and fixes implemented for Critical and High severity issues.

## Learn more

[OWASP API Top 10 README](../api-top10/README.md)
[Fix Broken Access Control](./fix-broken-access-control.md)
[API Top 10 Detail](https://owasp.org/API-Security/)
