# API3 — Broken Object Property Level Authorisation

## 30-second summary

Even when a user is authorised to access an object, they may not be authorised to see or modify every field on that object. When an API returns all database columns without filtering, or allows mass-assignment of any field in an update request, attackers can read sensitive data or escalate their own privileges by supplying fields they should never be allowed to touch.

> **Critical:** Never pass raw request body objects directly into database update operations. Always maintain an explicit allowlist of fields that each role may read or write.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE: both over-exposure and mass assignment

// Over-exposure: returns all user fields including sensitive ones
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [req.params.id]
  );
  // Returns: id, email, name, passwordHash, isAdmin, stripeCustomerId,
  //          internalCreditBalance, suspensionReason — all exposed
  return res.json(user);
});

// Mass assignment: any field in the request body is written to the database
app.patch('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // req.body might contain: { "isAdmin": true, "internalCreditBalance": 9999 }
  await db.query(
    'UPDATE users SET ? WHERE id = ?',
    [req.body, id]   // spreads all client-supplied fields
  );

  return res.json({ success: true });
});
```

---

## Fixed code example

```typescript
// Express.js — FIXED

// Explicit field allowlist for reads
const PUBLIC_USER_FIELDS = ['id', 'email', 'displayName', 'avatarUrl', 'createdAt'];
const ADMIN_USER_FIELDS = [...PUBLIC_USER_FIELDS, 'isAdmin', 'suspensionReason'];

app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await db.query(
    'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'Not found' });

  // If admin, return more fields; otherwise return public fields only
  const fields = req.user.isAdmin ? ADMIN_USER_FIELDS : PUBLIC_USER_FIELDS;
  const filtered = Object.fromEntries(
    Object.entries(user).filter(([key]) => fields.includes(key))
  );

  return res.json(filtered);
});

// Explicit allowlist for writes — role-aware
const USER_WRITABLE_FIELDS = ['displayName', 'avatarUrl', 'bio'];
const ADMIN_WRITABLE_FIELDS = [...USER_WRITABLE_FIELDS, 'isAdmin', 'suspensionReason'];

app.patch('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Only allow the caller to update their own profile (unless admin)
  if (req.user.id !== parseInt(id) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const allowedFields = req.user.isAdmin ? ADMIN_WRITABLE_FIELDS : USER_WRITABLE_FIELDS;

  // Strip any fields not in the allowlist
  const sanitised = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(sanitised).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  await db.updateUser(id, sanitised);

  return res.json({ success: true });
});
```

---

## Real-world breach scenario

**GitHub (2012) — Mass Assignment:** A researcher exploited a mass assignment vulnerability in GitHub's API to add his own SSH public key to the Ruby on Rails organisation's repository. He sent a PATCH request with an additional field that mapped to an internal attribute controlling repository access. He gained write access to any public repository. GitHub patched the issue within hours.

**Over-exposure pattern:** Multiple healthcare SaaS providers have been found to return full patient records — including diagnosis codes, medication histories, and internal provider notes — because their API returned `SELECT *` results. The portal only *displayed* certain fields, but the JSON response contained everything.

---

## Detection checklist

- [ ] API responses use field-level projection — only the minimum necessary fields are returned.
- [ ] No endpoint uses `SELECT *` where results are sent directly to the client.
- [ ] Update/create endpoints maintain an explicit allowlist of writable fields per role.
- [ ] `req.body` or request payloads are never spread directly into ORM `update()` calls.
- [ ] Sensitive internal fields (`isAdmin`, `role`, `creditBalance`, `passwordHash`) cannot be set via the API by regular users.
- [ ] DTO (Data Transfer Object) schemas are defined and validated on ingress and egress.
- [ ] OpenAPI/Swagger schema for the response object matches the actual fields returned.

---

## Testing strategy

**Over-exposure test:**
1. Authenticate as a regular user.
2. Call endpoints that return user or entity objects.
3. Inspect the full JSON response — not the rendered UI — for sensitive fields.
4. Flag: `passwordHash`, `internalNotes`, `isAdmin`, `stripeCustomerId`, `ssn`, any `*secret*` or `*token*` fields.

**Mass assignment test:**
```bash
# Attempt to set isAdmin to true on your own account
curl -s -X PATCH https://api.example.com/api/users/42 \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "hacker", "isAdmin": true, "role": "admin"}'

# Then fetch the account and check if isAdmin changed
curl -s https://api.example.com/api/users/42 \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.isAdmin'
```

**Tools:**
- Burp Suite — intercept responses and inspect full JSON, not just the rendered page.
- Postman — send PATCH/PUT requests with unexpected fields.
- `openapi-diff` — compare actual API response shapes against declared schemas.

---

## Why this matters

Over-exposure of fields causes data breaches without any traditional "attack." The data is simply returned in the API response. A developer building a mobile app may only use three fields from a 30-field response, leaving 27 fields silently exposed.

Mass assignment is privilege escalation. If a user can set `isAdmin: true` on their account, your entire authorisation model collapses. In multi-tenant systems, writing to the wrong tenant ID field can be equally catastrophic.

Both issues share a root cause: the application trusts its own data layer rather than defining explicit contracts for what each caller is allowed to see and write.
