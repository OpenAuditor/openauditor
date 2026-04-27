# Prompt: Fix Authentication Failures

## When to use this

Use this when an auth security issue is found (weak hashing, missing rate limiting, session not invalidated), or proactively when auditing an authentication implementation you didn't write.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer fixing authentication vulnerabilities. Systematically review and harden the authentication implementation.

**Step 1: Audit password hashing**

```bash
grep -rn "bcrypt\|argon2\|scrypt\|pbkdf2\|MD5\|SHA1\|sha1\|sha256\|hash\(" \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules
```

Check: What algorithm is used? What is the cost factor?

Fix any insecure hashing:

```typescript
// CRITICAL: Replace MD5/SHA with bcrypt
// VULNERABLE
const hash = md5(password); // never
const hash = crypto.createHash('sha256').update(password).digest('hex'); // never

// SECURE — bcrypt with cost factor ≥12
import bcrypt from 'bcrypt';
const COST_FACTOR = 12; // Adjust so hashing takes ~100ms on your hardware
const hash = await bcrypt.hash(password, COST_FACTOR);

// Verification
const match = await bcrypt.compare(inputPassword, storedHash);
```

If switching from an insecure algorithm, create a migration:
1. On next login, verify with old algorithm
2. If match, rehash with bcrypt and update stored hash
3. After 90 days, expire all accounts with old-format hashes (force password reset)

**Step 2: Add rate limiting to login endpoint**

```bash
# Check if rate limiting exists
grep -rn "rateLimit\|RateLimit\|rate_limit\|rateLimiter\|Ratelimit" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

If missing:

```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const loginRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await request.json();
  
  // Rate limit by IP + email combo
  const identifier = `login:${ip}:${body.email}`;
  const { success } = await loginRatelimit.limit(identifier);
  
  if (!success) {
    return Response.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }
  
  // ... authentication logic
}
```

**Step 3: Fix username enumeration**

```bash
# Find login handlers
grep -rn "user not found\|email not found\|invalid email\|user does not exist" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Ensure identical error messages and response times:

```typescript
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await db.users.findByEmail(email);
  
  // Always run bcrypt even if user doesn't exist — prevents timing attacks
  const dummyHash = '$2b$12$invalidhashforconsistencyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const passwordMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash); // same timing whether user exists or not
  
  if (!user || !passwordMatch) {
    return Response.json(
      { error: 'Invalid email or password' }, // Same message for both cases
      { status: 401 }
    );
  }
  
  // ... create session
}
```

**Step 4: Fix session invalidation on logout**

```bash
# Find logout handlers
grep -rn "logout\|signOut\|sign_out\|clearCookie\|destroySession" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Ensure server-side session destruction:

```typescript
// VULNERABLE — only clears cookie, server session still valid
export async function POST() {
  const response = new Response(JSON.stringify({ success: true }));
  response.headers.set('Set-Cookie', 'session=; Max-Age=0; Path=/');
  return response;
}

// SECURE — destroy session on server first
export async function POST(request: Request) {
  const sessionId = request.cookies.get('session')?.value;
  
  if (sessionId) {
    // Delete from session store — makes session permanently invalid
    await sessionStore.destroy(sessionId);
  }
  
  const response = new Response(JSON.stringify({ success: true }));
  response.headers.set('Set-Cookie', 
    'session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'
  );
  return response;
}
```

**Step 5: Verify password reset security**

```bash
grep -rn "reset.password\|forgot.password\|resetToken\|password_reset" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check:
- Is the token cryptographically random? (crypto.randomBytes, not Math.random)
- Does it expire? (should be ≤15 minutes)
- Is it single-use? (invalidated after first use)
- Is the response the same whether the email exists or not?

```typescript
// SECURE password reset token generation
import { randomBytes } from 'crypto';

const token = randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

await db.passwordResets.create({
  token,
  userId: user.id,
  expiresAt,
  usedAt: null, // Track if token has been used
});

// On token verification:
const reset = await db.passwordResets.findByToken(token);

if (!reset) return error('Invalid or expired token');
if (reset.usedAt) return error('Token already used');
if (reset.expiresAt < new Date()) return error('Token expired');

// Mark as used immediately
await db.passwordResets.update(reset.id, { usedAt: new Date() });
```

**Step 6: Check cookie security flags**

```bash
grep -rn "setCookie\|set-cookie\|HttpOnly\|Secure\|SameSite" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

All session cookies must have:
- `HttpOnly` — prevents JavaScript access
- `Secure` — HTTPS only
- `SameSite=Lax` — CSRF protection

```typescript
// SECURE cookie settings
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 1000, // 1 hour
  path: '/',
});
```

**Step 7: Write authentication security tests**

```typescript
describe('Authentication Security', () => {
  it('blocks after 5 failed login attempts', async () => {
    const attempts = Array.from({ length: 5 }, () =>
      request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'wrong' })
    );
    await Promise.all(attempts);
    
    const blocked = await request(app).post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });
    expect(blocked.status).toBe(429);
  });

  it('returns same error for wrong email vs wrong password', async () => {
    const r1 = await request(app).post('/api/auth/login')
      .send({ email: 'noexist@test.com', password: 'anything' });
    const r2 = await request(app).post('/api/auth/login')
      .send({ email: 'real@test.com', password: 'wrongpassword' });
    expect(r1.body.error).toBe(r2.body.error);
  });

  it('session is invalid after logout', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'correct' });
    const cookie = login.headers['set-cookie'][0];
    
    await request(app).post('/api/auth/logout').set('Cookie', cookie);
    
    const me = await request(app).get('/api/me').set('Cookie', cookie);
    expect(me.status).toBe(401);
  });
});
```

**Step 8: Produce findings and fix summary**

| Issue | Severity | Status | Fix Applied |
|-------|----------|--------|-------------|
| MD5 password hashing | Critical | Fixed | bcrypt cost=12 |
| No login rate limiting | High | Fixed | 5 req/15min |
| Username enumeration | Medium | Fixed | Identical errors |
| Session not invalidated | High | Fixed | Server-side destroy |

---

## What to expect

All authentication vulnerabilities identified and fixed: bcrypt with sufficient cost, rate limiting, uniform error messages, server-side logout, and cryptographically secure password reset tokens. Security tests written and passing.

## Learn more

[A07: Auth Failures](../web-top10/A07-auth-failures.md)
[Auth Best Practices](../../06-secure-coding/auth-best-practices.md)
[Testing Your Auth](../../10-security-testing/testing-your-auth.md)
