# Security Certifications

A practical guide to certifications that matter — who they're for, what they actually cover, realistic costs, and how long they take.

> **Honest note:** Certifications signal baseline competence. They don't replace hands-on experience. Employers increasingly value a HackTheBox or CTF portfolio over a cert you crammed for in two weeks.

---

## CompTIA Security+

**Who it's for:** Developers or sysadmins moving into a security-adjacent role, or anyone who needs a baseline credential for compliance or government work (it satisfies DoD 8570).

**What it covers:**
- Threats, attacks, and vulnerabilities
- Technologies and tools (firewalls, IDS, SIEM)
- Architecture and design principles
- Identity and access management
- Risk management and cryptography fundamentals
- Network and application security basics

**Depth:** Broad but shallow. You'll know the vocabulary and concepts; you won't be doing penetration tests.

**Format:** Multiple choice + performance-based questions. 90 questions, 90 minutes.

**Cost:** ~£350 / $404 USD exam voucher. Study materials (Professor Messer's free videos + Darril Gibson's book) can keep total cost under £500.

**Time to prepare:** 2–3 months for someone with an IT background; 4–6 months if starting from scratch.

**Validity:** 3 years; renew via continuing education or re-exam.

**Useful for:** Entry-level security roles, compliance requirements, demonstrating baseline knowledge to non-technical stakeholders.

**Official:** https://www.comptia.org/certifications/security

---

## CEH — Certified Ethical Hacker (EC-Council)

**Who it's for:** Developers or security engineers wanting a structured overview of offensive techniques. Widely recognised in corporate hiring, particularly in financial services and government sectors.

**What it covers:**
- Reconnaissance and footprinting
- Scanning networks and enumeration
- Social engineering
- System hacking methodology
- Malware, sniffing, session hijacking
- Web application hacking, SQL injection, XSS
- Cryptography basics

**Depth:** Broader than Security+ but still conceptual rather than deeply practical. The exam is multiple choice — you're recognising attack descriptions, not performing them.

**Format:** 125 multiple choice questions, 4 hours.

**Cost:** £1,200–£1,800 / $1,699 USD for official training + exam. Without training, the exam alone is ~$950 + an eligibility application fee.

**Time to prepare:** 2–3 months with official courseware.

**Validity:** 3 years; CECs (Continuing Education Credits) required to renew.

**Limitations:** Criticised by practitioners for being too theoretical compared to OSCP. The cost is high relative to practical value. Good for CV ticking, not for deep skill building.

**Official:** https://www.eccouncil.org/train-certify/certified-ethical-hacker-ceh/

---

## OSCP — Offensive Security Certified Professional

**Who it's for:** Security engineers, pentesters, and developers who want real offensive skills. Considered the benchmark practical penetration testing certification.

**What it covers:**
- Active information gathering
- Vulnerability scanning and exploitation
- Buffer overflows (x86 Windows and Linux)
- Client-side attacks
- Web application attacks (injection, file inclusion, etc.)
- Password attacks and privilege escalation
- Active Directory attacks
- Tunnelling and port forwarding

**Depth:** Very deep, entirely practical. The exam is a 24-hour hands-on lab — you must compromise machines, not answer questions.

**Format:** 24-hour practical exam (compromise 3+ machines + write a professional pentest report within 24 hours).

**Cost:** $1,499 USD for 90 days of lab access + exam attempt (PEN-200 course). Additional attempts cost extra.

**Time to prepare:** 3–12 months depending on prior experience. Extensive home lab practice expected.

**Validity:** Does not expire. Widely regarded as more valuable than CEH by technical hiring managers.

**Useful for:** Penetration tester roles, red team positions, security engineers. Overkill for most developers — unless you want to move into offensive security.

**Official:** https://www.offsec.com/courses/pen-200/

---

## CKS — Certified Kubernetes Security Specialist

**Who it's for:** Platform engineers, DevOps engineers, and developers who run workloads on Kubernetes and need to harden them.

**Prerequisites:** Must hold a valid CKA (Certified Kubernetes Administrator) first.

**What it covers:**
- Cluster setup and hardening (CIS benchmarks, network policies, API server config)
- Minimising microservice vulnerabilities (securityContext, admission controllers, OPA/Gatekeeper)
- Supply chain security (image signing, Trivy scanning, Falco runtime monitoring)
- Monitoring, logging, and runtime security
- System hardening (AppArmor, Seccomp, kernel hardening)

**Depth:** Practical hands-on exam in a live cluster. No multiple choice.

**Format:** 2-hour performance-based exam in a real Kubernetes environment.

**Cost:** $395 USD exam + 2 attempts.

**Time to prepare:** 2–4 months after earning CKA. Killer.sh simulator is the recommended prep.

**Validity:** 2 years.

**Useful for:** Teams running Kubernetes in production. Directly applicable to real-world cluster security hardening.

**Official:** https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/

---

## Cloud Security Certifications

### AWS Certified Security – Specialty

**Who it's for:** Developers and architects who deploy on AWS and need to own their security posture.

**What it covers:** IAM, data protection (KMS, encryption at rest/transit), network security (VPC, Security Groups, WAF), threat detection (GuardDuty, Macie), incident response, logging and monitoring.

**Format:** 65 questions, 170 minutes.

**Cost:** $300 USD.

**Time:** 3–6 months. Adrian Cantrill's and Stephane Maarek's courses are popular.

**Official:** https://aws.amazon.com/certification/certified-security-specialty/

---

### Google Professional Cloud Security Engineer

**Who it's for:** Engineers working on Google Cloud infrastructure.

**What it covers:** Configuring cloud security, managing operations, identity, access, networking policies, data protection, compliance.

**Format:** 50–60 questions, 2 hours.

**Cost:** $200 USD.

**Official:** https://cloud.google.com/learn/certification/cloud-security-engineer

---

### Microsoft SC-900 / SC-200

**SC-900** is the entry-level Microsoft security fundamentals cert — useful as a starting point. **SC-200** (Security Operations Analyst) is more advanced and covers Microsoft Sentinel, Defender, and threat investigation.

**Cost:** SC-900 ~$165 USD; SC-200 ~$165 USD.

**Official:** https://learn.microsoft.com/en-us/certifications/security-compliance-and-identity/

---

## Choosing the Right Certification

| Your situation | Recommended path |
|---------------|-----------------|
| Need a baseline credential for a job application | Security+ |
| Want to move into pentesting | OSCP (skip CEH) |
| Running Kubernetes in production | CKA → CKS |
| Deploying on AWS | AWS Security Specialty |
| Corporate compliance / government contracting | Security+ (DoD 8570 compliant) |
| Just want to learn — no cert required | PortSwigger Academy + TryHackMe (free) |

---

## Free Alternatives Worth Mentioning

Before spending money on certifications, these free resources build comparable practical skills:

- **PortSwigger Web Security Academy** — https://portswigger.net/web-security
- **TryHackMe** (free tier) — https://tryhackme.com
- **HackTheBox Starting Point** — https://www.hackthebox.com
- **SANS Cyber Aces** — https://www.sans.org/cyberaces/
- **Cybrary** (free tier) — https://www.cybrary.it

---

*Certification costs and formats change. Verify current pricing and exam objectives on the official sites before registering.*
