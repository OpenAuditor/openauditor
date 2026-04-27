# Vercel Security Settings

Vercel is the dominant deployment platform for Next.js applications, and its defaults are production-ready but not security-hardened. This guide covers every security lever Vercel exposes: response headers, environment variable scoping, preview deployment protection, IP allowlists, and team access controls.

---

## vercel.json — Security Headers

The fastest way to add HTTP security headers to every response is via `vercel.json` in your project root.

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

> **Critical:** The `Content-Security-Policy` above is a starting template. Tighten it based on your actual third-party dependencies — every `unsafe-inline` and `unsafe-eval` you can remove improves security.

### Applying Headers Only to HTML Responses

Avoid sending security headers on API routes where they are irrelevant, and use stricter CSP on pages:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/((?!api/).*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self';" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## Environment Variable Scoping

Vercel supports three environments, and secrets should be scoped as tightly as possible.

| Environment | Use case | Risk level |
|---|---|---|
| **Production** | Live application | Highest — production DB, payment keys |
| **Preview** | Pull request deployments | Medium — should use staging resources only |
| **Development** | Local `vercel dev` | Low — developer machines |

### Configuring Scoped Variables via CLI

```bash
# Production only — database connection string
vercel env add DATABASE_URL production

# Preview only — staging database
vercel env add DATABASE_URL preview

# Development only — local override
vercel env add DATABASE_URL development
```

### Configuring via Dashboard

1. Navigate to **Project → Settings → Environment Variables**
2. For each variable, untick the environments it should not apply to
3. For secrets (API keys, DB passwords): always use **Encrypted** type — Vercel encrypts these at rest and they are never readable again after creation

### Naming Conventions to Prevent Leaks

```bash
# NEXT_PUBLIC_ prefix exposes variables to the browser bundle
# Never prefix secrets with NEXT_PUBLIC_

NEXT_PUBLIC_APP_URL=https://myapp.com       # Safe — not secret
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXX         # Safe — not secret

DATABASE_URL=postgres://...                  # Never expose — server only
STRIPE_SECRET_KEY=sk_live_...               # Never expose — server only
SUPABASE_SECRET_KEY=eyJ...                  # Never expose — server only
```

> **Critical:** If you accidentally expose a secret via `NEXT_PUBLIC_`, it is embedded in your JavaScript bundle and visible to any user who opens DevTools. Rotate the key immediately and redeploy.

---

## Preview Deployment Protection

By default, Vercel preview URLs (`*.vercel.app`) are publicly accessible. Anyone with the URL can see your work-in-progress — including unreleased features, internal tooling, and staging data.

### Vercel Authentication (Recommended)

Vercel's built-in deployment protection requires visitors to authenticate with Vercel before viewing a preview. Available on Pro and Enterprise plans.

1. Go to **Project → Settings → Deployment Protection**
2. Enable **Vercel Authentication**
3. Optionally restrict to specific email domains (e.g., `@yourcompany.com`)

### Password Protection

For sharing previews with external stakeholders (clients, QA contractors):

1. Go to **Project → Settings → Deployment Protection**
2. Enable **Password Protection**
3. Set a strong password and share it out-of-band (not in Slack/email alongside the URL)

```bash
# Via CLI during deploy
vercel --confirm --env VERCEL_PASSWORD=yourpassword
```

### Bypass Token for CI/CD

When running automated tests against preview deployments, generate a bypass token:

1. **Project → Settings → Deployment Protection → Protection Bypass for Automation**
2. Generate a token
3. Pass it as a header in your test requests:

```bash
curl -H "x-vercel-protection-bypass: YOUR_BYPASS_TOKEN" \
  https://your-preview.vercel.app/api/health
```

Store this token as a GitHub Actions secret, not in your repository.

---

## IP Allowlist (Enterprise)

For internal applications or staging environments that should never be public:

1. **Project → Settings → Deployment Protection → IP Allowlist**
2. Add CIDR ranges:

```
# Office network
203.0.113.0/24

# VPN exit node
198.51.100.42/32

# CI/CD runner IPs
192.0.2.0/28
```

> **Note:** IP allowlists are an Enterprise-tier feature. For Pro plans, use Vercel Authentication or consider Cloudflare Access in front of your deployment.

---

## Team Access Controls

### Minimum Viable Permissions

| Role | What they can do | Who should have it |
|---|---|---|
| **Owner** | Billing, delete projects, team settings | Founders, lead engineers |
| **Member** | Deploy, manage env vars, view logs | Engineers |
| **Viewer** | View deployments and logs only | Stakeholders, clients |

1. Go to **Team → Settings → Members**
2. Assign the minimum role needed
3. Revoke access immediately when someone leaves the organisation

### Audit Log

Vercel Enterprise provides an audit log. For Pro teams, monitor:
- Who added/changed environment variables (visible in dashboard activity)
- Unexpected team member additions
- Deployments from unexpected branches

### Two-Factor Authentication

Require 2FA for all team members:

1. **Team → Settings → Security**
2. Enable **Require Two-Factor Authentication**

> **Critical:** A single team member without 2FA is the weakest link — if their Vercel account is compromised, an attacker can read all environment variables and deploy malicious code to production.

---

## Deployment Hooks Security

Deployment hooks allow external services to trigger builds. Treat them as secrets.

```bash
# Rotating a compromised hook — CLI
vercel deploy-hook rm <hook-id>
vercel deploy-hook create main

# Never put hooks in:
# - Public repositories
# - Client-side code
# - Slack messages or email
```

---

## Vercel Firewall (Edge Config)

Vercel's Edge Middleware can act as a lightweight firewall. Block suspicious patterns before they reach your application:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Block common scanner paths
  const blockedPaths = [
    '/wp-admin', '/wp-login.php', '/.env',
    '/config.php', '/phpinfo.php', '/adminer.php'
  ]

  if (blockedPaths.some(p => pathname.startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Block requests with suspicious User-Agent strings
  const ua = request.headers.get('user-agent') ?? ''
  if (/sqlmap|nikto|masscan|zgrab/i.test(ua)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Vercel Security Checklist

- [ ] HTTP security headers configured in `vercel.json`
- [ ] All secrets scoped to correct environment(s) — never cross-scoped
- [ ] No `NEXT_PUBLIC_` prefix on any sensitive value
- [ ] Preview deployment protection enabled (Vercel Auth or password)
- [ ] Bypass token stored as a repository secret, not plaintext
- [ ] All team members have minimum required role
- [ ] 2FA enforced at team level
- [ ] Deployment hooks rotated if previously exposed
- [ ] Edge Middleware blocking common scanner paths

---

## Verify Your Headers

After deploying, verify headers are set correctly:

```bash
curl -sI https://yourapp.vercel.app | grep -E "strict-transport|x-content|x-frame|content-security"
```

Or use the free online checker at [securityheaders.com](https://securityheaders.com).
