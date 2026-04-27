# The First 24 Hours After a Breach

Every minute matters. This is a numbered runbook — follow it in order.

---

## Hour 0: Confirm the Breach

Don't assume. Verify.

1. **What triggered the alert?** (Unusual traffic, user reports, external notification, suspicious logs?)
2. **Is this confirmed malicious, or could it be a bug or misconfiguration?**
3. **Is the attack ongoing?** (Is someone actively in your systems right now?)

If confirmed: start the clock. GDPR requires you notify the ICO within 72 hours of *becoming aware*.

---

## Hours 0–1: Contain

Stop the bleeding before investigating.

**Actions:**
- [ ] Revoke or rotate any exposed credentials (API keys, database passwords, JWT secrets)
- [ ] Block the attacker's IP(s) at the firewall or CDN level (if identifiable)
- [ ] Take compromised systems offline if the attack is ongoing
- [ ] Disable affected user accounts if account takeover is involved
- [ ] Revoke OAuth tokens and active sessions if auth is compromised
- [ ] Alert your team (on-call engineer, your manager, CTO if applicable)

**Do NOT:**
- Wipe or reimage servers before preserving evidence
- Delete logs
- Alert users yet (you don't have enough information)
- Speculate publicly about what happened

---

## Hours 1–4: Assess

Understand the scope.

**Questions to answer:**
- What data was accessed? (User records, payment info, health data, passwords?)
- How many users are affected?
- When did the attack start? (Check logs as far back as possible)
- How did the attacker get in? (Compromised credential, unpatched CVE, SQL injection, insider?)
- Is access revoked, or are they still in?
- Were backups affected?

**Actions:**
- [ ] Preserve logs (see [Forensic Evidence](./forensic-evidence.md))
- [ ] Screenshot or export evidence before anything is changed
- [ ] Start an incident log (time-stamped notes of every action taken)
- [ ] Do NOT delete or alter evidence — this has legal implications

---

## Hours 4–8: Involve the Right People

Don't handle this alone.

**People to notify internally:**
- Founder / CEO (they need to know)
- Legal counsel or data protection officer
- PR/comms lead (for external communication later)

**People to involve externally:**
- Your data protection officer or legal team
- Cyber insurance provider (if applicable) — call them before doing too much
- Law enforcement (if criminal activity — in the UK: Action Fraud; in the US: FBI)

---

## Hours 8–24: Begin Remediation

Once contained and assessed:

1. **Fix the root cause** — don't just patch the symptom
2. **Reset all credentials** that could have been exposed
3. **Deploy fixes** through your normal CI/CD with security review
4. **Verify the attacker is fully evicted** (check for persistence mechanisms: backdoors, new admin accounts, scheduled tasks)
5. **Test systems** before bringing them back online
6. **Draft user notification** (don't send yet — legal review first)
7. **Begin GDPR/regulatory notification process** if personal data was involved

---

## What to Log Throughout

Keep a running incident log:
```
[Timestamp] [Action] [Who] [Notes]
2026-04-26 02:14 — Detected unusual API traffic from 45.33.32.156
2026-04-26 02:18 — Blocked IP at Cloudflare by [name]
2026-04-26 02:30 — Rotated database credentials, checked active sessions
...
```

This log becomes your evidence trail, your regulatory submission, and your post-incident review.

---

## Why This Matters

The 2013 Target breach notification was delayed. Customers weren't told for several days despite Target knowing earlier. This delay cost them in public trust, regulatory action, and class-action lawsuits. The 72-hour GDPR rule exists precisely because of delays like this.

---

## Next Steps

- [User Notification Guide](./user-notification-guide.md)
- [GDPR Breach Timeline](./gdpr-breach-timeline.md)
- [Forensic Evidence](./forensic-evidence.md)
