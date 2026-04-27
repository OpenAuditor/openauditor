# Prompt: OWASP Web Top 10 Audit

## When to use this

Use this before launch, after a significant feature addition, or as an annual security review. This prompt produces a comprehensive audit covering all 10 OWASP Web Top 10 categories.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer conducting a full OWASP Web Top 10 2021 audit. Review the codebase systematically against each category and produce a prioritised findings report.

**Step 1: Map the application surface**

Before auditing, understand what you're working with:
```bash
# Application entry points
find app/api pages/api -name "*.ts" -o -name "*.js" 2>/dev/null | head -30
find src/routes -name "*.ts" -o -name "*.js" 2>/dev/null | head -30

# Authentication mechanism
grep -r "signIn\|login\|authenticate\|getServerSession\|withAuth" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Database access
grep -r "supabase\.\|prisma\.\|mongoose\.\|knex\.\|sequelize\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
```

What framework? What database? What authentication system?

**Step 2: A01 — Broken Access Control**

Check every API endpoint that accepts a resource ID:

```bash
grep -r "params\.id\|params\.userId\|params\.orderId\|req\.params" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each endpoint:
- Does it check that the authenticated user owns the resource?
- Is Row Level Security enabled in Supabase (if applicable)?

Test: create two test users; can User B access User A's resources?

Finding template:
- **A01 Status:** PASS / FAIL
- **Issues found:** [list each IDOR or access control gap]
- **Files:** [path:line for each issue]

**Step 3: A02 — Cryptographic Failures**

```bash
# Find password hashing
grep -r "bcrypt\|argon2\|scrypt\|MD5\|SHA1\|sha256" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for sensitive data in transit
grep -r "http://" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | grep -v localhost | grep -v 'comment'

# Check database encryption (Supabase encrypts at rest by default)
# For custom databases: check if SSL is required in connection string
grep -r "DATABASE_URL\|db_url" . --include="*.env*" 2>/dev/null
```

- Is bcrypt used with cost ≥12?
- Is Argon2 used (preferred for new projects)?
- Are sensitive fields encrypted in the database?
- Is HTTPS enforced?

**Step 4: A03 — Injection**

```bash
# Find raw SQL queries
grep -rn "\.query\(\`\|\.query\(\"\|\.raw\(\|db\.execute\(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find template literals in database queries
grep -rn '`SELECT\|`INSERT\|`UPDATE\|`DELETE' \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find NoSQL injection patterns
grep -rn "find({.*req\.\|findOne({.*req\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Is all user input parameterised or validated before use in database queries?

**Step 5: A04 — Insecure Design**

Review the architecture for:
- Missing rate limiting on login, registration, password reset
- Missing CSRF protection (especially for state-changing operations)
- Business logic that can be abused (negative prices, excessive quantities)

```bash
grep -r "rate.limit\|ratelimit\|RateLimit" --include="*.ts" --include="*.js" . | grep -v node_modules
```

**Step 6: A05 — Security Misconfiguration**

```bash
# Check security headers
curl -I https://[staging-url] 2>/dev/null | grep -i "strict-transport\|content-security\|x-frame\|x-content-type"

# Check Next.js config
cat next.config.ts 2>/dev/null || cat next.config.js 2>/dev/null

# Check for debug mode in production config
grep -r "DEBUG=true\|debug: true" . --include="*.env*" --include="*.ts" 2>/dev/null
```

Are all OWASP-recommended security headers present? Is HTTPS enforced?

**Step 7: A06 — Vulnerable Components**

```bash
npm audit --json | head -50
# or
pip-audit -r requirements.txt 2>/dev/null
```

Are there High or Critical vulnerabilities in dependencies?

**Step 8: A07 — Authentication Failures**

```bash
# Check for session invalidation on logout
grep -r "logout\|signOut" --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for MFA
grep -r "mfa\|totp\|two.factor\|2fa" --include="*.ts" --include="*.js" . | grep -v node_modules

# Check password reset implementation
grep -r "reset.password\|forgot.password" --include="*.ts" --include="*.js" . | grep -v node_modules
```

**Step 9: A08 — Data Integrity Failures**

```bash
# Check for unsafe deserialisation
grep -rn "JSON.parse\|deserialize\|pickle\|unserialize" \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules

# Check GitHub Actions for unpinned versions
grep -rn "uses:" .github/workflows/ | grep -v "@[a-f0-9]\{40\}"
```

**Step 10: A09 — Logging and Monitoring Failures**

```bash
# Find logging code
grep -r "logger\.\|console\.\|pino\|winston\|structlog" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Check for PII in logs
grep -r "logger\." --include="*.ts" --include="*.js" . | \
  grep -i "password\|token\|secret" | grep -v node_modules
```

Are security events logged? Are there alerts for anomalies?

**Step 11: A10 — SSRF**

```bash
# Find URL fetching with user-controlled input
grep -rn "fetch(\|axios\.\|request(\|got(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
```

Is user-supplied URL input validated before fetching?

**Step 12: Produce the audit report**

For each A01–A10 category:

| Category | Status | Critical Issues | High Issues | Notes |
|----------|--------|-----------------|-------------|-------|
| A01 Access Control | FAIL | 2 | 1 | IDOR in orders endpoint |
| A02 Crypto | PASS | 0 | 0 | bcrypt cost=12 ✓ |
| ... | | | | |

Then list all findings by severity:
- **Critical:** [List with file:line]
- **High:** [List with file:line]
- **Medium:** [List with file:line]

Finally, implement fixes for all Critical and High findings.

---

## What to expect

A complete OWASP Web Top 10 audit: status for all 10 categories, detailed findings with file locations, and implemented fixes for Critical and High severity issues.

## Learn more

[OWASP Web Top 10](../web-top10/README.md)
[Fix Broken Access Control](./fix-broken-access-control.md)
[Fix Injection Issues](./fix-injection.md)
