# HIPAA Awareness for Developers

HIPAA (Health Insurance Portability and Accountability Act) applies to anyone handling Protected Health Information (PHI) in the United States. It has serious criminal penalties for non-compliance.

---

> **Stop:** HIPAA is one of the regulations where you genuinely need a lawyer. This guide gives you awareness. It does not substitute for legal advice. The penalties are real: up to $1.9M per violation category per year, plus criminal charges.

---

## What Is PHI?

Protected Health Information (PHI) is any health information that can identify an individual. This includes:

- Medical records, diagnoses, treatment history
- Insurance information
- Lab results
- Any information about health conditions combined with a name, email, address, IP address, or other identifier

If your app stores anything about a person's health **and** can identify that person, you likely handle PHI.

---

## Who Does HIPAA Apply To?

**Covered Entities:** Healthcare providers, health plans, healthcare clearinghouses — they must comply directly.

**Business Associates:** Companies that handle PHI on behalf of covered entities. If a hospital contracts your SaaS to manage patient data, you're a Business Associate.

**Do you need a BAA?**
If you're a Business Associate, you must sign a Business Associate Agreement (BAA) with every covered entity you serve. Without a BAA, you're in violation.

---

## The Major Rules

**Privacy Rule:** Governs how PHI can be used and disclosed. Users have rights to their data.

**Security Rule:** Technical, administrative, and physical safeguards for electronic PHI (ePHI).

**Breach Notification Rule:** Breaches affecting 500+ individuals must be reported to HHS and media within 60 days. Individual notification required.

---

## Minimum Technical Requirements (Security Rule)

Under the Security Rule you must implement:

- **Access controls** — unique user IDs, emergency access procedures, automatic logoff
- **Audit controls** — log access to ePHI
- **Integrity controls** — verify ePHI hasn't been improperly altered
- **Transmission security** — encrypt ePHI in transit (TLS)
- **Encryption at rest** — strongly recommended (technically "addressable" but expected)

---

## Common HIPAA-Compliant Infrastructure

| Service | HIPAA-Eligible? |
|---------|----------------|
| AWS (most services) | Yes — sign BAA with AWS |
| Google Cloud | Yes — sign BAA |
| Azure | Yes — sign BAA |
| Heroku | No |
| Vercel | No (as of 2026 — verify current status) |
| Supabase | Check current BAA availability |
| Stripe | Yes for payment; no for PHI |

---

## What To Do If You Need HIPAA Compliance

1. Determine if you're a Covered Entity or Business Associate
2. Engage a HIPAA compliance consultant or lawyer
3. Complete a HIPAA Risk Assessment
4. Build your HIPAA compliance programme:
   - Policies and procedures
   - Employee training
   - Technical controls (encryption, access logging, MFA)
   - BAAs with all vendors who touch PHI
5. Sign BAAs with all relevant vendors

---

## Learn More

- [Which Compliance Applies to You](./which-compliance-applies-to-you.md)
- [Privacy and GDPR](../12-privacy-and-gdpr/)
