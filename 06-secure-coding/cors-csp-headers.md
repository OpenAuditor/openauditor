# CORS and Security Headers

Security headers are free protection. Most take under an hour to configure and prevent entire classes of attacks.

---

## Content Security Policy (CSP)

CSP tells the browser which sources of content are allowed to load. It's your primary defence against Cross-Site Scripting (XSS).

```javascript
// next.config.js — add CSP header
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",      // remove unsafe-inline if you can
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
```

> **Critical:** `unsafe-inline` weakens CSP significantly. Migrate to nonces or hashes for inline scripts if your CSP currently allows `unsafe-inline`.

### CSP Directives Explained

| Directive | What It Controls |
|-----------|-----------------|
| `default-src` | Fallback for all content types |
| `script-src` | JavaScript sources |
| `style-src` | CSS sources |
| `img-src` | Image sources |
| `connect-src` | Fetch, WebSocket, EventSource |
| `font-src` | Web fonts |
| `frame-ancestors` | Who can embed you in an iframe |
| `object-src` | Flash, plugins (set to 'none') |

---

## CORS (Cross-Origin Resource Sharing)

CORS controls which domains can make requests to your API.

### The Wrong Way

```javascript
// WRONG — allows any origin
app.use(cors()); // or Access-Control-Allow-Origin: *
```

### The Right Way

```javascript
import cors from 'cors';

const allowedOrigins = [
  'https://yourapp.com',
  'https://www.yourapp.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,           // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### In Next.js API Routes

```javascript
// pages/api/data.ts
export default function handler(req, res) {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // handle request...
}
```

---

## Full Security Headers Setup

### In Next.js (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ...",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### In Express

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## Headers Reference Table

| Header | Recommended Value | What It Prevents |
|--------|-------------------|-----------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Downgrades to HTTP, MITM |
| `X-Frame-Options` | `DENY` | Clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=()` | Unwanted browser API access |
| `Content-Security-Policy` | (see above) | XSS, data injection |

### Verify with Security Headers

Test your headers at [securityheaders.com](https://securityheaders.com). Aim for an A or A+ rating.

---

## Checklist

- [ ] CSP header configured and tested
- [ ] CORS restricted to specific allowed origins
- [ ] `X-Frame-Options: DENY` set
- [ ] `X-Content-Type-Options: nosniff` set
- [ ] HSTS enabled with preload
- [ ] `Referrer-Policy` set
- [ ] Headers verified with securityheaders.com
- [ ] No `Access-Control-Allow-Origin: *` on authenticated endpoints

---

## Learn More

- [OWASP A05: Security Misconfiguration](../02-owasp/web-top10/A05-security-misconfiguration.md)
- [Deployment Security Headers Checklist](../09-deployment-security/https-headers-checklist.md)
- [Add Security Headers prompt](./prompts/add-security-headers.md)
