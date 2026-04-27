# Prompt: Harden Vercel Deployment

## When to use this

Use this when setting up a new Vercel project or before launching. Vercel's defaults are optimised for ease of use, not security — this prompt gets you to a hardened configuration.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer hardening a Next.js application deployed to Vercel. Review and improve the deployment security configuration.

**Step 1: Check the current security headers**

Review `next.config.ts` (or `next.config.js`) and `vercel.json` for security headers:
- Is HSTS configured?
- Is CSP configured?
- Is X-Frame-Options set?
- Is X-Content-Type-Options set?
- Is Referrer-Policy set?

Also run:
```bash
curl -I https://[your-domain].vercel.app
```
to see the current response headers.

**Step 2: Add security headers**

If headers are missing or incomplete, add them to `next.config.ts`:

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

// Add a Content-Security-Policy appropriate for this specific application:
// 1. Check what external scripts, styles, and APIs are used
// 2. Build a minimal CSP that allows only what's needed
// 3. Start with Content-Security-Policy-Report-Only if unsure
```

**Step 3: Audit environment variables**

Review all environment variables configured in Vercel:
- Which variables are set for Production vs. Preview vs. Development?
- Are any production secrets (database URLs, secret keys) also set for Preview?
- Are any secrets exposed with the `NEXT_PUBLIC_` prefix (making them visible in the client bundle)?

Produce a table:
| Variable | Production | Preview | Development | Should be NEXT_PUBLIC_? |
|----------|-----------|---------|-------------|------------------------|

Flag any:
- Production secrets also set in Preview (should use test/staging values)
- Secrets with `NEXT_PUBLIC_` prefix (should only be truly public values)

**Step 4: Check preview deployment security**

- Are preview deployments publicly accessible without authentication?
- If so, recommend enabling Vercel Authentication (Team → Settings → Deployment Protection)
- Are preview deployments using production database credentials?

**Step 5: Check vercel.json configuration**

Review `vercel.json` if it exists:
- Are there any insecure CORS configurations (`"headers": [{"key": "Access-Control-Allow-Origin", "value": "*"}]`)?
- Are there any public routes that should be restricted?
- Is the project using appropriate regions for data residency?

**Step 6: Check for exposed routes**

Review the app's API routes and pages:
- Are there any `/api/admin/*` routes without admin auth checks?
- Are there any debug or development endpoints that shouldn't be in production?
- Does `robots.txt` expose sensitive paths (e.g., `/admin`, `/api`)?

```bash
# Check what routes exist
find app/api -name "route.ts" -o -name "route.js"
find pages/api -name "*.ts" -o -name "*.js"
```

**Step 7: Check for source map exposure**

In `next.config.ts`:
```typescript
const config = {
  productionBrowserSourceMaps: false, // should be false (default)
  // If true, source code is visible to anyone via browser DevTools
};
```

**Step 8: Produce a hardening report**

For each finding:
- **Issue:** What's the misconfiguration?
- **Risk:** What could an attacker do?
- **Fix:** Exact configuration change

Then implement the fixes — update `next.config.ts`, `vercel.json`, and flag environment variable changes that need to be made in the Vercel dashboard.

---

## What to expect

A complete Vercel security hardening: updated security headers, audited environment variables, preview deployment protection assessment, and a checklist of changes made and those requiring manual action in the Vercel dashboard.

## Learn more

[HTTPS and Security Headers Checklist](../https-headers-checklist.md)
[Preview Deployments](../preview-deployments.md)
[Environment Variables](../../06-secure-coding/env-secrets-management.md)
