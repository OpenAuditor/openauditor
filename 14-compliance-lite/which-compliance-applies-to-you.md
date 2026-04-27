# Which Compliance Applies to You?

A practical decision tree for SaaS founders and indie hackers.

> **Note:** This is guidance, not legal advice. Regulations are interpreted by lawyers and regulators, not by this guide.

---

## Step 1: Where Are Your Users?

**EU or UK users?** → GDPR / UK GDPR applies  
**California users?** → CCPA applies (if you meet thresholds)  
**Both?** → Both apply  
**Only other countries?** → Check local regulations (most countries now have data protection laws)

---

## Step 2: What Data Do You Process?

**Health data from US patients?** → HIPAA applies  
**Payment card numbers?** → PCI DSS applies  
**Biometric data?** → Many jurisdictions have specific rules (Illinois BIPA, EU GDPR Art. 9)  
**Children's data (under 13)?** → COPPA (US), GDPR's higher bar for children  
**Government data?** → FedRAMP (US), G-Cloud (UK)  

---

## Step 3: Who Are Your Customers?

**Selling to US enterprise companies?** → SOC 2 Type II will likely be required  
**Selling to EU enterprise?** → GDPR compliance + ISO 27001 may be required  
**Selling to US government agencies?** → FedRAMP is likely required  
**Consumer app only?** → GDPR/CCPA + your general security posture  

---

## Quick Reference Table

| Your Situation | Regulation | Priority |
|---------------|-----------|---------|
| Have EU/UK users | GDPR/UK GDPR | Immediate |
| Have California users, revenue >$25M or >100K users | CCPA | High |
| Process US health data | HIPAA | Critical — get a lawyer |
| Store payment cards | PCI DSS | Critical — use Stripe instead |
| B2B SaaS targeting enterprise | SOC 2 | 12–18 months out |
| Any serious security posture | ISO 27001 | 18–24 months out |

---

## The Shortcuts

### If You Use Stripe for Payments

Stripe handles PCI DSS compliance for card storage and processing. You must still:
- Never log card numbers
- Use Stripe.js (not raw card data sent to your server)
- Choose the appropriate SAQ level

[Read more →](./pci-dss-basics.md)

### If You Handle No Personal Data

If you process completely anonymised data with no way to re-identify individuals, GDPR does not apply. But be careful — "anonymous" is hard to achieve, and most apps handle at least IP addresses and emails.

### If You're Under the GDPR Threshold

GDPR applies to any organisation that processes EU/UK personal data, regardless of size. There's no minimum threshold.

---

## Where to Start

1. **Read [GDPR for Founders](../12-privacy-and-gdpr/uk-gdpr-for-founders.md)** — almost every SaaS founder needs this
2. **Use [Compliance Triage prompt](./prompts/compliance-triage.md)** to get an AI to assess your scope
3. **Get a lawyer** for anything involving HIPAA, PCI DSS, or FedRAMP — these have real penalties

---

## Learn More

- [Privacy and GDPR](../12-privacy-and-gdpr/)
- [SOC 2](../13-soc2/)
