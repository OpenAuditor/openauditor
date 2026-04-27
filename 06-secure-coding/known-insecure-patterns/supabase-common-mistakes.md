# Supabase Common Security Mistakes

The most dangerous Supabase mistakes, with fixes.

---

## 1. No RLS Policies (Most Critical)

```sql
-- WRONG — RLS enabled but no policies = table is locked to everyone
-- But often tables are created WITHOUT enabling RLS at all
CREATE TABLE public.orders (id UUID, user_id UUID, amount NUMERIC);
-- No ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- Anyone with anon key can read/write all orders!
```

```sql
-- RIGHT — enable RLS AND create policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id);
```

---

## 2. Service Role Key on the Frontend

```javascript
// WRONG — service role key bypasses all RLS
// If this is in a React/Next.js client-side component, it's in the JS bundle
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY, // NEVER!
);
```

```javascript
// RIGHT — use anon key on frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // safe with RLS
);

// Use service role only in server-side code (API routes, Server Actions)
// and store as SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix)
```

---

## 3. Permissive RLS Policies

```sql
-- WRONG — allows everything
CREATE POLICY "allow_all" ON public.profiles USING (true);

-- WRONG — allows reading but no insert restriction
CREATE POLICY "users_read_profiles" ON public.profiles
  FOR SELECT USING (true); -- anyone can read all profiles
```

```sql
-- RIGHT — specific and restrictive
-- Users can only read their own profile
CREATE POLICY "users_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read public profiles + their own
CREATE POLICY "read_public_or_own" ON public.profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
```

---

## 4. Forgetting INSERT/UPDATE/DELETE Policies

```sql
-- WRONG — SELECT policy exists but no INSERT policy
-- This means inserts are blocked by default (which seems safe)
-- But if you do:
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT policy = nobody can insert! (including the authenticated user)
```

```sql
-- RIGHT — explicit policies for each operation
CREATE POLICY "read_own_posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own_posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 5. Exposing User Emails via Profiles

```sql
-- WRONG — allows anyone to read all user emails
CREATE POLICY "public_profiles" ON public.profiles
  FOR SELECT USING (true);
-- If profiles includes email column, all emails are now public
```

```sql
-- RIGHT — expose only what's needed publicly
-- Create a separate view for public profile data
CREATE VIEW public_profiles AS
  SELECT id, display_name, avatar_url, created_at
  FROM profiles; -- no email, no sensitive fields

-- Or use column-level security:
CREATE POLICY "read_own_email" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id); -- only see your own email
```

---

## 6. Using `select('*')` When Not Needed

```javascript
// WRONG — fetches all columns including sensitive ones
const { data } = await supabase.from('users').select('*');
// Returns password_hash, internal_notes, billing_info, etc.
```

```javascript
// RIGHT — select only needed columns
const { data } = await supabase
  .from('users')
  .select('id, display_name, avatar_url, created_at');
```

---

## 7. Not Testing RLS

```javascript
// Test your RLS policies regularly
// In Supabase SQL editor:
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-id-a"}';

-- This query should ONLY return rows owned by user-id-a
SELECT * FROM posts;

-- Switch to different user
SET LOCAL "request.jwt.claims" TO '{"sub": "user-id-b"}';
-- This should NOT return user-id-a's posts
SELECT * FROM posts;
```

---

## Learn More

- [Database Security](../database-security.md)
- [Secure Supabase RLS prompt](../prompts/secure-supabase-rls.md)
- [Production Readiness Audit: Domain 7](../../skills/production-readiness-audit/SKILL.md)
