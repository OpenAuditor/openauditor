# SOC 2: What It Is and Whether You Need It

## What Is SOC 2?

SOC 2 (System and Organisation Controls 2) is a security compliance framework developed by the American Institute of Certified Public Accountants (AICPA). It provides a standardised way to demonstrate that your organisation handles customer data securely and responsibly.

A SOC 2 report is produced by an independent auditor who evaluates your systems against one or more of the five Trust Service Criteria (TSCs):

- **Security** (mandatory)
- **Availability**
- **Processing Integrity**
- **Confidentiality**
- **Privacy**

## Type I vs Type II

| | SOC 2 Type I | SOC 2 Type II |
|---|---|---|
| **What it proves** | Controls are designed appropriately at a point in time | Controls are operating effectively over a period of time |
| **Audit window** | Single point in time | Typically 6–12 months |
| **Time to achieve** | ~3 months | ~6–12 months from Type I |
| **Cost** | £5,000–£20,000 | £15,000–£50,000+ |
| **Who asks for it** | Enterprise prospects, early-stage deals | Large enterprise, regulated industries, government |
| **Value** | Quick credibility signal | Stronger assurance, required by many enterprises |

## Do You Need SOC 2?

### You almost certainly need it if:
- You sell B2B SaaS to mid-market or enterprise customers
- Your customers are in regulated industries (finance, healthcare, legal)
- US enterprise prospects include it in their vendor security questionnaires
- A deal has stalled because you couldn't answer "do you have SOC 2?"

### You probably don't need it yet if:
- You are pre-revenue or have fewer than 10 customers
- All your customers are consumers (B2C)
- Your customers are small businesses that don't ask for it
- You don't handle sensitive personal data

### Consider alternatives first:
- **ISO 27001** — more recognised outside the US, broader scope
- **Cyber Essentials** — UK government scheme, lower cost, good starting point
- **Self-assessment questionnaire** — some customers accept a completed VSQ
- **SOC 2 readiness report** — cheaper, no audit opinion, useful early on

## The Cost of Not Having SOC 2

The cost of not having SOC 2 is measured in lost deals. A single blocked enterprise contract worth £50,000–£500,000 ARR typically dwarfs the cost of the certification. The better question is not "can we afford SOC 2?" but "what deals are we losing without it?"

## Common Misconceptions

**"SOC 2 means we're secure."**
No. SOC 2 means you have documented controls and an auditor observed them working. A poorly designed control can still pass an audit.

**"We need to pass a test."**
SOC 2 is not a pass/fail exam. Auditors issue an opinion. A qualified opinion (with exceptions noted) is not the end of the world.

**"It takes a year."**
Type I can be achieved in as little as 8–12 weeks if you are already well-organised. Type II requires a minimum observation period, typically 6 months.

**"We need to be a big company."**
Startups with 10–20 employees regularly achieve SOC 2. The effort scales with your infrastructure complexity, not your headcount.

## What's In This Section

| File | Contents |
|---|---|
| `trust-service-criteria.md` | The 5 TSCs explained with example controls |
| `soc2-for-saas-startups.md` | Practical timeline, cost, and what auditors check |
| `evidence-collection.md` | Exactly what auditors ask for |
| `tools.md` | Vanta, Drata, Tugboat Logic, Secureframe comparison |
| `policy-templates/` | Ready-to-use policy templates |
| `prompts/soc2-readiness-audit.md` | Agent prompt to audit your SOC 2 readiness |

---

> **Legal note:** This guide provides general information only. Consult a qualified CPA or SOC 2 auditor for advice specific to your organisation.
