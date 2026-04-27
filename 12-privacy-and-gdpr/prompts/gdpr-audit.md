# Prompt: GDPR Audit

## When to use this

Use this when launching a product with EU/UK users, when entering a new market, or after adding features that collect new types of data. Better to audit now than to receive an ICO complaint.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a GDPR compliance advisor. Audit this application for GDPR compliance gaps and produce a prioritised action plan.

**Step 1: Data Inventory**
Examine the codebase and identify every type of personal data collected:
- What fields are collected at registration and in user profiles?
- What is logged (IP addresses, user agents, events)?
- What is stored in analytics or error tracking tools?
- What cookies are set?
- What data is shared with third-party services?

List each data type with: what it is, why it's collected, and where it's stored.

**Step 2: Lawful Basis Check**
For each data type, identify the likely lawful basis:
- Contract (necessary for service delivery)
- Consent (user opted in)
- Legitimate interests (justified with balancing test)
- Legal obligation

Flag any processing that lacks a clear lawful basis.

**Step 3: Privacy Policy Review**
If a privacy policy exists, check whether it accurately describes:
- What data is collected
- Why it's collected
- Who it's shared with
- How long it's retained
- Users' rights (access, deletion, objection, portability)
- Contact details for data requests

If no privacy policy exists, flag as Critical.

**Step 4: User Rights Implementation**
Check whether these rights are implemented:
- Right of access (can users request their data?) — 30-day deadline
- Right to erasure (can users delete their account and data?)
- Right to object (can users opt out of processing?)
- Right to portability (can users export their data?)

**Step 5: Cookie Audit**
List all cookies set by the application. For each:
- Is it strictly necessary or optional?
- If optional: is consent collected before setting it?

**Step 6: Data Retention**
Are retention periods defined for each data type?
Is retention automatically enforced, or manual?
Is any data retained indefinitely without justification?

**Step 7: Third-Party Processors**
List all third-party services that process personal data (email provider, analytics, error tracking, payment processor).
For each: do you have a Data Processing Agreement (DPA) in place?

**Findings format:**
For each finding:
- **Priority:** Critical / High / Medium / Low
- **Issue:** What's wrong
- **Legal basis for concern:** Which GDPR article applies
- **Fix:** Specific action to take
- **Effort:** Hours/days

---

## What to expect

A complete GDPR compliance audit with every gap prioritised. You'll get: a data inventory, lawful basis analysis, identification of missing user rights implementation, cookie consent gaps, and a to-do list with effort estimates.

## Learn more

[UK GDPR for Founders](../uk-gdpr-for-founders.md)
