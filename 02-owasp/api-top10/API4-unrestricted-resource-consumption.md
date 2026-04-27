# API4 — Unrestricted Resource Consumption

## 30-second summary

APIs that place no limits on request rate, payload size, query depth, or returned record counts can be abused to exhaust server resources, rack up third-party API bills, or cause denial of service. This applies to CPU, memory, database connections, outbound API calls, and cloud service quotas alike.

> **Critical:** Rate limiting is not optional. Every public-facing API endpoint, including password reset and OTP flows, must have limits that prevent automated abuse.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE

// No rate limiting, no pagination limits, no payload size restriction
app.get('/api/search', authenticate, async (req, res) => {
  const { query, page, pageSize } = req.query;

  // pageSize has no upper bound — attacker requests pageSize=100000
  const results = await db.query(
    'SELECT * FROM products WHERE name ILIKE $1 LIMIT $2 OFFSET $3',
    [`%${query}%`, pageSize, page * pageSize]
  );

  return res.json(results);
});

// No body size limit — attacker uploads 500MB JSON payload
app.post('/api/upload-data', authenticate, async (req, res) => {
  const { records } = req.body;

  // Processes every record regardless of how many there are
  for (const record of records) {
    await db.insertRecord(record);
  }

  return res.json({ inserted: records.length });
});

// SMS OTP endpoint — no rate limit
app.post('/api/auth/send-otp', async (req, res) => {
  const { phone } = req.body;
  await smsProvider.send(phone, generateOTP()); // Each SMS costs money
  return res.json({ sent: true });
});
```

---

## Fixed code example

```typescript
// Express.js — FIXED
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
});

// Strict limiter for expensive/paid operations
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // max 5 OTP requests per IP per hour
  keyGenerator: (req) => req.body.phone || req.ip, // key by phone number
  message: { error: 'Too many OTP requests. Try again later.' },
});

app.use(globalLimiter);

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

app.get('/api/search', authenticate, async (req, res) => {
  const query = String(req.query.query || '').slice(0, 200); // cap query length
  const page = Math.max(0, parseInt(String(req.query.page)) || 0);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(String(req.query.pageSize)) || DEFAULT_PAGE_SIZE)
  );

  const results = await db.query(
    'SELECT id, name, price, category FROM products WHERE name ILIKE $1 LIMIT $2 OFFSET $3',
    [`%${query}%`, pageSize, page * pageSize]
  );

  return res.json({ results, page, pageSize });
});

// Body size limit applied at middleware level
import express from 'express';
app.use(express.json({ limit: '1mb' }));

app.post('/api/upload-data', authenticate, async (req, res) => {
  const { records } = req.body;

  const MAX_RECORDS = 500;
  if (!Array.isArray(records) || records.length > MAX_RECORDS) {
    return res.status(400).json({
      error: `Maximum ${MAX_RECORDS} records per request`,
    });
  }

  // Batch insert rather than looping with individual queries
  await db.bulkInsert(records);
  return res.json({ inserted: records.length });
});

app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
  const { phone } = req.body;
  await smsProvider.send(phone, generateOTP());
  return res.json({ sent: true });
});
```

---

## Real-world breach scenario

**Parler (2021):** After Parler was removed from app stores, a researcher discovered the API had no rate limiting and returned posts in sequential numeric order with no authentication on public posts. She wrote a script to download all public content — 70+ terabytes of posts, images, and videos — before the platform went offline. The lack of rate limiting made large-scale automated harvesting trivial.

**SMS bombing / financial abuse:** Several ride-sharing and food delivery startups have been targeted with OTP flooding — attackers send hundreds of SMS messages to victim phone numbers, causing harassment and running up provider bills in the thousands of pounds per hour. In some cases the attacker's goal was purely financial: the company pays per SMS.

---

## Detection checklist

- [ ] Every endpoint has a rate limit appropriate to its expected usage pattern.
- [ ] OTP, password reset, and email verification endpoints have strict per-phone/per-email rate limits (not just per-IP).
- [ ] Pagination has an enforced maximum page size.
- [ ] Request body size is limited at the framework/middleware level.
- [ ] GraphQL queries (if used) have depth limiting and query complexity analysis.
- [ ] File upload endpoints limit file size and impose a maximum number of concurrent uploads.
- [ ] Third-party API calls triggered by user input have per-user quotas.
- [ ] Database queries triggered by API calls use timeouts and have row-count caps.
- [ ] Cloud function/serverless invocations triggered by the API have concurrency limits.

---

## Testing strategy

**Rate limit check:**
```bash
# Test if rate limiting exists on a critical endpoint
for i in $(seq 1 50); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://api.example.com/api/auth/send-otp \
    -H 'Content-Type: application/json' \
    -d '{"phone":"+447700900000"}')
  echo "Request $i: $STATUS"
  # Expect 429 after threshold
done
```

**Pagination abuse:**
```bash
# Check if pageSize is bounded
curl -s "https://api.example.com/api/search?query=a&pageSize=99999" \
  | jq 'length'
# If response contains tens of thousands of records, the limit is missing
```

**Payload size test:**
```python
import requests, json

# Send a large payload
large_payload = {'records': [{'name': f'item_{i}'} for i in range(10000)]}
r = requests.post(
    'https://api.example.com/api/upload-data',
    json=large_payload,
    headers={'Authorization': 'Bearer ' + TOKEN}
)
print(r.status_code)  # Expect 400 or 413, not 200
```

---

## Why this matters

Unrestricted resource consumption is a direct path to service unavailability and unexpected cloud bills. Unlike a DDoS from external traffic, these attacks use legitimate-looking API calls that are harder to distinguish and block.

For APIs that trigger paid third-party services (SMS, email, payment processing, LLM inference), the financial damage can accumulate in hours. A single unprotected OTP endpoint once cost a startup over £8,000 in a weekend from SMS flooding before anyone noticed.

For analytics or search endpoints, lack of pagination limits can bring down a database by generating full table scans — not from malice, but from a single poorly written script by a legitimate API partner.
