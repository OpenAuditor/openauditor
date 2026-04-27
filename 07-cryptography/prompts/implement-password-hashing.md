# Prompt: Implement Secure Password Hashing

## When to use this

Use this when setting up a new authentication system, when migrating from an insecure hashing algorithm (MD5, SHA-1, plain SHA-256), or when auditing an existing implementation.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer implementing secure password hashing. Audit the current implementation, replace any insecure algorithms, and if necessary create a migration path for existing users.

**Step 1: Find the current implementation**

```bash
# Find password hashing
grep -rn "bcrypt\|argon2\|scrypt\|pbkdf2\|MD5\|SHA1\|sha256\|hash\(\|hashSync" \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules

# Find where users are created or passwords set
grep -rn "user\.create\|password.*hash\|hash.*password\|\.password\s*=" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find login/verification logic
grep -rn "compare\|verify\|bcrypt\.\|argon2\." \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Read each file found and answer:
1. What algorithm is currently used?
2. What is the cost factor (bcrypt) or memory cost (Argon2)?
3. Is there an existing database of hashes that must be migrated?

**Step 2: Choose the target algorithm**

For new projects: **Use Argon2id** (OWASP recommended, memory-hard, resistant to GPU cracking)

For projects needing wide library support: **Use bcrypt** (cost factor ≥ 12)

Never use:
- MD5, SHA-1, SHA-256, SHA-512 directly for passwords (fast hashes — attackers compute billions/second)
- bcrypt cost < 10 (too fast)
- Custom schemes combining hash algorithms

**Step 3: Implement the hashing module**

**Node.js / TypeScript — Argon2id (preferred)**

```typescript
// src/lib/password.ts
import argon2 from 'argon2';

// OWASP-recommended parameters for Argon2id (2023)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB — balance between security and server RAM
  timeCost: 2,       // 2 iterations
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, ARGON2_OPTIONS);
  // Output format: $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>
  // (salt is automatically generated and embedded in the output)
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return argon2.verify(hash, plaintext);
  // Returns false on mismatch — never throws on wrong password
}

export function needsRehash(hash: string): boolean {
  // Returns true if hash was created with different (weaker) parameters
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}
```

**Node.js / TypeScript — bcrypt (if Argon2 not available)**

```typescript
// src/lib/password.ts
import bcrypt from 'bcrypt';

const COST_FACTOR = 12;
// Cost factor 12 ≈ 200-400ms on a modern server
// Benchmark: node -e "const b=require('bcrypt'); console.time(''); b.hash('test',12).then(()=>console.timeEnd(''))"

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, COST_FACTOR);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// bcrypt truncates at 72 bytes — use pre-hashing for very long passwords
export async function hashPasswordSafe(plaintext: string): Promise<string> {
  // Pre-hash to handle passwords > 72 bytes safely
  const { createHash } = await import('crypto');
  const prehashed = createHash('sha512').update(plaintext).digest('base64');
  return bcrypt.hash(prehashed, COST_FACTOR);
}
```

**Python — Argon2id**

```python
# auth/password.py
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)

def hash_password(plaintext: str) -> str:
    return ph.hash(plaintext)

def verify_password(hash: str, plaintext: str) -> bool:
    try:
        return ph.verify(hash, plaintext)
    except (VerifyMismatchError, VerificationError):
        return False

def needs_rehash(hash: str) -> bool:
    return ph.check_needs_rehash(hash)
```

**Step 4: Integrate into authentication flow**

```typescript
// src/api/auth/register.ts
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Validate password complexity before hashing
  if (password.length < 12) {
    return Response.json({ error: 'Password must be at least 12 characters' }, { status: 422 });
  }

  const passwordHash = await hashPassword(password);

  await db.users.create({
    email,
    passwordHash,  // Store the hash, never the plaintext
    createdAt: new Date(),
  });

  return Response.json({ success: true });
}

// src/api/auth/login.ts
import { verifyPassword, needsRehash, hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await db.users.findByEmail(email);

  // Always run verification even if user doesn't exist (prevents timing attacks)
  const dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$dummysaltdummysalt$dummyhashvalue00000000000';
  const isValid = user
    ? await verifyPassword(user.passwordHash, password)
    : await verifyPassword(dummyHash, password);

  if (!user || !isValid) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Opportunistic rehash: if parameters have been updated, rehash on successful login
  if (needsRehash(user.passwordHash)) {
    const newHash = await hashPassword(password);
    await db.users.update(user.id, { passwordHash: newHash });
  }

  // Create session...
}
```

**Step 5: Migrate existing insecure hashes (if needed)**

If users already exist with MD5, SHA, or weak bcrypt hashes:

```typescript
// Migration strategy: verify with old algorithm on login, re-hash with new algorithm
// NEVER require all users to reset — that's a poor experience

// src/api/auth/login.ts (migration version)
import { createHash } from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/password';

async function verifyLegacyHash(plaintext: string, storedHash: string): Promise<boolean> {
  // Support multiple legacy formats
  if (storedHash.startsWith('sha256:')) {
    const expected = 'sha256:' + createHash('sha256').update(plaintext).digest('hex');
    return expected === storedHash;
  }
  
  if (storedHash.startsWith('md5:')) {
    const expected = 'md5:' + createHash('md5').update(plaintext).digest('hex');
    return expected === storedHash;
  }
  
  return false;
}

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await db.users.findByEmail(email);
  
  if (!user) {
    // Still run an operation to prevent timing enumeration
    await hashPassword(password);
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  
  let isValid: boolean;
  let needsMigration = false;
  
  if (user.hashAlgorithm === 'argon2id' || user.passwordHash.startsWith('$argon2')) {
    // Modern hash — use normal verification
    isValid = await verifyPassword(user.passwordHash, password);
  } else {
    // Legacy hash — verify with old algorithm
    isValid = await verifyLegacyHash(password, user.passwordHash);
    needsMigration = isValid; // Only migrate on successful login
  }
  
  if (!isValid) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  
  // Migrate legacy hash on successful login
  if (needsMigration) {
    const newHash = await hashPassword(password);
    await db.users.update(user.id, {
      passwordHash: newHash,
      hashAlgorithm: 'argon2id',
    });
    console.info(`Migrated password hash for user ${user.id} from legacy to Argon2id`);
  }
  
  // Create session...
}
```

**Database migration for hash algorithm tracking:**

```sql
ALTER TABLE users ADD COLUMN hash_algorithm VARCHAR(20) DEFAULT 'argon2id';

-- Mark existing users as having legacy hashes
UPDATE users 
SET hash_algorithm = 'sha256'
WHERE password_hash NOT LIKE '$argon2%' AND password_hash NOT LIKE '$2b$%';
```

**Step 6: Set a deadline for legacy hash retirement**

```typescript
// After 90 days of migration being live, force-expire legacy accounts
// Run as a scheduled job

async function expireLegacyAccounts() {
  const migrationStartDate = new Date('2024-01-15'); // When migration went live
  const gracePeriodDays = 90;
  const deadline = new Date(migrationStartDate.getTime() + gracePeriodDays * 86400 * 1000);
  
  if (new Date() < deadline) {
    console.log(`Legacy account expiry not yet due (deadline: ${deadline.toISOString()})`);
    return;
  }
  
  const legacyAccounts = await db.users.findAll({ hashAlgorithm: 'sha256' });
  
  for (const user of legacyAccounts) {
    // Force password reset on next login
    await db.users.update(user.id, { requiresPasswordReset: true });
    await emailService.send(user.email, 'passwordResetRequired');
  }
  
  console.info(`Expired ${legacyAccounts.length} legacy hash accounts`);
}
```

**Step 7: Test the implementation**

```typescript
describe('Password Hashing', () => {
  it('produces different hashes for the same password', async () => {
    const h1 = await hashPassword('hunter2');
    const h2 = await hashPassword('hunter2');
    expect(h1).not.toBe(h2); // Salt ensures uniqueness
  });

  it('verifies correct password', async () => {
    const hash = await hashPassword('correct-password');
    expect(await verifyPassword(hash, 'correct-password')).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct-password');
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('takes at least 100ms (proof of cost factor)', async () => {
    const start = Date.now();
    await hashPassword('benchmark-password');
    expect(Date.now() - start).toBeGreaterThan(100);
  });

  it('migrates legacy hashes on login', async () => {
    const legacyHash = 'sha256:' + createHash('sha256').update('password').digest('hex');
    await db.users.create({ email: 'test@example.com', passwordHash: legacyHash, hashAlgorithm: 'sha256' });
    
    await simulateLogin('test@example.com', 'password');
    
    const updated = await db.users.findByEmail('test@example.com');
    expect(updated.passwordHash).toMatch(/^\$argon2/);
    expect(updated.hashAlgorithm).toBe('argon2id');
  });
});
```

---

## What to expect

A complete password hashing implementation: Argon2id or bcrypt with correct parameters, integrated into registration and login flows, with timing attack prevention (dummy hash on missing user), opportunistic rehashing, and a migration path for any legacy hashes.

## Learn more

[Never Roll Your Own Crypto](../never-roll-your-own.md)
[Audit Crypto Usage](./audit-crypto-usage.md)
[Fix Authentication Failures](../../02-owasp/prompts/fix-auth-failures.md)
