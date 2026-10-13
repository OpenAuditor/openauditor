# LLM08: Vector and Embedding Weaknesses

**LLM08:2025 · Rank #8 in the OWASP Top 10 for LLM Applications 2025 (new in 2025) · Severity: High for multi-tenant apps**

Retrieval-augmented generation (RAG) adds a new data store, the vector database, and a new pipeline that copies your data into it. Both are easy to get wrong: permissions get lost on the way in, tenants share an index, poisoned documents get retrieved, and "anonymous" vectors can be turned back into text.

---

## 30-Second Summary

Most RAG security bugs aren't exotic. They're ordinary access control and data lifecycle bugs in a store that teams don't think of as a database:

1. **Permissions don't survive ingestion.** The source document was private; its chunks in the vector store are readable by everyone.
2. **Tenants share an index** with the tenant filter applied (or forgotten) in application code.
3. **Untrusted content gets embedded** next to trusted content and retrieved as if it were authoritative ([LLM04](./LLM04-data-and-model-poisoning.md)).
4. **Embeddings are treated as non-sensitive.** Research such as *Text Embeddings Reveal (Almost) As Much As Text* (Morris et al., 2023) recovered most of the original wording of short texts from their embeddings alone. Vectors of personal data are personal data.
5. **Deleting a record doesn't delete its embeddings**, breaking erasure requests.

**Typical incident:** A B2B SaaS adds "Ask your workspace" using one shared vector index and filters results by `workspace_id` in TypeScript. A new code path (an export endpoint, a debug tool, a second chat feature) calls the search without the filter, and customers start seeing snippets from other companies' documents.

---

## 1. Enforce Tenancy in the Store, Not in the App

### Postgres + pgvector (Supabase)

Put embeddings in a table with a tenant column and Row Level Security, and search with the user's credentials. The database then enforces the boundary on every code path.

```sql
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  source text not null check (source in ('official', 'customer_upload')),
  created_at timestamptz not null default now()
);

alter table document_chunks enable row level security;

create policy "members read their org's chunks" on document_chunks
  for select to authenticated
  using (org_id in (select org_id from memberships where user_id = (select auth.uid())));

-- memberships needs its own RLS policy letting users read their own rows,
-- otherwise the subquery above returns nothing and search fails closed
create policy "read own memberships" on memberships
  for select to authenticated using (user_id = (select auth.uid()));

create index on document_chunks using hnsw (embedding vector_cosine_ops);
create index on document_chunks (org_id);
```

```typescript
// Use the user's session client so RLS applies. Never the service role key.
const supabase = await createClient();
const { data } = await supabase.rpc('match_chunks', { query_embedding, match_count: 8 });
```

The `match_chunks` function must be `security invoker` (the default). A `security definer` function runs as its owner, bypasses RLS and silently reintroduces cross-tenant leaks: in testing, the same query returned only the caller's org with `security invoker` and every org's chunks with `security definer`.

### Hosted vector databases

- Use one **namespace / collection per tenant** where the product supports it, or
- Add the tenant filter in a single server-side search function that every caller must use, and **never accept the tenant ID from the client or the model**
- Keep the vector DB API key server-side and scoped (read-only for the query path)

---

## 2. Carry Permissions Through Ingestion

```typescript
// VULNERABLE: chunks lose the source document's access rules
for (const chunk of chunks) {
  await upsert({ content: chunk, embedding: await embed(chunk) });
}

// SECURE: every chunk records who may see it, copied from the source of truth
for (const chunk of chunks) {
  await upsert({
    content: chunk,
    embedding: await embed(chunk),
    org_id: doc.orgId,
    document_id: doc.id,          // lets you delete and re-check permissions later
    visibility: doc.visibility,   // 'org' | 'private' | 'public'
    owner_id: doc.ownerId,
    source: doc.source,
  });
}
```

If permissions on the source document change (a file moved to a private folder, a user removed from a project), your index must change too. Either re-check the source permission at query time via `document_id`, or re-sync chunks when permissions change. Stale permissions are a common leak.

---

## 3. Keep Untrusted Content Separate

- Customer uploads are retrieved only for that customer's tenant
- Only reviewed, `official` content is shared across all users
- Strip hidden text, comments and metadata before embedding
- Show sources with answers so poisoned or outdated chunks get noticed

See [LLM04: Data and Model Poisoning](./LLM04-data-and-model-poisoning.md).

---

## 4. Treat Embeddings as the Data They Came From

- **Same protection:** encryption at rest, access control, backups and retention as the source data
- **Same location:** if you promise UK or EU data residency, your vector DB and your embedding API calls must comply too
- **Same erasure:** deleting a user or document deletes its chunks (`on delete cascade` above), and you know which backups still hold them
- **Same processor rules:** the embedding API provider receives the raw text, so it belongs in your [UK GDPR](../../12-privacy-and-gdpr/uk-gdpr-for-founders.md) records

```sql
-- Erasure: delete the source records, then verify the cascade removed their chunks
begin;
create temp table to_erase on commit drop as
  select id from documents where owner_id = $1;
delete from documents where id in (select id from to_erase);
select count(*) as orphaned_chunks
from document_chunks
where document_id in (select id from to_erase);  -- expect 0
commit;
```

---

## 5. Don't Mix Embedding Models

Vectors from different embedding models (or versions) live in different spaces. Mixing them makes retrieval silently return the wrong documents, which can surface unrelated (and unauthorised, if filters are loose) content. Store the model name with each vector and re-embed everything when you change models.

```sql
alter table document_chunks add column embedding_model text not null default 'text-embedding-3-small';
```

---

## Audit Checklist

- [ ] Every chunk stores tenant, document ID, visibility and source
- [ ] Tenancy is enforced by the store (RLS with `security invoker`, or per-tenant namespaces), not only by app code
- [ ] Search runs with the user's credentials; tenant IDs never come from the client or the model
- [ ] Permission changes on source documents propagate to the index (or are checked at query time)
- [ ] Untrusted uploads are never retrieved outside their own tenant
- [ ] Embeddings get the same encryption, residency, retention and erasure handling as the source data
- [ ] Vector DB keys are server-side and least-privilege
- [ ] Embedding model is recorded per vector and changes trigger a full re-embed

---

## Learn More

- [OWASP LLM08:2025 Vector and Embedding Weaknesses](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/)
- [LLM02: Sensitive Information Disclosure](./LLM02-sensitive-information-disclosure.md)
- [LLM04: Data and Model Poisoning](./LLM04-data-and-model-poisoning.md)
- [RAG Security](../../08-ai-app-security/rag-security.md)
- [Multi-Tenancy Patterns](../../06-secure-coding/multi-tenancy-patterns.md)
- [Right to Erasure](../../12-privacy-and-gdpr/right-to-erasure.md)
