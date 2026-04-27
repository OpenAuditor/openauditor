# Serverless and Edge Function Security

Serverless and edge computing shift the security model from "secure a long-running server" to "secure short-lived, distributed function invocations". The attack surface is different — and some misconfigurations that are benign in traditional deployments become critical in serverless.

---

## The Serverless Threat Model

```
Internet request
      │
      ▼
Edge network / CDN
      │
      ▼
Function invocation (new process, often fresh environment)
      │
      ├── Environment variables (secrets)
      ├── Outbound network calls (SSRF risk)
      ├── Temporary filesystem (/tmp)
      └── Shared runtime (cold start vs warm start)
```

Key differences from traditional servers:

| Traditional Server | Serverless Function |
|---|---|
| Persistent process, long-lived memory | Ephemeral — dies after invocation |
| Single deployment environment | Potentially thousands of concurrent instances |
| You control the OS and dependencies | Runtime managed by vendor |
| One network interface | Outbound calls to any destination by default |
| Firewall rules persistent | Network controls per-function |

---

## Cold Start Security Risks

Cold starts initialise a new function instance. Secrets loaded during cold start are sometimes cached in the runtime's environment for subsequent warm invocations.

### What Gets Cached

```javascript
// This code runs ONCE on cold start, not per request
// The secret is loaded once and re-used across all warm invocations
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!   // Cached in module scope
)

export default async function handler(req: Request) {
  // supabase client is reused — this is fine
  // But if you rotate secrets without redeploying, this will use stale credentials
  const data = await supabase.from('users').select('*')
  return Response.json(data)
}
```

**Risk:** If a secret is rotated (e.g., after a breach), warm function instances continue using the old secret until they are evicted. Deploy a new version after rotating credentials to force cold starts.

### Secrets That Should NOT Be Module-Scoped

```javascript
// WRONG — if this value changes, stale warm instances won't see the update
const FEATURE_FLAGS = await fetch('https://flags-service/flags').then(r => r.json())

export default async function handler(req: Request) {
  if (FEATURE_FLAGS.newFeature) { ... }
}

// CORRECT — fetch fresh on each invocation for mutable external data
export default async function handler(req: Request) {
  const flags = await fetch('https://flags-service/flags').then(r => r.json())
  if (flags.newFeature) { ... }
}
```

---

## Least-Privilege Permissions in Serverless

### Vercel Edge Functions

Vercel Edge Functions run in the V8 isolate runtime with a restricted API surface. Enforce least privilege via configuration:

```typescript
// app/api/route.ts (Next.js App Router)
export const runtime = 'edge'

// Restrict which origins can call this function
export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com']

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Function logic here
  return Response.json({ ok: true })
}
```

### AWS Lambda Execution Role (Minimum Privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:eu-west-1:123456789:log-group:/aws/lambda/my-function:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::my-specific-bucket/*"
    }
  ]
}
```

> **Critical:** Never attach `AdministratorAccess` or `AmazonS3FullAccess` to a Lambda function. If the function is compromised via SSRF or code injection, the attacker inherits its IAM role.

### Cloudflare Workers Permissions

```toml
# wrangler.toml

name = "my-worker"
main = "src/index.ts"

[[kv_namespaces]]
binding = "CACHE"
id = "abc123"

# Only bind the specific KV namespaces, R2 buckets, and Durable Objects
# the worker actually uses. Remove bindings when features are removed.

[vars]
ENVIRONMENT = "production"

# Secrets must be added via: wrangler secret put MY_SECRET
# Never put secrets in wrangler.toml
```

---

## SSRF in Serverless

Server-Side Request Forgery (SSRF) is particularly dangerous in cloud environments because the instance metadata service is reachable from any function:

```
# AWS metadata endpoint — returns instance credentials
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://100.100.100.200/latest/meta-data/  # Alibaba Cloud

# GCP metadata endpoint
http://metadata.google.internal/computeMetadata/v1/
```

### Defending Against SSRF

```typescript
// Always validate URLs before fetching user-supplied URLs
import { URL } from 'url'

function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL

  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') return false

  const host = parsed.hostname.toLowerCase()

  // Block private/link-local/metadata IP ranges
  const blockedPatterns = [
    /^127\./,                          // Loopback
    /^10\./,                           // RFC 1918
    /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918
    /^192\.168\./,                     // RFC 1918
    /^169\.254\./,                     // Link-local (AWS metadata)
    /^100\.100\.100\./,                // Alibaba Cloud metadata
    /^::1$/,                           // IPv6 loopback
    /^fd/,                             // IPv6 private
    /localhost$/i,
    /\.internal$/i,
    /^metadata\.google\.internal$/i,
  ]

  if (blockedPatterns.some(p => p.test(host))) return false

  return true
}

export async function POST(request: Request) {
  const { url } = await request.json()

  if (!isSafeUrl(url)) {
    return new Response('Invalid URL', { status: 400 })
  }

  const response = await fetch(url)
  return Response.json({ status: response.status })
}
```

---

## Function-Level Authentication

Every function endpoint should enforce authentication unless explicitly designed to be public.

```typescript
// lib/auth-middleware.ts
import { createClient } from '@supabase/supabase-js'

export async function requireAuth(request: Request): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorised', { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response('Unauthorised', { status: 401 })
  }

  return { userId: user.id }
}

// Usage in a route handler
export async function GET(request: Request) {
  const authResult = await requireAuth(request)
  if (authResult instanceof Response) return authResult  // Auth failed

  const { userId } = authResult
  // Authorised — proceed
}
```

---

## Rate Limiting at the Edge

Implement rate limiting in edge middleware before requests hit function compute:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// In-memory store (per-instance) — use KV/Redis for distributed rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 100

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const now = Date.now()

  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  if (entry.count >= MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        'X-RateLimit-Limit': String(MAX_REQUESTS),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

> **Note:** In-memory rate limiting is per-instance. For true distributed rate limiting across all edge nodes, use Upstash Redis with the `@upstash/ratelimit` library.

---

## Logging and Observability

Serverless functions are ephemeral — logs are the only record of what happened.

```typescript
// Structured logging for serverless
interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  requestId: string
  userId?: string
  duration?: number
  [key: string]: unknown
}

function log(entry: LogEntry) {
  // JSON format for easy parsing by log aggregators
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  }))
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const start = Date.now()

  try {
    log({ level: 'info', message: 'Request started', requestId })

    // ... function logic

    log({ level: 'info', message: 'Request completed', requestId, duration: Date.now() - start })
    return Response.json({ ok: true })
  } catch (error) {
    log({ level: 'error', message: 'Request failed', requestId, error: String(error) })
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

---

## Serverless Security Checklist

- [ ] All functions use minimum-privilege IAM roles / service accounts
- [ ] Module-scoped secrets are re-deployed after rotation
- [ ] User-supplied URLs validated against SSRF blocklist before fetch
- [ ] All non-public endpoints enforce authentication
- [ ] Rate limiting applied at the edge for all API paths
- [ ] Structured logging enabled with request IDs for traceability
- [ ] No secrets hardcoded or committed in `wrangler.toml`, `serverless.yml`, etc.
- [ ] Function timeouts configured (prevent long-running abuse)
- [ ] Outbound network restricted to known destinations where platform supports it
