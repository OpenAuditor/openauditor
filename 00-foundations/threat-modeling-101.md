# Threat Modeling 101: Think Like an Attacker

In 30 seconds: Threat modeling is asking "what could go wrong?" *before* you ship. You draw a diagram of your system, identify where data flows, and ask questions at each point: Can this be intercepted? Is this validated? Who has access? You don't need fancy tools—a whiteboard works. The goal is to find vulnerabilities before users are affected.

## What is threat modeling?

Threat modeling is a structured way to identify what could go wrong with your application **before** you build it or **before** you ship new features.

It answers three questions:
1. **What are we building?** (Architecture, data flows, users)
2. **What could go wrong?** (Threats to each component)
3. **What are we going to do about it?** (Mitigations and controls)

Done right, threat modeling prevents most of the vulnerabilities in [Why Security Matters](./why-security-matters.md)—because you spot them during design, not after a breach.

## The basic process

### Step 1: Draw your system

Start with a simple diagram. Include:
- **Users/actors** (web users, admins, third-party APIs)
- **Components** (frontend, API, database, cache, message queue, etc.)
- **Data flows** (arrows showing how data moves between components)
- **Trust boundaries** (lines separating different security zones)

**Example: Simple SaaS app**

```
┌─────────┐                    ┌──────────┐
│  User   │ (untrusted input)  │  API     │
│ Browser │◄──────────────────►│ Server   │
└─────────┘ (HTTPS required)   └──────────┘
                                    │
                        (DB queries)│
                                    ▼
                              ┌──────────┐
                              │ Database │
                              └──────────┘
```

Key insight: There's a **trust boundary** between the User and your API. The user is untrusted; your API must validate everything.

### Step 2: Ask "what could go wrong?" at each point

For each component and data flow, ask:
- Can this be read by someone who shouldn't see it?
- Can this be modified by someone who shouldn't?
- Can this be removed/deleted/disrupted?
- Can someone pretend to be someone else?
- Can someone access something outside their permissions?

**Example applied to our SaaS:**

| Component | Threat | Question |
|-----------|--------|----------|
| User → API | Eavesdropping | Is data encrypted in transit? (HTTPS) |
| API | Injection | Do we validate user input before using it in SQL? |
| API | Authentication bypass | Can unauthenticated users access protected endpoints? |
| Database | Unauthorized access | Can the API account only read/write its own data? |
| Database | Data exposure | Are sensitive fields encrypted at rest? |

### Step 3: Identify the threat categories

Standard threat categories (from STRIDE):

- **Spoofing** — Pretending to be someone else (fake login, IP spoofing)
- **Tampering** — Modifying data in transit or at rest
- **Repudiation** — Denying you did something (bad logging/auditing)
- **Information Disclosure** — Exposing data to unauthorized people
- **Denial of Service** — Making the system unavailable
- **Elevation of Privilege** — Getting more permissions than you should

Most web app vulnerabilities fall into these buckets.

### Step 4: Prioritize and mitigate

Not all threats are equal. Rate each by:
- **Likelihood** — How easy is it to exploit?
- **Impact** — What damage if it's exploited?

Then add controls:

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|-----------|
| Attacker reads user email from DB | High | Critical | Encrypt PII at rest; access logging |
| Attacker injects SQL | High | Critical | Use parameterized queries |
| Attacker bypasses auth | Medium | Critical | Rate limiting on login; MFA option |
| Attacker overloads API | High | High | Rate limiting; DDoS protection |
| Attacker reads passwords | Low | Critical | Hash + salt; never log passwords |

## Real threat model examples

### Example 1: Blog platform

**System:**
- Anonymous users read blog posts
- Authenticated authors write/edit posts
- Posts stored in database
- Posts cached in Redis

**Threats:**
1. **Someone deletes another author's post** — Broken access control
   - Mitigation: Check that POST `/api/posts/{id}` verifies the user owns the post before deleting

2. **Someone injects SQL in blog title** — SQL injection
   - Mitigation: Use parameterized queries; never concatenate user input into SQL

3. **Attacker eavesdrops on author password** — Man-in-the-middle
   - Mitigation: Enforce HTTPS everywhere; set secure/HttpOnly cookies

4. **Cache server compromised, attacker replaces all posts** — Tampering
   - Mitigation: Encrypt cache data; use authentication tokens for cache access

### Example 2: Payment processing

**System:**
- Users enter credit card info in frontend form
- Frontend sends to backend API
- Backend sends to payment processor (Stripe, etc.)
- Transaction stored in database

**Threats:**
1. **Frontend sends card data as plain HTTP** — Eavesdropping
   - Mitigation: Always HTTPS; tokenize cards on frontend before sending (Stripe.js)

2. **Attacker intercepts card data in logs** — Information disclosure
   - Mitigation: Never log full card numbers; only log last 4 digits

3. **Attacker replaces payment processor URL in code** — Tampering
   - Mitigation: Use environment variables for processor URL; sign requests

4. **Attacker modifies transaction amount before sending** — Tampering
   - Mitigation: Verify amount server-side before processing; sign requests

## Threat modeling tools (optional)

You don't need fancy software. A whiteboard or Google Doc works fine. But if you want structure:

- **Microsoft Threat Modeling Tool** — Free, Windows-focused
- **Draw.io** — Simple diagrams, free
- **Miro** — Collaborative whiteboard
- **IriusRisk** — Purpose-built for threat modeling (paid)

Most teams find a whiteboard session with developers, product, and security is worth more than any tool.

## Common patterns in SaaS/web apps

### Pattern 1: Multi-tenant isolation

**Threat:** User A sees User B's data

**Checklist:**
- [ ] Every database query filters by current user's tenant ID
- [ ] No "global" queries that return all data
- [ ] Caching keys include tenant ID
- [ ] Row-level security policies enforced in database
- [ ] API endpoints verify ownership before returning data

### Pattern 2: Third-party integrations

**Threat:** Third-party API key leaked; third-party is compromised

**Checklist:**
- [ ] Keys stored in environment variables, never in code
- [ ] Keys rotated regularly
- [ ] Requests to third-party signed with a nonce (prevents replay)
- [ ] Rate limiting on third-party requests
- [ ] Alerts if third-party API behaves abnormally

### Pattern 3: Admin functionality

**Threat:** Non-admin user gets admin powers

**Checklist:**
- [ ] Admin checks happen server-side, not based on client roles
- [ ] Admin roles not granted through API (only through manual process or UI)
- [ ] Sensitive admin actions logged with timestamp and user
- [ ] Admin accounts use MFA
- [ ] Admin access limited to specific IP ranges (if possible)

## Why this matters

Threat modeling prevents:
- **Costly rework** — Finding a flaw after launch costs 10-100x more to fix
- **User breaches** — Your users' data is protected by design, not luck
- **Regulatory issues** — You can show regulators you thought about security
- **Public shame** — You won't be the next case study of "how did they miss this?"

Developers who threat model ship faster because they don't have to rewrite authentication or redo database schema after a security review.

## Getting started

### For a new feature:
1. Sketch the architecture (5 minutes)
2. List all data that will be processed (5 minutes)
3. Identify trust boundaries (5 minutes)
4. Ask "what could go wrong?" for each boundary (10 minutes)
5. Write down mitigations (5 minutes)

**Total: 30 minutes. This prevents weeks of rework.**

### For a design review:
1. Grab a whiteboard
2. Draw the system
3. Use the [threat-modeling prompts](./prompts/README.md) to guide the conversation
4. Document decisions

## Agent-assisted threat modeling

The OpenAuditor prompts folder includes agent prompts you can use:
- **[Threat Discovery Agent](./prompts/threat-discovery.md)** — Generates threats for your architecture
- **[STRIDE Analysis Agent](./prompts/stride-analysis.md)** — Applies STRIDE framework
- **[Risk Prioritization Agent](./prompts/risk-prioritization.md)** — Helps you prioritize by impact/likelihood

Use these when threat modeling with your team.

## What comes next

- **[Secure by Default](./secure-by-default.md)** — Now that you know what to look for, learn the principles that prevent threats
- **[Risk Appetite Framework](./risk-appetite-framework.md)** — How to decide what level of risk is acceptable
- **01-architecture/** — Design patterns for building threat-resistant systems

---

**Related:**
- [Why Security Matters](./why-security-matters.md)
- [Secure by Default](./secure-by-default.md)
- [prompts/](./prompts/README.md)
