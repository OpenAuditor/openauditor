# ATT&CK for Web Applications

> **30-second summary:** Every MITRE ATT&CK tactic maps directly to techniques attackers use against web apps. This file walks through each tactic, names the relevant techniques with their IDs, shows real-world examples, and tells you what defensive control addresses it — so you can design your app with the attacker's playbook in mind.

---

## How to Read This File

Each section covers one ATT&CK tactic. Under it you'll find:
- Relevant technique IDs and names
- What this looks like in a web application context
- A real attack story where available
- The developer control that mitigates it

---

## 1. Reconnaissance (TA0043)

**Goal:** Gather information before attacking.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Active Scanning | T1595 | Automated scanner probing your `/api/`, `/.git/`, `/admin/` paths |
| Search Open Websites / Domains | T1593 | Searching Shodan, Google Dorks (`site:example.com filetype:env`) for exposed files |
| Gather Victim Identity Information | T1589 | Harvesting emails from the site for credential stuffing lists |
| Phishing for Information | T1598 | Fake login pages mimicking your brand to harvest credentials |

**Real story:** Before the 2020 Twitter hack, attackers performed reconnaissance on employee accounts via social media to identify targets for vishing (voice phishing) attacks.

**Developer controls:**
- Remove `.git/`, `.env`, `backup.zip` and similar files from public web roots
- Implement HTTP security headers (`X-Robots-Tag: noindex` for admin areas)
- Monitor for unusual path scanning in access logs
- Use security.txt so legitimate researchers can report findings

---

## 2. Initial Access (TA0001)

**Goal:** Get a foothold into the target environment.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Exploit Public-Facing Application | T1190 | SQL injection, RCE via deserialization, path traversal |
| Phishing | T1566 | Malicious link in email leading to credential harvest |
| Valid Accounts | T1078 | Credential stuffing — trying breached username/password pairs |
| Supply Chain Compromise | T1195 | Malicious npm/PyPI package pulled into your build |
| External Remote Services | T1133 | Exposed admin panel, Kubernetes dashboard, or dev server |

**Real story:** The 2020 SolarWinds attack exploited T1195 — a malicious update to the Orion software build pipeline infected thousands of downstream customers without any vulnerability in the customers' own code.

**Developer controls:**
- Parameterise all database queries (prevents T1190 SQL injection)
- Implement rate limiting and account lockout (prevents T1078 credential stuffing)
- Enforce MFA on all authentication flows
- Pin dependency versions and use lockfiles; verify package integrity with `npm audit`
- Never expose management interfaces (Kibana, Grafana, pgAdmin) to the public internet

---

## 3. Execution (TA0002)

**Goal:** Run malicious code in the target environment.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Command and Scripting Interpreter | T1059 | OS command injection via unsanitised user input passed to `exec()` |
| Server-Side Template Injection | T1059.007 | SSTI in Jinja2, Twig, or Handlebars rendering user-controlled strings |
| Exploitation for Client Execution | T1203 | XSS executing JavaScript in a victim's browser |
| User Execution | T1204 | Tricking an admin into uploading a malicious file (webshell) |

**Real story:** In 2021, the Log4Shell (CVE-2021-44228) vulnerability allowed unauthenticated RCE by sending a crafted string that the logging library executed. This is T1190 + T1059 combined.

**Developer controls:**
- Never pass user input to shell commands (`exec`, `system`, `subprocess`)
- Use template engines with auto-escaping; avoid rendering raw user strings as templates
- Implement strict Content Security Policy to limit what scripts execute in the browser
- Validate and restrict file upload types; store uploads outside the web root

---

## 4. Persistence (TA0003)

**Goal:** Maintain access after initial compromise.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Web Shell | T1505.003 | PHP/ASP webshell uploaded via unrestricted file upload |
| Account Manipulation | T1098 | Attacker adds their own admin user or OAuth app after compromise |
| Scheduled Task/Job | T1053 | Cron job or serverless function backdoor planted by attacker |
| Implant Container Image | T1525 | Malicious base image in CI/CD pipeline persists across deployments |

**Real story:** Many breaches (e.g., Magecart attacks on e-commerce sites) persist through a JavaScript webshell injected into CMS templates, surviving database restores because the file was written to disk.

**Developer controls:**
- Enforce immutable deployments — servers should not be writable at runtime
- Audit admin accounts and OAuth application grants regularly
- Monitor for new cron jobs or Lambda functions created outside normal deployment
- Sign container images and enforce image provenance checks in your registry

---

## 5. Privilege Escalation (TA0004)

**Goal:** Gain higher-level permissions than initially obtained.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Exploitation for Privilege Escalation | T1068 | Exploiting a SSRF to reach the cloud metadata service and get IAM credentials |
| Valid Accounts: Cloud Accounts | T1078.004 | Abusing over-permissioned service accounts |
| Abuse Elevation Control Mechanism | T1548 | Bypassing `sudo` or RBAC misconfiguration |
| Access Token Manipulation | T1134 | Forging or tampering with a JWT to elevate role claims |

**Real story:** The 2019 Capital One breach was driven by a SSRF vulnerability (T1190) that allowed the attacker to query the AWS EC2 metadata service (`169.254.169.254`), retrieve IAM role credentials, and then escalate to full S3 access — exfiltrating 100 million customer records.

**Developer controls:**
- Block requests to cloud metadata endpoints (`169.254.169.254`, `fd00:ec2::254`) at the network level
- Apply the principle of least privilege to every IAM role and service account
- Validate JWT signatures server-side; never trust client-supplied role claims
- Implement Broken Access Control checks at the API layer (OWASP A01:2021)

---

## 6. Defence Evasion (TA0005)

**Goal:** Avoid detection by security tools and analysts.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Obfuscated Files or Information | T1027 | Base64-encoded payloads in request parameters |
| Masquerading | T1036 | Renaming malicious file `image.jpg.php` to bypass extension checks |
| Indicator Removal | T1070 | Attacker deletes access logs after compromise |
| Traffic Signalling | T1205 | Port knocking or cookie-based backdoor only triggered by specific requests |
| Use Alternate Authentication Material | T1550 | Session token theft — reusing stolen cookies without knowing the password |

**Developer controls:**
- Decode and inspect all data before processing, not just validate the surface format
- Use MIME-type validation (not just extension checking) for file uploads
- Send logs to an external, immutable logging service (e.g. CloudWatch, Splunk) immediately
- Implement anomaly detection on session behaviour (unusual geography, rapid request patterns)

---

## 7. Credential Access (TA0006)

**Goal:** Steal account names and passwords.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Brute Force | T1110 | Password spraying or credential stuffing attacks on your login endpoint |
| Password Spraying | T1110.003 | Trying "Password1!" against 10,000 accounts to avoid lockout |
| Steal Web Session Cookie | T1539 | XSS exfiltrating document.cookie to attacker server |
| Unsecured Credentials | T1552 | `.env` file with DB password accidentally committed to public GitHub |
| Adversary-in-the-Middle | T1557 | HTTPS stripping or DNS poisoning on a poorly secured network |

**Real story:** Countless credential stuffing attacks (e.g. against Disney+, Spotify) leverage T1110 — automated tools try known breached email/password pairs against login endpoints. Rate limiting and MFA are the primary defences.

**Developer controls:**
- Rate limit login endpoints; implement CAPTCHA after N failures
- Set cookies with `HttpOnly`, `Secure`, and `SameSite=Strict`
- Scan git history for secrets; use pre-commit hooks to prevent secret commits
- Enforce HTTPS everywhere; use HSTS with a long `max-age`
- Implement MFA — prevents credential stuffing even with valid stolen passwords

---

## 8. Discovery (TA0007)

**Goal:** Learn about the environment after gaining access.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| System Information Discovery | T1082 | Reading `/proc/version`, `uname`, environment variables to fingerprint the host |
| Cloud Service Discovery | T1526 | Enumerating S3 buckets, Lambda functions, or database instances via AWS CLI |
| Account Discovery | T1087 | Listing users via a vulnerable `/api/users` endpoint without auth |
| Network Service Discovery | T1046 | Port scanning internal services reachable from a compromised container |
| Software Discovery | T1518 | Reading `package.json` or `requirements.txt` to find exploitable library versions |

**Developer controls:**
- Never expose internal infrastructure details in error messages or API responses
- Require authentication and authorisation on all API endpoints, including "read-only" ones
- Implement network segmentation — containers should not be able to reach internal services they don't need
- Remove framework/server version headers (`X-Powered-By`, `Server`)

---

## 9. Lateral Movement (TA0008)

**Goal:** Pivot from the initial foothold to other systems.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Internal Spearphishing | T1534 | Attacker with access to email sends phishing to internal staff |
| Exploitation of Remote Services | T1210 | Using SSRF to attack internal microservices |
| Use Alternate Authentication Material | T1550 | Stolen API keys used to access other internal services |
| Software Deployment Tools | T1072 | Compromising CI/CD to push malicious code to other services |

**Real story:** The SolarWinds attackers used T1072 — once inside the build environment, they could deploy to thousands of customers' networks, effectively using the software deployment pipeline as a lateral movement vehicle.

**Developer controls:**
- Implement zero-trust networking; services should authenticate to each other, not rely on network position
- Rotate service-to-service credentials regularly; use short-lived tokens (e.g. Vault, AWS IAM roles)
- Audit CI/CD pipeline permissions; secrets in CI should be scoped to the minimum necessary
- Block SSRF at the network layer; validate and allowlist outbound URLs from your application

---

## 10. Collection (TA0009)

**Goal:** Gather data of interest before exfiltration.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Data from Local System | T1005 | Reading database files, config files, or SSH keys from a compromised host |
| Data from Cloud Storage | T1530 | Downloading all objects from an S3 bucket or GCS bucket |
| Data from Information Repositories | T1213 | Scraping a CMS, wiki, or internal API for sensitive data |
| Screen Capture | T1113 | Exfiltrating user-facing data via XSS that captures DOM content |

**Developer controls:**
- Encrypt sensitive data at rest; even if accessed, it's not readable without the key
- Apply least-privilege access to cloud storage; never grant `s3:GetObject *` to a web app role
- Implement database activity monitoring; alert on bulk SELECT queries
- Use field-level encryption for PII in databases

---

## 11. Exfiltration (TA0010)

**Goal:** Steal data out of the target environment.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Exfiltration Over Web Service | T1567 | Attacker POSTing stolen data to a Pastebin or S3 bucket they control |
| Exfiltration Over C2 Channel | T1041 | Data exfiltrated via DNS queries (DNS tunnelling) |
| Automated Exfiltration | T1020 | Script runs at night, draining database rows slowly to avoid detection |
| Transfer Data to Cloud Account | T1537 | Copying RDS snapshot to attacker's AWS account |

**Developer controls:**
- Implement egress filtering — your web app should only talk to known external services
- Monitor for large or unusual outbound data transfers
- Alert on cross-account cloud resource operations
- Use DLP (Data Loss Prevention) tools on structured data stores

---

## 12. Impact (TA0040)

**Goal:** Disrupt, destroy, or manipulate the target.

| Technique | ID | Web App Manifestation |
|-----------|----|-----------------------|
| Data Destruction | T1485 | Deleting database records or S3 objects after exfiltration |
| Defacement | T1491 | Replacing homepage content with attacker's message |
| Endpoint Denial of Service | T1499 | HTTP flood targeting a specific endpoint |
| Resource Hijacking | T1496 | Cryptomining via XSS or a compromised server |
| Data Encrypted for Impact | T1486 | Ransomware encrypting server storage or an RDS instance |

**Developer controls:**
- Implement Point-in-Time Recovery (PITR) for databases; test your restore process
- Enable versioning and MFA-delete on S3 buckets containing critical data
- Use a CDN/WAF with DDoS protection (Cloudflare, AWS Shield)
- Set up resource consumption alerts to detect cryptomining behaviour

---

## Quick Reference: Developer Control Matrix

| Tactic | Top Control |
|--------|------------|
| Reconnaissance | Remove sensitive files from public web root; monitor for path scanning |
| Initial Access | Parameterise queries; enforce MFA; audit dependencies |
| Execution | Never exec() user input; auto-escape templates; strict CSP |
| Persistence | Immutable deployments; audit admin accounts |
| Privilege Escalation | Least-privilege IAM; validate JWTs server-side; block metadata endpoints |
| Defence Evasion | MIME-type validation; external immutable logging |
| Credential Access | Rate limiting; HttpOnly/Secure cookies; scan for secrets in git |
| Discovery | Authenticate all endpoints; remove version headers |
| Lateral Movement | Zero-trust service-to-service auth; SSRF protection |
| Collection | Encrypt data at rest; least-privilege on storage |
| Exfiltration | Egress filtering; monitor outbound data volume |
| Impact | PITR backups; DDoS protection; versioned S3 buckets |

---

## Further Reading

- [ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/)
- [MITRE ATT&CK for Cloud](https://attack.mitre.org/matrices/enterprise/cloud/)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
- See `mitre-to-owasp-mapping.md` for the cross-reference table
