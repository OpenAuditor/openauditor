# Breach Notification

Under GDPR, a data breach must be reported to the supervisory authority within 72 hours of becoming aware. Missing this deadline compounds your regulatory exposure.

---

## What Counts as a Breach?

A personal data breach is any incident leading to accidental or unlawful:
- **Destruction** of personal data
- **Loss** of personal data
- **Alteration** of personal data
- **Unauthorised disclosure** of personal data
- **Unauthorised access** to personal data

This includes: database dumps exposed online, compromised admin accounts, misconfigured S3 buckets, malicious insiders, ransomware.

---

## When Must You Report?

**To the ICO (UK) / your supervisory authority (EU):**  
When a breach is likely to result in a risk to individuals' rights and freedoms.

**To individuals:**  
When a breach is likely to result in **high risk** to individuals — which generally means: passwords, financial data, health data, or identity theft risk.

**You do NOT need to report if:**
- Data is encrypted and the key is not compromised
- The breach is unlikely to result in any risk

> When in doubt, report. Failing to report when required is a separate violation from the breach itself.

---

## The 72-Hour Timeline

```
T+0:   Become aware of a breach
T+72:  Deadline to notify ICO/supervisory authority

You can submit an initial report and update it as your investigation continues.
"We are still investigating and will provide updates" is acceptable.
```

---

## What to Report to the ICO

Submit via ico.org.uk/report-a-breach (UK). Include:

1. **Nature of the breach** — what happened, how, when discovered
2. **Categories of personal data** — email? health? payment?
3. **Approximate number of records/individuals affected**
4. **Likely consequences** — what could happen to affected individuals?
5. **Measures taken or proposed** — containment, remediation, notification
6. **Contact details** — DPO or nominated contact for follow-up

---

## What to Tell Affected Individuals

When notifying individuals, include:
- Name and contact details of your organisation
- Name and contact details of your DPO (if applicable)
- Description of what happened
- Description of the likely consequences
- Measures taken to address the breach
- Measures individuals can take to protect themselves (e.g., change password)

---

## Notification Template

```
Subject: Important notice about your [App Name] account data

Dear [Name / user],

We are writing to inform you of a security incident that occurred on [date].

**What happened**
[Brief factual description.]

**Your data that may have been affected**
[Specific data types.]

**What we have done**
[Specific containment and remediation actions.]

**What you should do**
- [Action 1]
- [Action 2]

If you have questions, contact us at [data protection contact].

[Name]
[App Name]
[Date]
```

---

## Checklist

- [ ] Incident detected and breach confirmed
- [ ] ICO/supervisory authority notified within 72 hours
- [ ] Breach documented (what happened, scope, actions taken)
- [ ] Affected individuals notified if high risk
- [ ] Notification records kept (who was notified, when)
- [ ] Remediation documented for regulatory follow-up

---

## Learn More

- [Post-Breach First 24 Hours](../15-post-breach/first-24-hours.md)
- [GDPR for Founders](./uk-gdpr-for-founders.md)
