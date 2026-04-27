# DAST Overview: Dynamic Application Security Testing

DAST tests your *running application* — probing it from the outside like an attacker would, rather than reading your source code. It finds vulnerabilities that only appear at runtime: configuration mistakes, injection flaws that slip through static analysis, and missing security headers.

---

## 30-Second Summary

SAST reads your code (finds logic errors, dangerous functions). DAST hits your running app (finds what attackers actually can exploit). You need both. DAST is the closer approximation of a real attack — it discovers what's exploitable from the outside, including third-party components and hosting configuration that SAST can't see.

---

## DAST vs. SAST

| | SAST | DAST |
|--|------|------|
| What it tests | Source code | Running application |
| When to run | In CI on every commit | Against staging, pre-release |
| What it finds | Insecure code patterns, dangerous functions | Runtime vulnerabilities, config issues, network-level issues |
| False positive rate | Higher | Lower (only reports actually exploitable issues) |
| Speed | Fast (seconds) | Slow (minutes to hours) |
| Example tools | Semgrep, CodeQL, Bandit | OWASP ZAP, Burp Suite, Nuclei |

---

## DAST Tools

### OWASP ZAP (Free, Open Source)

The most widely used open source DAST tool. Good for:
- Automated baseline scans
- CI/CD integration
- Authenticated scanning
- API testing

See [OWASP ZAP Guide](./owasp-zap-guide.md) for full setup instructions.

### Nuclei (Free, Open Source)

Template-based vulnerability scanner. Extremely fast, community-maintained templates for thousands of known vulnerabilities:

```bash
# Install
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Update templates
nuclei -update-templates

# Basic scan
nuclei -u https://staging.yourapp.com

# Scan with specific template categories
nuclei -u https://staging.yourapp.com -tags cve,misconfig,exposure

# Scan for specific CVEs
nuclei -u https://staging.yourapp.com -tags cve2024,cve2025

# Scan an API
nuclei -u https://api.staging.yourapp.com -tags api

# Output to JSON
nuclei -u https://staging.yourapp.com -json-export nuclei-results.json
```

Nuclei is excellent for:
- CVE scanning (checks for specific known vulnerabilities)
- Misconfiguration detection
- Exposed files and paths (`.env`, `/.git`, `phpinfo.php`)
- Security headers check
- Technology fingerprinting

### Burp Suite (Commercial, Community Edition Free)

The gold standard for manual penetration testing. Community Edition:
- Intercept and modify HTTP/S requests
- Manual testing, no automation limits
- Great for authenticated IDOR testing, business logic flaws

Professional Edition (£449/year):
- Automated scanner
- Active scanning with payloads
- Collaborator for out-of-band testing

Use Burp Suite for:
- Manual penetration testing sessions
- Testing authenticated flows
- Business logic testing that automated tools miss

---

## Running a DAST Scan

### Prerequisites

1. **Target a staging environment** — never run active DAST against production (it generates load, can corrupt data, and may trigger alerts)
2. **Have a test account** — for authenticated scanning
3. **Notify your team** — DAST traffic is distinctive and may trigger alerts
4. **Check your ToS** — if using cloud-hosted staging, your provider may prohibit automated scanning

### Basic Workflow

```bash
# Step 1: Passive scan (safe — just observes, doesn't attack)
docker run --rm \
  -v $(pwd)/reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t https://staging.yourapp.com \
  -r zap-baseline-report.html

# Step 2: Review the baseline findings (fix any obvious issues)

# Step 3: Active scan (more thorough — actually sends attack payloads)
docker run --rm \
  -v $(pwd)/reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t https://staging.yourapp.com \
  -r zap-full-report.html

# Step 4: Nuclei for CVE and misconfiguration scanning
nuclei -u https://staging.yourapp.com -severity medium,high,critical

# Step 5: Review all findings, triage, and fix
```

---

## Authenticated DAST

The most valuable findings come from scanning authenticated sections of your app. IDOR, privilege escalation, and business logic flaws are only discoverable when authenticated.

### ZAP Authenticated Scan

```yaml
# zap-auth.yaml — saved as a ZAP automation plan
env:
  contexts:
    - name: "authenticated-app"
      urls:
        - "https://staging.yourapp.com"
      authentication:
        method: "json"
        parameters:
          loginUrl: "https://staging.yourapp.com/api/auth/login"
          loginRequestData: '{"email":"test@example.com","password":"TestPass123!"}'
          loginPageUrl: "https://staging.yourapp.com/login"
        verification:
          method: "response"
          loggedInRegex: '"user":\{"id"'
          loggedOutRegex: '"error":"Unauthorised"'
      users:
        - name: "standard-user"
          credentials:
            username: "test@example.com"
            password: "TestPass123!"
        - name: "admin-user"  
          credentials:
            username: "admin@example.com"
            password: "AdminPass456!"
  
jobs:
  - type: spider
    parameters:
      maxDuration: 10
  - type: activeScan
    parameters:
      maxDuration: 60
  - type: report
    parameters:
      reportDir: "/zap/wrk"
      reportFile: "authenticated-scan-report.html"
```

```bash
docker run --rm \
  -v $(pwd):/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -cmd -autorun /zap/wrk/zap-auth.yaml
```

---

## API DAST

For REST APIs, generate an OpenAPI spec and use it as the scan target:

```bash
# ZAP API scan using OpenAPI spec
docker run --rm \
  -v $(pwd)/reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t https://staging.yourapp.com/api/openapi.json \
  -f openapi \
  -r api-scan-report.html

# Or use the API spec directly
zap-api-scan.py \
  -t api-definition.yaml \
  -f openapi \
  -r api-scan-report.html
```

---

## Interpreting DAST Results

DAST results are generally more reliable than SAST (fewer false positives) — but still require triage.

**High confidence findings (fix immediately):**
- Missing security headers (X-Frame-Options, CSP, HSTS) — easy to verify
- SQL injection confirmed by altered database responses
- XSS confirmed by reflected payload execution
- Open redirects confirmed by following redirect
- Exposed sensitive files (`.env`, `/.git/config`)

**Medium confidence findings (verify manually):**
- Potential injection points flagged but not confirmed
- Error messages that may contain version info
- Suspicious parameters or response patterns

**Low confidence / false positives (document and dismiss):**
- False SQL injection alerts on pages that don't query a database
- XSS alerts on properly escaped content
- "Missing CSP" when you've set it via middleware (some scanners miss server-sent headers)

---

## CI/CD Integration

Run DAST in CI on a weekly schedule or pre-release, not on every commit (it's too slow):

```yaml
# .github/workflows/dast.yml
name: DAST Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly, Monday 2am
  workflow_dispatch:      # Manual trigger

jobs:
  zap-baseline:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.11.0
        with:
          target: ${{ secrets.STAGING_URL }}
          rules_file_name: '.zap/rules.tsv'
          
      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        with:
          name: zap-report
          path: report_html.html
```

---

## Audit Checklist

- [ ] DAST scan run against staging environment before last release
- [ ] Both passive and active scans completed
- [ ] Authenticated scan run for logged-in functionality
- [ ] API endpoints scanned with OpenAPI spec
- [ ] All High/Critical findings remediated
- [ ] Medium findings triaged and tracked
- [ ] DAST integrated into CI/CD (weekly or pre-release)
- [ ] ZAP or Nuclei scan results reviewed by a human (not just passed/failed)

---

## Learn More

- [OWASP ZAP Guide](./owasp-zap-guide.md)
- [SAST Overview](./sast-overview.md)
- [Manual Testing Guide](./manual-testing-guide.md)
- [Run SAST Scan prompt](./prompts/run-sast-scan.md)
