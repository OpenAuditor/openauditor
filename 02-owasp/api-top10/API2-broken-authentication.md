# API2 — Broken Authentication

## 30-second summary

Authentication is broken when an API accepts weak credentials, issues insecure tokens, fails to expire sessions, or allows credential stuffing without rate limiting. Attackers exploit these weaknesses to take over accounts without needing to know the actual password.

> **Critical:** Authentication is not just login. It includes token issuance, token validation, session expiry, password reset flows, and protection against automated credential attacks.

---

## Vulnerable code example

```typescript
// Express.js + JWT — VULNERABLE
import jwt from 'jsonwebtoken';

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findByEmail(email);

  // Timing oracle: reveals whether the email exists
  if (!user || user.password !== md5(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // No expiry on the token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

  return res.json({ token });
});

// Token verification — VULNERABLE
app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    // Accepts 'none' algorithm — attacker can forge tokens
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: undefined  // accepts all algorithms including 'none'
    });
    res.json({ userId: decoded.userId });
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
  }
});
```

Problems:
- MD5 password hashing is trivially crackable.
- No token expiry (`exp` claim missing).
- `algorithms: undefined` accepts the `none` algorithm, allowing forged unsigned tokens.
- No rate limiting on the login endpoint.

---

## Fixed code example

```typescript
// Express.js + JWT — FIXED
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findByEmail(email);

  // Use a constant-time comparison to prevent timing attacks
  const validPassword = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2b$12$invalidhashpadding000000000000000');

  if (!user || !validPassword) {
    // Same message regardless of whether email exists
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      algorithm: 'HS256',
    }
  );

  return res.json({ token });
});

// Token verification — FIXED
app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // explicitly whitelist only expected algorithm
    });
    res.json({ userId: (decoded as any).userId });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});
```

---

## Real-world breach scenario

**Optus (2022):** An unauthenticated API endpoint was accessible on the public internet — no token required at all. The API returned full customer records including passport and driving licence numbers. Approximately 10 million Australians were affected. The attacker simply iterated customer IDs against the exposed endpoint.

**Credential stuffing — Dunkin' Donuts (2019):** Attackers used breach data from other sites to test email/password combinations against the Dunkin' loyalty API. No rate limiting existed. Thousands of accounts were taken over and rewards points were sold.

---

## Detection checklist

- [ ] Passwords are hashed with bcrypt, scrypt, or Argon2 (not MD5, SHA1, or unsalted SHA256).
- [ ] JWT tokens specify an explicit, short expiry (`exp` claim, e.g. 1 hour).
- [ ] JWT verification explicitly whitelists algorithms (e.g. `['HS256']`).
- [ ] Login, password reset, and OTP endpoints have rate limiting and/or account lockout.
- [ ] Responses to failed login do not reveal whether the email exists (constant-time comparison used).
- [ ] Refresh tokens are rotated on use and invalidated on logout.
- [ ] Tokens are invalidated server-side on logout (blocklist or short expiry + rotation).
- [ ] API keys and tokens are transmitted via headers, not URL query strings.
- [ ] Sensitive authentication endpoints are not accessible without TLS.

---

## Testing strategy

**Algorithm confusion attack:**
```python
import jwt
import base64

# Attempt to forge a token using 'none' algorithm
header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b'=')
payload = base64.urlsafe_b64encode(b'{"userId":1,"role":"admin"}').rstrip(b'=')
forged_token = f"{header.decode()}.{payload.decode()}."

# Submit to the API and check if it returns 200
import requests
r = requests.get(
    'https://api.example.com/api/me',
    headers={'Authorization': f'Bearer {forged_token}'}
)
print(r.status_code, r.json())
```

**Rate limiting test:**
```bash
# Check if the login endpoint enforces rate limits
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://api.example.com/api/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"wrongpass"}'
done
# Expect 429 responses after the threshold
```

**Tools:**
- Burp Suite — intercept and modify JWT header/payload.
- `jwt_tool` — comprehensive JWT attack suite.
- Hydra / ffuf — credential stuffing simulation (with authorisation).

---

## Why this matters

Authentication failures are account takeover. For a B2C API this means accessing personal data, making purchases, and impersonating users. For a B2B API it can mean full tenant compromise. The damage is compounded when the API has no rate limiting — a single attacker can attempt millions of credential combinations in hours.

Broken JWT validation is particularly dangerous because it affects every protected endpoint simultaneously. A single `algorithms: undefined` bug does not just expose one user — it allows forging tokens for *any* user ID, including administrators.
