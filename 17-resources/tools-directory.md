# Security Tools Directory

A categorised reference of security tools developers actually use. Each entry covers what the tool does, whether a free tier exists, and its official link. Limitations are noted honestly.

---

## Static Application Security Testing (SAST)

Tools that analyse source code without executing it.

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Semgrep** | Pattern-based static analysis; supports 30+ languages; custom rules via YAML | Yes (OSS + free cloud tier) | https://semgrep.dev |
| **CodeQL** | Deep semantic analysis; powers GitHub Advanced Security; strong for Java, C++, Python, JS | Yes (free for public repos via GitHub) | https://codeql.github.com |
| **Bandit** | Python-specific SAST; flags common issues (SQL injection, shell injection, hardcoded secrets) | Yes (open source) | https://bandit.readthedocs.io |
| **ESLint (security plugins)** | JS/TS linting with `eslint-plugin-security` for injection, regex DoS, unsafe eval | Yes (open source) | https://github.com/eslint-community/eslint-plugin-security |
| **Brakeman** | Rails-specific SAST; very fast on large Ruby codebases | Yes (open source) | https://brakemanscanner.org |
| **SonarQube Community** | Multi-language SAST with a web dashboard; community edition is self-hosted | Yes (community edition) | https://www.sonarsource.com/products/sonarqube/ |
| **Snyk Code** | AI-assisted SAST; integrates into IDE and CI; good fix suggestions | Yes (limited free tier) | https://snyk.io/product/snyk-code/ |
| **Flawfinder** | C/C++ scanner; quick to run; limited depth but useful for legacy codebases | Yes (open source) | https://dwheeler.com/flawfinder/ |

**Limitations to know:** SAST tools produce false positives. Treat results as a triage list, not gospel. SonarQube community edition lacks taint analysis (available in commercial tiers only).

---

## Dynamic Application Security Testing (DAST)

Tools that probe a running application from the outside.

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **OWASP ZAP** | Full-featured web app scanner; active and passive scanning; scriptable | Yes (open source) | https://zaproxy.org |
| **Burp Suite Community** | Industry-standard proxy for manual and automated testing; Community edition lacks scanner automation | Yes (Community edition) | https://portswigger.net/burp |
| **Nuclei** | Template-based vulnerability scanner; huge community template library; very fast | Yes (open source) | https://nuclei.projectdiscovery.io |
| **Nikto** | Web server scanner; checks for outdated software, misconfigurations, 6700+ known issues | Yes (open source) | https://github.com/sullo/nikto |
| **w3af** | Python-based web application attack and audit framework | Yes (open source) | https://w3af.org |
| **OWASP Amass** | Attack surface discovery; DNS enumeration, subdomain discovery | Yes (open source) | https://github.com/owasp-amass/amass |

**Limitations to know:** DAST requires a running target — not suitable for pre-deployment. Burp Suite Community cannot save projects or run automated scans; the Pro licence costs ~$449/year.

---

## Secret Scanners

Tools that detect accidentally committed credentials, API keys, and tokens.

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Gitleaks** | Scans git history and working tree for secrets; pre-commit and CI-friendly | Yes (open source) | https://gitleaks.io |
| **Trufflehog** | Entropy-based and regex secret detection; scans git, S3, Slack, Jira and more | Yes (open source) | https://github.com/trufflesecurity/trufflehog |
| **detect-secrets** | Yelp's pre-commit tool; maintains a baseline file to avoid repeated alerts | Yes (open source) | https://github.com/Yelp/detect-secrets |
| **git-secrets** | AWS Labs tool; blocks commits with AWS keys or patterns you define | Yes (open source) | https://github.com/awslabs/git-secrets |
| **GitHub Secret Scanning** | Built into GitHub; alerts on 100+ partner token patterns; push protection available | Yes (free for public repos; GHAS for private) | https://docs.github.com/en/code-security/secret-scanning |
| **GitGuardian** | Real-time monitoring of public and private repos; developer-friendly dashboard | Yes (free for public repos) | https://gitguardian.com |

**Limitations to know:** No tool catches 100% of secrets. Custom internal tokens require custom rules. Always combine with pre-commit hooks so secrets never reach the remote.

---

## Dependency / Software Composition Analysis (SCA)

Tools that audit third-party packages for known vulnerabilities.

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **npm audit** | Built into npm; checks Node.js deps against npm advisory database | Yes (built-in) | https://docs.npmjs.com/cli/v10/commands/npm-audit |
| **pip-audit** | Python equivalent of npm audit; uses OSV and PyPI advisory data | Yes (open source) | https://pypi.org/project/pip-audit/ |
| **OWASP Dependency-Check** | Java/JVM-focused but supports many ecosystems; generates HTML/XML reports | Yes (open source) | https://owasp.org/www-project-dependency-check/ |
| **Snyk Open Source** | Deep SCA with fix PRs; integrates with GitHub, GitLab, Bitbucket | Yes (limited free tier) | https://snyk.io/product/open-source-security-management/ |
| **Dependabot** | GitHub-native; auto-opens PRs to update vulnerable deps | Yes (free on GitHub) | https://docs.github.com/en/code-security/dependabot |
| **OSV-Scanner** | Google's scanner using the Open Source Vulnerabilities database; supports lock files | Yes (open source) | https://google.github.io/osv-scanner/ |
| **Renovate** | Automated dependency updates with extensive config options | Yes (open source + hosted) | https://docs.renovatebot.com |
| **Grype** | Container and filesystem SCA; pairs well with Syft for SBOMs | Yes (open source) | https://github.com/anchore/grype |

---

## Container & Infrastructure Security

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Trivy** | All-in-one scanner for containers, filesystems, IaC, SBOMs; very fast | Yes (open source) | https://trivy.dev |
| **Hadolint** | Dockerfile linter; checks against best practices and shell command issues | Yes (open source) | https://hadolint.github.io/hadolint/ |
| **Checkov** | IaC scanner (Terraform, CloudFormation, Kubernetes, Helm) | Yes (open source) | https://checkov.io |
| **tfsec** | Terraform-specific security scanner; very fast; over 400 checks | Yes (open source) | https://aquasecurity.github.io/tfsec/ |
| **kube-bench** | Checks Kubernetes clusters against CIS benchmarks | Yes (open source) | https://github.com/aquasecurity/kube-bench |
| **Falco** | Runtime security for containers; detects anomalous behaviour in real time | Yes (open source) | https://falco.org |
| **Syft** | Generates SBOMs from containers and filesystems; pairs with Grype | Yes (open source) | https://github.com/anchore/syft |

---

## Monitoring, Observability & SIEM

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Wazuh** | Open-source SIEM and XDR; log analysis, FIM, vulnerability detection | Yes (open source) | https://wazuh.com |
| **Elastic Security** | SIEM built on Elasticsearch; good for teams already on the Elastic stack | Yes (basic features free) | https://www.elastic.co/security |
| **Grafana + Loki** | Log aggregation and dashboards; security dashboards possible with plugins | Yes (open source) | https://grafana.com/oss/loki/ |
| **OpenTelemetry** | Vendor-neutral telemetry framework; feeds into your SIEM of choice | Yes (open source) | https://opentelemetry.io |
| **Sentry** | Error and performance monitoring; helps spot attack-triggered exceptions | Yes (generous free tier) | https://sentry.io |
| **Datadog Security** | Cloud SIEM with application security management; strong integrations | No (paid only) | https://www.datadoghq.com/product/security-platform/ |

---

## Web Application Firewalls (WAF)

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Cloudflare WAF** | Managed WAF with OWASP ruleset; easy setup; DDoS protection included | Yes (free plan includes basic WAF) | https://www.cloudflare.com/waf/ |
| **AWS WAF** | Integrates with CloudFront, ALB, API Gateway; pay-per-use pricing | No (pay-per-use, no free tier) | https://aws.amazon.com/waf/ |
| **ModSecurity** | Open-source WAF engine; used with OWASP Core Rule Set (CRS) on nginx/Apache | Yes (open source) | https://owasp.org/www-project-modsecurity-core-rule-set/ |
| **Coraza** | Modern, OWASP CRS-compatible WAF written in Go; can be embedded | Yes (open source) | https://coraza.io |
| **Nginx App Protect** | NGINX-native WAF (F5); enterprise-grade but complex to configure | No (commercial) | https://www.nginx.com/products/nginx-app-protect/ |

**Alternatives note:** Cloudflare and AWS WAF are managed services. For full control and self-hosting, ModSecurity or Coraza with the OWASP CRS is the open-source standard.

---

## Penetration Testing Frameworks

| Tool | What it does | Free tier? | Link |
|------|-------------|------------|------|
| **Metasploit Framework** | The industry standard exploitation framework; huge module library | Yes (open source community edition) | https://www.metasploit.com |
| **SQLmap** | Automated SQL injection detection and exploitation | Yes (open source) | https://sqlmap.org |
| **Hydra** | Network login brute-forcer; supports dozens of protocols | Yes (open source) | https://github.com/vanhauser-thc/thc-hydra |
| **ffuf** | Fast web fuzzer for directory and parameter discovery | Yes (open source) | https://github.com/ffuf/ffuf |
| **Gobuster** | Directory, DNS, and vhost brute-forcing tool | Yes (open source) | https://github.com/OJ/gobuster |

**Important:** Only use these tools against systems you own or have explicit written permission to test.

---

*Last reviewed: April 2026. Tool landscapes change — always verify current pricing and features on the official site.*
