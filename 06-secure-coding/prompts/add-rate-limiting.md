# Prompt: Add Rate Limiting

## When to use this

Use this when your app has no rate limiting, when you're preparing for launch, or after seeing unusual traffic patterns. Essential before exposing any authentication or public API endpoints.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Implement rate limiting on this application.

**Step 1: Identify endpoints that need rate limiting**
List all API endpoints and classify them:
- Authentication (login, register, password reset, 2FA) — STRICT limits needed
- Public data endpoints — MODERATE limits
- Authenticated user API endpoints — PER-USER limits
- Admin endpoints — VERY STRICT + alert on repeated failures

**Step 2: Determine the stack**
Check whether this is:
- Next.js with serverless/Vercel deployment → use Upstash Redis + @upstash/ratelimit
- Express/Node.js on a persistent server → use express-rate-limit
- FastAPI/Python → use slowapi
- Another framework → identify the appropriate library

**Step 3: Implement rate limiting**

For Next.js + Upstash:
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
// Set env: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
```

Create a rate limit middleware/helper and apply it to:
- Login endpoint: 10 requests per 15 minutes per IP
- Registration: 5 requests per hour per IP
- Password reset: 5 requests per hour per IP
- General API: 60 requests per minute per user (when authenticated) or per IP

**Step 4: Return correct HTTP response**
When rate limited:
- Return HTTP 429 (Too Many Requests)
- Include `Retry-After` header with seconds until reset
- Return JSON: `{ "error": "Too many requests. Please try again later." }`
- Do NOT return 403 or 500

**Step 5: Logging**
Log rate limit events:
```javascript
console.warn({ event: 'rate_limit', ip, endpoint, timestamp: new Date() });
```

**Step 6: Test it**
Write a test that sends more than the limit and verifies:
- First N requests succeed (200)
- Request N+1 returns 429
- After the window resets, requests succeed again

Show the working implementation and test.

---

## What to expect

Working rate limiting middleware installed and applied to all sensitive endpoints. Each endpoint has appropriate limits. Rate limit violations return 429. You'll also see test code that verifies the limits work.

## Learn more

[Rate Limiting](../rate-limiting.md)
