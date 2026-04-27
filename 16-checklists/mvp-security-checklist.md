# MVP Security Checklist

**25 critical security items for rapid MVP launches**

Use this checklist when you need to launch quickly but safely. Focus on highest-impact vulnerabilities that prevent most attacks. Estimated time: 1-2 hours.

> **Note**: This is the minimum viable security baseline. Upgrade to `pre-launch-checklist.md` before production if possible.

---

## Authentication & Authorization (5 items)

- [ ] All user passwords enforced: minimum 12 characters, complexity required
- [ ] No hardcoded credentials in code or environment files
- [ ] Authentication endpoints protected with rate limiting (max 5 failed login attempts/minute)
- [ ] Session tokens expire after 24 hours (or configurable based on app needs)
- [ ] Admin panels require separate authentication from user accounts

**Why this matters**: The majority of breaches (43%) involve credential compromise. Weak auth is the path of least resistance for attackers.

---

## Data Protection (4 items)

- [ ] All network traffic uses HTTPS/TLS (no HTTP)
- [ ] Sensitive data encrypted at rest in database
- [ ] Passwords hashed with bcrypt (or equivalent: Argon2, scrypt)
- [ ] Database credentials stored in environment variables, never in code

**Why this matters**: Twitch (2021) exposed millions of credentials because OAuth tokens were logged in plaintext. Capital One (2019) was breached through unencrypted data in cloud storage.

**Quick reference - Hashing:**
- ✅ Use: bcrypt, Argon2, PBKDF2
- ❌ Don't use: MD5, SHA-1, unsalted hashing

---

## Application Security (4 items)

- [ ] Input validation on all forms (reject special characters, enforce length limits)
- [ ] SQL injection prevention implemented (use parameterized queries everywhere)
- [ ] Cross-site scripting (XSS) prevention: escape all user input in templates
- [ ] CORS configured to allow only trusted domains (not `*`)

**Why this matters**: OWASP Top 10 #1 is broken access control. #2 is cryptographic failures. These 4 items prevent the worst attacks in those categories.

---

## Dependencies & Vulnerabilities (3 items)

- [ ] No abandoned or unmaintained dependencies
- [ ] Dependency audit run in CI: `npm audit`, `pip audit`, or equivalent
- [ ] All critical/high severity vulnerabilities patched before launch

**Why this matters**: 80% of breaches exploit known vulnerabilities. Equifax (2017) was breached through a 2-month-old unpatched vulnerability.

**How to check:**
```bash
npm audit --production
# or
pip audit
```

---

## Secrets & Configuration (3 items)

- [ ] No API keys, database passwords, or tokens in git history
- [ ] `.env` files in `.gitignore` (check: does your repo have these files?)
- [ ] Production secrets stored only in secure secret management system
  - Examples: AWS Secrets Manager, HashiCorp Vault, Supabase secrets

**Why this matters**: 92% of credential breaches happen because secrets are committed to git. Attackers scan public repos specifically for credentials.

**Quick scan:**
```bash
git log -p --all | grep -i "password\|api_key\|secret" | head -20
```

---

## Infrastructure & Deployment (3 items)

- [ ] Database backups enabled and tested (restore from backup monthly)
- [ ] Application deployed on HTTPS-only hosting (Vercel, Netlify, Heroku, AWS, etc.)
- [ ] Error messages don't expose system details (stack traces, database structure, paths)

**Why this matters**: Error messages revealing system info are reconnaissance for attackers. Missing backups means data loss = no recovery option.

---

## Monitoring & Logging (2 items)

- [ ] Failed login attempts logged and monitored
- [ ] Application monitoring tool configured (Sentry, DataDog, Rollbar, etc.) to catch runtime errors

**Why this matters**: You can't respond to incidents if you don't know they're happening. Failed login monitoring catches account takeover attempts early.

---

## Compliance & Documentation (1 item)

- [ ] Privacy policy published explaining what data is collected and how it's used

**Why this matters**: Even MVPs handling user data need basic privacy disclosure. GDPR requires this; missing it can result in fines.

---

## Sign-Off

| Role | Name | Date | Sign-off |
|------|------|------|----------|
| Developer | | | |
| Security Lead | | | |
| Product Manager | | | |

---

## If You Have Extra 30 Minutes

Upgrade these items first:

1. **Add two-factor authentication (2FA)** for admin accounts (Google Authenticator or similar)
2. **Enable WAF (Web Application Firewall)** if hosting on AWS/GCP (blocks common attacks automatically)
3. **Run SAST tool** on code: SonarQube free tier, CodeQL, or Semgrep
4. **Document incident response** procedure (who to call, how to roll back, where logs are)

---

## Common Gotchas

| Issue | Fix | Prevention |
|-------|-----|-----------|
| Forgot to enable HTTPS on domain | Use hosting provider's SSL certificate (free with Vercel, Netlify, Heroku) | Add to CI: verify HTTPS is enabled before deploy |
| Database credentials in logs | Rotate credentials, check application logs | Never log `process.env` or connection strings |
| User uploads not validated | Whitelist allowed file types, enforce max file size | Scan uploads for malware (ClamAV, VirusTotal) |
| API keys exposed in frontend code | Move API calls to backend, verify frontend doesn't include keys | Scan build output: `grep -r "sk_" dist/` |

---

**Checklist version**: 1.0  
**Last updated**: 2026-04-25  
**Next review**: Before next major release or 90 days, whichever is sooner
