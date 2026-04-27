# Prompt: Fix Broken Access Control

## When to use this

Use this after an IDOR is discovered, when auditing a new codebase, or before launch. Access control bugs are the #1 OWASP risk and are almost always present in systems without a formal access control layer.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer implementing and auditing access control. Your goal: ensure no user can access or modify another user's data.

**Step 1: Map all data resources**

Find every resource type in the application:
```bash
# Find API endpoints that return or modify user data
grep -r "req.params.id\|params.userId\|params.orderId\|params.documentId" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find Supabase queries with user-provided IDs
grep -r "supabase\.\|\.from(" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | head -50

# Find database queries
grep -r "findById\|findOne\|where.*id" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | head -50
```

For each resource: document who should be able to access it (owner only? team members? public?).

**Step 2: Find IDOR vulnerabilities**

Review each endpoint that accepts a resource ID (user ID, order ID, document ID, etc.):

```typescript
// VULNERABLE — takes ID from URL without ownership check
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const order = await db.orders.findById(params.id); // No ownership check!
  return Response.json(order);
}

// SECURE — verify the authenticated user owns the resource
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorised', { status: 401 });
  
  const order = await db.orders.findOne({
    id: params.id,
    userId: session.user.id, // MUST match — IDOR prevention
  });
  
  if (!order) return new Response('Not found', { status: 404 }); // Not 403 — don't reveal existence
  return Response.json(order);
}
```

**Step 3: For Supabase — implement Row Level Security**

If using Supabase, enable RLS on every table that contains user data:

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY "users_own_orders"
ON orders FOR ALL
USING (auth.uid() = user_id);

-- Users can only see their own documents
CREATE POLICY "users_own_documents"
ON documents FOR ALL
USING (auth.uid() = user_id);

-- Team members can see team documents
CREATE POLICY "team_members_can_view"
ON documents FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);
```

Verify RLS is enabled on all tables:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
-- rowsecurity should be 't' for all tables with user data
```

**Step 4: Check horizontal privilege escalation**

Test that users cannot access each other's resources:
- Create two test users: User A and User B
- User A creates a resource (order, document, etc.)
- Log in as User B
- Attempt to access User A's resource with its ID
- Expected: 404 (not 403 — don't reveal the resource exists)

Write automated IDOR tests:
```typescript
describe('IDOR Prevention', () => {
  it('cannot access another user\'s order', async () => {
    const { cookie: cookieA } = await loginAs('userA@test.com');
    const { cookie: cookieB } = await loginAs('userB@test.com');
    
    // User A creates an order
    const createRes = await request(app)
      .post('/api/orders')
      .set('Cookie', cookieA)
      .send({ productId: 'prod_1', quantity: 1 });
    const orderId = createRes.body.id;
    
    // User B tries to access it
    const getRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Cookie', cookieB);
    
    expect(getRes.status).toBe(404); // Not 200 or 403
  });
});
```

**Step 5: Check vertical privilege escalation**

Test that regular users cannot access admin endpoints:
```typescript
describe('Admin Access Control', () => {
  it('regular user cannot list all users', async () => {
    const { cookie } = await loginAs('user@test.com'); // regular user
    
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookie);
    
    expect(res.status).toBe(403);
  });
  
  it('regular user cannot modify user roles', async () => {
    const { cookie } = await loginAs('user@test.com');
    
    const res = await request(app)
      .put('/api/admin/users/some-user-id/role')
      .set('Cookie', cookie)
      .send({ role: 'admin' });
    
    expect(res.status).toBe(403);
  });
});
```

**Step 6: Implement a centralised access control layer**

Instead of repeating ownership checks everywhere, create a helper:

```typescript
// lib/access-control.ts
export async function requireOwnership(
  userId: string,
  resourceType: 'order' | 'document' | 'profile',
  resourceId: string
): Promise<void> {
  const resourceUserId = await getResourceOwner(resourceType, resourceId);
  
  if (resourceUserId !== userId) {
    throw new AccessDeniedError(resourceType, resourceId);
  }
}

// Usage in API routes:
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorised', { status: 401 });
  
  await requireOwnership(session.user.id, 'order', params.id);
  // If we reach here, the user owns this order
  
  await db.orders.delete(params.id);
  return new Response(null, { status: 204 });
}
```

**Step 7: Produce findings report**

For each endpoint reviewed:
- **Endpoint:** Path and method
- **Status:** SECURE / VULNERABLE / PARTIAL
- **Issue:** Description of the access control gap
- **Fix:** Code applied

---

## What to expect

Every resource endpoint reviewed and fixed, RLS policies implemented in Supabase (if applicable), IDOR tests written and passing, and a centralised access control helper to prevent regression.

## Learn more

[OWASP A01: Broken Access Control](../web-top10/A01-broken-access-control.md)
[Supabase RLS prompt](../../06-secure-coding/prompts/secure-supabase-rls.md)
[Testing Your Auth](../../10-security-testing/testing-your-auth.md)
