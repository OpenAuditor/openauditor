# Prompt: CI Integration for Pre-Commit Security Checks

## When to use this

Use this when pre-commit hooks run locally but not in CI, or when you want to ensure security checks run on PRs even when a developer bypasses local hooks.

Pre-commit hooks can be bypassed locally with `--no-verify`. The same checks must run in CI as a safety net.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer integrating pre-commit security checks into CI/CD. Local hooks are bypassable — the same checks must run in CI as a mandatory gate.

**Step 1: Identify what runs locally**

Read the pre-commit hooks:
```bash
cat .husky/pre-commit 2>/dev/null
cat .pre-commit-config.yaml 2>/dev/null
cat package.json | grep -A 20 '"lint-staged"'
```

List every check that runs locally. Each one needs a CI equivalent.

**Step 2: Check what's already in CI**

```bash
ls .github/workflows/
# Read each workflow file to understand what currently runs
```

What's already there? What's missing compared to the local hooks?

**Step 3: Create or update the CI security workflow**

Create `.github/workflows/security-checks.yml` that mirrors the local hooks:

```yaml
name: Security Checks

on:
  push:
    branches: [main, master]
  pull_request:

permissions:
  contents: read
  security-events: write

jobs:
  # ===== Secret Scanning =====
  gitleaks:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
        with:
          fetch-depth: 0  # Full history for PR scanning

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@cb7149a9b57195b609c63e8518d2c6ef8e492c33
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml

  # ===== ESLint Security =====
  eslint:
    name: ESLint Security
    runs-on: ubuntu-latest
    if: hashFiles('package.json') != ''
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci --ignore-scripts

      - name: Run ESLint
        run: npx eslint . --max-warnings=0 --format=sarif --output-file=eslint.sarif || true

      - name: Upload ESLint results
        uses: github/codeql-action/upload-sarif@c7f9125735019aa87cfc361530512d50ea439c71
        with:
          sarif_file: eslint.sarif
          category: eslint

  # ===== Dependency Audit =====
  audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    if: hashFiles('package.json') != ''
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci --ignore-scripts

      - name: npm audit (fail on High+)
        run: npm audit --audit-level=high

  # ===== SAST (broader than ESLint) =====
  semgrep:
    name: Semgrep SAST
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - name: Semgrep security scan
        run: |
          semgrep \
            --config=p/security-audit \
            --config=p/owasp-top-ten \
            --sarif \
            --output=semgrep.sarif \
            . || true

      - uses: github/codeql-action/upload-sarif@c7f9125735019aa87cfc361530512d50ea439c71
        with:
          sarif_file: semgrep.sarif
```

**Step 4: Enforce checks before merge**

In GitHub repository settings, add these as required status checks:
- Settings → Branches → main → Branch protection rules
- Add each job as a required status check:
  - `Secret Scan`
  - `ESLint Security`
  - `Dependency Audit`
  - `Semgrep SAST`

This means PRs cannot be merged if any security check fails.

**Step 5: Handle the no-verify bypass case**

Even with `git commit --no-verify` bypassing local hooks, CI catches it:

```yaml
# In every job, this runs regardless of how the commit was made:
on:
  push:
    branches: [main]     # Catches direct pushes
  pull_request:           # Catches all PRs
```

Additionally, protect the main branch from direct pushes:
- Settings → Branches → Require pull request before merging
- This forces all changes through PR (and therefore CI)

**Step 6: Add pre-push hook as a stronger local gate**

A pre-push hook is harder to bypass accidentally than pre-commit:

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running security checks before push..."

# Full npm audit (not just staged files)
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "npm audit failed — fix vulnerabilities before pushing"
  exit 1
fi

# Run tests including security tests
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed — fix before pushing"
  exit 1
fi

echo "Pre-push checks passed."
```

**Step 7: Document the security gate**

Update CONTRIBUTING.md or README.md:
```markdown
## Security Requirements

All PRs must pass automated security checks before merge:
- ✅ No secrets in committed files (Gitleaks)
- ✅ ESLint security rules pass with zero warnings
- ✅ No High/Critical dependency vulnerabilities (npm audit)
- ✅ Semgrep SAST scan clean

If your PR fails a security check:
1. Read the check output for the specific finding
2. Fix the issue in your branch
3. The check will re-run automatically

To bypass a false positive: open an issue explaining why it's a false positive,
then an admin can approve the exception.
```

---

## What to expect

A GitHub Actions workflow that runs all the same security checks as local hooks, configured as required status checks to block PRs from merging when they fail.

## Learn more

[Setup Pre-Commit prompt](./setup-pre-commit.md)
[Security Scan GitHub Action](../../templates/github-actions/security-scan.yml)
[Pre-Commit Hooks README](../README.md)
