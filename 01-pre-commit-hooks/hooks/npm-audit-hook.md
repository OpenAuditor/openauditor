# npm-audit-hook: Dependency Vulnerability Scanning

**30-second summary:** npm-audit-hook scans npm/yarn/pnpm dependencies for known CVEs (Common Vulnerabilities and Exposures) before they're committed. It prevents vulnerable packages from reaching production by failing commits when security issues are detected in `package.json` or `package-lock.json`.

## What It Detects

### Dependency Vulnerabilities
- Known CVEs in npm packages
- Outdated versions with security patches available
- Transitive dependencies (indirect package dependencies)
- High/Critical severity issues by default
- Optional: dev dependency vulnerabilities

### Real Examples
```json
// ✓ Caught
{
  "dependencies": {
    "express": "2.5.11"  // CVE-2022-24999: Prototype Pollution
  }
}

// ✓ Caught
{
  "dependencies": {
    "lodash": "4.17.19"  // CVE-2021-23337: Code Injection
  }
}

// ✗ Safe
{
  "dependencies": {
    "express": "4.18.2"  // Latest patch
  }
}
```

## Why Use npm-audit-hook?

| Feature | npm-audit-hook | Snyk | npm-audit (manual) |
|---------|---|---|---|
| Speed | Medium (1-3s) | Slow (5-30s) | Manual |
| Accuracy | 100% (known CVEs) | 100% | 100% |
| Setup | Simple (pre-commit) | Cloud account | Manual check |
| Dev deps | Optional (can omit) | Always checks | Always checks |
| Lock file scanning | ✓ Yes | ✓ Yes | ✓ Yes |
| Transitive deps | ✓ Yes | ✓ Yes | ✓ Yes |
| Fix suggestions | ✗ No | ✓ Yes | ✓ Limited |
| Cost | Free | Free/paid | Free |

**When to use npm-audit-hook:**
- Node.js/JavaScript projects with dependencies
- Want automated checks before commit
- Free alternative to Snyk
- Prevent vulnerable packages reaching git

**When to use Snyk instead:**
- Want detailed fix suggestions and remediation
- Need commercial support
- Want container/infrastructure scanning too
- Enterprise security dashboard needed

## Installation

### Prerequisites
- Node.js 12+ with npm/yarn/pnpm
- Python (for pre-commit framework)
- git

### Install pre-commit framework
```bash
pip install pre-commit
```

### Verify npm is available
```bash
npm --version
npm audit --version
```

## Quick Start

### 1. Add to pre-commit hooks

In `.pre-commit-config.yaml`:

```yaml
- repo: https://github.com/pre-commit/mirrors-npm
  rev: v10.2.4
  hooks:
    - id: npm-audit
      name: NPM audit (dependency security)
      files: ^package\.json$
      entry: bash -c 'npm audit --audit-level=moderate'
      language: node
      stages: [commit]
      pass_filenames: false
```

### 2. Install hooks
```bash
pre-commit install
```

### 3. Now commits are checked
```bash
npm install express@2.5.11  # Vulnerable version
git add package.json package-lock.json
git commit -m "Add vulnerable express"

# Output:
# npm audit: 1 vulnerability found
# moderate severity, npm audit fails commit
```

## How It Works

### Audit Process
1. **Read package.json** and package-lock.json (or yarn.lock)
2. **Check npm registry** for known CVEs for each dependency
3. **Identify vulnerabilities** by severity and type
4. **Report findings:**
   - Package name
   - Current version
   - Vulnerable version range
   - Fix: recommended version
   - CVE ID and description
5. **Fail or pass** based on audit level

### Severity Levels

| Level | Fail? | Examples |
|-------|-------|----------|
| CRITICAL | ✓ Always | Remote code execution, arbitrary file upload |
| HIGH | ✓ Default | SQL injection, auth bypass, XSS |
| MODERATE | ✓ With flag | Denial of service, information disclosure |
| LOW | ✗ Ignored | Minor issues, defense-in-depth |

## Configuration

### Basic .pre-commit-config.yaml
```yaml
- repo: https://github.com/pre-commit/mirrors-npm
  rev: v10.2.4
  hooks:
    - id: npm-audit
      name: NPM audit
      files: ^package\.json$
      entry: bash -c 'npm audit --audit-level=moderate'
      language: node
      stages: [commit]
      pass_filenames: false
```

### Strict (CRITICAL and HIGH only)
```yaml
- id: npm-audit
  name: NPM audit (strict)
  files: ^package\.json$
  entry: bash -c 'npm audit --audit-level=high'
  language: node
  stages: [commit]
  pass_filenames: false
```

### Permissive (CRITICAL only)
```yaml
- id: npm-audit
  name: NPM audit (critical only)
  files: ^package\.json$
  entry: bash -c 'npm audit --audit-level=critical'
  language: node
  stages: [commit]
  pass_filenames: false
```

### Exclude dev dependencies
```yaml
- id: npm-audit
  name: NPM audit (prod only)
  files: ^package\.json$
  entry: bash -c 'npm audit --audit-level=moderate --omit=dev'
  language: node
  stages: [commit]
  pass_filenames: false
```

### Yarn project
```yaml
- id: yarn-audit
  name: Yarn audit
  files: ^package\.json$
  entry: bash -c 'yarn audit --level=moderate'
  language: node
  stages: [commit]
  pass_filenames: false
```

### pnpm project
```yaml
- id: pnpm-audit
  name: pnpm audit
  files: ^package\.json$
  entry: bash -c 'pnpm audit --audit-level=moderate'
  language: node
  stages: [commit]
  pass_filenames: false
```

## Usage Examples

### Check current vulnerabilities
```bash
npm audit
```

**Output example:**
```
┌───────────────────────────────────────────────────────┐
│ 3 vulnerabilities found                               │
├───────────────────────────────────────────────────────┤
│ High  │ Prototype Pollution                           │
│ ~2.5.11 │ express <4.17.1                            │
│ fix: npm install express@4.17.1                      │
├───────────────────────────────────────────────────────┤
│ Moderate │ Denial of Service                         │
│ lodash <4.17.21                                       │
│ fix: npm install lodash@4.17.21                      │
└───────────────────────────────────────────────────────┘
```

### Audit with severity filter
```bash
npm audit --audit-level=high
```

Only fails if HIGH or CRITICAL vulnerabilities found.

### Audit without dev dependencies
```bash
npm audit --omit=dev
```

Ignores vulnerabilities in devDependencies (testing libraries, etc.)

### Generate audit report
```bash
npm audit --json > audit-report.json
```

### Try to fix automatically
```bash
npm audit fix
```

Automatically updates packages to patched versions.

### Try to fix only direct dependencies
```bash
npm audit fix --depth=0
```

## Performance

| Scenario | Time |
|----------|------|
| First audit (npm installs packages) | 5-30s |
| Pre-commit check (cached) | 1-3s |
| Large project (1000 packages) | 2-5s |

**Optimize for speed:**
```bash
# Cache node_modules between runs
npm ci --prefer-offline --no-audit

# Then audit is fast
npm audit --audit-level=moderate
```

## Common Vulnerabilities Found

### Express.js
```bash
# CVE-2022-24999: Prototype Pollution
npm install express@4.18.2  # Fixed version
```

### Lodash
```bash
# CVE-2021-23337: Code Injection
npm install lodash@4.17.21  # Fixed version
```

### Axios
```bash
# CVE-2021-3749: Prototype Pollution
npm install axios@0.21.2  # Fixed version
```

### ws (WebSocket)
```bash
# CVE-2021-32640: DoS
npm install ws@8.2.3  # Fixed version
```

## CI Integration

### GitHub Actions
```yaml
- name: Install dependencies
  run: npm ci

- name: Audit dependencies
  run: npm audit --audit-level=moderate
```

### GitLab CI
```yaml
npm-audit:
  image: node:18
  script:
    - npm ci
    - npm audit --audit-level=moderate
```

### Jenkins
```groovy
stage('NPM Audit') {
  steps {
    sh 'npm ci'
    sh 'npm audit --audit-level=moderate'
  }
}
```

## Troubleshooting

### "npm audit: WARN invalid: remove old versions"
```bash
# Solution: Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm audit
```

### Audit fails for dev-only packages
```bash
# Solution: Exclude dev dependencies
npm audit --audit-level=moderate --omit=dev

# Or: Update pre-commit config
entry: bash -c 'npm audit --audit-level=moderate --omit=dev'
```

### False positive (vulnerability in test library only)
```bash
# Solution: Move to devDependencies
npm install --save-dev vulnerable-package

# Or: Accept and document
# Create .audit-allowlist (custom):
# vulnerable-package@1.0.0: CVE-2021-xxxx (false positive)
```

### npm audit too slow
```bash
# Solution: Run in CI only, not pre-commit
# Comment out from .pre-commit-config.yaml
# Add to GitHub Actions workflow

# Or: Use npm ci instead of npm install
npm ci --prefer-offline

# Then audit is cached and fast
npm audit --audit-level=moderate
```

### "No matching version found"
```bash
# Solution: npm registry may be down
npm audit --offline

# Or: Check network
npm ping
```

## Audit Levels Explained

### CRITICAL (Always fail)
- Remote code execution (RCE)
- Arbitrary file upload/download
- SQL injection with remote execution
- Authentication bypass
- Confidentiality breach (large data leak)

### HIGH (Default with --audit-level=high)
- SQL injection, XSS, CSRF
- Denial of service (DoS)
- Authentication weakening
- Privilege escalation
- Information disclosure (sensitive data leak)

### MODERATE (Default with --audit-level=moderate)
- Denial of service (minor)
- Information disclosure (minor)
- Prototype pollution (defense-in-depth)
- Regex DoS

### LOW (Only with --audit-level=low)
- Minor issues
- Defense-in-depth concerns
- Theoretical vulnerabilities

## When to Use npm-audit vs Snyk vs Manual

### Use npm-audit-hook if:
- Node.js/JavaScript project
- Want free, built-in solution
- Automated pre-commit checks sufficient
- Simple severity filtering enough

### Use Snyk instead if:
- Need detailed remediation guidance
- Want container/infrastructure scanning
- Enterprise dashboard needed
- Commercial support required

### Use both if:
- npm-audit in pre-commit (fast, local)
- Snyk in CI (detailed reports, suggestions)
- Maximum coverage desired

## Next Steps

1. **Add to .pre-commit-config.yaml:** Copy config above
2. **Install hooks:** `pre-commit install`
3. **Test:** `npm install vulnerable@version && git add . && git commit`
4. **For CI:** Add npm audit step to GitHub Actions/GitLab CI
5. **Integrate with Snyk** for detailed reports (optional)

---

**See also:**
- Official npm audit docs: https://docs.npmjs.com/cli/v10/commands/npm-audit
- Compare with Snyk: https://snyk.io/
- CI integration guide: `../ci-integration.md`
- Other hooks: `../hooks/gitleaks.md`, `../hooks/semgrep.md`
