# Prompt: Secure Supabase Row-Level Security

## When to use this

Use this when setting up a new Supabase project, auditing an existing one, or after adding new tables. RLS is your primary defence against data leaks in Supabase.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a database security engineer. Audit and implement Supabase Row-Level Security (RLS) for this project.

**Step 1: List all tables**
Run or examine the database schema. List every table in `public` schema.

**Step 2: Check RLS status**
For each table, verify:
- Is RLS enabled? (`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)
- What policies exist? (`SELECT * FROM pg_policies WHERE schemaname = 'public'`)
- Is the service role key used anywhere on the frontend? (CRITICAL if yes)

**Step 3: Classify each table**
For each table determine:
- Who should be able to read it? (Public, own rows only, specific roles)
- Who should be able to insert? (Authenticated users, service role only)
- Who should be able to update? (Own rows only, admins)
- Who should be able to delete? (Own rows, soft delete preferred)

**Step 4: Write policies for every table**

Standard pattern for user-owned data:
```sql
ALTER TABLE public.[table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own" ON public.[table]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.[table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.[table]
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON public.[table]
  FOR DELETE USING (auth.uid() = user_id);
```

For public read / private write:
```sql
CREATE POLICY "public_read" ON public.[table]
  FOR SELECT USING (is_published = true OR auth.uid() = user_id);
```

**Step 5: Verify no dangerous patterns**
Check for and remove:
- `USING (true)` — allows all users to access all rows
- `WITH CHECK (true)` — allows any user to insert any data
- Tables with RLS disabled that should have it
- Policies that don't reference `auth.uid()`

**Step 6: Verify storage bucket policies**
Check Supabase Storage bucket policies. Apply same ownership principle.

**Step 7: Test the policies**
In Supabase SQL editor, test each policy:
```sql
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id"}';
SELECT * FROM [table]; -- should only return rows for test-user-id
```

Show the complete set of SQL statements to run, and confirm the policies are correct.

---

## What to expect

A full RLS audit of your Supabase schema, SQL to enable RLS on every table, policy definitions for each table, and test queries to verify isolation works. Any table with a dangerous policy will be flagged as Critical.

## Learn more

[Database Security](../database-security.md)
