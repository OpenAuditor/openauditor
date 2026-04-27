# Prompt: MITRE ATT&CK Threat Review

## When to use this

Use this when preparing for a security assessment, after a breach to understand attacker techniques, before a red team engagement, or when you want to systematically harden defences against realistic attack chains.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer performing a MITRE ATT&CK-based threat review. Map your application's attack surface to realistic attacker techniques, identify gaps in defences, and produce prioritised hardening tasks.

**Step 1: Profile the application**

```bash
# Application entry points
find app/api pages/api src/routes -name "*.ts" -o -name "*.js" 2>/dev/null | head -30

# Authentication mechanism
grep -r "signIn\|login\|authenticate\|jwt\|session" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Third-party integrations
grep -r "require\|import" --include="*.ts" . | \
  grep -v node_modules | grep -E "stripe|sendgrid|twilio|openai|aws|gcp|azure" | head -20

# File processing capabilities
grep -r "multer\|sharp\|pdf\|xlsx\|zip\|tar\|exec\|spawn" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# External HTTP calls
grep -r "fetch(\|axios\.\|request(" --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
```

**Step 2: Map attack surface to MITRE Initial Access techniques**

For each attack surface, evaluate these MITRE techniques:

**T1190 — Exploit Public-Facing Application**
```bash
# Find public endpoints with complex input processing
grep -rn "JSON\.parse\|req\.body\|req\.query\|req\.params" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -30

# Find SQL/command construction from user input
grep -rn '`SELECT\|`INSERT\|\.query(`\|exec(`' \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**T1078 — Valid Accounts (credential stuffing/phishing)**
```bash
# Assess authentication strength
grep -rn "bcrypt\|argon2\|MD5\|SHA1" --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "rateLimit\|Ratelimit" --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "mfa\|totp\|two.factor\|2fa" --include="*.ts" --include="*.js" . | grep -v node_modules
```

**T1195 — Supply Chain Compromise**
```bash
# Check dependency health
npm audit --json 2>/dev/null | head -50
ls package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null
grep -rn "npm install\|npm ci" .github/workflows/ 2>/dev/null
grep -rn "uses:" .github/workflows/ 2>/dev/null | grep -v "@[a-f0-9]\{40\}"
```

**T1133 — External Remote Services**
```bash
# Find admin panels, management interfaces
grep -rn "admin\|internal\|management\|debug" \
  --include="*.ts" --include="*.js" . | grep -v "node_modules\|comment" | head -20
```

**Step 3: Analyse post-exploitation techniques**

Once initial access is achieved, what can an attacker do?

**T1552 — Unsecured Credentials**
```bash
# Check for credentials in code or env
git log --all --diff-filter=A -- '*.env' '*.env.*' 2>/dev/null
grep -rn "password\s*=\s*['\"]" --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "API_KEY\s*=\s*['\"]sk-\|secret\s*=\s*['\"]" --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for leaked credentials in git history
git log --all --full-history -- '*.pem' '*.key' '*.p12'
```

**T1530 — Data from Cloud Storage**
```bash
# Find S3 or Supabase storage operations
grep -rn "s3\.\|supabase\.storage\|getObject\|putObject\|\.upload(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Check for public bucket configurations
grep -rn "ACL.*public\|public-read\|publicAccessBlock" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**T1548 — Privilege Escalation**
```bash
# Check for missing authorisation checks on sensitive operations
grep -rn "admin\|role.*admin\|isAdmin\|hasRole" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find privilege-granting endpoints
grep -rn "role.*update\|admin.*grant\|permission.*set" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**T1562 — Impair Defences (disable/bypass logging)**
```bash
# Check if logs can be tampered
grep -rn "logger\.\|console\.\|winston\|pino" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20

# Are logs shipped externally (so they can't be deleted locally)?
grep -rn "axiom\|logtail\|datadog\|papertrail\|cloudwatch" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**T1090 — Proxy / SSRF**
```bash
# Find URL fetching that accepts user input
grep -rn "fetch(\|axios\.get(\|request(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
grep -rn "webhookUrl\|callbackUrl\|imageUrl\|url\s*=\s*req\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

**Step 4: Build attack chain scenarios**

For your application, construct 3 realistic attack chains:

**Chain 1: External attacker gaining data access**
```
1. Initial Access: Which T1190/T1078/T1195 technique is most likely?
2. Discovery: What can they discover (T1083 file discovery, T1580 cloud)?
3. Collection: What data can they access (T1530 cloud storage, T1213 data from repos)?
4. Exfiltration: How would they extract it (T1041)?

For each step: What is your current defensive control? Is it effective?
```

**Chain 2: Privilege escalation to admin**
```
1. Initial Access: Compromise a low-privilege user account
2. Discovery: Enumerate admin endpoints (T1046 network service scanning)
3. Privilege Escalation: Exploit T1548 (broken auth, mass assignment)
4. Persistence: T1098 Account Manipulation (add admin role to own account)
```

**Chain 3: Supply chain compromise**
```
1. Supply Chain: Compromised npm package runs code during install (T1195)
2. Execution: Code runs in CI/CD context (T1059)
3. Credential Access: Reads CI environment secrets (T1552)
4. Exfiltration: Sends secrets to attacker (T1041)
```

**Step 5: Gap analysis**

For each MITRE technique identified, rate your current defence:

| Technique | Attack Vector | Current Control | Rating | Gap |
|-----------|--------------|-----------------|--------|-----|
| T1190 Exploit App | SQL injection | Parameterised queries | Strong | — |
| T1078 Valid Accounts | Credential stuffing | Rate limiting 5/15m | Medium | No MFA |
| T1195 Supply Chain | Malicious package | npm audit weekly | Weak | No npm ci --ignore-scripts |
| T1552 Unsecured Creds | .env in git | gitleaks pre-commit | Medium | No rotation policy |
| T1562 Impair Defences | Log deletion | No external shipping | None | Critical gap |

Rating: **Strong** (blocks attack), **Medium** (slows attacker), **Weak** (easy to bypass), **None** (no control)

**Step 6: Produce hardening tasks**

Based on the gap analysis, create prioritised tasks:

**Critical (P1) — blocks active attack chains:**
- [ ] [Gap description] → [specific fix] at [file:line]

**High (P2) — significantly reduces attack surface:**
- [ ] [Gap description] → [specific fix]

**Medium (P3) — defence in depth improvements:**
- [ ] [Gap description] → [specific fix]

Implement all P1 and P2 fixes in this session.

---

## What to expect

A threat model aligned to MITRE ATT&CK: 3 realistic attack chains mapped to your application, a gap analysis rating each defensive control, and prioritised hardening tasks with implemented fixes for P1 and P2 gaps.

## Learn more

[MITRE to OWASP Mapping](../mitre-to-owasp-mapping.md)
[OWASP Web Top 10 Audit](../../02-owasp/prompts/web-top10-audit.md)
[MITRE ATT&CK Matrix](https://attack.mitre.org/matrices/enterprise/)
