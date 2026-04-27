# API5 — Broken Function Level Authorisation

## 30-second summary

Some API functions are intended only for administrators or privileged roles. When the API fails to enforce those restrictions at the server, a regular user can invoke admin-only operations — deleting accounts, reading audit logs, changing subscription tiers, or accessing bulk data exports — simply by calling the endpoint directly.

> **Critical:** Never rely on hiding admin endpoints. Security through obscurity is not access control. Every function must check the caller's role before executing.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE
// Admin routes are defined but not role-protected

app.get('/api/admin/users', authenticate, async (req, res) => {
  // authenticate confirms the user is logged in — but does NOT check isAdmin
  const users = await db.query('SELECT * FROM users');
  return res.json(users); // Any authenticated user gets all user records
});

app.delete('/api/admin/users/:id', authenticate, async (req, res) => {
  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  return res.json({ deleted: true });
});

// Sometimes admin routes are just slightly different paths:
app.post('/api/users/promote', authenticate, async (req, res) => {
  const { userId, role } = req.body;
  await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
  return res.json({ success: true });
});
```

The `authenticate` middleware only validates the token. Role checking is missing entirely.

---

## Fixed code example

```typescript
// Express.js — FIXED

// Reusable authorisation middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    if (!roles.includes(req.user.role)) {
      // Log the attempt — could indicate reconnaissance
      logger.warn('Forbidden function access attempt', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Admin routes — both middleware layers required
app.get(
  '/api/admin/users',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    // Only admins reach this handler
    const users = await db.query(
      'SELECT id, email, role, created_at FROM users'
    );
    return res.json(users);
  }
);

app.delete(
  '/api/admin/users/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    const { id } = req.params;

    // Prevent admins deleting their own account via this endpoint
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return res.json({ deleted: true });
  }
);

app.post(
  '/api/users/promote',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    const { userId, role } = req.body;
    const VALID_ROLES = ['user', 'moderator', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    return res.json({ success: true });
  }
);
```

---

## Real-world breach scenario

**Bumble (2020):** Security researcher Sanjana Sarda discovered that Bumble's API had admin-level functionality accessible to regular users. By modifying API requests, she could access premium features (Bumble Boost) for free, access location data for all users, and use admin search filters without paying. The vulnerability existed because the server only checked authentication (is the user logged in?) but not authorisation (is this user allowed to call this function?).

**SolarWinds Orion (2021):** An internal API endpoint (`/api/v2/perfdata`) was accessible without proper role checking. The API was intended for internal monitoring but was reachable by lower-privileged accounts. Attackers in the supply chain compromise used such internal endpoints to enumerate network topology.

---

## Detection checklist

- [ ] Every API endpoint has explicit role/permission checks, not just authentication.
- [ ] Admin, moderator, and privileged routes are protected by reusable middleware — not ad-hoc `if (user.isAdmin)` checks inside handlers.
- [ ] Role checks are performed server-side; client-supplied role claims in JWT payloads are re-validated against the database.
- [ ] HTTP verbs are also restricted by role (e.g. GET may be allowed for all, but DELETE only for admins).
- [ ] Routes are inventoried: every route has a documented expected-caller role.
- [ ] Changing paths slightly (e.g. `/api/v2/admin/` vs `/api/admin/`) does not bypass role checks.
- [ ] Unauthorised access attempts are logged and alerted on.

---

## Testing strategy

**Manual role escalation test:**
1. Discover admin endpoints — via OpenAPI docs, JavaScript source maps, or directory bruteforce.
2. Authenticate as a regular user (not admin).
3. Call each admin endpoint with the regular user token.
4. Check whether the response is `403 Forbidden` or `200 OK` with data.

**Endpoint discovery:**
```bash
# Bruteforce common admin path patterns with a regular user token
ffuf -u https://api.example.com/api/FUZZ \
  -w /usr/share/wordlists/api-admin-paths.txt \
  -H "Authorization: Bearer $USER_TOKEN" \
  -mc 200,201,204 \
  -o findings.json
```

**Verb tampering:**
```bash
# Check if a DELETE is accessible where only GET should be allowed
curl -s -X DELETE https://api.example.com/api/users/100 \
  -H "Authorization: Bearer $USER_TOKEN"
# Expect 403 or 405, not 200
```

**Tools:**
- Burp Suite — capture admin requests from admin session, replay with low-privilege token.
- `autorize` Burp extension — automatically re-sends all requests with a lower-privilege token and highlights any that succeed.
- `ffuf` — fast endpoint discovery for admin paths.

---

## Why this matters

Function-level authorisation failures turn any authenticated user into an administrator. The impact depends entirely on what the admin functions can do — but it commonly includes data deletion, account takeover of other users, bulk data export, and billing manipulation.

Unlike BOLA (API1) where the attacker can only access their own data type, broken function-level auth opens up operations that were never meant to exist for regular users. A single missing `requireRole('admin')` check on a "delete all records" endpoint is a single call away from catastrophic data loss.

These bugs frequently appear in code that was copy-pasted from a user-facing endpoint to build an admin endpoint quickly, with the role check never added.
