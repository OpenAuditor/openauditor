# Load Production Readiness Audit Skill in Cursor

## Setup (one time)

1. Open Cursor Settings: `Cmd/Ctrl + Shift + J` → Rules for AI
2. Or create `.cursorrules` in your project root

Paste the following:

```
When I type /audit, run the production readiness audit below on the current codebase.
```

## The Skill

Copy everything below into your `.cursorrules` file or Cursor rules:

---

**Production Readiness Audit**

When the user types `/audit` or asks for a production readiness check, perform a systematic review of the codebase covering these security and reliability areas. Produce a findings report with severity ratings and implemented fixes for all Critical and High issues.

**1. Environment and Secrets**
```bash
# Check for secrets in code
grep -rn "password\s*=\s*['\"].\|api_key\s*=\s*['\"].\|secret\s*=\s*['\"]." \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Verify .env is gitignored
cat .gitignore | grep -E "\.env|secrets"

# Check env template exists
ls .env.example .env.sample 2>/dev/null
```

**2. Authentication**
```bash
grep -rn "bcrypt\|argon2\|MD5\|sha1\|sha256" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "rateLimit\|Ratelimit" --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "algorithms:\|algorithm:" --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check: bcrypt cost≥12 or Argon2id, rate limiting on auth endpoints, JWT algorithm specified.

**3. Injection Vulnerabilities**
```bash
grep -rn '`SELECT\|`INSERT\|`UPDATE\|`DELETE\|query.*\${\|query.*\+' \
  --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "innerHTML\s*=" --include="*.tsx" --include="*.ts" . | grep -v node_modules
grep -rn "exec(`\|execSync(`" --include="*.ts" --include="*.js" . | grep -v node_modules
```

**4. Access Control**
```bash
grep -rn "params\.id\|params\.\w*Id" --include="*.ts" --include="*.js" . | grep -v node_modules
# For each: verify ownership check against authenticated user
```

**5. Security Headers**
```bash
cat next.config.ts next.config.js 2>/dev/null | grep -A 30 "headers"
grep -rn "helmet\|cors(" --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, CORS origin restriction.

**6. Dependencies**
```bash
npm audit --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
vulns = data.get('vulnerabilities', {})
high = [(k,v) for k,v in vulns.items() if v.get('severity') in ('high','critical')]
print(f'High/Critical vulnerabilities: {len(high)}')
for name, v in high[:10]:
    print(f'  {name}: {v[\"severity\"]}')
" 2>/dev/null || npm audit
```

**7. HTTPS and TLS**
```bash
grep -rn "rejectUnauthorized.*false\|http://" \
  --include="*.ts" --include="*.js" . | \
  grep -v "node_modules\|localhost\|127\.0\.0\.1\|comment"
```

**8. Error Handling**
```bash
grep -rn "err\.stack\|error\.stack\|console\.error(err\b" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check: Stack traces are not returned to clients in production.

**9. Logging**
```bash
grep -rn "console\.log.*password\|logger.*token\|log.*secret" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**10. GitHub Actions Security**
```bash
grep -rn "uses:" .github/workflows/ 2>/dev/null | grep -v "@[a-f0-9]\{40\}"
grep -rn "permissions:" .github/workflows/ 2>/dev/null
```

**Report Format:**
Produce a table:

| Area | Status | Critical | High | Medium | Top Finding |
|------|--------|----------|------|--------|-------------|
| Secrets | PASS/FAIL | | | | |
| Authentication | | | | | |
| Injection | | | | | |
| Access Control | | | | | |
| Headers | | | | | |
| Dependencies | | | | | |
| HTTPS/TLS | | | | | |
| Error Handling | | | | | |
| Logging | | | | | |
| CI/CD | | | | | |

Then implement fixes for all Critical and High findings.

---

## Usage

In any Cursor conversation, type:

```
/audit
```

Or:

```
Run a production readiness audit on this codebase
```

## Learn More

[Skills README](../../README.md)
[Load in Claude](./load-skill-claude.md)
[OWASP Web Top 10 Audit](../../../02-owasp/prompts/web-top10-audit.md)
