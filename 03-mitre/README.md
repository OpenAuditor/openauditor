# MITRE ATT&CK for Developers

> **30-second summary:** MITRE ATT&CK is a globally accessible knowledge base of adversary tactics and techniques based on real-world observations. For developers, it provides a shared language for describing how attackers operate — so you can design systems that resist known attack patterns, not just pass a compliance checklist.

---

## What Is MITRE ATT&CK?

MITRE ATT&CK (Adversarial Tactics, Techniques, and Common Knowledge) is a curated framework maintained by the non-profit MITRE Corporation. It documents the real methods that threat actors use at every stage of an attack, from the first reconnaissance scan to data exfiltration and system destruction.

Unlike a vulnerability database (which catalogues flaws), ATT&CK catalogues **behaviours** — what an attacker *does*, not just what is broken. This makes it useful for:

- **Threat modelling** — "Which techniques could be used against our login endpoint?"
- **Security control mapping** — "Does our WAF block T1190 (Exploit Public-Facing Application)?"
- **Incident response** — "The logs show lateral movement; which technique matches?"
- **Red/blue team communication** — shared vocabulary across offensive and defensive teams

---

## The Three ATT&CK Matrices

| Matrix | Scope |
|--------|-------|
| **Enterprise** | Windows, Linux, macOS, cloud, network, containers |
| **Mobile** | Android and iOS |
| **ICS** | Industrial control systems (SCADA, OT) |

Most web and SaaS developers work primarily within the **Enterprise** matrix, specifically the cloud and web application sub-domains.

---

## The 14 Tactics (The "Why")

Tactics represent the adversary's **goal** at each stage of an attack. They form a rough kill chain:

1. **Reconnaissance** — gathering information before attacking
2. **Resource Development** — building infrastructure, acquiring tools
3. **Initial Access** — getting a foothold into the target
4. **Execution** — running malicious code
5. **Persistence** — maintaining access across reboots/logins
6. **Privilege Escalation** — gaining higher-level permissions
7. **Defence Evasion** — avoiding detection
8. **Credential Access** — stealing usernames and passwords
9. **Discovery** — learning about the environment
10. **Lateral Movement** — pivoting to other systems
11. **Collection** — gathering data of interest
12. **Command and Control** — communicating with compromised systems
13. **Exfiltration** — stealing data out of the environment
14. **Impact** — disrupting, destroying, or manipulating systems

---

## Techniques and Sub-techniques (The "How")

Under each tactic sit numbered **techniques** (e.g. T1190) and **sub-techniques** (e.g. T1190.001). Each entry includes:

- A description of the technique
- Which threat groups have used it
- Detection guidance
- Mitigations

As of 2024, the Enterprise matrix contains over 600 techniques and sub-techniques.

---

## Why This Matters for Developers

Most security frameworks tell you what *not* to do (don't store plaintext passwords, don't use MD5). ATT&CK tells you *what attackers will actually try*, which inverts the problem usefully:

| Instead of… | ATT&CK helps you ask… |
|-------------|----------------------|
| "Is our password hashing secure?" | "What are all the ways an attacker could access credentials in our system?" |
| "Did we pass the pentest?" | "Are our controls mapped to the techniques used against SaaS apps?" |
| "We have a WAF" | "Does our WAF configuration address T1190, T1133, and T1059?" |

---

## How to Use ATT&CK as a Developer

### 1. Identify Your Attack Surface
What do you expose publicly? APIs, login pages, admin panels, OAuth flows, webhooks?

### 2. Browse Relevant Techniques
Visit [attack.mitre.org](https://attack.mitre.org) and filter by platform (e.g. "SaaS", "Cloud"). Look at which techniques apply to your surface.

### 3. Map to Your Controls
For each relevant technique, ask: "Do we have a control for this?" If not, is the risk acceptable or does it need addressing?

### 4. Use the ATT&CK Navigator
The free [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) lets you colour-code the matrix to show your coverage — a useful artifact for threat modelling workshops.

---

## Files in This Section

| File | Purpose |
|------|---------|
| `attck-for-web-apps.md` | ATT&CK tactics mapped to web application attacks |
| `attck-for-saas.md` | ATT&CK for SaaS products — initial access, persistence, lateral movement |
| `attck-for-ai-apps.md` | ATT&CK adapted for AI/LLM-powered applications |
| `mitre-to-owasp-mapping.md` | Cross-reference table: ATT&CK techniques ↔ OWASP Top 10 |
| `prompts/mitre-threat-review.md` | Agent prompt to map ATT&CK threats to your application |

---

## Further Reading

- [MITRE ATT&CK official site](https://attack.mitre.org)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
- [ATT&CK for Cloud](https://attack.mitre.org/matrices/enterprise/cloud/)
- [MITRE D3FEND](https://d3fend.mitre.org/) — the defensive counterpart to ATT&CK
