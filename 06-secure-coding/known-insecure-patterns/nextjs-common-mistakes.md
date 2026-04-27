# Next.js Common Security Mistakes

Real mistakes seen in Next.js apps, with the vulnerable code and the fix.

---

## 1. Exposing Server-Side Secrets to the Client

```javascript
// WRONG — NEXT_PUBLIC_ prefix exposes to browser
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  // in .env.local

// In component:
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
// This key is now in your JavaScript bundle, visible to everyone
```

```javascript
// RIGHT — service role key stays server-side
// .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  // no NEXT_PUBLIC_ prefix

// Server-side only (API route, Server Action, Server Component)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // only accessible server-side
);
```

---

## 2. Missing Auth in API Routes

```javascript
// WRONG — no authentication check
// pages/api/user/delete.ts
export default async function handler(req, res) {
  await db.users.delete({ where: { id: req.body.userId } });
  res.json({ success: true });
}
```

```javascript
// RIGHT — authenticate and authorise
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  
  // Only allow users to delete their own account
  if (req.body.userId !== session.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await db.users.delete({ where: { id: session.user.id } });
  res.json({ success: true });
}
```

---

## 3. SQL Injection via Raw Queries

```javascript
// WRONG — raw string interpolation
const user = await prisma.$queryRaw(`SELECT * FROM users WHERE email = '${email}'`);
```

```javascript
// RIGHT — tagged template literal (Prisma parameterises automatically)
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// Or use Prisma ORM methods which always parameterise
const user = await prisma.user.findUnique({ where: { email } });
```

---

## 4. No Rate Limiting on Auth Endpoints

```javascript
// WRONG — anyone can try unlimited passwords
export default async function handler(req, res) {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  ...
}
```

```javascript
// RIGHT — rate limit login attempts
import { rateLimiter } from '@/lib/rate-limit';

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { success } = await rateLimiter.limit(ip);
  
  if (!success) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  ...
}
```

---

## 5. Using `dangerouslySetInnerHTML` with User Content

```jsx
// WRONG — XSS via unsanitised user content
function Comment({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

```jsx
// RIGHT — sanitise before rendering HTML (only if you need HTML)
import DOMPurify from 'dompurify';

function Comment({ content }) {
  const clean = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// BETTER — use a markdown renderer that sanitises
import ReactMarkdown from 'react-markdown';
function Comment({ content }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
```

---

## 6. Trusting `x-forwarded-for` Without Validation

```javascript
// WRONG — can be spoofed
const ip = req.headers['x-forwarded-for']; // attacker sends: X-Forwarded-For: 127.0.0.1

// RIGHT — get first IP in chain (the real client IP)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim(); // first IP is the original client
  }
  return req.socket.remoteAddress;
}
```

---

## 7. No CSRF Protection on Mutations

```javascript
// WRONG — missing CSRF protection on state-changing endpoint
// Attacker can make a form on evil.com that submits to your API
export default async function handler(req, res) {
  await deleteAccount(req.body.userId);
}
```

```javascript
// RIGHT — use NextAuth CSRF tokens, or check Content-Type + Origin
export default async function handler(req, res) {
  // SameSite=Lax cookies provide implicit CSRF protection for most cases
  // For extra protection, verify the origin header
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'CSRF check failed' });
  }
  ...
}
```

---

## 8. Logging Sensitive Data

```javascript
// WRONG — logs the password and full user object
console.log('Login attempt:', { email, password, ...userData });
```

```javascript
// RIGHT — log only what's needed for debugging
console.log('Login attempt:', { email, success: true, userId: user.id });
// Never log: passwords, tokens, credit card numbers, full PII
```

---

## Learn More

- [Auth Best Practices](../auth-best-practices.md)
- [Input Validation](../input-validation.md)
- [Supabase Common Mistakes](./supabase-common-mistakes.md)
