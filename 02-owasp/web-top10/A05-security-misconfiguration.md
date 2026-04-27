# A05 — Security Misconfiguration

## Summary

Security misconfiguration is the most broadly occurring vulnerability in the OWASP Top 10 — it appears in 90% of applications tested. It covers any case where a system is not correctly hardened: default credentials left in place, overly permissive CORS policies, unnecessary features or ports left enabled, verbose error messages leaking stack traces, cloud storage buckets set to public, debug mode left on in production, and missing security headers. Misconfiguration is almost never intentional — it results from moving fast, not reading documentation, or copying configuration from development into production without review.

---

## What It Looks Like

### Debug mode enabled in production

```python
# Flask — VULNERABLE: debug=True in production
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
```

```javascript
// Next.js — verbose errors exposed to users
// next.config.js — VULNERABLE
const nextConfig = {
  // No error page customisation — raw stack traces shown to users in some configurations
};
```

### Overly permissive CORS

```javascript
// Express — VULNERABLE: allows any origin with credentials
const cors = require("cors");
app.use(cors({
  origin: "*",          // Allows any domain
  credentials: true,   // Combined with wildcard, this is invalid per spec but dangerous in some configs
}));
```

### Missing security headers

```javascript
// Next.js — VULNERABLE: no security headers set
// An application without X-Frame-Options, CSP, HSTS, etc.
module.exports = {
  // No headers configuration at all
};
```

### Public S3 / cloud storage bucket

```javascript
// AWS SDK — VULNERABLE: bucket created without blocking public access
const s3 = new AWS.S3();
await s3.createBucket({
  Bucket: "user-uploads",
  // No BlockPublicAcls: true — defaults may allow public access depending on account settings
}).promise();
```

### Default admin credentials

```yaml
# Docker Compose — VULNERABLE: default PostgreSQL credentials
version: "3"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres  # Default credentials — change immediately
      POSTGRES_USER: postgres
```

### Verbose error messages exposing internals

```javascript
// Express — VULNERABLE: stack traces exposed to users
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack }); // Never expose stack in production
});
```

---

## The Fix

### Disable debug mode in production

```python
# Flask — FIXED
import os

app.run(
    debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    host="0.0.0.0"
)
```

### Restrict CORS to known origins

```javascript
// Express — FIXED
const allowedOrigins = [
  "https://yourapp.com",
  "https://www.yourapp.com",
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

### Add security headers in Next.js

```javascript
// next.config.js — FIXED
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten as much as your app allows
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.yourapp.com",
    ].join("; "),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

### Block public access on S3 buckets

```javascript
// AWS SDK — FIXED
await s3.putPublicAccessBlock({
  Bucket: "user-uploads",
  PublicAccessBlockConfiguration: {
    BlockPublicAcls: true,
    IgnorePublicAcls: true,
    BlockPublicPolicy: true,
    RestrictPublicBuckets: true,
  },
}).promise();
```

### Generic error responses in production

```javascript
// Express — FIXED
app.use((err, req, res, next) => {
  // Log full error internally (to your logging service)
  console.error(err);

  // Return generic message to the client
  res.status(500).json({
    error: "An internal error occurred",
    // No stack trace, no err.message that might reveal internals
  });
});
```

> **Critical:** Security headers, CORS policies, and debug settings must be reviewed as part of every deployment. A single misconfiguration in production can expose your entire application to attack.

---

## Real-World Breach

**Capital One — 2019**
A misconfigured AWS Web Application Firewall allowed attacker Paige Thompson to exploit a Server-Side Request Forgery (SSRF) vulnerability to access the EC2 instance metadata service. The metadata service returned AWS credentials, which Thompson used to access over 100 S3 buckets. The result was the exposure of over 100 million customer records including Social Security numbers and bank account details. Capital One paid a $80 million fine. The root cause was a configuration error — the WAF was not correctly restricting outbound SSRF requests, and the IAM role attached to the EC2 instance had excessive permissions. Both are misconfigurations.

---

## How to Test

### Check security headers

```bash
# Using securityheaders.com (or curl)
curl -I https://yourapp.com | grep -iE "strict-transport|x-frame|x-content-type|content-security|referrer"

# Or use the Mozilla Observatory CLI
npx observatory-cli https://yourapp.com
```

### Check for open S3 buckets

```bash
# AWS CLI — check bucket public access block settings
aws s3api get-public-access-block --bucket your-bucket-name

# Check bucket ACL
aws s3api get-bucket-acl --bucket your-bucket-name
```

### Check CORS configuration

```bash
# Send a cross-origin preflight request
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     https://yourapp.com/api/users \
     -I | grep -i "access-control"
# Response should NOT include: Access-Control-Allow-Origin: https://evil.com
```

### Check for debug endpoints

```bash
# Common debug/info endpoints to test
curl https://yourapp.com/.env
curl https://yourapp.com/.git/config
curl https://yourapp.com/phpinfo.php
curl https://yourapp.com/api/__health
curl https://yourapp.com/actuator/env  # Spring Boot
curl https://yourapp.com/debug/pprof   # Go
```

---

## Checklist

- [ ] Debug mode is disabled in all production environments
- [ ] Security headers are set: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] CORS policy explicitly lists allowed origins — wildcard `*` is not used with credentials
- [ ] All cloud storage buckets block public access by default
- [ ] Default credentials have been changed on all services (databases, admin panels, message queues)
- [ ] Verbose error messages (stack traces, internal paths) are suppressed in production responses
- [ ] Unnecessary features, ports, and services are disabled (directory listing, server version headers)
- [ ] Security header scan (securityheaders.com or Mozilla Observatory) returns an A grade

---

## Why This Matters

Misconfiguration is the easiest vulnerability for attackers to find at scale. Automated scanners probe for open S3 buckets, exposed `.env` files, default credentials, and missing headers continuously. Security header gaps make clickjacking, XSS, and MIME-sniffing attacks easier. An overly permissive CORS policy can allow a malicious website to make authenticated requests to your API on behalf of your users. Debug mode in production can expose application source code, environment variables, and internal routes. These are all avoidable with a 30-minute configuration review before each deployment.

---

## Learn More

- [OWASP A05:2021 — Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [Mozilla Observatory — Security Header Scanner](https://observatory.mozilla.org/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [OpenAuditor: Secure Coding — CORS and CSP Headers](../../06-secure-coding/cors-csp-headers.md)
- [OpenAuditor: Deployment Security](../../09-deployment-security/)
