# Prompt: Secure API Routes

## When to use this

Use this when building API endpoints or auditing existing ones. Every route that returns data or performs an action needs authentication, authorisation, validation, and error handling.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit and harden every API route in this application.

**Step 1: Map all API routes**
List every route/endpoint in the application:
- Method (GET, POST, PUT, DELETE, PATCH)
- Path
- What it does
- What data it returns or modifies

**Step 2: Check authentication on each route**
For each route, verify:
- Is authentication required? (Should it be?)
- Is it enforced via middleware, not just trusted user input?
- Does it fail safely (401) when the token is missing or invalid?

Flag any route that:
- Handles sensitive data but has no auth check
- Trusts user-supplied role or permission claims
- Uses an authentication method that can be bypassed (e.g., checking a cookie that doesn't exist in a JWT)

**Step 3: Check authorisation (ownership)**
For every route that returns or modifies a specific resource (by ID):
- Does it verify the authenticated user owns that resource?
- Does it return 404 (not 403) when a user requests something they don't own?

Example check:
```javascript
// This is insecure — must also check ownership
const item = await db.items.findOne({ where: { id: req.params.id } });

// This is correct
const item = await db.items.findOne({ 
  where: { id: req.params.id, userId: req.user.id } 
});
```

**Step 4: Check input validation**
For every POST/PUT/PATCH endpoint:
- Is the request body validated with a schema?
- Are all fields typed, bounded, and sanitised?
- Can users set fields they shouldn't (e.g., role, userId, isAdmin)?

**Step 5: Check error responses**
For every route:
- Do errors return stack traces, SQL queries, or internal paths?
- Are 500 errors generic to the client but logged server-side?
- Are auth errors consistent (same message whether user doesn't exist or password is wrong)?

**Step 6: Check rate limiting**
Which endpoints have rate limiting? Which don't?

Flag any endpoint that:
- Handles authentication or password reset without rate limiting
- Returns large datasets without pagination

**Step 7: Implement fixes**
For every issue found:
- Add or fix authentication middleware
- Add ownership checks
- Add input validation with Zod/Pydantic
- Fix error responses
- Add rate limiting where missing
- Add pagination where missing

Show the before and after for every changed file.

---

## What to expect

A complete audit of all API routes, each rated as Secure / Needs Fix, with specific code changes for every insecure route. The output includes working middleware, schema validation, and corrected error handling.

## Learn more

[API Security](../api-security.md)
