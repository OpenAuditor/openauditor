# OWASP ZAP Guide

OWASP ZAP (Zed Attack Proxy) is a free dynamic testing tool that scans your running application for vulnerabilities. Use it against your staging environment before launch.

---

## What ZAP Finds

ZAP discovers:
- Missing security headers
- XSS vulnerabilities
- SQL injection indicators
- Information disclosure
- Insecure configurations
- CSRF vulnerabilities
- Broken auth patterns

ZAP does NOT reliably find:
- Authorisation/IDOR issues (doesn't understand your business logic)
- Complex injection in authenticated flows (needs session management)
- Logic flaws

---

## Installation

```bash
# Option 1: Download from zaproxy.org
# macOS: brew install --cask owasp-zap

# Option 2: Docker (recommended for CI)
docker pull ghcr.io/zaproxy/zaproxy:stable
```

---

## Basic Automated Scan

```bash
# Run a baseline scan against your staging URL
docker run --rm \
  -v $(pwd)/zap-reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t https://staging.yourapp.com \
  -r zap-report.html \
  -l WARN
```

This runs a passive scan — it doesn't attack, just observes and analyses responses.

---

## Full Active Scan (More Thorough)

```bash
# Active scan — actually tests for vulnerabilities
# Only run this against YOUR OWN systems, in a test environment
docker run --rm \
  -v $(pwd)/zap-reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t https://staging.yourapp.com \
  -r zap-full-report.html
```

> **Critical:** Only run active scans against systems you own and have permission to test. Active scanning is aggressive and can cause issues even in test environments.

---

## Authenticated Scanning

To scan authenticated sections of your app:

```yaml
# zap-auth.yaml — ZAP automation script
env:
  contexts:
    - name: "app-authenticated"
      urls:
        - "https://staging.yourapp.com"
      authentication:
        method: "form"
        parameters:
          loginUrl: "https://staging.yourapp.com/api/auth/login"
          loginRequestData: "email=testuser@test.com&password=TestPassword123"
      users:
        - name: "testuser"
          credentials:
            username: "testuser@test.com"
            password: "TestPassword123"
```

```bash
docker run --rm \
  -v $(pwd):/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -cmd -autorun /zap/wrk/zap-auth.yaml
```

---

## In CI/CD (GitHub Actions)

```yaml
# .github/workflows/zap-scan.yml
name: ZAP Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 2am
  workflow_dispatch:

jobs:
  zap:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.11.0
        with:
          target: 'https://staging.yourapp.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-I'
```

---

## Reading ZAP Reports

ZAP rates findings as:
- **High** — fix before launch
- **Medium** — fix within 30 days
- **Low** — review and document

Common findings and what they mean:

| Alert | Risk | What to do |
|-------|------|-----------|
| X-Content-Type-Options header missing | Low | Add `nosniff` header |
| Content-Security-Policy header not set | Medium | Add CSP header |
| X-Frame-Options header not set | Medium | Add `DENY` header |
| Strict-Transport-Security missing | High | Add HSTS header |
| Cookie without Secure flag | Medium | Set Secure on all cookies |
| Application error disclosure | Medium | Fix error handling |
| SQL injection | High | Fix immediately |

---

## Checklist

- [ ] ZAP baseline scan run against staging environment
- [ ] All High findings addressed
- [ ] Medium findings triaged and tracked
- [ ] ZAP scan in CI/CD pipeline (weekly or pre-release)
- [ ] Authenticated scan run for logged-in pages

---

## Learn More

- [DAST Overview](./dast-overview.md)
- [Security Testing README](./README.md)
- [Run SAST Scan prompt](./prompts/run-sast-scan.md)
