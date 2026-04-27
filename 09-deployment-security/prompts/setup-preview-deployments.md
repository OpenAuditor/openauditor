# Prompt: Set Up Secure Preview Deployments

## When to use this

Use this when setting up Vercel preview deployments, when your preview environments expose sensitive data, or when developers are sharing preview links publicly without authentication.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer setting up secure preview deployments. Preview environments must be isolated from production, authenticated, and use separate data — they must never expose production data or be publicly accessible.

**Step 1: Audit the current state**

```bash
# Check Vercel configuration
cat vercel.json 2>/dev/null || echo "No vercel.json found"

# Check environment variable setup
ls .env .env.local .env.preview .env.production 2>/dev/null

# Check if preview URLs are used in git commits or docs
grep -rn "vercel\.app\|preview\." --include="*.md" --include="*.ts" . | grep -v node_modules

# Check for authentication middleware
grep -rn "middleware\|Middleware\|withAuth\|getServerSession" \
  --include="*.ts" . | grep -v node_modules

# Check if Supabase project is separate per environment
grep -rn "SUPABASE_URL\|DATABASE_URL" .env* 2>/dev/null
```

**Step 2: Enable Vercel Deployment Protection**

In the Vercel dashboard:
1. Go to Project Settings → Deployment Protection
2. Enable **Vercel Authentication** (requires Vercel login) or **Password Protection**
3. Set scope to **Preview** (never require auth on production)

Or configure in `vercel.json`:

```json
{
  "preview": {
    "protected": true
  }
}
```

For team accounts, Vercel Authentication ensures only team members can access preview URLs.

**Step 3: Create environment-specific variables**

```bash
# Production environment (via Vercel CLI or dashboard)
# Never set production secrets in .env files

vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SECRET_KEY production

# Preview environment — use a SEPARATE Supabase project
vercel env add SUPABASE_URL preview
vercel env add SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SECRET_KEY preview

# Development (local)
# .env.local (gitignored)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=local-anon-key
```

**Step 4: Create a separate preview Supabase project**

```bash
# Create a new Supabase project for preview/staging
# In Supabase dashboard: New Project → "myapp-preview"

# Link to the preview project
supabase link --project-ref YOUR_PREVIEW_PROJECT_REF

# Push your schema to preview
supabase db push

# Seed with test data (not production data)
supabase db seed
```

Never point preview environments at the production database. This is the most critical isolation requirement.

**Step 5: Add authentication middleware for preview environments**

If Vercel Authentication is not available (free plan), add your own middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isPreview = process.env.VERCEL_ENV === 'preview';
  
  if (!isPreview) {
    return NextResponse.next(); // Production: no restriction here
  }
  
  // Check for preview access token (shared with team via password manager)
  const previewToken = request.cookies.get('preview-access-token')?.value;
  
  if (previewToken === process.env.PREVIEW_ACCESS_TOKEN) {
    return NextResponse.next();
  }
  
  // No valid token — redirect to login page
  const loginUrl = new URL('/preview-login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Apply to all paths except the login page and static assets
    '/((?!preview-login|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

```typescript
// app/preview-login/page.tsx (only rendered in preview)
'use client';
import { useState } from 'react';

export default function PreviewLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/preview-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    
    if (res.ok) {
      const redirect = new URLSearchParams(window.location.search).get('redirect') ?? '/';
      window.location.href = redirect;
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">Preview Access</h1>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Preview password"
        className="w-full border rounded p-2 mb-4"
      />
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <button type="submit" className="w-full bg-blue-600 text-white rounded p-2">
        Access Preview
      </button>
    </form>
  );
}
```

```typescript
// app/api/preview-auth/route.ts
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';

export async function POST(request: Request) {
  const { password } = await request.json();
  
  const expectedPassword = process.env.PREVIEW_ACCESS_TOKEN!;
  
  // Constant-time comparison to prevent timing attacks
  const isValid = password.length === expectedPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));
  
  if (!isValid) {
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }
  
  const response = Response.json({ success: true });
  
  // Set cookie that expires in 24 hours
  response.headers.set('Set-Cookie',
    `preview-access-token=${expectedPassword}; HttpOnly; Secure; SameSite=Lax; Max-Age=86400; Path=/`
  );
  
  return response;
}
```

**Step 6: Configure ephemeral databases per PR (optional but ideal)**

For critical applications, create a fresh database per PR:

```yaml
# .github/workflows/preview-database.yml
name: Preview Database Setup
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  setup-preview-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - name: Create preview database
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_ORG_ID: ${{ secrets.SUPABASE_ORG_ID }}
        run: |
          PR_NUMBER=${{ github.event.pull_request.number }}
          DB_NAME="preview-pr-${PR_NUMBER}"
          
          # Create ephemeral Supabase project for this PR
          curl -X POST "https://api.supabase.com/v1/projects" \
            -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
              \"name\": \"${DB_NAME}\",
              \"organization_id\": \"${SUPABASE_ORG_ID}\",
              \"plan\": \"free\",
              \"region\": \"eu-west-2\"
            }"
```

**Step 7: Verify the setup**

```bash
# Test 1: Preview URL requires authentication
curl -I https://your-app-xxx.vercel.app/
# Expected: 302 redirect to login OR 401 Unauthorized

# Test 2: Production URL does NOT require preview auth
curl -I https://your-app.com/
# Expected: 200 OK (normal app behaviour)

# Test 3: Preview uses different database
# Deploy a feature branch, check in preview that:
# - Production users don't appear in preview
# - Test data from preview seeding is present

# Test 4: Environment variables are correct per environment
# In preview deployment, check /api/health or /api/debug (if it exists)
# It should show preview Supabase project URL, not production
```

**Step 8: Document access for the team**

Create an internal note (not in the public repo):

```markdown
## Preview Environment Access

Preview deployments at: https://[branch-name]-[project]-[team].vercel.app

**How to access:** Visit the preview URL and enter the team password
**Password:** Stored in [password manager name] under "Preview Deployments"
**Rotate password:** Change PREVIEW_ACCESS_TOKEN in Vercel env vars (preview only)

**Important:**
- Preview uses SEPARATE database (preview Supabase project)
- DO NOT share preview URLs publicly — they require password
- Production data is NOT in preview — use test accounts
- Test accounts: See [password manager] under "Preview Test Users"
```

---

## What to expect

Preview deployments protected behind authentication (Vercel Auth or custom middleware), using an isolated database separate from production, with environment-specific variable configuration and documented team access.

## Learn more

[Preview Deployments Overview](../preview-deployments.md)
[Harden Vercel](./harden-vercel.md)
[Deployment Security README](../README.md)
