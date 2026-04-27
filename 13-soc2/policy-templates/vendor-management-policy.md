# Vendor Management Policy

**Version:** 1.0  
**Effective Date:** [DATE]  
**Owner:** [Name/Role]  
**Review Schedule:** Annual

---

> **Instructions:** Replace all `[PLACEHOLDER]` text. This template covers SOC 2 Trust Service Criteria CC9.2 (Vendor and Business Partner Risk Management).

---

## 1. Purpose

This policy ensures [COMPANY NAME] appropriately assesses and manages the risks introduced by third-party vendors, including SaaS providers, sub-processors, and contractors who access our systems or customer data.

## 2. Scope

This policy applies to all third parties who:
- Access [COMPANY NAME] systems, networks, or facilities
- Process personal data on our behalf (sub-processors under GDPR)
- Provide critical services upon which our systems depend (cloud infrastructure, DNS, payments)

## 3. Vendor Risk Classification

| Tier | Description | Examples | Review Frequency |
|------|-------------|---------|-----------------|
| Critical | Access to production data or customer PII; core infrastructure | AWS, Supabase, Stripe, Vercel | Annual security review |
| High | Access to internal systems; significant data processing | GitHub, Google Workspace, Slack, Datadog | Annual review |
| Medium | Limited data access; non-critical services | Project management, analytics | Every 2 years |
| Low | No data access; incidental contact | Office supplies, couriers | On procurement only |

---

## 4. Procurement Process

Before engaging a new Critical or High-tier vendor:

### 4.1 Security Assessment

Complete the Vendor Security Questionnaire covering:
- Data storage location (UK/EEA for GDPR compliance)
- Subprocessor list
- Incident response and breach notification processes
- Penetration testing frequency
- Certifications: SOC 2, ISO 27001, PCI DSS (as applicable)
- Data deletion processes

**Minimum acceptable standards for Critical vendors:**
- SOC 2 Type II or ISO 27001 certification (or equivalent)
- Breach notification within 24-48 hours
- Data processing only in UK/EEA unless documented adequacy or SCCs in place
- Clear data deletion process within 30 days of contract termination

### 4.2 Contractual Requirements

All Critical and High-tier vendors must sign:
- **Data Processing Agreement (DPA)** — required for any GDPR sub-processors
- **Confidentiality Agreement** — for vendors with access to confidential data

The DPA must include:
- Processing only on [COMPANY NAME]'s instructions
- Sub-processor obligations
- Security measures (technical and organisational)
- Breach notification obligations
- Data deletion/return at contract end
- Right to audit

### 4.3 Approval

New vendor onboarding requires approval from:
- Critical tier: [CISO/CTO] + [CFO/CEO]
- High tier: [CISO/CTO]
- Medium tier: [Department Head]

---

## 5. Ongoing Vendor Monitoring

### 5.1 Annual Review

For Critical vendors:
1. Request updated SOC 2 report or security certification
2. Review any incidents the vendor disclosed during the year
3. Confirm DPA is still current and covers all data processing
4. Verify sub-processor list hasn't changed (or approve changes)
5. Reassess risk classification

### 5.2 Continuous Monitoring

- Subscribe to vendor security bulletins and incident notifications
- Monitor for vendor breach disclosures via BreachWatch or similar
- Review vendor's security page and trust portal periodically

### 5.3 Incident Notification

Critical and High vendors must notify [COMPANY NAME] of security incidents affecting our data within [48 hours]. Notification should go to [SECURITY EMAIL].

---

## 6. Vendor Access Management

Vendor access to [COMPANY NAME] systems:
- Is time-limited (expires with contract)
- Is scoped to the minimum required
- Is reviewed quarterly in the access review process
- Is revoked immediately on contract termination
- Is logged via our access management system

Vendors must:
- Use MFA for any access to our systems
- Not share credentials between individuals
- Report suspected compromise immediately

---

## 7. Sub-Processor Register

[COMPANY NAME] maintains a register of all sub-processors (vendors who process customer personal data). The register is reviewed and published at [URL / PRIVACY POLICY] in accordance with GDPR transparency requirements.

Current sub-processors: [LINK TO SUB-PROCESSOR LIST]

When adding a new sub-processor who will process customer personal data:
1. Obtain DPA with the sub-processor
2. Update the sub-processor register
3. Notify customers if required by our DPA with them (typically via privacy policy update with 30 days' notice)

---

## 8. Contract Termination

On vendor contract termination:
1. Revoke all vendor access within [24 hours]
2. Request data deletion within [30 days]
3. Obtain written confirmation of deletion
4. Remove vendor from sub-processor register (if applicable)
5. Notify customers of sub-processor change if applicable

---

## 9. Responsibilities

| Role | Responsibility |
|------|---------------|
| Business owners | Identify new vendor needs; complete security assessment questionnaire |
| CISO/Security | Review security assessments; approve Critical/High vendors |
| Legal | Review and execute DPAs; maintain sub-processor register |
| Finance/Procurement | Ensure contracts include required security clauses |
| IT | Manage vendor access; revoke on contract termination |

---

## 10. Policy Review

This policy is reviewed annually by [OWNER] or when significant vendor relationships change.

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [DATE] | [NAME] | Initial version |
