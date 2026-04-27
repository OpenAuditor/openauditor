# Scoring Rubric

How the Production Readiness Audit calculates your security score.

---

## Score Calculation

**Total Points: 100**

Each of the 18 domains gets a score based on findings:

| Status | Points per Check |
|--------|-----------------|
| ✓ PASS | +5 points |
| ~ PARTIAL | +2 points |
| ✗ FAIL | 0 points |
| — NOT APPLICABLE | +5 points (doesn't count against you) |

**Formula:**
```
Total Score = (Sum of all check points / Total possible points) × 100
```

---

## Example Scoring

**Domain 1: Secrets and Environment Configuration (10 checks)**

If results are:
- 7 PASS = 7 × 5 = 35 points
- 2 PARTIAL = 2 × 2 = 4 points
- 1 FAIL = 1 × 0 = 0 points

**Domain score: 39 / 50 = 78%**

Across all 18 domains (~10 checks each, ~180 total checks):
- 130 PASS = 650 points
- 30 PARTIAL = 60 points
- 20 FAIL = 0 points

**Total: 710 / 900 = 79%**

---

## Verdict Bands

| Score Range | Verdict | Meaning |
|------------|---------|---------|
| 90–100 | 🟢 GREEN | Ship confidently. No critical issues. |
| 70–89 | 🟡 AMBER | Ship with caution. Plan fixes for high/medium issues. |
| 0–69 | 🔴 RED | Don't ship yet. Critical issues must be fixed. |

---

## What "GREEN" Means

- ✓ All critical findings are PASS or PARTIAL
- ✓ No FAIL on critical checks (secrets, auth, injection)
- ✓ Logging and monitoring are in place
- ✓ Incident response plan exists
- ✓ You have a deployable product

**You can ship now.** Non-critical issues can be fixed post-launch.

---

## What "AMBER" Means

- ⚠️ Some high-severity issues exist (e.g., weak password hashing, missing rate limiting)
- ⚠️ No critical show-stoppers
- ⚠️ You have a plan to fix high/medium issues
- ⚠️ Security posture is acceptable but improvable

**You can ship, but fix issues within 30 days.** Prioritize high-severity findings first.

---

## What "RED" Means

- 🛑 Critical issues exist (hardcoded secrets, no auth, SQL injection risk, etc.)
- 🛑 You're not ready to ship
- 🛑 Fix critical findings before launch, or you will get hacked

**Don't ship.** Common RED findings:
- Secrets hardcoded in code
- No authentication on sensitive endpoints
- SQL injection risk
- No rate limiting (DDoS vulnerability)
- No logging or monitoring
- No incident response plan

---

## Critical vs. High vs. Medium vs. Low

**Critical (50 points if fixed)**
- Secrets in version control
- No auth on sensitive endpoints
- SQL injection, command injection, or XXE risks
- Broken access control (users accessing others' data)
- No HTTPS
- Hardcoded API keys

**High (25 points if fixed)**
- Weak password hashing (anything but bcrypt/Argon2)
- No rate limiting
- Missing CORS/CSP headers
- No file upload validation
- No logging of security events
- Expired TLS certificate

**Medium (10 points if fixed)**
- No 2FA on admin accounts
- Incomplete backup strategy
- No dependency scanning
- Outdated dependencies
- Missing security documentation
- No code review process

**Low (5 points if fixed)**
- No `.gitignore` file
- Debug mode on in production
- Missing HTTP security headers
- No privacy policy
- Incomplete incident response plan

---

## Weighting

All checks are weighted equally. A critical finding has the same point value as a low finding on the rubric.

**However:** The audit prioritizes critical findings in the remediation list. Fix critical issues first, regardless of point value.

---

## Score Interpretation Guide

**90–100: "You're shipping secure"**
- You've covered the fundamentals
- Your architecture is sound
- You have monitoring and logging
- Incident response is ready

**80–89: "Ship it, but watch for these"**
- You have a solid foundation
- Some gaps exist (usually in observability, testing, or compliance)
- Fix within 30–90 days
- Monitor for exploitation of unfixed gaps

**70–79: "Ship, but prioritize fixes"**
- You're functional, but not hardened
- Multiple medium/high issues exist
- High likelihood of breach if issues are exploited
- Allocate resources to security immediately post-launch

**60–69: "Risky. Reconsider timeline."**
- Your attack surface is large
- Critical issues exist or are about to
- Likelihood of breach in first 6 months is high
- Consider delaying launch to fix
- If you ship, have incident response on standby

**Below 60: "Don't ship."**
- Your app will likely be hacked
- Fix critical findings before launch
- This is not a judgment; it's math

---

## Re-audit Scoring

After you fix findings, re-run the audit on failed domains only:

1. **Failed Domains:** Only re-check domains with FAIL/PARTIAL findings
2. **New Score:** Recalculate only those domains
3. **Overall Impact:** If critical domain improved from 40% to 100%, this may bump overall score from RED to AMBER
4. **Frequency:** Re-audit weekly during fixes, monthly once in production

**Example:**
```
Initial audit: 65 (RED)

After fixes to critical domains:
- Secrets & env: 40% → 100% (+40 points)
- Auth: 50% → 90% (+20 points)
- API security: 60% → 100% (+20 points)

New score: 75 (AMBER) — Ship with caution
```

---

## Why This Rubric Works

- **Simple math:** No hidden factors or mysterious scores
- **Points for progress:** PARTIAL checks reward attempts
- **Emphasis on critical issues:** They block shipping (by recommendation)
- **Transparent:** You can see exactly why you got your score
- **Re-auditable:** Run it again later to track improvement

---

## Common Questions

**Q: My score is 72. Can I ship?**
A: Yes, but fix high-severity issues within 30 days. This is AMBER territory.

**Q: My score is 65. Can I ship?**
A: Not recommended. Fix critical findings first. You're RED.

**Q: My score went from 75 to 71. What happened?**
A: Either you found new issues (discovered during re-audit) or you changed something. Common causes: added a new dependency (vulnerable), disabled a security check, or changed infrastructure. Review what changed.

**Q: Can I negotiate the score?**
A: No. The score is based on objective checks. If you think a check is wrong, that's a finding to address, not a reason to change the score.

**Q: I fixed everything. Why is my score still 70?**
A: You probably didn't fix everything, or new issues were discovered. Re-audit to see what's still FAIL.

---

## Next Steps

1. Get your initial score
2. Create a remediation timeline based on severity
3. Fix critical issues before launch
4. Re-audit after fixes
5. Ship when you reach GREEN or AMBER with a fix plan

Go to [SKILL.md](./SKILL.md) to start the audit.
