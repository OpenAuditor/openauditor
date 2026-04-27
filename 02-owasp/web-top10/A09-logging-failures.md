# A09: Security Logging and Monitoring Failures

**Formerly "Insufficient Logging & Monitoring" (2017 #10) — OWASP Web Top 10 2021**

Without proper logging and monitoring, breaches go undetected for months. The average time to identify a breach is 194 days. Logging is your evidence trail, anomaly detector, and forensic toolkit.

---

## 30-Second Summary

Applications that don't log security events, don't alert on anomalies, or don't retain logs long enough are flying blind. Attackers know this — they deliberately operate slowly to avoid triggering thresholds. The Equifax breach (2017) was active for 78 days before detection. The Target breach (2013) triggered security alerts that were ignored.

**Real breach:** The 2013 Target breach — attackers exfiltrated 40 million credit card numbers over weeks. Target's security tools *did* alert. The alerts were ignored. Logging without monitoring is nearly useless.

---

## What Must Be Logged

### Security Events (Always Log These)

```javascript
// Authentication events
logger.info({ event: 'auth.login.success', userId: user.id, ip: req.ip });
logger.warn({ event: 'auth.login.failure', email: req.body.email, ip: req.ip });
logger.warn({ event: 'auth.login.rate_limited', ip: req.ip, email: req.body.email });
logger.info({ event: 'auth.logout', userId: req.user.id });
logger.warn({ event: 'auth.password_reset.requested', email: req.body.email });
logger.info({ event: 'auth.password_changed', userId: req.user.id });
logger.warn({ event: 'auth.mfa.failed', userId: req.user.id });

// Authorisation events
logger.warn({ event: 'authz.denied', userId: req.user.id, resource: req.path, method: req.method });
logger.warn({ event: 'authz.privilege_escalation_attempt', userId: req.user.id, attempted_role: 'admin' });

// Data events
logger.info({ event: 'data.export', userId: req.user.id, table: 'orders', count: rows.length });
logger.info({ event: 'data.delete', userId: req.user.id, resource: 'user_account', targetId: req.params.id });

// Admin actions
logger.info({ event: 'admin.user_banned', adminId: req.user.id, targetUserId: req.params.id });
logger.info({ event: 'admin.config_changed', adminId: req.user.id, setting: 'payment_provider' });

// Errors with security implications
logger.error({ event: 'error.unhandled', path: req.path, error: err.message, userId: req.user?.id });
```

### What NOT to Log

```javascript
// NEVER log these — they're sensitive data
logger.info({ password: req.body.password });          // passwords
logger.info({ token: req.headers.authorization });     // auth tokens
logger.info({ card: req.body.cardNumber });            // payment data
logger.info({ ssn: req.body.ssn });                    // PII
logger.info({ secret: process.env.JWT_SECRET });       // secrets

// Sanitise request bodies before logging
function sanitiseForLog(obj) {
  const sensitive = ['password', 'token', 'secret', 'key', 'card', 'cvv', 'ssn'];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      sensitive.some(s => k.toLowerCase().includes(s)) ? '[REDACTED]' : v
    ])
  );
}

logger.info({ event: 'user.updated', body: sanitiseForLog(req.body) });
```

---

## Structured Logging Implementation

```javascript
// Use structured (JSON) logging — easy to query and alert on
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'api',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  },
});

// Every log line is JSON with consistent fields:
// {"level":"warn","service":"api","event":"auth.login.failure","email":"test@example.com","ip":"1.2.3.4","time":"2026-01-15T12:00:00.000Z"}

// Middleware — log every request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      event: 'http.request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: req.ip,
      userId: req.user?.id,
    });
  });
  next();
});
```

```python
# Python — use structlog
import structlog

logger = structlog.get_logger()

# Authentication event
logger.warning(
    "auth.login.failure",
    email=request.json.get('email'),
    ip=request.remote_addr,
    user_agent=request.headers.get('User-Agent'),
)
```

---

## Alerting Thresholds

Set up alerts for these patterns. If using Datadog, Grafana, or CloudWatch:

```javascript
// Express middleware — track metrics for alerting
const metrics = {
  loginFailures: new Map(), // ip -> count
};

app.post('/login', (req, res, next) => {
  // After failed login:
  const ip = req.ip;
  const count = (metrics.loginFailures.get(ip) || 0) + 1;
  metrics.loginFailures.set(ip, count);
  
  if (count >= 10) {
    logger.warn({
      event: 'security.alert.brute_force',
      ip,
      attempts: count,
      // This triggers PagerDuty/Slack alert in your monitoring system
    });
  }
});
```

**Alert thresholds to configure:**

| Event | Threshold | Response |
|-------|-----------|----------|
| Login failures from single IP | >10 in 15 min | Auto-block IP |
| Login failures across many IPs | >100 in 1 hour | Credential stuffing attack |
| Password resets | >20 in 1 hour | Investigate |
| 403 errors from single IP | >50 in 10 min | Possible IDOR scan |
| 500 errors | Spike >2x baseline | Application under attack |
| Admin actions | Any outside business hours | Immediate alert |
| Large data exports | >1000 rows | Manual review |

---

## Log Retention and Storage

```yaml
# Minimum retention requirements
security_logs:
  retention: 12 months      # PCI DSS, SOC 2 requirement
  
application_logs:
  retention: 90 days        # typical minimum

access_logs:
  retention: 90 days

# GDPR note: logs may contain IP addresses (personal data)
# Document log retention in your Privacy Policy
# Delete logs after retention period (or anonymise IPs)
```

**Anti-pattern:** Logs stored where attackers can delete them:

```bash
# VULNERABLE — attacker who compromises app server can delete logs
/var/log/app/security.log   # on the same server

# SECURE — ship logs to separate service immediately
# Options: Datadog, Logtail, Axiom, CloudWatch, Loki
# Attacker can't delete logs from a service they don't control
```

---

## Log Injection Prevention

```javascript
// VULNERABLE — log injection (attacker controls log content)
const username = req.body.username;
logger.info(`User logged in: ${username}`);
// If username = "admin\nINFO: User logged in: attacker", this injects a fake log line

// SECURE — use structured logging (fields, not concatenation)
logger.info({ event: 'auth.login', username: req.body.username });
// The logger serialises the value safely — no injection
```

---

## Supabase / Next.js Logging Pattern

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'body.password', 'body.token'],
});

// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  
  if (error) {
    logger.warn({
      event: 'auth.login.failure',
      email: body.email,
      error: error.message,
      ip: request.headers.get('x-forwarded-for'),
    });
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  logger.info({
    event: 'auth.login.success',
    userId: data.user.id,
    ip: request.headers.get('x-forwarded-for'),
  });
  
  return Response.json({ success: true });
}
```

---

## Audit Checklist

- [ ] Authentication events logged (success, failure, logout, password change)
- [ ] Authorisation failures logged (403s, IDOR attempts)
- [ ] Admin actions logged with actor ID
- [ ] Structured JSON logging (not plain text)
- [ ] Passwords, tokens, and PII are never logged
- [ ] Logs shipped to external service (not stored on app server only)
- [ ] Log retention ≥90 days (≥12 months for compliance)
- [ ] Alerting configured for brute force, large data exports, and admin actions
- [ ] Alerts actually tested (fire a test alert to verify the pipeline works)
- [ ] Log access is restricted (not publicly accessible)
- [ ] GDPR: log retention documented, IP addresses treated as personal data

---

## Learn More

- [Monitoring and Observability](../../11-monitoring-and-observability/README.md)
- [Post-Breach Forensics](../../15-post-breach/forensic-evidence.md)
- [GDPR Breach Notification](../../12-privacy-and-gdpr/breach-notification.md)
