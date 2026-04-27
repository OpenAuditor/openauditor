# Lawful Basis for Processing

Under GDPR, every time you process personal data you must have a valid legal basis. "Because it's useful" is not a legal basis.

---

## The Six Lawful Bases

| Basis | When It Applies | Examples |
|-------|----------------|---------|
| **Consent** | User gives clear, specific, informed agreement | Marketing emails, optional analytics |
| **Contract** | Processing necessary to fulfil a contract | Delivering the service the user signed up for |
| **Legal obligation** | Processing required by law | Keeping financial records for HMRC |
| **Vital interests** | Life or death situations | Emergency health information |
| **Public task** | Government/public authority functions | Rarely applies to SaaS |
| **Legitimate interests** | Your interests don't override user rights | Fraud prevention, security logging |

---

## Which Basis Applies to Your SaaS?

**Core service delivery → Contract**  
When a user creates an account to use your product, you can process their email and account data to provide the service. You don't need consent for this.

```
User signs up for an email newsletter tool → you process their email to send them the newsletter.
Lawful basis: Contract (delivering the subscribed service)
```

**Marketing emails → Consent**  
You need consent for marketing that the user hasn't specifically signed up for. Soft opt-in may apply in some jurisdictions (user is a customer and the email is about similar products).

**Analytics → Legitimate interests or Consent**  
Privacy-preserving analytics (Plausible, Fathom) may qualify for legitimate interests. Google Analytics with cookie tracking requires consent.

**Security logging → Legitimate interests**  
Logging IP addresses and auth events for security purposes typically qualifies as legitimate interests — your interest in security doesn't override user rights.

**Fraud prevention → Legitimate interests**  
Checking payments for fraud patterns is a legitimate interest that can be balanced against user privacy.

---

## Consent: How to Do It Right

Valid consent must be:
- **Freely given** — not bundled with terms of service, not required for service access
- **Specific** — for a specific purpose, not a blanket agreement
- **Informed** — users must know what they're consenting to
- **Unambiguous** — clear affirmative action (not pre-ticked boxes)

```javascript
// WRONG — consent bundled with terms, pre-selected
<input type="checkbox" checked name="marketing" />
By creating an account you agree to marketing emails.

// RIGHT — separate, explicit, not required
<input type="checkbox" name="marketing" />  // not checked by default
I'd like to receive product updates and newsletter (optional)
```

---

## Legitimate Interests: When to Use It

Legitimate interests is not a free pass. You must conduct a three-part test:

1. **Purpose test:** Is there a genuine legitimate interest?
2. **Necessity test:** Is processing necessary for that purpose?
3. **Balancing test:** Do user privacy rights override your interests?

Document this test. If users would be surprised by the processing, it likely fails the balancing test.

---

## What to Document

In your Privacy Policy, state the lawful basis for each type of processing:

```
| Processing Activity | Lawful Basis |
|---------------------|-------------|
| Account registration and service delivery | Contract |
| Security and fraud prevention logging | Legitimate interests |
| Marketing emails (opted-in users) | Consent |
| Accounting records | Legal obligation |
| Crash reporting analytics | Legitimate interests |
```

---

## Learn More

- [UK GDPR for Founders](./uk-gdpr-for-founders.md)
- [Cookie Consent](./cookie-consent.md)
