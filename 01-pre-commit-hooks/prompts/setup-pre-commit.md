# Prompt: Set Up Pre-Commit Security Hooks

## When to use this

Use this when starting a new project, or when joining a project that has no pre-commit hooks. Hooks are your last line of defence before code reaches the repository.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer setting up pre-commit hooks to prevent security issues from reaching the repository.

**Step 1: Identify the stack and existing tooling**

```bash
# Check what's already in place
cat package.json | grep -E '"husky|pre-commit|lint-staged|gitleaks"' 2>/dev/null
ls -la .husky/ 2>/dev/null
cat .pre-commit-config.yaml 2>/dev/null
cat .gitleaks.toml 2>/dev/null
```

What language/framework is this project using? (Node.js, Python, Go?)
Is Husky already installed? What linting is in place?

**Step 2: Install and configure Husky (Node.js) or pre-commit (Python/universal)**

**For Node.js projects:**
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**For Python or mixed projects:**
```bash
pip install pre-commit
pre-commit install
```

**Step 3: Configure secret scanning**

Install gitleaks and create a configuration:

```toml
# .gitleaks.toml
title = "Security Scan"

[[rules]]
description = "AWS Access Key"
id = "aws-access-key"
regex = '''AKIA[0-9A-Z]{16}'''

[[rules]]
description = "Generic Secret Key"
id = "generic-secret"
regex = '''(?i)(secret|password|passwd|api.?key)\s*[:=]\s*["']?[a-zA-Z0-9/+]{20,}'''

[[rules]]
description = "Private Key"
id = "private-key"
regex = '''-----BEGIN (RSA|EC|OPENSSH)? ?PRIVATE KEY'''

[allowlist]
paths = [
  '''.env.example''',
  '''\.gitleaks\.toml''',
]
regexes = [
  '''your[-_]secret[-_]here''',
  '''PLACEHOLDER''',
  '''replace[-_]me''',
]
```

Add to the pre-commit hook:
```bash
# .husky/pre-commit
gitleaks protect --staged --config=.gitleaks.toml
if [ $? -ne 0 ]; then
  echo "Secret detected in staged files. Remove it before committing."
  exit 1
fi
```

**Step 4: Configure ESLint security rules (Node.js)**

```bash
npm install --save-dev eslint-plugin-security
```

Add to ESLint config:
```javascript
// eslint.config.mjs
import security from 'eslint-plugin-security';

export default [
  security.configs.recommended,
  {
    rules: {
      'security/detect-eval-with-expression': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
    }
  }
];
```

**Step 5: Add .env protection**

Add to the pre-commit hook:
```bash
# Prevent .env files from being committed
if git diff --cached --name-only | grep -qE '^\.env($|\.)'; then
  echo "ERROR: .env file staged for commit!"
  echo "Run: git reset HEAD .env"
  exit 1
fi
```

Verify .gitignore includes:
```
.env
.env.local
.env.*.local
*.pem
*.key
```

**Step 6: Set up lint-staged (run only on changed files)**

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,yaml,yml}": [
      "prettier --write"
    ]
  }
}
```

**Step 7: Add Semgrep to CI (not pre-commit — too slow)**

Create `.github/workflows/security-scan.yml` with Semgrep configured to run on every PR. See [Security Scan template](../../templates/github-actions/security-scan.yml).

**Step 8: Test the hooks**

```bash
# Test secret detection
echo 'API_KEY=AKIAIOSFODNN7EXAMPLE' > test-secret.txt
git add test-secret.txt
git commit -m "test"
# Should fail with: Secret detected

# Clean up
git reset HEAD test-secret.txt
rm test-secret.txt

# Test .env protection
echo 'SECRET=test' > .env
git add .env
git commit -m "test"
# Should fail: .env staged

git reset HEAD .env
```

**Step 9: Document in README**

Add a section to README.md explaining:
1. Pre-commit hooks are installed via `npm install` (Husky's `prepare` script)
2. What the hooks check
3. How to bypass in an emergency (and that you should never bypass for security reasons)

---

## What to expect

Husky installed with pre-commit hooks running: secret scanning (gitleaks), ESLint security rules, .env protection, and CI-based SAST. All hooks tested and passing.

## Learn more

[Pre-Commit Hooks README](../README.md)
[Node.js Stack Guide](../by-stack/node-express.md)
[Security Scan GitHub Action](../../templates/github-actions/security-scan.yml)
