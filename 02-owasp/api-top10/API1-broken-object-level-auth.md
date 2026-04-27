# API1 — Broken Object Level Authorisation (BOLA / IDOR)

## 30-second summary

Every API endpoint that retrieves or modifies a resource using a client-supplied identifier must verify that the requesting user is allowed to access *that specific object*. When this check is missing, an attacker increments or guesses an ID and reads or modifies another user's data. This is the most widespread and impactful API vulnerability.

> **Critical:** Authenticating a user does not authorise them to access every object. You must check ownership or permissions on every single resource lookup.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE
// The route trusts whatever orderId the client sends
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await db.query(
    'SELECT * FROM orders WHERE id = $1',
    [req.params.orderId]
  );

  if (!order) return res.status(404).json({ error: 'Not found' });

  // No check: does this order belong to req.user.id?
  return res.json(order);
});
```

An attacker with a valid session for user `42` can request `/api/orders/1`, `/api/orders/2`, etc. and read any order in the database.

---

## Fixed code example

```typescript
// Express.js — FIXED
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await db.query(
    // Add the user constraint to the query itself
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [req.params.orderId, req.user.id]
  );

  if (!order) {
    // Return 404, not 403 — do not confirm the resource exists
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(order);
});
```

**Key changes:**
- The ownership check is pushed into the database query. There is no way for application logic bugs to bypass it.
- Returns `404` rather than `403` to avoid confirming that the object exists for another user.

---

## Real-world breach scenario

**Peloton (2021):** Unauthenticated API endpoints exposed user profile data — including age, location, gender, and workout stats — for any user by simply supplying their numeric user ID. Approximately 4 million profiles were accessible. The endpoint required no authentication at all, and no ownership check was present.

A researcher demonstrated the issue by iterating through user IDs with a simple loop. Peloton left the endpoint open for 90 days after initial disclosure.

---

## Detection checklist

- [ ] Every endpoint that accepts a resource identifier checks that the caller owns or has permission to access that resource.
- [ ] Ownership checks occur at the data layer (query constraint), not only in application logic.
- [ ] Non-numeric or non-sequential IDs (UUIDs) are used to reduce guessability — but UUIDs are not a substitute for authorisation checks.
- [ ] The API returns `404` (not `403`) when a resource exists but does not belong to the caller, to avoid object enumeration.
- [ ] Admin or service-account queries are never reused in user-facing endpoints without re-adding ownership constraints.
- [ ] Indirect references are scoped to the authenticated session.

---

## Testing strategy

**Manual testing:**
1. Authenticate as User A. Record the IDs of resources belonging to User A.
2. Authenticate as User B (or use User B's session token).
3. Request User A's resource IDs through User B's session.
4. A `200 OK` with data is a confirmed BOLA vulnerability.

**Automated testing:**
```bash
# Using a simple curl loop to test order ID enumeration
TOKEN_USER_B="eyJhbGci..."

for id in $(seq 1 20); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN_USER_B" \
    https://api.example.com/orders/$id)
  echo "Order $id: $STATUS"
done
```

Any `200` for IDs not belonging to User B is a finding.

**Tools:**
- Burp Suite — use the Intruder module to iterate IDs in captured requests.
- OWASP ZAP — active scan with ID fuzzing.
- `autorize` Burp extension — automatically replays requests with a lower-privilege token.

---

## Why this matters

BOLA is the #1 API vulnerability for a reason: it is trivially exploitable and almost always leads to a data breach. Unlike injection or XSS, it requires no technical skill to exploit — only a browser or `curl`. The damage is direct: personal data, financial records, private messages, health information.

It is also easy to introduce accidentally. Developers writing an endpoint often test it as the owner of the data. The broken case — accessing someone else's data — is only caught if authorisation is explicitly tested from a separate account.

**Regulatory impact:** Exposing another user's personal data via BOLA is a likely GDPR or HIPAA breach event, with mandatory notification obligations and potential fines.
