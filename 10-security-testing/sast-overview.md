# SAST (Static Application Security Testing)

SAST analyses your source code without running it. It finds security issues — potential injections, hardcoded secrets, unsafe functions — before they go to production.

---

## What SAST Finds

- SQL injection patterns
- Hardcoded credentials
- Insecure cryptography (MD5, SHA1 for passwords)
- Use of dangerous functions (eval, exec with user input)
- Missing security headers
- Cross-site scripting (XSS) patterns
- Path traversal risks
- Known vulnerable code patterns

SAST does NOT find:
- Runtime misconfiguration
- Logic-level authorisation flaws
- Most business logic vulnerabilities

Use SAST + DAST + manual testing for full coverage.

---

## Semgrep (Recommended)

Semgrep is free, fast, and has excellent security rule sets.

### Setup in GitHub Actions

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/javascript
            p/typescript
            p/nodejs
          publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}  # optional, for dashboard
```

### Run Locally

```bash
pip install semgrep

# Run against your project
semgrep --config=p/security-audit --config=p/owasp-top-ten .

# JavaScript/TypeScript specific
semgrep --config=p/javascript --config=p/typescript .

# Python specific
semgrep --config=p/python .
```

---

## ESLint Security Plugin (JavaScript/TypeScript)

```bash
npm install --save-dev eslint-plugin-security
```

```javascript
// .eslintrc.json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-eval-with-expression": "error",
    "security/detect-child-process": "warn"
  }
}
```

---

## Bandit (Python)

```bash
pip install bandit

# Scan your Python project
bandit -r . -f txt -o bandit-report.txt

# With severity threshold
bandit -r . --severity-level medium
```

Common Bandit findings:
- B307: Use of `eval` — dangerous
- B501: SSL context without verification
- B601: Shell injection via paramiko
- B106: Hardcoded password function arguments

---

## CodeQL (GitHub — Free for Open Source)

```yaml
# .github/workflows/codeql.yml
name: CodeQL

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript, python  # or your languages
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

CodeQL is deeper than Semgrep — it models data flow through your application to find more complex vulnerabilities.

---

## SAST Tools Comparison

| Tool | Languages | Free? | Depth | Speed |
|------|----------|-------|-------|-------|
| **Semgrep** | All major | Yes | Pattern-based | Fast |
| **ESLint Security** | JS/TS | Yes | Pattern-based | Fast |
| **Bandit** | Python | Yes | Pattern-based | Fast |
| **CodeQL** | Most | Free for OSS | Deep (data flow) | Slow |
| **Snyk Code** | Most | Limited free | Deep | Medium |
| **SonarQube** | Most | Free community | Deep | Slow |

---

## CI Integration Best Practices

```yaml
# Only block on high-severity findings; warn on medium
semgrep:
  severity: ERROR  # or WARNING
  
# Never block CI on low severity — it creates alert fatigue
```

---

## Checklist

- [ ] SAST tool running in CI on every PR
- [ ] High-severity findings block merge
- [ ] Medium findings reviewed and triaged
- [ ] Findings tracked and not ignored indefinitely

---

## Learn More

- [Run SAST Scan prompt](./prompts/run-sast-scan.md)
- [Pre-commit hooks: Semgrep](../01-pre-commit-hooks/hooks/semgrep.md)
- [CVE Awareness: Dependency Scanning](../04-cve-awareness/dependency-scanning.md)
