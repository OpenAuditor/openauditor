# HTTPS and Security Headers Checklist

Security headers are the fastest security wins you can implement. They're often a single line of configuration, and they prevent entire classes of attacks.

---

## 30-Second Summary

A web application without proper security headers is like a house with no locks on the windows. Security headers instruct browsers on how to handle your content — blocking XSS, preventing clickjacking, enforcing HTTPS, and controlling what external resources can load. You can add most of them in 30 minutes.

---

## The Critical Headers

### 1. HTTPS Everywhere

Before headers, ensure all traffic uses HTTPS:

```
HTTP → HTTPS redirect: 301 (permanent)
Never serve mixed content: HTTP resources on HTTPS pages
```

```javascript
// Express.js — redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});
```

```typescript
// Next.js — next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 2. HTTP Strict Transport Security (HSTS)

Tells browsers to always use HTTPS for your domain, even if the user types `http://`:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `max-age` | 31536000 | Cache for 1 year (in seconds) |
| `includeSubDomains` | — | Apply to all subdomains |
| `preload` | — | Submit to browser preload list |

**Start with a short max-age (300) to test, then increase to 31536000.**

```javascript
// Express (using helmet.js)
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
}));
```

```typescript
// Next.js
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload',
}
```

### 3. Content Security Policy (CSP)

The most powerful and most complex security header. Restricts where resources can be loaded from — prevents XSS.

**Simple CSP (good starting point):**

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'
```

**Next.js with nonces (prevents 'unsafe-inline'):**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64');
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  
  return response;
}
```

**CSP with common third-party services:**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
  frame-src https://js.stripe.com;
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';
```

**Use CSP report-only mode first to identify issues without breaking things:**

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /api/csp-report
```

### 4. X-Frame-Options

Prevents your site from being embedded in iframes (clickjacking):

```http
X-Frame-Options: DENY
```

Or if you need to allow iframes from same origin:

```http
X-Frame-Options: SAMEORIGIN
```

Note: CSP's `frame-ancestors` directive is the modern replacement, but `X-Frame-Options` remains useful for older browsers.

### 5. X-Content-Type-Options

Prevents MIME type sniffing — browsers must respect your declared Content-Type:

```http
X-Content-Type-Options: nosniff
```

This prevents browsers from executing a JavaScript file uploaded as `text/plain` if they sniff it as JavaScript.

### 6. Referrer-Policy

Controls how much referrer information is sent with requests:

```http
Referrer-Policy: strict-origin-when-cross-origin
```

Options (least to most restrictive):
- `no-referrer-when-downgrade` — default (sends full URL within HTTPS)
- `strict-origin-when-cross-origin` — recommended (sends origin only for cross-origin)
- `no-referrer` — never sends referrer (breaks analytics)

### 7. Permissions-Policy

Restricts which browser features your site can use (formerly Feature-Policy):

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

For apps that need media:
```http
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(self "https://js.stripe.com")
```

### 8. Cross-Origin Headers

For APIs and apps with complex embedding requirements:

```http
# Prevent your resources being loaded by other origins
Cross-Origin-Resource-Policy: same-origin

# Prevent cross-origin iframes accessing your window
Cross-Origin-Opener-Policy: same-origin

# Required for SharedArrayBuffer (performance features)
Cross-Origin-Embedder-Policy: require-corp
```

---

## Complete Implementation

### Express.js (using Helmet)

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      frameSrc: ["https://js.stripe.com"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  },
}));
```

### Next.js (next.config.ts)

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Vercel (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

---

## Testing Your Headers

```bash
# Check headers from the command line
curl -I https://yourdomain.com

# Security Headers Score
# Visit: https://securityheaders.com/?q=yourdomain.com
# Target grade: A or A+

# Mozilla Observatory
# Visit: https://observatory.mozilla.org/analyze/yourdomain.com
# Target score: 80+

# SSL Labs (TLS configuration)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
# Target grade: A or A+
```

---

## Cookie Security

HTTP cookies need their own security attributes:

```javascript
// SECURE cookie settings
res.cookie('session', token, {
  httpOnly: true,    // not accessible via JavaScript
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection ('strict' if you don't need cross-site)
  maxAge: 60 * 60 * 1000, // 1 hour
  path: '/',
  domain: '.yourdomain.com', // explicit domain
});

// sameSite options:
// 'strict'  — cookie never sent on cross-site requests (breaks OAuth flows)
// 'lax'     — sent on top-level navigation, not subrequests (recommended)
// 'none'    — sent on all requests — MUST be paired with secure: true
```

---

## Audit Checklist

- [ ] HTTPS enforced (HTTP → HTTPS redirect)
- [ ] HSTS enabled with max-age ≥ 1 year
- [ ] CSP configured (even if permissive initially)
- [ ] X-Frame-Options: DENY (or frame-ancestors in CSP)
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured
- [ ] All cookies: HttpOnly, Secure, SameSite
- [ ] SecurityHeaders.com score: A or A+
- [ ] SSL Labs grade: A or A+
- [ ] No mixed content warnings in browser console

---

## Learn More

- [CORS Configuration](../06-secure-coding/cors-csp-headers.md)
- [DNS Security](./dns-domain-security.md)
- [Add Security Headers prompt](./prompts/harden-vercel.md)
