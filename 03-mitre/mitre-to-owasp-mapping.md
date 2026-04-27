# MITRE ATT&CK to OWASP Mapping

> **30-second summary:** MITRE ATT&CK describes how attackers operate tactically (initial access, persistence, lateral movement). OWASP describes the vulnerabilities they exploit. This mapping helps you see which MITRE techniques your OWASP fixes actually defend against — and which ATT&CK techniques have no OWASP control.

## Why This Mapping Matters

Security teams speak different languages:
- **Red teams and threat hunters** use MITRE ATT&CK (techniques and tactics)
- **Development teams** use OWASP (vulnerability categories)
- **Compliance teams** use frameworks like SOC 2 and ISO 27001

This mapping bridges the gap so a finding like "API1: BOLA" can be traced to `T1078: Valid Accounts` in ATT&CK, helping you understand what an attacker actually *does* with the vulnerability.

## OWASP Web Top 10 → MITRE ATT&CK

| OWASP Category | Primary ATT&CK Techniques | Tactic |
|----------------|--------------------------|--------|
| A01: Broken Access Control | T1078 Valid Accounts, T1548 Abuse Elevation Control Mechanism | Privilege Escalation |
| A02: Cryptographic Failures | T1040 Network Sniffing, T1552 Unsecured Credentials | Credential Access |
| A03: Injection | T1059 Command and Scripting Interpreter, T1190 Exploit Public-Facing Application | Initial Access / Execution |
| A04: Insecure Design | T1499 Endpoint Denial of Service, T1110 Brute Force | Impact / Credential Access |
| A05: Security Misconfiguration | T1190 Exploit Public-Facing Application, T1133 External Remote Services | Initial Access |
| A06: Vulnerable Components | T1195 Supply Chain Compromise, T1203 Exploitation for Client Execution | Initial Access |
| A07: Authentication Failures | T1110 Brute Force, T1078 Valid Accounts, T1539 Steal Web Session Cookie | Credential Access |
| A08: Data Integrity Failures | T1195 Supply Chain Compromise, T1553 Subvert Trust Controls | Defense Evasion |
| A09: Logging Failures | T1562 Impair Defenses (disable logging), T1070 Indicator Removal | Defense Evasion |
| A10: SSRF | T1090 Proxy, T1583 Acquire Infrastructure | Command & Control |

## OWASP API Top 10 → MITRE ATT&CK

| OWASP API Category | Primary ATT&CK Techniques | Tactic |
|--------------------|--------------------------|--------|
| API1: BOLA/IDOR | T1078 Valid Accounts (misuse), T1530 Data from Cloud Storage | Collection |
| API2: Broken Authentication | T1110 Brute Force, T1212 Exploitation for Credential Access | Credential Access |
| API3: Mass Assignment | T1548 Abuse Elevation Control Mechanism | Privilege Escalation |
| API4: Resource Consumption | T1499 Endpoint Denial of Service | Impact |
| API5: Function-Level Auth | T1548 Abuse Elevation Control Mechanism | Privilege Escalation |
| API6: Business Flows | T1657 Financial Theft, T1499 Endpoint DoS | Impact |
| API7: SSRF | T1090 Proxy, T1557 Adversary-in-the-Middle | Collection |
| API8: Misconfiguration | T1190 Exploit Public-Facing Application | Initial Access |
| API9: Inventory Management | T1592 Gather Victim Host Information | Reconnaissance |
| API10: Third-Party APIs | T1195 Supply Chain Compromise | Initial Access |

## ATT&CK Techniques Not Covered by OWASP

These MITRE techniques are common in web application attacks but have no direct OWASP Top 10 control:

| ATT&CK Technique | Description | Mitigation Approach |
|------------------|-------------|---------------------|
| T1566: Phishing | Spear-phishing to steal credentials | MFA, security awareness training |
| T1083: File and Directory Discovery | Enumeration after initial access | WAF, directory listing disabled |
| T1005: Data from Local System | Reading files after RCE | Least privilege, file system sandboxing |
| T1486: Data Encrypted for Impact | Ransomware | Backups, endpoint protection |
| T1021: Remote Services | Lateral movement via RDP/SSH | Network segmentation, MFA |
| T1057: Process Discovery | Post-exploitation reconnaissance | HIDS, process monitoring |

## Attack Chain Examples

### Chain 1: Credential Stuffing → Data Exfiltration

```
MITRE Tactics:      Reconnaissance → Initial Access → Collection → Exfiltration
MITRE Techniques:   T1596 (cred leak search) → T1110.004 (credential stuffing) → T1530 (cloud data) → T1041 (C2 exfil)

OWASP Mapping:
  T1596 → (not covered by OWASP — external threat intel)
  T1110.004 → A07 Authentication Failures (no rate limiting)
  T1530 → A01 Broken Access Control (IDOR on S3/Supabase)
  T1041 → A09 Logging Failures (exfil not detected)

Defensive controls:
  A07 fix: Rate limit login to 5/15min per IP+email
  A01 fix: Supabase RLS, ownership checks
  A09 fix: Alert on bulk data access, unusual download volumes
```

### Chain 2: Supply Chain → Persistence

```
MITRE Tactics:      Initial Access → Execution → Persistence → Defense Evasion
MITRE Techniques:   T1195.002 (malicious package) → T1059.007 (JS execution) → T1098 (add credentials) → T1562 (disable logging)

OWASP Mapping:
  T1195.002 → A06 Vulnerable Components / A08 Data Integrity Failures
  T1059.007 → A03 Injection
  T1098 → A07 Authentication Failures
  T1562 → A09 Logging Failures

Defensive controls:
  A06 fix: npm audit, Dependabot, npm ci --ignore-scripts
  A08 fix: SRI hashes, signed packages, GitHub Actions pinning
  A07 fix: MFA, session invalidation, login anomaly alerting
  A09 fix: Immutable audit logs, log integrity checks
```

### Chain 3: SSRF → Cloud Metadata → Privilege Escalation

```
MITRE Tactics:      Initial Access → Discovery → Credential Access → Privilege Escalation
MITRE Techniques:   T1190 (exploit app) → T1580 (cloud infrastructure discovery) → T1552.005 (cloud instance metadata) → T1548 (abuse elevation)

OWASP Mapping:
  T1190 → A05 Security Misconfiguration (SSRF enabled by misconfigured fetches)
  T1580 → A10 SSRF (SSRF used for cloud discovery)
  T1552.005 → A10 SSRF (metadata endpoint fetched)
  T1548 → A01 Broken Access Control (IAM escalation)

Real-world example: Capital One 2019
  1. WAF misconfiguration (A05) → SSRF possible
  2. SSRF to 169.254.169.254 (A10) → AWS IAM role credentials
  3. IAM role had S3 full access → 100M records exfiltrated
  4. No anomaly detection on SSRF or bulk S3 reads (A09)
```

## Using This Mapping in Threat Modelling

### Step 1: Start with Your Attack Surface

```
For your application, list:
- Public-facing APIs (primary target for T1190, API-based techniques)
- Authentication endpoints (target for T1110 brute force)
- Admin panels (target for T1548 privilege escalation)
- File upload/processing (target for T1059 code execution)
- External integrations (target for T1195 supply chain)
```

### Step 2: Map to MITRE Techniques

For each attack surface, identify which MITRE techniques apply. Use the MITRE ATT&CK matrix at https://attack.mitre.org/matrices/enterprise/

### Step 3: Identify OWASP Controls

Use the mapping table above to find which OWASP categories address those techniques. Then implement the corresponding fixes.

### Step 4: Find Gaps

Techniques not covered by OWASP (phishing, lateral movement, ransomware) require different controls:
- MFA and security awareness for phishing
- Network segmentation for lateral movement
- Immutable backups for ransomware

## MITRE D3FEND Mapping

MITRE D3FEND maps defensive techniques to ATT&CK. Key mappings for web application defenders:

| ATT&CK Technique | D3FEND Countermeasure | Implementation |
|------------------|----------------------|----------------|
| T1110 Brute Force | D3-ANCI: Account Locking / Rate Limiting | Upstash rate limiter, account lockout |
| T1190 Exploit App | D3-SICA: Software Inventory Check | npm audit, SAST (Semgrep) |
| T1195 Supply Chain | D3-SVCDEP: Service Dependency Analysis | Dependabot, lockfile integrity |
| T1552 Unsecured Creds | D3-SCE: Credential Scanning | gitleaks, GitHub secret scanning |
| T1562 Impair Defenses | D3-LFICA: Log File Integrity Check | External log shipping (Axiom/Logtail) |

## Learn More

- [MITRE ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/)
- [MITRE D3FEND](https://d3fend.mitre.org/)
- [OWASP Web Top 10](../02-owasp/web-top10/README.md)
- [OWASP API Top 10](../02-owasp/api-top10/README.md)
- [MITRE Threat Review Prompt](./prompts/mitre-threat-review.md)
