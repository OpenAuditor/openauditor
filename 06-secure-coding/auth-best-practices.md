# Authentication Best Practices

Authentication is the front door to your application. Most breaches start with weak auth — predictable tokens, unsalted hashes, missing brute-force protection.

---

## Password Hashing

Passwords must never be stored in plain text or with reversible encryption. Use a slow, salted hashing algorithm designed for passwords.

### Use bcrypt (Node.js)

```javascript
import bcrypt from 'bcryptjs';

// Hashing a password (cost factor 12 recommended)
const COST_FACTOR = 12;
const hash = await bcrypt.hash(password, COST_FACTOR);

// Verifying a password
const isValid = await bcrypt.compare(inputPassword, storedHash);
if (!isValid) {
  throw new Error('Invalid credentials');
}
```

### Use Argon2 (Node.js — even better)

```javascript
import argon2 from 'argon2';

// Hash
const hash = await argon2.hash(password);

// Verify
const isValid = await argon2.verify(hash, inputPassword);
```

### Use passlib (Python)

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash
hashed = pwd_context.hash(password)

# Verify
is_valid = pwd_context.verify(plain_password, hashed)
```

> **Critical:** Never use MD5, SHA1, SHA256, or plain text for passwords. These are fast hash functions — fine for checksums, catastrophically weak for passwords. The 2012 LinkedIn breach exposed 6.5M passwords hashed with unsalted SHA1. They were cracked in days.

### Why Cost Factor Matters

bcrypt's cost factor controls how slow the hash is. Higher = slower = more expensive for attackers.

| Cost Factor | Time to Hash | Brute-Force Resistance |
|-------------|-------------|----------------------|
| 10 | ~65ms | Acceptable minimum |
| 12 | ~250ms | **Recommended** |
| 14 | ~1000ms | High security (slow UX) |

Benchmark on your hardware. Target 200–400ms per hash on your production server.

---

## Session Management

### Use Secure Session Cookies

```javascript
// Next.js API route — set session cookie
import { serialize } from 'cookie';

res.setHeader('Set-Cookie', serialize('session', sessionToken, {
  httpOnly: true,     // not accessible via JavaScript
  secure: true,       // HTTPS only
  sameSite: 'lax',   // CSRF protection
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}));
```

> **Critical:** Never store session tokens in localStorage or sessionStorage. They are accessible to JavaScript and vulnerable to XSS attacks. Always use HttpOnly cookies.

### Session Expiry

Sessions must expire:
- **Absolute expiry:** after a maximum time (e.g., 30 days)
- **Idle expiry:** after inactivity (e.g., 30 minutes for sensitive apps)
- **On logout:** immediately invalidated server-side

```javascript
// Server-side session validation
const session = await db.sessions.findOne({ token: sessionToken });

if (!session) throw new Error('Invalid session');
if (session.expiresAt < new Date()) {
  await db.sessions.delete({ token: sessionToken });
  throw new Error('Session expired');
}

// Slide session (update last activity)
await db.sessions.update({ token: sessionToken }, {
  lastActivityAt: new Date(),
  expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
});
```

---

## JWTs (JSON Web Tokens)

JWTs are stateless authentication tokens. Use them correctly or don't use them at all.

### Signing JWTs

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // min 32 random bytes

// Sign
const token = jwt.sign(
  { userId: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Verify
try {
  const payload = jwt.verify(token, JWT_SECRET);
} catch (err) {
  throw new Error('Invalid or expired token');
}
```

### JWT Don'ts

- **Don't store JWTs in localStorage.** XSS attacks steal them.
- **Don't use `alg: none`.** This disables signature verification entirely.
- **Don't put sensitive data in JWT payload.** It's base64-encoded, not encrypted.
- **Don't use long-lived JWTs without refresh tokens.** 15–60 minute expiry is standard.

### Refresh Token Pattern

```javascript
// Short-lived access token (15 minutes)
const accessToken = jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: '15m' });

// Long-lived refresh token stored in DB
const refreshToken = crypto.randomBytes(64).toString('hex');
await db.refreshTokens.create({ token: refreshToken, userId, expiresAt: ... });

// Set refresh token as HttpOnly cookie
res.setHeader('Set-Cookie', serialize('refreshToken', refreshToken, {
  httpOnly: true, secure: true, sameSite: 'lax', path: '/api/auth/refresh',
}));
```

---

## Brute-Force Protection

Without rate limiting, attackers can try millions of passwords per minute.

```javascript
import rateLimit from 'express-rate-limit';

// Strict limit on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // 10 attempts per window
  message: 'Too many login attempts. Try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

Also implement:
- Account lockout after N failed attempts
- CAPTCHA after repeated failures
- Email alert after suspicious login

---

## Timing Attack Prevention

```javascript
// WRONG — leaks whether user exists via timing
if (user && user.password === hashedInput) { ... }

// RIGHT — always run the hash comparison
const isValid = user 
  ? await bcrypt.compare(password, user.passwordHash)
  : await bcrypt.compare(password, '$2b$12$invalidhashpadding'); // dummy hash

if (!user || !isValid) {
  throw new Error('Invalid credentials'); // same error either way
}
```

---

## Password Reset Flow

```javascript
// 1. Generate secure reset token
const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

// 2. Store HASHED token with expiry (not the plain token)
await db.passwordResets.create({
  userId: user.id,
  tokenHash: resetTokenHash,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
});

// 3. Email the PLAIN token to the user
await sendEmail({ to: user.email, resetLink: `https://app.com/reset?token=${resetToken}` });

// 4. On reset, hash input and compare to stored hash
const inputHash = crypto.createHash('sha256').update(inputToken).digest('hex');
const record = await db.passwordResets.findOne({ tokenHash: inputHash });
```

> **Critical:** Never check if an email exists in the password reset flow. Always respond the same way whether the email is registered or not, or attackers can enumerate your user list.

---

## Why This Matters

The 2012 LinkedIn breach compromised 117 million accounts. Their SHA1 password hashes were cracked in bulk because LinkedIn used no salting and a fast algorithm. With bcrypt + salting, the breach would have been dramatically less damaging.

---

## Checklist

- [ ] Passwords hashed with bcrypt or Argon2 (not MD5/SHA1/plain text)
- [ ] Cost factor ≥12 for bcrypt
- [ ] Sessions stored server-side, not as signed cookies containing user data
- [ ] Session cookies have HttpOnly, Secure, SameSite flags
- [ ] Session expiry (absolute and idle)
- [ ] Rate limiting on login endpoint
- [ ] Consistent error messages (don't reveal if user exists)
- [ ] Secure password reset flow (short-lived token, hashed in DB)

---

## Learn More

- [OWASP A07: Auth Failures](../02-owasp/web-top10/A07-auth-failures.md)
- [Rate Limiting](./rate-limiting.md)
- [Cryptography: Password Hashing](../07-cryptography/password-hashing.md)
