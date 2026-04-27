# A01 — Broken Access Control

## Summary

Broken access control occurs when an application does not properly enforce what authenticated (or unauthenticated) users are allowed to do. An attacker can exploit this to view another user's data, modify records they do not own, escalate privileges, or perform administrative actions without authorisation. It moved to the number one position in the 2021 OWASP Top 10 because it appeared in 94% of tested applications. Access control is only meaningful when enforced on the server — UI-level hiding is not a control.

---

## What It Looks Like

### Missing authorisation check on an API route

```javascript
// Next.js API route — pages/api/user/[id].js
// VULNERABLE: any authenticated user can read any other user's profile
export default async function handler(req, res) {
  const { id } = req.query;

  // No check that req.user.id === id
  const user = await db.users.findUnique({ where: { id } });
  return res.json(user);
}
```

### Insecure direct object reference (IDOR) — guessable IDs

```javascript
// VULNERABLE: sequential integer IDs let an attacker enumerate all invoices
// GET /api/invoices/1001, /api/invoices/1002, etc.
export default async function handler(req, res) {
  const invoice = await db.invoices.findUnique({
    where: { id: Number(req.query.id) },
  });
  return res.json(invoice);
}
```

### Privilege escalation via missing role check

```python
# Flask — VULNERABLE: no admin check before deleting a user
@app.route("/admin/users/<user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    # Missing: if not current_user.is_admin: abort(403)
    db.session.delete(User.query.get_or_404(user_id))
    db.session.commit()
    return jsonify({"deleted": user_id})
```

---

## The Fix

### Enforce ownership on every resource fetch

```javascript
// Next.js API route — FIXED
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const { id } = req.query;

  // Only allow a user to fetch their own record
  if (session.user.id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await db.users.findUnique({ where: { id } });
  return res.json(user);
}
```

### Use non-guessable identifiers (UUIDs)

```javascript
// Supabase / Prisma — use uuid_generate_v4() as primary key
// In your Prisma schema:
model Invoice {
  id        String   @id @default(uuid())
  userId    String
  // ...
}
```

### Enforce role checks server-side

```python
# Flask — FIXED
from functools import wraps
from flask_login import current_user

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated

@app.route("/admin/users/<user_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_user(user_id):
    db.session.delete(User.query.get_or_404(user_id))
    db.session.commit()
    return jsonify({"deleted": user_id})
```

> **Critical:** Never rely on client-side checks (hidden buttons, disabled fields, URL obfuscation) as access control. Every state-changing operation must be authorised on the server.

---

## Real-World Breach

**Facebook — 2018 (Cambridge Analytica adjacent IDOR)**
In 2018, Facebook's "View As" feature had a broken access control flaw that allowed attackers to generate access tokens for any user. Approximately 50 million accounts were compromised. The root cause was that a video upload feature visible in the "View As" context incorrectly generated a user access token belonging to the *viewed* user rather than the *viewing* user. Facebook invalidated around 90 million session tokens as a precaution. The flaw was present because the access control logic was not uniformly applied across all UI surfaces.

---

## How to Test

### Manual — IDOR testing

1. Log in as User A. Note the ID of a resource you own (e.g. `/api/orders/abc-123`).
2. Log in as User B in a separate browser/incognito window.
3. As User B, request the URL from step 1. You should receive a 403 or 404, not the data.
4. Repeat for all resource types: profiles, orders, invoices, files, settings.

### Manual — privilege escalation

1. Log in as a regular user.
2. Identify any admin endpoints (check the source, look for `/admin/`, `/management/`, etc.).
3. Send requests to those endpoints as the regular user.
4. A 403 is correct. A 200 with data is a vulnerability.

### Automated — OWASP ZAP

```bash
# Run a ZAP active scan against your staging environment
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t https://staging.yourapp.com \
  -r zap-report.html
```

---

## Checklist

- [ ] Every API route that returns or modifies user data verifies the requesting user owns that resource
- [ ] Administrative endpoints check for an admin role, not just authentication
- [ ] Resource IDs are UUIDs or other non-guessable values (not sequential integers)
- [ ] Access control logic lives on the server — not in the UI or client-side code
- [ ] CORS policy does not allow arbitrary origins to make credentialled requests
- [ ] Directory listing is disabled on all web servers
- [ ] JWT or session tokens are invalidated on logout and privilege changes
- [ ] Automated tests cover authorisation (not just authentication) for all sensitive endpoints

---

## Why This Matters

A single IDOR vulnerability can expose every user's private data in your application. If your users table has 10,000 records and an attacker can iterate sequential IDs, they can download all of it in minutes. This leads to GDPR breach notifications, regulatory fines (up to 4% of global annual turnover under GDPR), reputational damage, and potential class-action liability. Broken access control is not exotic — it is the most common vulnerability in production web apps.

---

## Learn More

- [OWASP A01:2021 — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP Testing Guide: Authorisation Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/)
- [OpenAuditor: Secure Coding — Auth Best Practices](../../06-secure-coding/auth-best-practices.md)
- [OpenAuditor: Security Testing](../../10-security-testing/)
