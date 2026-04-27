# What Not to Log

Logging too much is as dangerous as logging too little. Sensitive data in logs creates a second attack surface — logs are often shipped to third-party platforms, stored with weaker access controls than your database, and retained far longer than necessary.

This file documents patterns you must never log, with examples of the mistake and the safe alternative.

---

## The danger

Log aggregation platforms (Datadog, Logtail, Splunk, etc.) typically have:

- Broader access than your production database (many engineers can read logs)
- Weaker encryption at rest
- Longer retention by default
- Less auditing of who read what

A single log line containing a password or token can compromise your entire system. A single log line containing a customer's email can be a GDPR breach.

---

## Category 1: Credentials and secrets

### Passwords

**Never do this:**

```javascript
// BAD — logs the attempted password
logger.info(`Login attempt for ${email} with password ${password}`);

// BAD — logs the full request body
logger.info('Auth request', { body: req.body });
// req.body = { email: "user@example.com", password: "hunter2" }
```

**Do this instead:**

```javascript
// GOOD — logs the outcome, not the credential
logger.info({
  event_type: 'auth.login.failure',
  email_hash: hashEmail(email),
  failure_reason: 'invalid_password',
  ip_address: req.ip,
});
```

### API keys and tokens

**Never do this:**

```javascript
// BAD — logs the full Authorization header
logger.debug('Incoming request', { headers: req.headers });
// headers.authorization = "Bearer sk_live_abc123..."

// BAD — logs the full token in an error
logger.error(`Token validation failed for token: ${token}`);

// BAD — logs Stripe webhook secret
logger.info(`Webhook received`, { webhookSecret: process.env.STRIPE_WEBHOOK_SECRET });
```

**Do this instead:**

```javascript
// GOOD — log only a token prefix for debugging identity
const tokenPrefix = token?.substring(0, 8) + '...';
logger.error({
  event_type: 'auth.token.invalid',
  token_prefix: tokenPrefix,
  reason: 'expired',
});
```

### Database connection strings

**Never do this:**

```javascript
// BAD — connection string contains password
logger.error(`DB connection failed: ${process.env.DATABASE_URL}`);
// DATABASE_URL = "postgresql://user:password@host:5432/db"
```

**Do this instead:**

```javascript
// GOOD — log only the host and database name
const url = new URL(process.env.DATABASE_URL);
logger.error({
  event_type: 'db.connection_failed',
  host: url.hostname,
  database: url.pathname,
  // no username, no password
});
```

### Private keys and certificates

```javascript
// BAD — never log PEM blocks
logger.debug('Loaded signing key', { key: signingKey });

// BAD — never log JWT secrets
logger.info('JWT config', { secret: process.env.JWT_SECRET });
```

---

## Category 2: Personally Identifiable Information (PII)

Logging PII creates GDPR obligations for your log platform, your log retention, and your log access controls. Avoid it entirely where possible.

### Email addresses

**Never do this:**

```javascript
// BAD
logger.info(`User logged in: ${user.email}`);
logger.info('Auth failure', { email: req.body.email });
```

**Do this instead:**

```javascript
// GOOD — hash the email for correlation without storage
import { createHash } from 'crypto';

function hashEmail(email: string): string {
  return 'sha256:' + createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

logger.info({
  event_type: 'auth.login.success',
  email_hash: hashEmail(user.email),
  user_id: user.id,
});
```

The hash lets you search logs for a specific user (you compute the hash of the email you're investigating) without storing the email in plain text.

### Names

```javascript
// BAD
logger.info(`Processing order for ${user.firstName} ${user.lastName}`);

// GOOD
logger.info({
  event_type: 'order.processing',
  user_id: user.id,
  order_id: order.id,
});
```

### Phone numbers and addresses

```javascript
// BAD
logger.info('SMS sent', { to: user.phoneNumber });
logger.info('Delivery dispatched', { address: order.deliveryAddress });

// GOOD
logger.info({ event_type: 'sms.sent', user_id: user.id, provider_message_id: smsId });
logger.info({ event_type: 'delivery.dispatched', order_id: order.id });
```

### Payment card data (PCI DSS)

**This is a legal requirement, not just a best practice.** PCI DSS prohibits storing card numbers in logs.

```javascript
// BAD — even partial card numbers can be restricted
logger.info('Payment processed', { card: paymentMethod.card });
// card = { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2028 }

// GOOD — reference the payment provider's token only
logger.info({
  event_type: 'payment.processed',
  payment_method_id: paymentMethod.id,   // Stripe PM ID, not card data
  amount_pence: charge.amount,
  currency: charge.currency,
  user_id: user.id,
});
```

### Health / medical data

```javascript
// BAD
logger.info(`User ${userId} updated health profile: ${JSON.stringify(healthData)}`);

// GOOD
logger.info({
  event_type: 'profile.health.updated',
  user_id: userId,
  fields_updated: Object.keys(healthData),
});
```

### National insurance / social security numbers, passport numbers

Never log. No exceptions.

---

## Category 3: Session tokens and cookies

**Never do this:**

```javascript
// BAD — logs the session token
logger.debug('Request context', {
  cookies: req.cookies,
  // cookies = { session: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
});

// BAD — logs Authorization header wholesale
app.use((req, res, next) => {
  logger.debug({ headers: req.headers }); // includes auth token
  next();
});
```

**Do this instead:**

```javascript
// GOOD — log only safe headers
const safeHeaders = {
  'content-type': req.headers['content-type'],
  'user-agent': req.headers['user-agent'],
  'x-request-id': req.headers['x-request-id'],
  'x-forwarded-for': req.headers['x-forwarded-for'],
};
logger.debug({ event_type: 'request.received', headers: safeHeaders });
```

---

## Category 4: Request and response bodies

**Never log request or response bodies by default.**

Bodies frequently contain:
- Passwords (login forms)
- PII (registration forms, profile updates)
- Payment details
- File uploads

```javascript
// BAD — blanket body logging
app.use((req, res, next) => {
  logger.debug({ body: req.body }); // dangerous
  next();
});
```

If you need to debug specific endpoints, use a middleware that explicitly allowlists safe fields:

```javascript
// GOOD — safe request logging middleware
function safeRequestLog(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const safeBody = Object.fromEntries(
      allowedFields
        .filter(f => f in req.body)
        .map(f => [f, req.body[f]])
    );
    logger.debug({
      event_type: 'request.received',
      method: req.method,
      path: req.path,
      body: safeBody,
    });
    next();
  };
}

// Usage: only log non-sensitive search parameters
router.get('/search', safeRequestLog(['query', 'page', 'per_page']), searchHandler);
```

---

## Category 5: Internal infrastructure details

Avoid logging information that helps attackers map your infrastructure.

```javascript
// BAD — reveals internal hostnames and IPs
logger.error(`DB query failed on host db-primary-01.internal:5432`);

// BAD — reveals service mesh topology
logger.info(`Proxying request to payment-service.prod.svc.cluster.local`);

// BAD — reveals dependency versions (helps attackers find CVEs)
logger.info(`Starting server with Node ${process.version}, Express 4.18.2`);
```

Log version information at startup to a restricted internal log, not to the general application log.

---

## Automated scanning: find dangerous patterns

Run this grep before deploying or during CI to catch dangerous log patterns:

```bash
#!/bin/bash
# scan-logs.sh — detect dangerous logging patterns

echo "Scanning for dangerous log patterns..."

DANGEROUS_PATTERNS=(
  'password'
  'passwd'
  'secret'
  'token'
  'api_key'
  'apiKey'
  'authorization'
  'credit_card'
  'card_number'
  'cvv'
  'ssn'
  'nationalInsurance'
  'req\.body'
  'req\.headers'
  'process\.env'
)

FOUND=0
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  results=$(grep -rn --include="*.ts" --include="*.js" \
    -E "(logger|log|console)\.(info|debug|warn|error|log).*${pattern}" \
    ./src/ 2>/dev/null)
  
  if [ -n "$results" ]; then
    echo "WARNING: Potential sensitive data in log call — pattern: ${pattern}"
    echo "$results"
    FOUND=$((FOUND + 1))
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "No dangerous patterns found."
  exit 0
else
  echo "${FOUND} potentially dangerous pattern(s) found. Review before deploying."
  exit 1
fi
```

---

## Quick reference: never log checklist

| Data type | Why it's dangerous |
|---|---|
| Passwords (any form) | Credential theft, account takeover |
| API keys and tokens | Full access to services |
| Session cookies / JWTs | Session hijacking |
| Database connection strings | Direct DB access |
| Private keys / certificates | Cryptographic compromise |
| Email addresses (plain text) | GDPR breach, targeted phishing |
| Full names | GDPR PII |
| Phone numbers | GDPR PII, SIM swapping |
| Physical addresses | GDPR PII |
| Card numbers (any digits) | PCI DSS violation |
| CVV codes | PCI DSS violation |
| NI / SSN numbers | Identity theft, regulatory violation |
| Passport / ID numbers | Identity theft |
| Health / medical data | Special category GDPR data |
| `req.body` wholesale | Contains all of the above |
| `req.headers` wholesale | Contains auth tokens |
| `process.env` wholesale | Contains secrets |
| Full stack traces | Reveals code structure, paths, versions |
| Internal hostnames / IPs | Aids network reconnaissance |
