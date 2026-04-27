# A07: Identification and Authentication Failures

**Formerly "Broken Authentication" (2017 #2) — OWASP Web Top 10 2021**

Authentication failures let attackers impersonate users, take over accounts, or bypass access entirely. This category moved down the list in 2021 only because frameworks now handle more automatically — but custom auth code remains extremely vulnerable.

---

## 30-Second Summary

Weak authentication gives attackers the keys to your users' accounts. The most common issues are: weak passwords allowed, sessions not invalidated on logout, missing rate limiting (enabling brute force), credential stuffing vulnerabilities, and insecure "remember me" implementations.

**Real breach:** The 2012 LinkedIn breach exposed 6.5 million SHA-1-hashed passwords (no salt). Within days, 90%+ were cracked. By 2016, it emerged the full breach was 117 million accounts. SHA-1 without salt: never.

---

## Vulnerability Patterns

### 1. Weak Password Policies

```javascript
// VULNERABLE — accepts any password
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10); // even '1' is accepted
  await db.users.create({ email, password_hash: hash });
});

// SECURE — enforce minimum requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

// Even better — check against HaveIBeenPwned API
import { pwnedPassword } from 'hibp';
const count = await pwnedPassword(password);
if (count > 0) {
  return res.status(400).json({ 
    error: 'This password has appeared in data breaches. Choose another.' 
  });
}
```

### 2. Missing Rate Limiting (Brute Force)

```javascript
// VULNERABLE — unlimited login attempts
app.post('/login', async (req, res) => {
  const user = await db.users.findByEmail(req.body.email);
  if (user && await bcrypt.compare(req.body.password, user.password_hash)) {
    req.session.userId = user.id;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// SECURE — rate limiting with lockout
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
});

app.post('/login', async (req, res) => {
  const identifier = req.ip + ':' + req.body.email;
  const { success, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ 
      error: 'Too many login attempts. Try again in 15 minutes.' 
    });
  }
  // ... authentication logic
});
```

### 3. Weak Password Hashing

```javascript
// CRITICAL VULNERABILITY — MD5 (cracks in seconds)
const hash = md5(password); // never do this

// CRITICAL VULNERABILITY — SHA-256 (fast hash, no work factor)
const hash = crypto.createHash('sha256').update(password).digest('hex');

// CRITICAL VULNERABILITY — unsalted bcrypt (rainbow tables work)
const hash = bcrypt.hashSync(password, '$2b$10$fixedsaltfixedsaltfixe');

// SECURE — bcrypt with sufficient cost factor
const COST_FACTOR = 12; // adjust so hashing takes ~100-200ms on your hardware
const hash = await bcrypt.hash(password, COST_FACTOR);

// SECURE — Argon2 (preferred for new projects)
import argon2 from 'argon2';
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536, // 64MB
  timeCost: 3,
  parallelism: 4,
});
```

### 4. Session Not Invalidated on Logout

```javascript
// VULNERABLE — client-side only logout
app.post('/logout', (req, res) => {
  res.clearCookie('session'); // only removes cookie, server session still valid
  res.json({ success: true });
});

// SECURE — server-side session destruction
app.post('/logout', async (req, res) => {
  const sessionId = req.cookies.session;
  
  // Destroy session in store
  await sessionStore.destroy(sessionId);
  
  // Clear the cookie
  res.clearCookie('session', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  
  res.json({ success: true });
});

// For JWT — maintain a denylist (Redis)
app.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  
  // Add to denylist until token would naturally expire
  await redis.setex(`denylist:${token}`, ttl, '1');
  res.json({ success: true });
});

// Middleware to check denylist
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const isDenylisted = await redis.get(`denylist:${token}`);
  if (isDenylisted) return res.status(401).json({ error: 'Session expired' });
  // ... verify token
}
```

### 5. Insecure "Remember Me"

```javascript
// VULNERABLE — predictable remember-me token
const rememberToken = userId + ':' + Date.now(); // guessable

// VULNERABLE — token stored in DB without hashing (stolen DB = stolen sessions)
await db.sessions.create({ user_id: userId, token: rememberToken });

// SECURE — cryptographically random, hashed in DB
import { randomBytes, createHash } from 'crypto';

const selector = randomBytes(16).toString('hex'); // for DB lookup
const verifier = randomBytes(32).toString('hex'); // secret part
const hashedVerifier = createHash('sha256').update(verifier).digest('hex');

// Store selector + hashed verifier in DB
await db.rememberTokens.create({
  user_id: userId,
  selector,
  hashed_verifier: hashedVerifier,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});

// Cookie contains selector:verifier
res.cookie('remember_me', `${selector}:${verifier}`, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

// Verification
const [selector, verifier] = req.cookies.remember_me.split(':');
const record = await db.rememberTokens.findBySelector(selector);
const hash = createHash('sha256').update(verifier).digest('hex');
if (record && timingSafeEqual(Buffer.from(record.hashed_verifier), Buffer.from(hash))) {
  // Valid — rotate the token immediately
}
```

### 6. Username Enumeration

```javascript
// VULNERABLE — different error messages reveal valid emails
if (!user) {
  return res.status(404).json({ error: 'Email not found' }); // reveals email existence
}
if (!passwordMatch) {
  return res.status(401).json({ error: 'Wrong password' }); // confirms email is valid
}

// SECURE — identical error for both cases + consistent timing
import { timingSafeEqual } from 'crypto';

app.post('/login', async (req, res) => {
  const user = await db.users.findByEmail(req.body.email);
  
  // Always run bcrypt even if user doesn't exist (prevents timing attacks)
  const dummyHash = '$2b$12$invalidhashforfakeconsistency.............';
  const passwordMatch = user 
    ? await bcrypt.compare(req.body.password, user.password_hash)
    : await bcrypt.compare(req.body.password, dummyHash); // constant time
  
  if (!user || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' }); // same message
  }
  
  // success
});
```

---

## Supabase Auth Checklist

```sql
-- Enforce minimum password length (Supabase dashboard → Auth → Password Policy)
-- Min length: 12 characters
-- Check for leaked passwords: enabled

-- Enable email confirmation
-- Supabase dashboard → Auth → Email → Confirm email: enabled

-- Set sensible session duration
-- Supabase dashboard → Auth → JWT expiry: 3600 (1 hour)
-- Refresh token reuse interval: 10 seconds (prevents theft)
```

```javascript
// Supabase — always handle auth errors generically
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  // Don't return error.message directly — it may reveal too much
  return res.status(401).json({ error: 'Invalid email or password' });
}
```

---

## OAuth Security

```javascript
// VULNERABLE — missing state parameter (CSRF attack possible)
const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}`;

// SECURE — include unpredictable state
import { randomBytes } from 'crypto';

app.get('/auth/github', (req, res) => {
  const state = randomBytes(32).toString('hex');
  req.session.oauthState = state;
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'read:user user:email');
  
  res.redirect(authUrl.toString());
});

app.get('/auth/github/callback', (req, res) => {
  const { code, state } = req.query;
  
  // Verify state matches what we set
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid OAuth state' });
  }
  
  delete req.session.oauthState;
  // Exchange code for token...
});
```

---

## Security Tests

```javascript
describe('Authentication Security', () => {
  it('blocks brute force after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/login')
        .send({ email: 'user@test.com', password: 'wrong' + i });
    }
    const res = await request(app).post('/login')
      .send({ email: 'user@test.com', password: 'wrongfinal' });
    expect(res.status).toBe(429);
  });

  it('returns identical error for wrong email vs wrong password', async () => {
    const r1 = await request(app).post('/login')
      .send({ email: 'nonexistent@test.com', password: 'anything' });
    const r2 = await request(app).post('/login')
      .send({ email: 'real@test.com', password: 'wrongpassword' });
    expect(r1.body.error).toBe(r2.body.error);
  });

  it('invalidates session after logout', async () => {
    const loginRes = await request(app).post('/login')
      .send({ email: 'user@test.com', password: 'CorrectPass123!' });
    const cookie = loginRes.headers['set-cookie'][0];
    
    await request(app).post('/logout').set('Cookie', cookie);
    
    const meRes = await request(app).get('/api/me').set('Cookie', cookie);
    expect(meRes.status).toBe(401);
  });

  it('rejects weak passwords at registration', async () => {
    const res = await request(app).post('/register')
      .send({ email: 'new@test.com', password: 'password' }); // common password
    expect(res.status).toBe(400);
  });
});
```

---

## Audit Checklist

- [ ] Passwords hashed with bcrypt (cost ≥12), Argon2id, or PBKDF2
- [ ] Rate limiting on login endpoint (≤10 attempts per 15 minutes)
- [ ] Rate limiting on password reset endpoint
- [ ] Sessions invalidated server-side on logout
- [ ] Session cookies: HttpOnly, Secure, SameSite=Lax
- [ ] JWT tokens short-lived (≤1 hour) with refresh rotation
- [ ] Identical error messages for wrong email and wrong password
- [ ] OAuth state parameter used and verified
- [ ] Multi-factor authentication available (especially for admin accounts)
- [ ] Password reset tokens: cryptographically random, expire in ≤15 minutes, single-use
- [ ] Leaked password check (HaveIBeenPwned integration)
- [ ] Account lockout or progressive delay after failed attempts

---

## Learn More

- [Auth Best Practices](../../06-secure-coding/auth-best-practices.md)
- [Rate Limiting Guide](../../06-secure-coding/rate-limiting.md)
- [OAuth Deep Dive](../../06-secure-coding/oauth-deep-dive.md)
- [Testing Your Auth](../../10-security-testing/testing-your-auth.md)
- [OWASP A02: Cryptographic Failures](./A02-cryptographic-failures.md)
