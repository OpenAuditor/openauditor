# UK GDPR for Founders

The essentials of UK GDPR without the legal jargon — what you actually need to do.

---

## Does GDPR Apply to You?

UK GDPR applies if:
- You're based in the UK (UK GDPR applies)
- You're based anywhere else and process personal data of UK residents (UK GDPR applies)
- You're based anywhere else and process personal data of EU residents (EU GDPR applies)

If you have a single UK or EU user, GDPR applies to you. There's no revenue threshold.

"Personal data" means anything that could identify a living person — email address, IP address, cookie ID, name, location, and much more.

---

## The Core Principles (What You Must Do)

**1. Lawfulness, Fairness, Transparency**  
Tell users what you collect, why, and how. Don't do anything with data that would surprise them.

**2. Purpose Limitation**  
Collect data for a specific purpose. Don't use it for something else later.

**3. Data Minimisation**  
Collect only what you actually need. Don't collect email *and* phone *and* address if you only use email.

**4. Accuracy**  
Keep data accurate. Let users update it.

**5. Storage Limitation**  
Don't keep data forever. Define retention periods and stick to them.

**6. Integrity and Confidentiality**  
Protect the data from unauthorised access (this is the security requirement).

**7. Accountability**  
Be able to demonstrate you comply. Document your decisions.

---

## What You Must Have

**Privacy Policy:** Required. Must explain:
- What data you collect
- Why you collect it
- What legal basis you rely on
- Who you share it with
- How long you keep it
- Users' rights (access, deletion, objection, etc.)

**Cookie consent:** Required for non-essential cookies. See [Cookie Consent guide](./cookie-consent.md).

**Data Processing Register:** Not always legally required for small organisations, but recommended. A spreadsheet listing what data you process, why, and how long you keep it.

---

## Your Users' Rights

Users can:
- **Access** their data (Subject Access Request — respond within 30 days, free)
- **Correct** inaccurate data
- **Delete** their data (right to erasure)
- **Restrict** processing
- **Object** to processing
- **Port** their data (receive it in machine-readable format)

You need a process for each of these. The most common ones: data access and deletion.

---

## ICO Registration

Most UK organisations that process personal data must register with the ICO (Information Commissioner's Office). Fee: £40–£60/year for small organisations.

Check if you need to register: ico.org.uk/registration

---

## Common Mistakes

- **Collecting more than you need** — adds risk, violates minimisation
- **No retention policy** — keeping data forever is non-compliant
- **Sharing data with third parties without telling users** — analytics tools, email platforms
- **Not responding to subject access requests** — 30-day legal deadline
- **Treating "legitimate interests" as a blank cheque** — it's not

---

## The Practical Minimum for an MVP

1. ✓ Privacy policy (accurate, published)
2. ✓ Cookie banner (if using analytics/advertising cookies)
3. ✓ Email address to handle data requests (data@yourapp.com)
4. ✓ Ability to delete a user's data when they ask
5. ✓ Data processing agreements with vendors that handle your users' data (Supabase, Vercel, etc. — most have these in their ToS)

---

## Learn More

- [Lawful Basis](./lawful-basis.md)
- [Right to Erasure](./right-to-erasure.md)
- [Privacy by Design](./privacy-by-design.md)
- [GDPR Audit prompt](./prompts/gdpr-audit.md)
