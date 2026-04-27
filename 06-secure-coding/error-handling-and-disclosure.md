# Error Handling and Information Disclosure

What you show users in errors can help attackers more than it helps your users.

---

## The Problem

Verbose error messages reveal:
- Stack traces (file paths, line numbers, framework versions)
- SQL queries (table names, column names, database type)
- Internal hostnames and IP addresses
- Dependency versions with known CVEs
- Business logic and data structures

All of this is gold for an attacker profiling your app.

---

## What to Show vs What to Log

| Information | Show to User? | Log Server-Side? |
|-------------|-------------|-----------------|
| "Something went wrong" | ✓ | ✓ |
| Error reference ID | ✓ | ✓ |
| Stack trace | ✗ | ✓ |
| SQL query | ✗ | ✓ |
| File paths | ✗ | ✓ |
| Internal error message | ✗ | ✓ |
| User's input that caused error | ✗ | Limited (PII risks) |

---

## Centralised Error Handler

### Express

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

// Global error handler (must be last middleware)
app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  
  // Always log the full error server-side
  console.error({
    errorId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });
  
  // Return generic response to client
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;
  
  res.status(statusCode).json({
    error: isOperational ? err.message : 'Internal server error',
    errorId, // safe to share — helps with support
  });
});

// Usage in routes
app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const post = await getPost(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    res.json(post);
  } catch (err) {
    next(err); // passes to global handler
  }
});
```

### Next.js

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
  }
}

// app/api/posts/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const post = await getPost(params.id);
    if (!post) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(post);
  } catch (err) {
    const errorId = crypto.randomUUID();
    console.error({ errorId, error: err });
    
    if (err instanceof AppError) {
      return Response.json({ error: err.message, errorId }, { status: err.statusCode });
    }
    
    return Response.json({ error: 'Internal server error', errorId }, { status: 500 });
  }
}
```

---

## Disable Debug Mode in Production

```javascript
// next.config.js
const isDev = process.env.NODE_ENV === 'development';

// Never expose detailed errors in production
if (!isDev) {
  // Errors handled by global error boundary
}
```

```python
# Django — NEVER in production
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# FastAPI — disable debug in production
app = FastAPI(debug=False)
```

---

## Database Errors

Never pass raw database errors to the client.

```javascript
// WRONG
try {
  await db.users.create({ email: duplicateEmail });
} catch (err) {
  // This might say: "duplicate key value violates unique constraint 'users_email_key'"
  // Reveals table structure!
  return res.status(500).json({ error: err.message });
}

// RIGHT
try {
  await db.users.create({ email });
} catch (err) {
  if (err.code === '23505') { // Postgres unique violation
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  console.error({ error: err.message, code: err.code });
  return res.status(500).json({ error: 'Internal server error' });
}
```

---

## 404 vs 403

Be consistent. Don't reveal whether a resource exists to unauthorised users.

```javascript
// WRONG — reveals that resource exists
if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

// RIGHT — treat unauthorised access as not-found
const resource = await db.items.findOne({
  where: { id, userId: req.user.id } // only returns result if user owns it
});
if (!resource) return res.status(404).json({ error: 'Not found' });
```

---

## Why This Matters

In 2022, multiple fintech apps were found leaking full stack traces in API responses. This revealed exact Node.js version (cross-referenced with known CVEs), framework versions, internal service names, and database table structure. An attacker could use this for targeted exploitation.

---

## Checklist

- [ ] Global error handler catches all unhandled errors
- [ ] Stack traces never returned to client
- [ ] Database errors translated to generic messages
- [ ] Debug mode disabled in production
- [ ] Error IDs generated and logged for support
- [ ] 404 returned when unauthorised (not 403 that reveals existence)
- [ ] Error logging includes enough context to diagnose (server-side only)

---

## Learn More

- [OWASP A09: Logging Failures](../02-owasp/web-top10/A09-logging-failures.md)
- [What to Log](../11-monitoring-and-observability/what-to-log.md)
