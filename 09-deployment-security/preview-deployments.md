# Securing Preview Deployments

Preview deployments (Vercel, Netlify, Render) are a developer productivity win — every PR gets its own URL. But they introduce security risks that many teams overlook.

---

## 30-Second Summary

Preview deployments often use production secrets, expose draft content, and are publicly accessible by default. An attacker who discovers your preview URL can access features before they're hardened, see unpublished content, and potentially exploit vulnerabilities that haven't been patched yet because the fix is still in PR.

---

## The Risks

### 1. Production Secrets in Preview Environments

```bash
# VULNERABLE — preview deployments use the same env vars as production
# Vercel: same DATABASE_URL, STRIPE_SECRET_KEY, etc.
# This means:
# - Preview can write to production database
# - Stripe test keys (hopefully!) are exposed via preview URL
# - JWT secrets are the same — tokens minted in preview work in production
```

### 2. Publicly Accessible Draft Content

```
If your preview URL is publicly accessible:
- Competitors can see unreleased features
- Draft blog posts and marketing copy are exposed
- Partially implemented features may have security gaps
```

### 3. Subdomain Takeover Risk

```
Preview URLs often look like:
my-app-git-feature-branch-myorg.vercel.app

After a branch is deleted, the preview deployment may still be accessible.
This isn't a classic subdomain takeover, but the URL remains live.
```

---

## Solutions

### Option 1: Vercel Deployment Protection

Vercel's built-in solution — requires authentication to access any preview deployment:

```
Vercel Dashboard → Project → Settings → Deployment Protection

Options:
1. Vercel Authentication — requires a Vercel account (free, good for teams)
2. Password Protection — single password for the preview (Pro plan)
3. Deployment Protection for all environments — requires auth even for production
```

With Vercel Authentication enabled, only users in your Vercel team can access preview URLs.

### Option 2: Separate Environment Variables for Preview

```bash
# In Vercel Dashboard → Project → Settings → Environment Variables
# Set environment scope for each variable:

DATABASE_URL
  ✓ Production
  ✗ Preview        ← use a separate preview database
  ✓ Development

STRIPE_SECRET_KEY
  ✓ Production     ← live key
  ✓ Preview        ← test key (sk_test_...)
  ✓ Development    ← test key

SUPABASE_URL
  ✓ Production     ← production Supabase project
  ✓ Preview        ← staging Supabase project (separate)
  ✓ Development    ← local Supabase
```

This ensures preview deployments never touch production data.

### Option 3: Feature Flags for Unfinished Features

```typescript
// Use feature flags to hide incomplete features even in preview
const flags = {
  newCheckoutFlow: process.env.NEXT_PUBLIC_FF_NEW_CHECKOUT === 'true',
  aiRecommendations: process.env.NEXT_PUBLIC_FF_AI_RECS === 'true',
};

// Preview environment: NEXT_PUBLIC_FF_NEW_CHECKOUT=false (hidden)
// Production: NEXT_PUBLIC_FF_NEW_CHECKOUT=true (enabled after QA)
```

### Option 4: IP Allowlisting

For teams that need strict control, allowlist your team's IP addresses:

```javascript
// middleware.ts — only allow your team's IPs in preview
export function middleware(request: NextRequest) {
  const isPreview = process.env.VERCEL_ENV === 'preview';
  
  if (isPreview) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0];
    const allowedIPs = process.env.PREVIEW_ALLOWED_IPS?.split(',') ?? [];
    
    if (!allowedIPs.includes(ip)) {
      return new NextResponse('Access denied', { status: 403 });
    }
  }
  
  return NextResponse.next();
}
```

**Note:** This requires knowing your team's IP addresses in advance. Works well for static office IPs; impractical for remote teams.

---

## Preview Environment Database Strategy

Never let preview deployments touch your production database. Three options:

### Option A: Shared Staging Database

```
Production DB → Preview DB (separate Supabase project or schema)

Pros: Simple, always has recent data if you sync it
Cons: All previews share the same staging database — one PR can corrupt another
```

### Option B: Ephemeral Databases per PR

```yaml
# GitHub Actions — create a database for each PR
# Using Supabase branching (beta) or PlanetScale branching

on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  create-preview-db:
    steps:
      - name: Create Supabase branch
        run: |
          supabase branches create pr-${{ github.event.pull_request.number }} \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          
          # Get the branch URL and pass it to Vercel
          BRANCH_URL=$(supabase branches get pr-${{ github.event.pull_request.number }} \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} \
            --output json | jq -r '.db_url')
          
          vercel env add DATABASE_URL preview --value "$BRANCH_URL" \
            --git-branch ${{ github.head_ref }}
```

### Option C: Seeded Test Database

```
Use a fixed test database populated with synthetic data:
- No real user data
- Reset on demand
- All previews use the same test data
- Safe to expose to any team member
```

---

## Secrets in Preview: The Audit

Run this audit on your Vercel (or Netlify) project:

```bash
# 1. List all environment variables
vercel env ls

# 2. For each production secret, ask:
#    - Is this value the same in Preview as Production?
#    - If yes, can you use a different (test) value for Preview?

# Common secrets that SHOULD differ between environments:
# - Database connection strings
# - Stripe API keys (use test keys in preview)
# - Email provider keys (use sandbox/test in preview)
# - Supabase service role key (use a staging project's key in preview)

# Common values that CAN be the same:
# - Supabase anon key (it's public anyway)
# - NextAuth URL (will be different per deployment — use VERCEL_URL)
# - Public API URLs
```

---

## NEXTAUTH_URL in Preview Deployments

NextAuth.js needs the correct base URL. For Vercel preview deployments:

```typescript
// next.config.ts or .env
// NEXTAUTH_URL is automatically set by Vercel for production
// For preview deployments, use VERCEL_URL:

// In your NextAuth config:
export const authOptions = {
  // ...
  secret: process.env.NEXTAUTH_SECRET,
};

// Set in Vercel environment variables:
// NEXTAUTH_URL — set for Production only
// For Preview, NextAuth will use VERCEL_URL automatically in newer versions
// Or set explicitly: NEXTAUTH_URL=${VERCEL_URL} (use Vercel's system variable)
```

---

## Audit Checklist

- [ ] Preview deployments require authentication (Vercel Authentication or password)
- [ ] Preview deployments use test/staging database, not production
- [ ] Stripe keys: test keys (sk_test_) in preview, live keys in production
- [ ] Email provider: sandbox mode or separate account in preview
- [ ] Supabase: separate project or branching for preview
- [ ] NEXTAUTH_URL or equivalent configured correctly for previews
- [ ] Deleted branches don't leave accessible preview deployments (check Vercel cleanup settings)
- [ ] Team members know which preview URLs are safe to share externally

---

## Learn More

- [Harden Vercel prompt](./prompts/harden-vercel.md)
- [Environment Variables](../06-secure-coding/env-secrets-management.md)
- [Deployment Security README](./README.md)
