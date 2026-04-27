# Database Security

Your database holds everything worth stealing. Misconfigured databases are responsible for more breaches than almost anything else.

---

## Parameterised Queries — No Exceptions

Raw string concatenation in SQL queries is the definition of SQL injection.

```javascript
// WRONG — SQL injection waiting to happen
const query = `SELECT * FROM users WHERE email = '${email}'`;
// If email = "'; DROP TABLE users; --" you're done.

// RIGHT — parameterised query
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// RIGHT — using an ORM (Prisma)
const user = await prisma.user.findUnique({ where: { email } });

// RIGHT — Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email);
```

```python
# WRONG
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# RIGHT — psycopg2 parameterised
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# RIGHT — SQLAlchemy ORM
user = session.query(User).filter(User.email == email).first()
```

---

## Supabase Row-Level Security (RLS)

If you use Supabase, RLS is your most critical configuration. Without it, your database is functionally public to anyone with your anon key.

> **Critical:** Enable RLS on every table. Without RLS, any request using the anon key can read and write all rows.

### Enable RLS

```sql
-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
```

### Basic RLS Policies

```sql
-- Users can only read their own profile
CREATE POLICY "Users read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read published posts + their own drafts
CREATE POLICY "Users read posts"
  ON public.posts
  FOR SELECT
  USING (
    published = true
    OR auth.uid() = author_id
  );

-- Users can only insert their own rows
CREATE POLICY "Users insert own data"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

### Dangerous Anti-Patterns

```sql
-- WRONG — allows anyone to do anything
CREATE POLICY "Allow all"
  ON public.users
  USING (true);

-- WRONG — using service role on frontend
-- The SUPABASE_SERVICE_ROLE_KEY bypasses RLS entirely
-- Never expose it to the frontend or client
```

---

## Least Privilege Principle

Your application should connect to the database with the minimum permissions needed.

```sql
-- Create a limited role for your app
CREATE ROLE app_user;

-- Grant only what's needed
GRANT SELECT, INSERT, UPDATE ON public.posts TO app_user;
GRANT SELECT ON public.profiles TO app_user;

-- Never grant DELETE unless your app actually deletes rows
-- Never grant DROP TABLE, ALTER TABLE, TRUNCATE
```

### In Supabase

- Use the **anon key** for public-facing operations with RLS
- Use the **service role key** only for backend admin operations (never expose to frontend)
- Use **per-table RLS policies** to enforce data isolation

---

## Connection Security

```javascript
// Require SSL for database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // verify server certificate
  },
});
```

```python
import psycopg2

conn = psycopg2.connect(
    dsn=os.environ['DATABASE_URL'],
    sslmode='require',  # or 'verify-full' for full cert verification
)
```

> **Critical:** Never connect to a database without SSL/TLS in production. Credentials and data would be transmitted in plain text.

---

## Don't Expose Internal IDs

```javascript
// WRONG — exposes sequential IDs (easy to enumerate)
GET /api/posts/1
GET /api/posts/2
...

// RIGHT — use UUIDs
GET /api/posts/550e8400-e29b-41d4-a716-446655440000

// In Supabase / Postgres — use gen_random_uuid()
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

---

## Backup Strategy

```bash
# Supabase — enable Point-in-Time Recovery (PITR) in dashboard
# This gives you second-by-second backups for the past 7-30 days

# For self-hosted Postgres — automated daily backup
pg_dump -Fc -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).dump

# Encrypt backups before storing
gpg --symmetric --cipher-algo AES256 backup_$(date +%Y%m%d).dump
```

---

## Why This Matters

The 2018 MongoDB ransomware attacks hit thousands of databases left exposed on the internet with default credentials. Attackers ran automated scans, wiped data, and left ransom notes. Proper access control, authentication, and network isolation would have prevented every one of these attacks.

---

## Checklist

- [ ] All SQL uses parameterised queries or an ORM
- [ ] Supabase RLS enabled on all tables
- [ ] RLS policies restrict users to their own data
- [ ] Service role key never exposed to frontend
- [ ] Database not publicly accessible (port 5432 not open to 0.0.0.0)
- [ ] App connects with minimum required permissions
- [ ] SSL required for all database connections
- [ ] UUIDs used for primary keys (not sequential integers)
- [ ] Automated backups configured and tested

---

## Learn More

- [Secure Supabase RLS prompt](./prompts/secure-supabase-rls.md)
- [OWASP A03: Injection](../02-owasp/web-top10/A03-injection.md)
- [Supabase Common Mistakes](./known-insecure-patterns/supabase-common-mistakes.md)
