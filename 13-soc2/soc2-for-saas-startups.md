# SOC 2 for SaaS Startups: The Practical Path

This guide assumes you are a SaaS company, likely on AWS/GCP/Azure, with a small engineering team, and you want to achieve SOC 2 Type I followed by Type II.

---

## The Timeline at a Glance

```
Month 0        Month 1-2         Month 3          Month 4-14        Month 15
   |               |                |                  |                |
Kickoff         Readiness        Evidence           Type II           Type II
& Gap           Assessment       Collection         Observation       Report
Assessment      & Policy         & Type I           Period            Issued
                Writing          Audit
                                 Issued
```

**Type I: ~3 months**
**Type II: 6–12 months after Type I** (minimum 6-month observation window)

---

## Phase 1: Readiness (Weeks 1–4)

### What happens
- Gap assessment: where are you now vs. what SOC 2 requires?
- Scope definition: which systems are in scope? Which TSCs?
- Policy writing: drafting the 10–15 policies auditors expect
- Control mapping: identifying which controls you have, which you need to build

### What you produce
- Scope document
- Risk assessment
- Policy library (see `policy-templates/` folder)
- Control matrix

### Common gaps at this stage
- No formal access review process
- MFA not enforced on all production systems
- No documented incident response plan
- No vendor management programme
- Security training not tracked

### Typical effort
- 2–3 weeks of focused work for a 10–20 person company
- Use a compliance platform (Vanta, Drata, etc.) to automate evidence collection and reduce effort by 40–60%

---

## Phase 2: Gap Remediation (Weeks 4–10)

### What you build

| Gap | Typical Fix | Time to Implement |
|---|---|---|
| No MFA on production | Enforce MFA in AWS IAM / GCP / Okta | 1–2 days |
| No access reviews | Set up quarterly review in HR system or spreadsheet | 1 week |
| No security training | Deploy KnowBe4, Curricula, or free alternatives | 1–2 weeks |
| No vulnerability scanning | Add Snyk, Dependabot, or AWS Inspector | 2–3 days |
| No endpoint management | Deploy Jamf (Mac) or Intune | 1–2 weeks |
| No incident response plan | Write and table-top test a basic IR plan | 1 week |
| No penetration test | Schedule with a pen test firm | 4–6 weeks lead time |

### Key documents to have before the audit
- Information Security Policy
- Access Control Policy
- Incident Response Policy
- Change Management Policy
- Data Retention Policy
- Vendor Management Policy
- Acceptable Use Policy
- Business Continuity Plan

---

## Phase 3: Type I Audit (Weeks 10–12)

### What the auditor does
- Reviews your policies and procedures
- Interviews key personnel (typically your CTO, Head of Engineering, maybe a DevOps engineer)
- Samples evidence you have collected
- Assesses whether controls are **designed** appropriately

### What auditors actually check (common samples)

**Access Management**
- List of users with production access — are roles appropriate?
- Evidence of the last access review — who approved it? When?
- Evidence that a departed employee's access was revoked within 24–48 hours
- MFA configuration screenshots for production systems

**Change Management**
- 5–10 recent pull requests — do they have code reviews?
- Evidence of a deployment approval for a recent release
- A record of a change that was rejected or rolled back

**Incident Response**
- A recent incident ticket with timeline, containment steps, and resolution
- Evidence the IR plan was reviewed in the last 12 months
- On-call schedule or alerting configuration

**Vendor Management**
- List of critical vendors
- Security review evidence for your top 3–5 vendors
- Sub-processor list for your privacy notice

**Security Training**
- Completion records showing all employees completed training
- Date of training completion vs. hire date

### Common reasons auditors issue exceptions
- Policy exists but there is no evidence it was followed
- Access review was done but undocumented
- MFA is enforced for some users but not all (especially contractors)
- No evidence of background checks for employees with privileged access

---

## Phase 4: Type II Observation Period (Months 4–14)

### What changes
You must now **operate** your controls consistently over 6–12 months. Auditors will sample evidence from across the observation period, not just one point in time.

### What this means in practice
- Run access reviews every quarter — and document them every time
- Log every incident, even minor ones — auditors want to see the process working
- Complete security training for every new hire within 30 days
- Review vendor risk at least annually — document it
- Do not skip change management process even under deadline pressure

### What auditors sample for Type II
- 25–30 change tickets (do they all show code review approval?)
- 10–15 user provisioning/deprovisioning events (all done within policy timeframes?)
- All incidents in the period (were they handled per the IR plan?)
- Security training records for every employee hired during the period
- Evidence of quarterly access reviews (all four quarters)

---

## Cost Breakdown

### Type I

| Item | Cost Range |
|---|---|
| Compliance platform (Vanta/Drata/etc.) — annual | £8,000–£25,000/year |
| Auditor fees (CPA firm) — Type I | £5,000–£15,000 |
| Penetration test | £5,000–£15,000 |
| Internal engineering time (remediation) | 2–6 weeks of eng time |
| **Total (first year)** | **~£20,000–£60,000** |

### Type II (incremental)

| Item | Cost Range |
|---|---|
| Auditor fees (Type II audit) | £15,000–£40,000 |
| Continued compliance platform | Included in annual above |
| **Total (Type II increment)** | **~£15,000–£40,000** |

### Cost reduction strategies
- Choose a narrower scope (Security criterion only, fewer systems in scope)
- Use a compliance platform to reduce auditor time
- Use an auditor that partners with your compliance platform (discounts common)
- Start Type I and Type II with the same firm — they know your environment

---

## Choosing an Auditor

Look for a CPA firm that:
- Specialises in SOC 2 (not a general accountancy firm that also does SOC 2)
- Has experience with your cloud provider (AWS, GCP, Azure)
- Integrates with your compliance platform
- Has transparent pricing

**Questions to ask potential auditors:**
- How many SOC 2 audits do you complete per year?
- Do you have experience with [your tech stack]?
- What is included vs. billed extra?
- What is your process for issuing exceptions?
- Can you provide references from similar-sized companies?

---

## What Auditors Actually Want

Auditors want to see that your controls are:
1. **Documented** — written down somewhere
2. **Communicated** — staff know about them
3. **Followed** — there is evidence they are actually being used
4. **Reviewed** — periodically checked and updated

A perfect policy that nobody follows is worse than an informal process that is consistently documented. **Evidence of operation matters more than elegant documentation.**

---

> **Note:** Costs and timelines vary significantly based on company size, infrastructure complexity, and auditor. Consult a qualified CPA and get multiple quotes before starting.
