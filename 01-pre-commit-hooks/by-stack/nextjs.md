# Next.js: Pre-Commit Hook Setup

**30-second summary:** Next.js projects need security checks for both frontend (React) and backend (Node.js/API routes). This guide shows how to configure pre-commit hooks for secrets, static analysis, and dependency scanning in a Next.js app, plus handling of environment files (`.env`, `.env.local`) that commonly leak secrets.

## Next.js Security Challenges

### What's At Risk in Next.js
1. **API routes** expose backend logic and database queries
2. **Environment variables** leaked in `.next/` build directory
3. **Third-party packages** (npm dependencies)
4. **Client-side secrets** accidentally exposed
5. **Database credentials** hardcoded in `pages/api/`

### Example Vulnerabilities
```javascript
// ✗ Secrets in getServerSideProps
export async function getServerSideProps() {
  const db = await mongoose.connect(
    "mongodb+srv://admin:hardcoded_password@cluster.mongodb.net/db"
  );
}

// ✗ API keys in environment not handled
export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  // If STRIPE_SECRET is logged, it's exposed!
}

// ✗ Secrets in .env.local (often committed)
NEXT_PUBLIC_API_KEY=sk_live_9fdsf9sdfsdf  # Should not be PUBLIC

// ✓ Safe
const db = await mongoose.connect(process.env.DB_URL);
// Environment variable is not hardcoded
```

## Setup: Complete .pre-commit-config.yaml for Next.js

```yaml
# Pre-commit configuration for Next.js projects
# Place in repository root: .pre-commit-config.yaml

default_stages: [commit]
fail_fast: false

repos:
  # ============================================================================
  # GITLEAKS: Catch hardcoded secrets before commit
  # ============================================================================
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
        name: Detect secrets (gitleaks)
        description: Scans for hardcoded API keys, DB passwords, tokens
        entry: gitleaks protect --verbose
        language: golang
        stages: [commit]
        pass_filenames: false
        always_run: true


  # ============================================================================
  # DETECT-SECRETS: Regex baseline for known secrets
  # ============================================================================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        name: Detect secrets (baseline)
        description: Catches hardcoded passwords, API keys, tokens
        args: ['--baseline', '.secrets.baseline']
        exclude: |
          (?x)^(
            package-lock.json|
            yarn.lock|
            pnpm-lock.yaml
          )$


  # ============================================================================
  # NPM-AUDIT: Dependency vulnerability scanning
  # ============================================================================
  - repo: https://github.com/pre-commit/mirrors-npm
    rev: v10.2.4
    hooks:
      - id: npm-audit
        name: NPM audit (dependencies)
        description: Checks for known CVEs in npm packages
        files: ^package\.json$
        entry: bash -c 'npm audit --audit-level=moderate --omit=dev'
        language: node
        stages: [commit]
        pass_filenames: false


  # ============================================================================
  # ESLINT: JavaScript/TypeScript linting (optional)
  # ============================================================================
  # Catches common bugs, security issues in JS/TS
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.54.0
    hooks:
      - id: eslint
        name: ESLint (code quality)
        description: Checks JavaScript/TypeScript for bugs
        types: [javascript, typescript]
        entry: bash -c 'npm run lint --'
        language: node
        stages: [commit]
        # Skip if no .eslintrc
        files: |
          (?x)^(
            src/|
            pages/|
            app/|
            .*\.ts$|
            .*\.tsx$|
            .*\.js$|
            .*\.jsx$
          )


  # ============================================================================
  # PRETTIER: Code formatting (optional)
  # ============================================================================
  # Auto-formats JavaScript, TypeScript, JSON, CSS, Markdown
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        name: Prettier (code formatting)
        description: Auto-formats code
        types_or: [javascript, typescript, json, yaml, markdown]


  # ============================================================================
  # YAML VALIDATION: Check config files
  # ============================================================================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        name: Validate YAML
        description: Checks YAML files for syntax errors
        args: ['--unsafe']

      - id: check-json
        name: Validate JSON
        description: Checks JSON files for syntax errors

      - id: check-toml
        name: Validate TOML
        description: Checks TOML files for syntax errors

      - id: trailing-whitespace
        name: Remove trailing whitespace

      - id: end-of-file-fixer
        name: Fix end-of-file-fixer

      - id: check-added-large-files
        name: Detect large files
        args: ['--maxkb=5000']

      - id: check-merge-conflict
        name: Detect merge conflicts


  # ============================================================================
  # CI-ONLY HOOKS (Comment out; use in CI/CD instead)
  # ============================================================================
  # These are slow; run in CI pipeline, not pre-commit

  # SEMGREP: Static analysis for vulnerabilities
  # - repo: https://github.com/returntocorp/semgrep
  #   rev: v1.45.0
  #   hooks:
  #     - id: semgrep
  #       name: Semgrep (static analysis)
  #       entry: semgrep --config=p/owasp-top-ten --config=p/nodejs
  #       language: python
  #       types: [javascript, typescript]
  #       pass_filenames: false

  # TRUFFLEHOG: Deep entropy scanning
  # - repo: https://github.com/trufflesecurity/trufflehog
  #   rev: v3.63.0
  #   hooks:
  #     - id: trufflehog
  #       name: Trufflehog (entropy scan)
  #       entry: trufflehog filesystem . --json --fail
  #       language: python
  #       pass_filenames: false
```

## Key Files to Protect

### 1. Environment Files (.env.local, .env.production)

These should NEVER be committed:

```bash
# .gitignore (ensure these exist)
.env
.env.local
.env.*.local
.env.production
.env.production.local
.env.test
.env.development
.env.staging
```

**Pre-commit hook to prevent .env files:**

Add to `.pre-commit-config.yaml`:

```yaml
# Prevent .env files from being committed
- repo: https://github.com/pre-commit/pre-commit-hooks
  rev: v4.5.0
  hooks:
    - id: check-env-file
      name: Check .env files not committed
      entry: bash -c 'if [[ $(git diff --cached --name-only) =~ \.env ]]; then echo "ERROR: .env file staged for commit!"; exit 1; fi'
      language: bash
      stages: [commit]
      pass_filenames: false
```

### 2. next.config.js

Common secrets in Next.js config:

```javascript
// ✗ Bad: Secrets in next.config.js
module.exports = {
  env: {
    STRIPE_SECRET_KEY: 'sk_live_9fdsf9sdfsdf'  // This gets built into client!
  }
}

// ✓ Good: Use .env.local (git-ignored)
// .env.local
// NEXT_PUBLIC_STRIPE_KEY=pk_live_xxx (only public key)
// STRIPE_SECRET_KEY=sk_live_xxx (never in next.config.js)
```

### 3. API Routes (pages/api/)

Secure API routes:

```javascript
// ✗ Bad: Query string with secrets
export default function handler(req, res) {
  const apiKey = req.query.key;  // Key exposed in logs
}

// ✓ Good: Headers or Authorization
export default function handler(req, res) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) return res.status(401).end();
}
```

### 4. Middleware and Auth

```typescript
// ✓ Good: Secure token verification
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  try {
    const { payload } = await jwtVerify(token, secret);
    // Proceed
  } catch (e) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
```

## Pre-Commit Initialize (First Time)

```bash
# 1. Navigate to Next.js project
cd my-nextjs-app

# 2. Install pre-commit framework
pip install pre-commit

# 3. Create .pre-commit-config.yaml (copy above)
cp .pre-commit-config.yaml .

# 4. Initialize baseline for detect-secrets
detect-secrets scan --all-files > .secrets.baseline

# 5. Install hooks
pre-commit install

# 6. Run on all files (check existing code)
pre-commit run --all-files

# 7. Fix any issues, then commit
git add .pre-commit-config.yaml .secrets.baseline
git commit -m "Add pre-commit security hooks"
```

## Environment Variables: Best Practices

### Three Categories of Env Vars

```bash
# 1. Public (frontend): Prefix with NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=UA-123456789

# 2. Secret (backend only): No prefix
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_xxx
JWT_SECRET=super_secret_key

# 3. Build-time public: In next.config.js
// next.config.js
module.exports = {
  env: {
    // Avoid this; use .env.local instead
  }
}
```

### .env.local Example

```bash
# .env.local (git-ignored)
# Public API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Backend secrets (not sent to client)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
STRIPE_SECRET_KEY=sk_live_9fdsf9sdfsdf
JWT_SECRET=your_jwt_secret_here
GITHUB_TOKEN=ghp_xxx

# API keys
SENDGRID_API_KEY=SG.xxx
OPENAI_API_KEY=sk-xxx

# Twilio (if used)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# AWS (if used)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Secrets in package.json

Gitleaks will catch these:

```json
{
  "scripts": {
    "build": "STRIPE_KEY=sk_live_xxx next build"  // CAUGHT!
  }
}
```

## Example: Catching Real Secrets

### Test secret gets caught
```bash
# 1. Create test.js with secret
echo "const API_KEY = 'sk_live_9fdsf9sdfsdf';" > pages/api/test.js

# 2. Stage changes
git add pages/api/test.js

# 3. Try to commit
git commit -m "Add test"

# Output:
# gitleaks: Found secret in: pages/api/test.js
# Ensure this is not sensitive data.
# Exit code 1 (commit failed)

# 4. Remove secret, try again
git reset pages/api/test.js
rm pages/api/test.js
git commit -m "Remove test"  # Success!
```

## CI Integration for Next.js

### GitHub Actions Example

```yaml
name: Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install pre-commit
        run: pip install pre-commit

      - name: Run pre-commit hooks
        run: pre-commit run --all-files

      - name: Run ESLint
        run: npm run lint

      - name: Build Next.js
        run: npm run build

      - name: Semgrep SAST (slower, CI-only)
        run: |
          pip install semgrep
          semgrep --config=p/owasp-top-ten --config=p/nodejs --fail .
        continue-on-error: true
```

## Troubleshooting

### Hook says: ".env file is committed"
```bash
# Solution: Remove from git, add to .gitignore
git rm --cached .env.local
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Remove .env from git"
```

### npm-audit fails on dev dependency
```bash
# Solution: Update pre-commit to omit dev
entry: bash -c 'npm audit --audit-level=moderate --omit=dev'
```

### ESLint hook not running
```bash
# Solution: Ensure eslint script exists in package.json
{
  "scripts": {
    "lint": "eslint --max-warnings=0 ."
  }
}

# Then reinstall hooks
pre-commit install
```

### Large build artifacts slow hooks
```bash
# Solution: Exclude .next/ and node_modules/
# Add to .pre-commit-config.yaml
exclude: |
  (?x)^(
    \.next/|
    node_modules/|
    out/
  )$
```

## Next Steps

1. **Copy .pre-commit-config.yaml** above to your Next.js repo root
2. **Initialize:** `pre-commit install`
3. **Test:** `pre-commit run --all-files`
4. **Fix any issues** (env files, hardcoded secrets, etc.)
5. **Commit hooks config:**
   ```bash
   git add .pre-commit-config.yaml .secrets.baseline
   git commit -m "Add pre-commit security hooks"
   ```
6. **Integrate CI:** Add GitHub Actions workflow
7. **Team on-board:** Share this guide with team

---

**See also:**
- Next.js security best practices: https://nextjs.org/docs/going-to-production/security-checklist
- ESLint Next.js config: https://nextjs.org/docs/app/building-your-application/configuring/eslint
- Environment variables: https://nextjs.org/docs/basic-features/environment-variables
- Parent guide: `../README.md`
- Hook details: `../hooks/gitleaks.md`, `../hooks/npm-audit-hook.md`
