# Rate Limiting

Rate limiting prevents brute-force attacks, credential stuffing, API abuse, and accidental DoS. Every public-facing endpoint needs it.

---

## Why It Matters

Without rate limiting:
- An attacker can try 10 million passwords per minute on your login endpoint
- Someone can scrape your entire database through your API
- A misconfigured client can accidentally take down your service
- Bots can spam your registration endpoint

**The 2021 Parler breach** was entirely caused by missing rate limiting. Attackers made sequential API requests, scraping 70 terabytes of posts, direct messages, and metadata before the platform was taken offline.

---

## Node.js / Express: express-rate-limit

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

// Global rate limit (all routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // 10 attempts per window per IP
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// API endpoints (per user, not per IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 60,                    // 60 req/min per key
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/v1', apiLimiter);
```

---

## Next.js: Rate Limiting API Routes

### Using Upstash Redis (Recommended for Serverless)

```bash
npm install @upstash/ratelimit @upstash/redis
```

```javascript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  analytics: true,
});

// pages/api/auth/login.ts
import { rateLimiter } from '@/lib/rate-limit';

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { success, remaining } = await rateLimiter.limit(ip);

  if (!success) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  // handle login...
}
```

### Using in-memory (Single Instance Only — Not Suitable for Serverless)

```javascript
// Only use this for non-serverless Node.js apps
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({ windowMs: 60000, max: 60 });
```

> **Critical:** In-memory rate limiting doesn't work with serverless functions (each invocation is isolated). Use Redis-backed rate limiting for Vercel, AWS Lambda, or Edge functions.

---

## Python / FastAPI

```bash
pip install slowapi
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/auth/login")
@limiter.limit("10/15minutes")
async def login(request: Request, credentials: LoginCredentials):
    ...

@app.get("/api/data")
@limiter.limit("60/minute")
async def get_data(request: Request):
    ...
```

---

## Rate Limit Strategies

| Strategy | How It Works | Best For |
|----------|-------------|---------|
| **Fixed Window** | Count resets every N minutes | Simple APIs |
| **Sliding Window** | Smooth count over rolling period | Auth endpoints |
| **Token Bucket** | Tokens refill at steady rate, burst allowed | High-traffic APIs |
| **Leaky Bucket** | Queue requests, drain at steady rate | Background jobs |

Use sliding window for auth endpoints — fixed windows have edge cases where attackers can send 2x allowed requests at window boundaries.

---

## Per-User vs Per-IP

```javascript
// Per-IP (unauthenticated endpoints)
keyGenerator: (req) => req.ip

// Per-user (authenticated endpoints)
keyGenerator: (req) => req.user?.id || req.ip

// Per-API-key (developer APIs)
keyGenerator: (req) => req.headers['x-api-key'] || req.ip
```

Use per-IP for login. Use per-user for authenticated APIs. Per-IP alone is easy to bypass with multiple IPs, but it raises the cost significantly.

---

## Response Headers

Always return rate limit info in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714123456
Retry-After: 60
```

Return HTTP 429 with a clear message. Don't return 403 or 500 — that confuses clients.

---

## Checklist

- [ ] Global rate limit on all routes
- [ ] Strict rate limit on auth endpoints (login, register, password reset)
- [ ] Per-user rate limiting on authenticated API endpoints
- [ ] Redis-backed rate limiter for serverless deployments
- [ ] Returns 429 with `Retry-After` header
- [ ] Rate limit events logged for monitoring
- [ ] Limits tested to ensure they don't block legitimate users

---

## Learn More

- [API Security](./api-security.md)
- [OWASP API4: Unrestricted Resource Consumption](../02-owasp/api-top10/API4-unrestricted-resource-consumption.md)
- [Add Rate Limiting prompt](./prompts/add-rate-limiting.md)
