# Manual Security Testing Guide

Automated tools miss logic-level vulnerabilities. Manual testing is how you find authorisation bypasses, business logic flaws, and multi-step attack chains.

---

## Setup

Before testing:
1. Use a test account (not production data)
2. Test in staging, not production
3. Use a proxy tool (Burp Suite Community Edition or OWASP ZAP)
4. Have a second test account (to test cross-user access)

---

## Authentication Tests

### Login

- [ ] Submit empty username and password — what error message appears? (Should not reveal which field is missing)
- [ ] Submit valid email + wrong password — does error differ from invalid email? (Shouldn't — timing attacks)
- [ ] Submit 20 rapid login attempts — does rate limiting trigger?
- [ ] Send the same request twice rapidly (double-click protection) — one should succeed, one fail

### Session

- [ ] Log out, then press the browser back button — does it still show protected content?
- [ ] Copy session cookie from browser to curl — does it authenticate? (It should — but once you're done, does logout invalidate it?)
- [ ] Log out — is the session token invalidated server-side?
- [ ] Wait for session timeout (if configured) — does the session expire?

### Password Reset

- [ ] Submit reset for an email that doesn't exist — does the response differ from a real email? (Shouldn't)
- [ ] Request two reset tokens for the same email — is the first token invalidated?
- [ ] Does the reset link expire? (Test after 1 hour)
- [ ] Can you reuse a reset link after using it once? (Shouldn't work)

---

## Authorisation Tests

### Object-Level Authorisation (IDOR)

This is the most common finding. Test whether you can access other users' data.

1. Log in as User A
2. Create a resource (post, invoice, file)
3. Note the resource ID (e.g., `/api/posts/123`)
4. Log in as User B
5. Try to access User A's resource directly: `GET /api/posts/123`
6. Expected: 404 or 403
7. Unexpected: the resource is returned — CRITICAL finding

Test for every resource type: GET, PUT, DELETE.

### Privilege Escalation

- [ ] As a regular user, can you access admin endpoints? (`/api/admin/*`)
- [ ] Can you modify your own role by sending `{"role": "admin"}` in a POST?
- [ ] Can you access another user's account settings page?

---

## Input Validation Tests

### XSS

```html
<!-- Try in every input field, URL parameter, and form -->
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
"><script>alert('XSS')</script>
```

Does the alert appear? If yes — XSS vulnerability.

### SQL Injection

```sql
-- Try in search fields and URL parameters
' OR '1'='1
'; DROP TABLE users; --
1 AND 1=1
```

Does the query return unexpected results or errors?

### Path Traversal (File Uploads and Downloads)

```
# Try in filename parameters
../../etc/passwd
../../../windows/win.ini
%2e%2e%2f%2e%2e%2fetc/passwd
```

---

## Business Logic Tests

- [ ] Can you bypass checkout by manipulating the price in the request?
- [ ] Can you apply a promo code multiple times?
- [ ] Can you submit a form step twice (race condition)?
- [ ] What happens if you send negative quantities?
- [ ] Can you access a paid feature by modifying a subscription flag in the request?

---

## API-Specific Tests

- [ ] Try changing the HTTP method: POST → GET, DELETE → GET for the same endpoint
- [ ] Send a request with no `Content-Type` header — does it still work?
- [ ] Send a request with `Content-Type: text/xml` instead of JSON — server side parsing different?
- [ ] Add extra fields to request bodies — are they rejected or silently accepted?

---

## Output Tests

- [ ] Trigger a 500 error (malformed request) — does it return a stack trace?
- [ ] Access a non-existent page — does the 404 reveal server info?
- [ ] Check response headers — are debug headers present (`X-Powered-By: Express 4.18.2`)?

---

## Checklist

- [ ] Authentication tests complete
- [ ] IDOR tested for all resource types
- [ ] XSS tested in all input fields
- [ ] Admin endpoints tested from non-admin account
- [ ] Business logic edge cases tested
- [ ] Error responses don't leak system info

---

## Learn More

- [Testing Your Auth](./testing-your-auth.md)
- [OWASP ZAP Guide](./owasp-zap-guide.md)
- [OWASP A01: Broken Access Control](../02-owasp/web-top10/A01-broken-access-control.md)
