# Prompt: Set Up Security Logging

## When to use this

Use this when starting a new project, inheriting a codebase that has no security logging, or after a security audit identifies logging gaps. Security logging is evidence — you need it before an incident, not after.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer implementing security logging for a web application. Your goal: ensure every security-relevant event is logged with sufficient context to investigate incidents.

**Step 1: Assess current logging state**

```bash
# Find current logging code
grep -r "console.log\|console.error\|logger\.\|logging\." \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" . | \
  grep -v node_modules | head -30

# Find where auth events happen
grep -r "signIn\|login\|logout\|register\|password\|auth\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules | head -20
```

What logging library is currently in use (if any)? Is it structured (JSON) or plain text? Are logs shipped externally or only to console?

**Step 2: Set up structured logging**

If structured logging is not in place, implement it:

**For Node.js/Next.js (use Pino):**

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  
  // Redact sensitive fields automatically
  redact: {
    paths: [
      'password', 
      'token', 
      'secret', 
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  
  // Base fields on every log line
  base: {
    service: process.env.npm_package_name ?? 'app',
    version: process.env.npm_package_version ?? 'unknown',
    env: process.env.NODE_ENV ?? 'development',
  },
});

// For Next.js: export child loggers per module
export const authLogger = logger.child({ module: 'auth' });
export const apiLogger = logger.child({ module: 'api' });
```

**For Python (use structlog):**

```python
# logging_config.py
import structlog
import logging

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()
```

**Step 3: Instrument authentication events**

Add logging to all authentication code paths:

```typescript
// Wherever login happens:
async function handleLogin(email: string, password: string, ip: string) {
  const user = await db.users.findByEmail(email);
  const passwordMatch = user && await bcrypt.compare(password, user.passwordHash);
  
  if (!user || !passwordMatch) {
    logger.warn({
      event: 'auth.login.failure',
      email, // OK to log — not a secret
      ip,
      reason: !user ? 'user_not_found' : 'wrong_password',
      // IMPORTANT: Use the same reason for both cases externally
      // but log the true reason for security analysis
    });
    return null;
  }
  
  logger.info({
    event: 'auth.login.success',
    userId: user.id,
    ip,
  });
  
  return user;
}

// Logout:
logger.info({ event: 'auth.logout', userId: session.userId });

// Password change:
logger.info({ event: 'auth.password_changed', userId: user.id });

// Password reset requested:
logger.info({ event: 'auth.password_reset.requested', email });

// Rate limit hit:
logger.warn({ event: 'auth.rate_limited', ip, endpoint: req.path });
```

**Step 4: Instrument authorisation events**

```typescript
// Log every 403 — these are potential IDOR attempts
function forbidden(userId: string, resource: string, resourceId: string) {
  logger.warn({
    event: 'authz.forbidden',
    userId,
    resource,
    resourceId,
    // This pattern helps detect IDOR scanning
  });
  return new Response('Not found', { status: 404 }); // 404 not 403
}

// Log admin actions
logger.info({
  event: 'admin.user_role_changed',
  adminId: currentUser.id,
  targetUserId: params.id,
  oldRole: user.role,
  newRole: req.body.role,
});
```

**Step 5: Add request logging middleware**

```typescript
// middleware or route handler wrapper
export function withRequestLogging(handler: Handler): Handler {
  return async (req, res) => {
    const start = Date.now();
    
    try {
      const result = await handler(req, res);
      
      logger.info({
        event: 'http.request',
        method: req.method,
        path: req.nextUrl.pathname,
        status: res.status,
        duration_ms: Date.now() - start,
        ip: req.headers.get('x-forwarded-for'),
        userId: req.auth?.userId, // if using next-auth
      });
      
      return result;
    } catch (err) {
      logger.error({
        event: 'http.error',
        method: req.method,
        path: req.nextUrl.pathname,
        error: err instanceof Error ? err.message : 'Unknown error',
        duration_ms: Date.now() - start,
        userId: req.auth?.userId,
      });
      throw err;
    }
  };
}
```

**Step 6: Ship logs to an external service**

Logs on the same server can be deleted by an attacker. Ship them externally:

**Logtail (simplest):**
```bash
npm install @logtail/pino
```

```typescript
// lib/logger.ts — update to ship to Logtail
import pino from 'pino';
import { createWriteStream } from '@logtail/pino';

const streams = [
  { stream: process.stdout }, // local console
];

if (process.env.LOGTAIL_SOURCE_TOKEN) {
  streams.push({ 
    stream: createWriteStream({ sourceToken: process.env.LOGTAIL_SOURCE_TOKEN })
  });
}

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? 'info' },
  pino.multistream(streams)
);
```

**Step 7: Verify logging is working**

```typescript
// Test that security events are being logged correctly
// Log a test event and verify it appears in your logging service:
logger.info({ event: 'system.startup', message: 'Logging system verified' });

// Verify these events appear in logs for a complete login flow:
// 1. auth.login.failure (trigger with wrong password)
// 2. auth.login.success (trigger with correct password)
// 3. authz.forbidden (access a resource you don't own)
// 4. auth.logout (log out)
```

**Step 8: Confirm PII is not logged**

Do a grep to check for any PII leakage in log statements:

```bash
grep -rn "logger\.\|console\." --include="*.ts" --include="*.js" . | \
  grep -v node_modules | \
  grep -i "password\|token\|secret\|card\|ssn\|dob"
# Any results here need to be fixed — PII should not appear in log calls
```

---

## What to expect

Structured JSON logging in place, all authentication and authorisation events instrumented, logs shipped to an external service, PII verified as absent from log statements.

## Learn more

[Monitoring README](../README.md)
[OWASP A09: Logging Failures](../../02-owasp/web-top10/A09-logging-failures.md)
[Configure Alerting prompt](./configure-alerting.md)
