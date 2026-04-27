# Pre-Commit Hooks: Node.js / Express

Security-focused pre-commit hook configuration for Node.js and Express applications. These hooks catch secrets, dangerous patterns, and security misconfigurations before they reach your repository.

---

## Quick Setup

```bash
# Install dependencies
npm install --save-dev husky lint-staged @commitlint/cli

# Initialise Husky
npx husky init

# Install gitleaks for secret scanning
# macOS: brew install gitleaks
# Linux: see github.com/gitleaks/gitleaks/releases
# Or use: npm install --save-dev detect-secrets
```

---

## Configuration

### package.json

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,mjs,cjs}": [
      "eslint --fix --max-warnings=0",
      "node scripts/security-check.js"
    ],
    "*.{json,yaml,yml}": [
      "node scripts/check-secrets.js"
    ]
  }
}
```

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 1. Run lint-staged (ESLint security checks on changed files)
npx lint-staged

# 2. Secret scanning
gitleaks protect --staged --config=.gitleaks.toml
# If gitleaks is not installed, fail gracefully:
# command -v gitleaks && gitleaks protect --staged || echo "gitleaks not installed — skipping"

# 3. Check for .env files accidentally staged
if git diff --cached --name-only | grep -qE '\.env($|\.)'; then
  echo "ERROR: Attempting to commit a .env file!"
  echo "Remove it from staging: git reset HEAD <filename>"
  exit 1
fi

# 4. Run security-focused tests (auth, input validation, permissions)
# npm run test:security  # Uncomment when you have security tests
```

---

## ESLint Security Configuration

```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin eslint-plugin-security eslint-plugin-no-unsanitized
```

```javascript
// eslint.config.mjs (ESLint v9 flat config)
import eslintSecurity from 'eslint-plugin-security';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import tsEslint from '@typescript-eslint/eslint-plugin';

export default [
  {
    plugins: {
      security: eslintSecurity,
      'no-unsanitized': noUnsanitized,
      '@typescript-eslint': tsEslint,
    },
    rules: {
      // === Security Plugin Rules ===
      
      // Detect dangerous eval usage
      'security/detect-eval-with-expression': 'error',
      
      // Detect non-literal regular expressions (ReDoS risk)
      'security/detect-non-literal-regexp': 'warn',
      
      // Detect unsafe use of child_process with user input
      'security/detect-child-process': 'warn',
      
      // Detect fs operations with user-controlled paths
      'security/detect-non-literal-fs-filename': 'warn',
      
      // Detect possible object injection (bracket notation with variable)
      'security/detect-object-injection': 'warn',
      
      // Detect use of pseudorandom (non-cryptographic) number generators
      'security/detect-pseudoRandomBytes': 'error',
      
      // Detect possible SQL injection
      'security/detect-possible-template-injection': 'warn',
      
      // === XSS Prevention ===
      
      // Prevent innerHTML with user-controlled content
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      
      // === TypeScript Security ===
      
      // Disallow any-typed values being used in template literals (injection risk)
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // === General ===
      
      // No eval
      'no-eval': 'error',
      
      // No Function constructor (same risk as eval)
      'no-new-func': 'error',
    },
  },
];
```

---

## Gitleaks Configuration

```toml
# .gitleaks.toml
title = "Security Secret Scan"

[[rules]]
description = "AWS Access Key"
id = "aws-access-key"
regex = '''AKIA[0-9A-Z]{16}'''
tags = ["key", "AWS"]

[[rules]]
description = "Stripe Secret Key"
id = "stripe-secret"
regex = '''sk_(test|live)_[0-9a-zA-Z]{24,}'''
tags = ["key", "Stripe"]

[[rules]]
description = "Supabase Service Role Key"
id = "supabase-service-role"
regex = '''eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'''
tags = ["jwt", "supabase"]

[[rules]]
description = "Generic API Key"
id = "generic-api-key"
regex = '''(?i)(api[_-]?key|apikey)\s*[=:]\s*["']?[a-zA-Z0-9_-]{20,}'''
tags = ["key"]

[[rules]]
description = "Private Key"
id = "private-key"
regex = '''-----BEGIN (RSA|EC|DSA|OPENSSH)? ?PRIVATE KEY-----'''
tags = ["key", "pem"]

[allowlist]
description = "Allowlist"
paths = [
  '''.env.example''',        # Example env files are fine
  '''\.gitleaks\.toml''',    # This config file
  '''package-lock\.json''',  # Lock files with hashes
]
regexes = [
  '''EXAMPLE_KEY_PLACEHOLDER''',  # Placeholder values in docs
  '''your[-_]secret[-_]here''',
  '''replace[-_]me''',
]
```

---

## Custom Security Check Script

```javascript
// scripts/security-check.js
// Run as part of lint-staged on .js/.ts files
const fs = require('fs');

const DANGEROUS_PATTERNS = [
  {
    pattern: /eval\s*\(/,
    message: 'eval() detected — remove this before committing',
    severity: 'error',
  },
  {
    pattern: /new Function\s*\(/,
    message: 'new Function() detected — potential code injection',
    severity: 'error',
  },
  {
    pattern: /child_process\.exec\s*\(/,
    message: 'child_process.exec() with shell — use execFile() instead',
    severity: 'warn',
  },
  {
    pattern: /Math\.random\s*\(\s*\)/,
    message: 'Math.random() is not cryptographically secure — use crypto.randomBytes()',
    severity: 'warn',
  },
  {
    pattern: /innerHTML\s*=/,
    message: 'innerHTML assignment detected — use textContent or sanitise first',
    severity: 'warn',
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    message: 'dangerouslySetInnerHTML — ensure content is sanitised with DOMPurify',
    severity: 'warn',
  },
  {
    pattern: /console\.log\(.*password/i,
    message: 'Possible password logging detected',
    severity: 'error',
  },
  {
    pattern: /console\.log\(.*token/i,
    message: 'Possible token logging detected',
    severity: 'error',
  },
];

const files = process.argv.slice(2);
let hasErrors = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, message, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(lines[i])) {
        const prefix = severity === 'error' ? '❌ ERROR' : '⚠️  WARN';
        console.log(`${prefix}: ${file}:${i + 1}`);
        console.log(`       ${message}`);
        console.log(`       ${lines[i].trim()}`);
        console.log();

        if (severity === 'error') hasErrors = true;
      }
    }
  }
}

if (hasErrors) {
  console.error('Pre-commit security check failed. Fix errors before committing.');
  process.exit(1);
}
```

---

## .gitignore Security Additions

```gitignore
# Secrets and environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local

# Private keys and certificates
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ecdsa

# Credential files
.aws/credentials
.npmrc          # may contain auth tokens
.netrc          # may contain credentials
credentials.json
service-account.json

# Database files
*.db
*.sqlite
*.sqlite3

# Security scan results (don't commit these)
gitleaks-report.json
semgrep-results.json
npm-audit.json
```

---

## Audit Checklist

- [ ] `npm install` does not run arbitrary scripts (`--ignore-scripts` used in CI)
- [ ] Husky pre-commit hooks installed and tested
- [ ] ESLint security plugin enabled with `error` on critical rules
- [ ] Gitleaks configured and running on staged files
- [ ] .env files in .gitignore
- [ ] Custom security check catches dangerous patterns

---

## Learn More

- [Pre-Commit Hooks README](../README.md)
- [Setup Pre-Commit prompt](../prompts/setup-pre-commit.md)
- [Environment Variables](../../06-secure-coding/env-secrets-management.md)
- [Supply Chain Security](../../05-supply-chain-security/README.md)
