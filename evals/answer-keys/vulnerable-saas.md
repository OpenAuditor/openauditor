# Answer Key: vulnerable-saas (Tasklane)

> **Do not copy this folder into the audit workspace.** If the agent can read this file, the eval is invalid. See [the eval guide](../README.md).

Fixture version: **1.0** · 18 planted issues · 6 decoys · Next.js 16.2.0, Supabase, AI SDK 5

Covers 13 of the skill's 18 audit domains, plus two LLM Top 10 issues that have no domain of their own. Domains 13 (preview environments), 14 (DNS), 16 (privacy), 17 (backups) and 18 (incident response) need information outside the code, so they aren't planted here.

---

## Scoring

For each planted issue:

| Score | Meaning |
|---|---|
| **1** | Found: right location (file, or the specific policy/route), right risk, and a fix that would actually work |
| **0.5** | Partial: right area but wrong reason, wrong location, or a fix that wouldn't close the hole |
| **0** | Missed, or mentioned only as a generic checklist item with no link to this code |

Also record:
- **False positives:** findings that claim a decoy (below) is vulnerable. Count each one.
- **Severity match:** whether the agent's severity is within one level of the key.
- **Bonus findings:** valid issues not in this key (listed below or new). Don't count them as false positives; add genuinely new ones to the next version of the key.

**Headline metric:** planted score out of 18, false positives, and Critical issues found out of 6.

---

## Planted Issues

| ID | Domain | Severity | Location | Issue |
|---|---|---|---|---|
| P01 | 1 Secrets | **Critical** | `lib/supabase/admin.ts`, `components/admin-stats.tsx`, `.env.example` | Service role key in a `NEXT_PUBLIC_` variable and imported into a client component, so it ships in the browser bundle |
| P02 | 7 Database / RLS | **Critical** | `supabase/migrations/0001_init.sql` | `projects` table never has RLS enabled: any signed-in user (and anyone with the anon key) can read and modify every project |
| P03 | 7 Database / RLS | High | `0001_init.sql`, policy "tasks are readable" | `using (true)` lets any authenticated user read every tenant's tasks. Also reachable via `/api/search` and `/api/ai/chat` |
| P04 | 4 Access control | **Critical** | `app/api/projects/[id]/route.ts` | IDOR: checks the user is signed in, then reads any project by ID with the admin client (bypassing RLS) and no membership check |
| P05 | 4 Access control | High | `app/projects/[id]/actions.ts`, `deleteProject` | Server Action with no auth or ownership check, using the admin client. Server Actions are public POST endpoints, so anyone can delete any project |
| P06 | 3 Authentication | **Critical** | `app/admin/page.tsx` | Admin check reads `user_metadata.role`, which users can set themselves with `supabase.auth.updateUser({ data: { role: 'admin' } })` |
| P07 | 5 Injection | High | `app/api/search/route.ts` | User input interpolated into a PostgREST `.or()` filter string: attacker can add or alter filter clauses |
| P08 | 5 Injection (XSS) | High | `components/comment-list.tsx` | Comment markdown rendered with `marked` into `dangerouslySetInnerHTML` without sanitising: stored XSS between project members |
| P09 | 6 Headers / CORS | Medium | `app/api/search/route.ts` | `Access-Control-Allow-Origin: *` with `Allow-Credentials: true` on an authenticated endpoint |
| P10 | 6 Headers / CORS | Medium | `next.config.ts` | No security headers (CSP, HSTS, `X-Content-Type-Options`, frame protection) anywhere |
| P11 | 8 API (LLM10) | High | `app/api/ai/chat/route.ts` | AI endpoint has no rate limit, no per-user budget, no `maxOutputTokens`, and unvalidated input size: unbounded cost |
| P12 | LLM01 / LLM05 | High | `components/task-summary.tsx` with `app/api/ai/chat/route.ts` | Untrusted task and comment text goes into the prompt, and the answer is rendered as markdown with remote images allowed: an injected task can exfiltrate project data via an image URL |
| P13 | 9 File upload | High | `app/api/avatar/route.ts`, `avatars` bucket | Trusts client-supplied MIME type, allows SVG (scriptable) in a **public** bucket, uses the user's filename, and `upsert: true` |
| P14 | 10 Error handling | Medium | `app/api/projects/[id]/route.ts` | Returns `error.message` and the full stack trace to the client |
| P15 | 8 API | **Critical** | `app/api/webhooks/stripe/route.ts` | Stripe webhook doesn't verify the `Stripe-Signature` header: anyone can POST a fake event and set any project's billing status |
| P16 | 2 Dependencies | Medium | `package.json` | `jsonwebtoken` pinned to 8.5.1, which has known advisories (fixed in 9.0.0) |
| P17 | 12 CI/CD | **Critical** | `.github/workflows/ci.yml` | `pull_request_target` checks out and runs the PR's code (`npm install`, build) with production secrets in the environment; actions also unpinned |
| P18 | 11 Logging | Medium | `app/api/webhooks/stripe/route.ts` | Logs all request headers (including any auth/signature headers) and the full event payload (customer data) |

### Accepted fixes and partial-credit notes

- **P01:** Rename to a server-only `SUPABASE_SERVICE_ROLE_KEY`, add `import 'server-only'` to the admin module, and move the counts to a Server Component or Route Handler with an admin check. *Partial* if the agent spots only the env name or only the client import. **Rotate the key** should be mentioned for full credit.
- **P02:** `alter table projects enable row level security` plus member-scoped policies. *Partial* if the agent says "check RLS" without naming `projects`.
- **P03:** Replace `using (true)` with a membership check. Full credit if the agent links it to search or the AI route; *partial* if it flags the policy without explaining cross-tenant exposure.
- **P04:** Use the user's client (RLS) or verify membership before the admin query. *Partial* if it notices the admin client but not the missing membership check.
- **P05:** Authenticate inside the action, check the user is the project owner, and use the user's client.
- **P06:** Use `app_metadata` (not user-writable) or a roles table checked server-side. *Partial* for "add a role check" without explaining that `user_metadata` is user-controlled.
- **P07:** Use separate `.ilike()` calls or escape PostgREST reserved characters; validate `q` length and charset. *Partial* for generic "validate input" without naming the filter string.
- **P08:** Sanitise with DOMPurify / `sanitize-html`, or render with `react-markdown` (no raw HTML). Pair with a CSP for full marks.
- **P09:** Restrict origins to an allowlist or remove CORS (same-origin app). *Partial* if it flags `*` without the credentials combination.
- **P10:** Add `headers()` in `next.config.ts` (or proxy) with CSP, HSTS, `nosniff`, `frame-ancestors`.
- **P11:** Per-user rate limit, `maxOutputTokens`, input size limit, timeout, provider spend cap. *Partial* if only one control is suggested.
- **P12:** Block remote images and non-allowlisted links in markdown rendering (`urlTransform`, CSP `img-src`), and treat task/comment text as untrusted in the prompt. *Partial* for "prompt injection risk" without identifying the image exfiltration channel.
- **P13:** Server-side content sniffing (magic bytes), drop SVG, generate filenames server-side, private bucket or signed URLs, size limit. *Partial* for spotting only one of SVG / MIME trust / public bucket.
- **P14:** Log server-side, return a generic message and a request ID.
- **P15:** `stripe.webhooks.constructEvent(rawBody, signature, secret)` before trusting the event.
- **P16:** Upgrade to `jsonwebtoken@9`, or note that `npm audit` would report it. *Partial* for "run npm audit" with no specific package.
- **P17:** Use `pull_request` (no secrets for forks) or never check out PR head under `pull_request_target`; pin actions by SHA; set `permissions`. *Partial* for "pin actions" only.
- **P18:** Log an allowlist of fields (event ID, type), never headers or full payloads.

---

## Decoys (should NOT be flagged)

| ID | Location | Why it's correct |
|---|---|---|
| D1 | `lib/supabase/server.ts`, `lib/supabase/client.ts` | Standard `@supabase/ssr` setup with the anon key |
| D2 | `app/api/tasks/route.ts` | Auth, Zod validation, explicit membership check, user client |
| D3 | `memberships` and `comments` RLS policies | Correctly scoped to the caller |
| D4 | `addTask` Server Action | Authenticates; RLS insert policy enforces membership |
| D5 | `.gitignore`, `.env.example` | Env files ignored; example has placeholders only (the service role *variable name* is P01, not a leaked secret) |
| D6 | `proxy.ts` | Correct session-refresh pattern; it isn't the only auth check for `/projects` data |

## Valid bonus findings (not scored, not false positives)

- No `package-lock.json` committed and CI uses `npm install` rather than `npm ci`
- `/api/ai/chat` doesn't validate `projectId` or check membership (impact comes from P03)
- `readInviteToken` calls `jwt.verify` without an `algorithms` allowlist
- `/api/search` and `/api/avatar` also return raw Supabase error messages (minor P14 variants)
- `CommentList` and `TaskSummary` lack a CSP backstop (overlaps P08, P10, P12)
- Any real advisory against the pinned `next@16.2.0` at the time of the run (verify it's real)
