# Community and Learning Resources

Curated security learning resources for developers — focused on practical, applied security rather than theory.

---

## Where to Learn

### Free Interactive Learning

**PortSwigger Web Security Academy** (portswigger.net/web-security)
- The best free, hands-on web security training available
- Labs covering every OWASP category: SQLi, XSS, CSRF, SSRF, IDOR, auth failures
- Burp Suite built into the browser — no setup required
- Estimated time: 20-40 hours to complete all topics
- **Recommended starting path:** Access Control → Authentication → CSRF → SQLi

**OWASP WebGoat** (github.com/WebGoat/WebGoat)
- Deliberately insecure application for practising attack techniques
- Docker setup: `docker run -p 8080:8080 webgoat/goat-and-wolf`
- Good companion to the OWASP Top 10 documentation

**HackTheBox** (hackthebox.com)
- CTF-style challenges and retired machines
- Free tier has access to some machines
- Pro tier (~£12/month) for active machines
- **Best for:** Understanding attacker mindset, practising detection

**TryHackMe** (tryhackme.com)
- More guided than HackTheBox — good for beginners
- Free tier available
- Good web application security paths

**PentesterLab** (pentesterlab.com)
- Web penetration testing exercises
- Free intro content; Pro ($20/month) for advanced
- Specifically focused on web app security

---

## Books

### Essential

**The Web Application Hacker's Handbook** — Stuttard & Pinto
- Comprehensive guide to web application attacks and defences
- Older but foundational — most attacks are still relevant
- Good reference for understanding *why* defences work

**Real-World Bug Hunting** — Peter Yaworski
- Case studies from HackerOne bug bounty reports
- Shows how real bugs are found and reported
- Great for understanding attacker methodology

**The Tangled Web** — Michal Zalewski
- Deep dive into browser security model
- Explains how cookies, origins, and the web security model actually work
- Technical but accessible

### Architecture and Design

**Security Engineering** — Ross Anderson (free online at cl.cam.ac.uk)
- Comprehensive security engineering textbook
- Covers authentication, cryptography, distributed systems security
- Free PDF available

**Threat Modeling: Designing for Security** — Adam Shostack
- Systematic approach to identifying threats
- Practical STRIDE methodology
- Applies to architecture review and code review

---

## Newsletters and Blogs

**tl;dr sec** (tldrsec.com) — Clint Gibler
- Weekly digest of security research, tools, and conference talks
- Very high signal-to-noise ratio
- Free newsletter

**Krebs on Security** (krebsonsecurity.com) — Brian Krebs
- Investigative security journalism
- Breach analysis and threat intelligence
- Good for understanding the attacker ecosystem

**Troy Hunt's Blog** (troyhunt.com)
- Practical web security from a developer perspective
- HIBP creator — excellent content on credential security and breach analysis
- Free

**The New Stack / OWASP Blog**
- Security engineering and DevSecOps content

---

## Podcasts

**Darknet Diaries** — Jack Rhysider
- True stories from the dark side of the internet
- Breach stories, hacker interviews, espionage
- Excellent for understanding real attack scenarios
- Listen to: EP 52 (NotPetya), EP 74 (Ubiquiti), EP 112 (Dirty Cow)

**Security Now** — Steve Gibson & Leo Laporte
- Weekly deep dives into security topics
- Technical depth on cryptography, protocols, vulnerabilities
- Free

**SANS Internet Stormcast**
- 5-minute daily podcast covering current threats
- Good for staying current without a huge time investment

**Risky Business** — Patrick Gray
- Weekly security news and analysis
- Industry perspective on threats and defences

---

## Conferences (Talks Available Online)

**DEF CON** (defcon.org/media/presentations)
- Hacker conference; talks free online after the event
- High technical quality; attacker perspective

**Black Hat** (blackhat.com/html/archives.html)
- Enterprise security research; talks free online
- More defensive/vendor focus than DEF CON

**BSides** (securitybsides.com)
- Community conferences in cities worldwide
- Free or low cost to attend
- Local, accessible, high quality

**OWASP AppSec** (owasp.org/events/)
- Web application security conference
- Talks focused on developers and defenders

---

## Tools to Know

### For Developers

**Burp Suite Community Edition** (portswigger.net/burp)
- HTTP proxy for intercepting and modifying requests
- Essential for manual security testing

**OWASP ZAP** (zaproxy.org)
- Free, open source DAST scanner
- Good for CI/CD integration

**Semgrep** (semgrep.dev)
- SAST tool with community rules
- Free tier; runs locally; fast

**jwt.io**
- JWT decoder and debugger in the browser
- Essential for debugging JWT authentication

**CyberChef** (gchq.github.io/CyberChef)
- Swiss army knife for encoding/decoding/encryption
- Useful for understanding encoded values in requests

### For Bug Bounty / CTF

**Gobuster / ffuf** — directory and parameter fuzzing
**Nuclei** — template-based vulnerability scanner
**httpx** — fast HTTP probe
**Amass** — subdomain enumeration

---

## Bug Bounty Platforms

**HackerOne** (hackerone.com)
- Largest bug bounty platform
- Good for reading disclosed reports — excellent learning resource
- Free to browse disclosed reports

**Bugcrowd** (bugcrowd.com)
- Similar to HackerOne
- Good for finding paid programmes

**Intigriti** (intigriti.com)
- European-focused bug bounty platform
- Active community

**Reading disclosed reports is the most efficient way to learn real-world vulnerabilities.**
Start here: `hackerone.com/hacktivity` — filter by severity and web application type.

---

## Standards and Reference

- **OWASP Top 10** — owasp.org/www-project-top-ten
- **OWASP ASVS** — Application Security Verification Standard
- **NIST Cybersecurity Framework** — nist.gov/cyberframework
- **MITRE ATT&CK** — attack.mitre.org
- **CVE/NVD** — nvd.nist.gov
- **CWE** — Common Weakness Enumeration — cwe.mitre.org

---

## OpenAuditor Community

- **Issues and contributions:** github.com/baulintech/openauditor
- **Report errors or outdated content:** Open a GitHub issue
- **Contribute a section:** See CONTRIBUTING.md
- **Security issues with this repo:** security@baulin.tech

---

## Learn More

- [Start Here](../START-HERE.md)
- [OWASP Top 10](../02-owasp/web-top10/README.md)
- [Security Testing](../10-security-testing/README.md)
