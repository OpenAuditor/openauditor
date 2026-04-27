# A04 — Insecure Design

## Summary

Insecure design is a new category in the 2021 OWASP Top 10 that addresses flaws baked into an application's architecture and business logic before a single line of code is written. Unlike implementation bugs (where code does the wrong thing), insecure design means the specification itself is missing security controls, makes incorrect assumptions about trust, or lacks business logic constraints that should be obvious. You cannot patch your way out of insecure design — the architecture must change. Common examples include: password reset flows that do not rate-limit OTP guessing, checkout flows that do not validate price server-side, and multi-tenant systems that share a single database schema with only application-layer separation.

---

## What It Looks Like

### Password reset OTP with no rate limiting

```javascript
// Next.js API route — VULNERABLE
// An attacker can try all 10,000 combinations of a 4-digit OTP
export default async function handler(req, res) {
  const { email, otp } = req.body;

  const record = await db.passwordResets.findFirst({
    where: { email, otp, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  await resetPassword(email);
  return res.json({ success: true });
}
// No rate limit. No OTP attempt counter. No lockout after N failures.
```

### Price manipulation — server trusts client-supplied price

```javascript
// Express checkout endpoint — VULNERABLE
app.post("/checkout", authenticate, async (req, res) => {
  const { items, totalPrice } = req.body; // Attacker sends totalPrice: 0.01

  await db.orders.create({
    data: {
      items,
      totalCharged: totalPrice, // Trusting the client
    },
  });

  await stripe.charges.create({ amount: totalPrice * 100, currency: "gbp" });
  return res.json({ success: true });
});
```

### Multi-tenancy enforced only in application code (no DB isolation)

```python
# VULNERABLE: tenant isolation only via a WHERE clause
# If a bug in another endpoint forgets to filter by tenant_id, all tenants' data leaks
@app.route("/documents")
@login_required
def list_documents():
    docs = db.execute(
        "SELECT * FROM documents WHERE tenant_id = ?",
        (current_user.tenant_id,)
    ).fetchall()
    return jsonify(docs)

# One forgotten WHERE clause somewhere in 50,000 lines of code = full data breach
```

### Insecure account enumeration through design

```javascript
// VULNERABLE: different responses reveal whether an email is registered
app.post("/forgot-password", async (req, res) => {
  const user = await db.users.findUnique({ where: { email: req.body.email } });

  if (!user) {
    return res.status(404).json({ error: "No account found with that email" }); // Reveals enumeration
  }

  await sendResetEmail(user.email);
  return res.json({ message: "Reset email sent" });
});
```

---

## The Fix

### Rate-limit and lock OTP verification

```javascript
// Next.js API route — FIXED
import rateLimit from "express-rate-limit";

// Limit: 5 attempts per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

export default async function handler(req, res) {
  await otpLimiter(req, res, () => {});

  const { email, otp } = req.body;

  // Also check attempt count in the database
  const record = await db.passwordResets.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
  });

  if (!record || record.attempts >= 5) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  if (record.otp !== otp) {
    await db.passwordResets.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  await db.passwordResets.delete({ where: { id: record.id } });
  await resetPassword(email);
  return res.json({ success: true });
}
```

### Always calculate price server-side

```javascript
// Express checkout endpoint — FIXED
app.post("/checkout", authenticate, async (req, res) => {
  const { items } = req.body;

  // Recalculate total from your own database — never trust client price
  const productIds = items.map((i) => i.productId);
  const products = await db.products.findMany({ where: { id: { in: productIds } } });

  const totalPrice = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error("Unknown product");
    return sum + product.price * item.quantity;
  }, 0);

  await stripe.charges.create({ amount: Math.round(totalPrice * 100), currency: "gbp" });
  return res.json({ success: true, charged: totalPrice });
});
```

### Use Row Level Security for multi-tenant data isolation

```sql
-- PostgreSQL Row Level Security — FIXED
-- Database enforces tenant isolation even if application code forgets a WHERE clause

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- In your application, set the tenant context before queries:
-- SET LOCAL app.current_tenant_id = '<uuid>';
```

### Return identical responses regardless of account existence

```javascript
// FIXED: same response whether or not the email exists
app.post("/forgot-password", async (req, res) => {
  const user = await db.users.findUnique({ where: { email: req.body.email } });

  if (user) {
    await sendResetEmail(user.email);
  }
  // Always return the same message — prevents email enumeration
  return res.json({ message: "If an account exists, a reset email has been sent." });
});
```

> **Critical:** Insecure design cannot be fixed with a hotfix. If your password reset has no rate limiting, or your checkout trusts client prices, you need to redesign those flows before shipping. Treat security requirements the same way you treat functional requirements.

---

## Real-World Breach

**Instagram — 2019 (OTP brute force)**
Instagram's "forgot password" flow used a 6-digit OTP sent via SMS. The flow had no rate limiting or IP-based lockout on OTP submission. A researcher demonstrated that an attacker could systematically guess all one million possible 6-digit codes through a distributed network of IP addresses, bypassing Instagram's per-IP rate limit. Instagram rotated accounts to 8-digit codes and added stricter rate limiting. The vulnerability was a design flaw, not an implementation bug: the system was designed without considering that an attacker might distribute requests across IPs.

---

## How to Test

### Test OTP and password reset rate limiting

```bash
# Try submitting the OTP endpoint rapidly
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://yourapp.com/api/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","otp":"'"$i"'000"}'
done
# You should start receiving 429 after 5 attempts
```

### Test price manipulation

```bash
# Submit a checkout with a manipulated price
curl -X POST https://yourapp.com/api/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session>" \
  -d '{"items":[{"productId":"abc","quantity":1}],"totalPrice":0.01}'
# Your server should ignore totalPrice and calculate it server-side
```

### Test account enumeration

```bash
# Compare responses for known vs unknown email
curl -s -X POST https://yourapp.com/api/forgot-password \
  -d '{"email":"definitely-not-registered@test.com"}' | jq .

curl -s -X POST https://yourapp.com/api/forgot-password \
  -d '{"email":"real-user@yourapp.com"}' | jq .
# Responses should be identical
```

---

## Checklist

- [ ] Password reset and OTP flows are rate-limited per IP and per account
- [ ] OTP attempt counts are tracked server-side; accounts lock after N failures
- [ ] Prices, totals, and quantities are always recalculated on the server — never taken from client input
- [ ] Multi-tenant data isolation is enforced at the database layer (Row Level Security), not only in application code
- [ ] Account existence is not revealed through different API responses (forgot password, login errors)
- [ ] Business logic constraints (order limits, discount caps, withdrawal limits) are enforced server-side
- [ ] A threat model exists for all user-facing flows involving money, access, or sensitive data
- [ ] Security requirements are documented alongside functional requirements in your spec or backlog

---

## Why This Matters

Insecure design is the hardest category to fix because it often requires redesigning core flows. A checkout that trusts client prices will be exploited — automated scripts test for this within days of a site launching. OTP flows without rate limiting are trivially attacked with distributed requests. Multi-tenant bugs with application-only isolation have caused dozens of major data breaches where one customer's data leaked to another. Fixing these issues after launch is expensive, disruptive, and sometimes impossible without downtime. The only effective response is to build correctly from the start.

---

## Learn More

- [OWASP A04:2021 — Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [OWASP Business Logic Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/)
- [OpenAuditor: 00 Foundations — Threat Modelling](../../00-foundations/)
- [OpenAuditor: Secure Coding — Auth Best Practices](../../06-secure-coding/auth-best-practices.md)
