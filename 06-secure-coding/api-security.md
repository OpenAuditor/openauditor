# API Security

Every API endpoint is an attack surface. Authentication, authorisation, rate limiting, and input validation are required — not optional.

---

## Auth on Every Endpoint

The most common API vulnerability is forgetting to check authentication on some routes.

```javascript
// WRONG — auth middleware only on some routes
app.get('/api/public', handler);
app.get('/api/users', authMiddleware, handler);
app.get('/api/admin', handler); // forgot auth!

// RIGHT — apply globally, then relax for public routes
app.use('/api', authMiddleware); // protect everything
app.use('/api/public', relaxAuth); // then explicitly open public routes
```

### Middleware Pattern (Express)

```javascript
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Next.js API Route Auth

```typescript
// lib/auth.ts
export async function requireAuth(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.slice(7);
  const payload = jwt.verify(token, process.env.JWT_SECRET!);
  const user = await db.users.findUnique({ where: { id: payload.userId } });
  
  if (!user) throw new Response('Unauthorized', { status: 401 });
  return user;
}

// app/api/posts/route.ts
export async function GET(req: Request) {
  const user = await requireAuth(req);
  // user is guaranteed to exist here
  const posts = await db.posts.findMany({ where: { userId: user.id } });
  return Response.json(posts);
}
```

---

## Object-Level Authorisation (Prevent IDOR)

After authenticating, check the user owns the resource.

```javascript
// WRONG — checks auth but not ownership
app.get('/api/invoices/:id', auth, async (req, res) => {
  const invoice = await db.invoices.findOne({ id: req.params.id });
  res.json(invoice); // any user can read any invoice!
});

// RIGHT — check ownership
app.get('/api/invoices/:id', auth, async (req, res) => {
  const invoice = await db.invoices.findOne({
    where: { id: req.params.id, userId: req.user.id } // ownership check
  });
  
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  res.json(invoice);
});
```

---

## Safe Error Responses

Never reveal internal information in API errors.

```javascript
// WRONG — leaks DB schema, stack trace, or internal paths
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message,              // might be "Column 'email' doesn't exist"
    stack: err.stack,               // full stack trace
    query: err.sql,                 // the SQL query that failed
  });
});

// RIGHT — generic error, details logged server-side only
app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  console.error({ errorId, error: err.message, stack: err.stack });
  
  res.status(err.statusCode || 500).json({
    error: err.statusCode === 404 ? 'Not found' : 'Internal server error',
    errorId, // reference for support, safe to show
  });
});
```

---

## Input Validation on All Endpoints

```typescript
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string().max(50)).max(10),
  published: z.boolean().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = CreatePostSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json({ errors: result.error.flatten() }, { status: 400 });
  }
  
  const post = await createPost(result.data);
  return Response.json(post, { status: 201 });
}
```

---

## API Versioning

```javascript
// Version your APIs so you can deprecate insecure patterns safely
app.use('/api/v1', v1Router); // current
app.use('/api/v2', v2Router); // new version with security improvements

// When deprecating v1, add a deprecation header
v1Router.use((req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Sat, 01 Jan 2027 00:00:00 GMT');
  next();
});
```

---

## Rate Limiting (Always)

See [Rate Limiting](./rate-limiting.md) for implementation. Apply to every public endpoint.

---

## Pagination (Don't Allow Full Table Dumps)

```javascript
// WRONG — returns potentially millions of rows
app.get('/api/users', auth, async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});

// RIGHT — paginate and cap
const MAX_PAGE_SIZE = 100;
app.get('/api/users', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = Math.min(parseInt(req.query.size) || 20, MAX_PAGE_SIZE);
  
  const users = await db.users.findMany({
    skip: (page - 1) * size,
    take: size,
  });
  
  res.json({ data: users, page, size });
});
```

---

## Checklist

- [ ] Auth required on every non-public endpoint
- [ ] Ownership checked before returning any record
- [ ] All endpoints have rate limiting
- [ ] All input validated with schema validation
- [ ] Errors don't leak stack traces or internal details
- [ ] API responses paginated
- [ ] API versioning strategy in place
- [ ] Sensitive endpoints logged

---

## Learn More

- [OWASP API Top 10](../02-owasp/api-top10/)
- [Rate Limiting](./rate-limiting.md)
- [Secure API Routes prompt](./prompts/secure-api-routes.md)
