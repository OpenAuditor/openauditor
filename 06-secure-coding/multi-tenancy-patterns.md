# Multi-Tenancy Security Patterns

In a multi-tenant app, your most critical requirement is that Tenant A can never see or touch Tenant B's data.

---

## The Risk

Cross-tenant data leaks are catastrophic — they expose your customers' private data to each other. This destroys trust, triggers regulatory action, and is frequently grounds for legal action.

---

## Row-Level Security (Recommended for Supabase)

The safest pattern: the database enforces tenant isolation.

```sql
-- Add tenant_id to all tenant-scoped tables
ALTER TABLE public.documents ADD COLUMN organization_id UUID NOT NULL;

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own organization's documents
CREATE POLICY "org_isolation"
  ON public.documents
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );
```

Every query automatically filters by the authenticated user's organisation. No risk of forgetting a WHERE clause.

---

## Application-Layer Tenant Filtering

If you handle tenant isolation in code, every query must include the tenant filter.

```javascript
// Middleware: attach tenant to request
async function tenantMiddleware(req, res, next) {
  const user = req.user; // from auth middleware
  const tenant = await db.tenants.findOne({ where: { id: user.tenantId } });
  
  if (!tenant) return res.status(403).json({ error: 'Access denied' });
  req.tenant = tenant;
  next();
}

// Service layer: always include tenantId
async function getDocuments(tenantId: string, userId: string) {
  return db.documents.findMany({
    where: {
      tenantId,  // ALWAYS filter by tenant
      // optionally also filter by userId for user-scoped data
    },
  });
}

// NEVER do this
async function getDocument(id: string) {
  return db.documents.findOne({ where: { id } }); // no tenant filter!
}
```

---

## Shared Infrastructure, Isolated Data

```javascript
// Tenant context helper — attach to all queries
class TenantRepository {
  constructor(private readonly tenantId: string) {}
  
  async findAll<T>(model: any, where: object = {}): Promise<T[]> {
    return model.findMany({
      where: { ...where, tenantId: this.tenantId },
    });
  }
  
  async findOne<T>(model: any, where: object): Promise<T | null> {
    return model.findUnique({
      where: { ...where, tenantId: this.tenantId },
    });
  }
}

// Usage
const repo = new TenantRepository(req.tenant.id);
const docs = await repo.findAll(db.documents);
```

---

## Tenant-Scoped File Storage

```javascript
// Scope file storage paths by tenant
const filePath = `tenants/${tenantId}/documents/${randomUUID()}.pdf`;

// Supabase Storage — scoped path
await supabase.storage
  .from('documents')
  .upload(filePath, fileBuffer);

// RLS policy on storage
// CREATE POLICY "tenant_isolation"
//   ON storage.objects
//   USING (
//     (storage.foldername(name))[2] = (
//       SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
//     )
//   );
```

---

## Testing Tenant Isolation

```javascript
// Test: user from Tenant A cannot access Tenant B data
describe('Tenant Isolation', () => {
  it('cannot access another tenant document', async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();
    const doc = await createDocument({ tenantId: tenantB.id });
    
    const response = await request(app)
      .get(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${tenantA.userToken}`);
    
    expect(response.status).toBe(404); // not 403 — don't reveal existence
  });
});
```

---

## Checklist

- [ ] All tenant-scoped tables have `tenant_id` / `organization_id` column
- [ ] Row-level security enforced at DB level (preferred) or application layer
- [ ] Every query includes tenant filter
- [ ] File storage scoped by tenant path
- [ ] Automated tests verify cross-tenant isolation
- [ ] Admin users explicitly scoped to their tenant (not global admin unless intended)
- [ ] Tenant ID comes from authenticated session, not user input

---

## Learn More

- [Database Security](./database-security.md)
- [OWASP A01: Broken Access Control](../02-owasp/web-top10/A01-broken-access-control.md)
