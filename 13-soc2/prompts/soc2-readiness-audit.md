# Prompt: SOC 2 Readiness Audit

## When to use this

Use this 6-12 months before your planned SOC 2 audit, or when a prospect asks "are you SOC 2 compliant?" and you need to assess your current state. This gives you an honest gap analysis — not preparation theatre.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a SOC 2 readiness assessor. Evaluate the technical controls in this application against the SOC 2 Trust Service Criteria (TSC). Focus on CC6 (Logical and Physical Access), CC7 (System Operations), CC8 (Change Management), and CC9 (Risk Mitigation).

**Step 1: Review the technical stack**

Identify:
- Cloud provider(s) in use (AWS, GCP, Azure, Vercel, etc.)
- Database(s) and where they're hosted
- Authentication system
- Logging and monitoring tools
- CI/CD pipeline
- Secret management approach

**Step 2: Assess CC6 — Logical and Physical Access Controls**

Check each of these:

**CC6.1 — Logical access security:**
- [ ] Is MFA enforced for all production access?
- [ ] Is there a formal user provisioning/deprovisioning process?
- [ ] Are access reviews conducted at least quarterly?
- [ ] Are privileged/admin accounts separate from regular accounts?

Evidence needed: Screenshots of MFA enforcement settings, access review records, user list.

**CC6.2 — New user registration:**
- [ ] Is there a documented onboarding process for new employees?
- [ ] Are access requests documented with business justification?

**CC6.3 — Modification and removal of access:**
- [ ] Is offboarding documented with timelines?
- [ ] Are access changes logged?

**CC6.6 — Boundary protection:**
- [ ] Are all externally exposed endpoints inventoried?
- [ ] Is there a WAF or API gateway?
- [ ] Are unnecessary ports and services closed?

**CC6.7 — Encryption in transit and at rest:**
- [ ] Is HTTPS enforced everywhere?
- [ ] Are databases encrypted at rest?
- [ ] Are backups encrypted?

For each item: report current status, evidence available, and what's missing.

**Step 3: Assess CC7 — System Operations**

**CC7.1 — Detection of anomalies:**
- [ ] Is there centralised logging?
- [ ] Are logs retained for ≥90 days?
- [ ] Are there alerts for security events (failed logins, error spikes)?

**CC7.2 — Monitoring:**
- [ ] Is there uptime monitoring?
- [ ] Are security alerts sent to the right people?
- [ ] Is there a documented process for investigating alerts?

**CC7.3 — Incident response:**
- [ ] Is there a written incident response plan?
- [ ] Have roles been assigned (incident commander, communications)?
- [ ] Has the plan been tested in the last 12 months?

**CC7.4 — Response to incidents:**
- [ ] Is there a post-mortem process?
- [ ] Are post-mortems documented and retained?

For each item: current status, evidence, and gaps.

**Step 4: Assess CC8 — Change Management**

**CC8.1 — Changes to infrastructure and software:**
- [ ] Is there a code review process (PR reviews required)?
- [ ] Is there branch protection on the main branch?
- [ ] Are CI tests required to pass before deployment?
- [ ] Are production deployments logged?
- [ ] Is there a rollback capability?

Check the repository settings and CI/CD configuration and report findings.

**Step 5: Assess CC9 — Risk Mitigation**

**CC9.2 — Vendor management:**
- [ ] Is there a list of critical vendors?
- [ ] Do critical vendors have SOC 2 or equivalent certifications?
- [ ] Are Data Processing Agreements (DPAs) in place for vendors who process personal data?

List the top 5 critical vendors and their certification status.

**Step 6: Assess availability controls (if Availability TSC in scope)**

- [ ] Are backups configured and tested?
- [ ] Is there a documented recovery time objective (RTO) and recovery point objective (RPO)?
- [ ] Has a backup restore been tested in the last 12 months?
- [ ] Is there a business continuity plan?

**Step 7: Gap analysis and prioritised remediation**

Produce a gap analysis table:

| TSC | Control | Status | Gap | Priority | Effort |
|-----|---------|--------|-----|----------|--------|
| CC6.1 | MFA enforced | ✗ Fail | MFA not required for GitHub | P0 | Low |
| CC7.3 | Incident response plan | ✗ Fail | No documented plan | P1 | Medium |
| CC8.1 | Branch protection | ✓ Pass | Required reviews in place | — | — |

**Priority:**
- P0: Auditors will flag this as a finding — fix before the audit window
- P1: Should be in place but some auditors may accept compensating controls
- P2: Good practice, strengthens the audit

**Effort:**
- Low: < 1 day (add a config setting, screenshot, write a short policy)
- Medium: 1-5 days (write a policy + implement tooling)
- High: > 5 days (significant process change or technical implementation)

**Step 8: Quick wins to implement now**

For each P0 and P1 gap with Low effort, implement the fix immediately:
- Enable MFA enforcement
- Enable branch protection with required reviews
- Configure log retention
- Create incident response document from template

---

## What to expect

A complete SOC 2 readiness gap analysis: current status for each major control, gap list with priority and effort, implemented quick wins, and a prioritised roadmap for the remaining gaps.

## Learn more

[SOC 2 README](../README.md)
[Policy Templates](../policy-templates/access-control-policy.md)
[SOC 2 Tools](../tools.md)
