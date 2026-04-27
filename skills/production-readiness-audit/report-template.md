# Audit Report Template

Use this template to document your Production Readiness Audit results.

---

# Production Readiness Audit Report

**Application:** [App Name]  
**Audit Date:** [Date]  
**Auditor:** [Your Name / Agent Name]  
**Version:** v1.0  

---

## Executive Summary

**Overall Score:** [0–100]  
**Verdict:** 🟢 GREEN / 🟡 AMBER / 🔴 RED  

**In Plain English:**
[One paragraph summarizing the overall security posture. Example: "This application is ready to ship with standard production monitoring. Three high-severity issues should be fixed within 30 days."]

---

## Key Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | X | [status] |
| High | X | [status] |
| Medium | X | [status] |
| Low | X | [status] |

**Total issues:** X (Y fixed, Z remaining)

---

## Verdict Details

### 🟢 GREEN — Ship Confidently (90–100)
Your application meets baseline production security standards. You're ready to launch.

### 🟡 AMBER — Ship with Caution (70–89)
Your application is functionally secure, but has gaps. Plan to fix high/medium issues within 30 days of launch. Monitor for exploitation of unfixed issues.

### 🔴 RED — Don't Ship (0–69)
Your application has critical security issues that must be fixed before launch. Shipping now will likely result in compromise within weeks.

**Current verdict:** [Choose one and explain why]

---

## Domain Scores

| Domain | Score | Status | Priority |
|--------|-------|--------|----------|
| 1. Secrets & Environment | [%] | PASS / PARTIAL / FAIL | — |
| 2. Dependencies & Supply Chain | [%] | PASS / PARTIAL / FAIL | — |
| 3. Authentication | [%] | PASS / PARTIAL / FAIL | — |
| 4. Authorization | [%] | PASS / PARTIAL / FAIL | — |
| 5. Input Validation | [%] | PASS / PARTIAL / FAIL | — |
| 6. Security Headers & CORS | [%] | PASS / PARTIAL / FAIL | — |
| 7. Database Security | [%] | PASS / PARTIAL / FAIL | — |
| 8. API Security | [%] | PASS / PARTIAL / FAIL | — |
| 9. File Upload Security | [%] | PASS / PARTIAL / FAIL | — |
| 10. Error Handling | [%] | PASS / PARTIAL / FAIL | — |
| 11. Logging & Monitoring | [%] | PASS / PARTIAL / FAIL | — |
| 12. CI/CD Security | [%] | PASS / PARTIAL / FAIL | — |
| 13. Preview/Staging | [%] | PASS / PARTIAL / FAIL | — |
| 14. DNS & Domain | [%] | PASS / PARTIAL / FAIL | — |
| 15. Third-Party Scripts | [%] | PASS / PARTIAL / FAIL | — |
| 16. Privacy & Data | [%] | PASS / PARTIAL / FAIL | — |
| 17. Backup & Recovery | [%] | PASS / PARTIAL / FAIL | — |
| 18. Incident Response | [%] | PASS / PARTIAL / FAIL | — |

---

## Remediation List (By Severity)

### 🛑 Critical (Fix Before Launch)

#### 1. [Issue Title]
**Domain:** [Domain name]  
**Severity:** Critical  
**Status:** FAIL  
**Risk:** [Plain-English explanation of what breaks if this is ignored. Include real-world breach example if applicable.]

**The Fix:**
[Step-by-step instructions or code example to fix this issue.]

**Why This Matters:**
[Real-world consequence. Why did companies get hacked because of this?]

**Learn More:** [Link to relevant OpenAuditor section]

**Estimated Time to Fix:** [Hours/days]

---

#### 2. [Next critical issue]
[Repeat template above]

---

### 🟠 High (Fix Within 30 Days)

#### 1. [Issue Title]
[Repeat critical template]

---

### 🟡 Medium (Fix Within 90 Days)

#### 1. [Issue Title]
[Repeat critical template]

---

### 🔵 Low (Document, Fix When Possible)

#### 1. [Issue Title]
[Repeat critical template]

---

## Application Context (From Discovery Interview)

**App Name:** [Name]  
**Description:** [What it does]  
**Users:** [Who uses it]  
**Launch Date:** [When launching]  
**Sensitive Data Handled:** [PII, payments, etc.]  
**Team Size:** [X developers]  
**Regulated Industry:** [Yes/no, which]  

### Technology Stack

**Frontend:** [Next.js, React, etc.]  
**Backend:** [Node.js, Python, etc.]  
**Database:** [PostgreSQL, Supabase, etc.]  
**Hosting:** [Vercel, AWS, etc.]  
**CI/CD:** [GitHub Actions, etc.]  

---

## Recommendations

### Immediate Actions (Before Launch)
1. [Critical fix 1]
2. [Critical fix 2]
3. [High fix if blocking launch]

### Post-Launch (30-Day Plan)
1. [High fix 1]
2. [High fix 2]
3. [Medium fix 1]

### Long-Term (90 Days)
1. [Medium fix X]
2. [Low fix Y]
3. [Process improvements]

---

## Re-audit Protocol

After fixing issues, re-run this audit on the failed domains:

**Domains to Re-Audit:**
- [ ] Domain 1
- [ ] Domain 2
- [ ] [etc.]

**Re-Audit Cadence:**
- [ ] Weekly (during active fixes)
- [ ] Biweekly (after initial fixes done)
- [ ] Monthly (ongoing verification)

**Re-audit Success Criteria:**
- [ ] Critical domains: 90%+
- [ ] High-severity domains: 80%+
- [ ] Overall score: 75+ (AMBER minimum)

---

## Approval & Sign-Off

**App Owner:** [Name]  
**Security Reviewer:** [Name]  
**Launch Approved?** [ ] YES [ ] NO  
**Approved By:** [Name, title]  
**Date:** [Date]  

**Caveats:**
[Any assumptions, limitations, or caveats about this audit. Example: "Audit does not include load testing. Audit assumes AWS security groups are configured correctly (not verified)."]

---

## Appendix: Detailed Findings

### Domain 1: Secrets and Environment Configuration

| Check | Status | Notes |
|-------|--------|-------|
| No secrets committed to git | ✓ PASS | .gitignore correctly excludes .env files |
| Production .env never committed | ✓ PASS | Uses GitHub secrets for CI/CD |
| Secrets use environment variables | ~ PARTIAL | API keys in env, but JWT signing key hardcoded in code |
| [Next check] | ✗ FAIL | [Notes] |

---

[Repeat this table for all 18 domains]

---

## Questions?

For clarification on any finding, see:
- [OpenAuditor README](../../README.md)
- [START-HERE guide](../../START-HERE.md)
- [Relevant domain guide in OpenAuditor]

For help implementing fixes:
- [PROMPTS.md](../../PROMPTS.md) has copy-paste agent prompts for each issue
- [OpenAuditor sections] have code examples and deep dives

---

**Report Generated:** [Date and time]  
**Next Re-audit:** [Date]
