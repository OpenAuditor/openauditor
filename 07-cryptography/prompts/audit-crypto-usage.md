# Prompt: Audit Cryptographic Usage

## When to use this

Use this when inheriting a codebase, before a security audit, when A02 (Cryptographic Failures) is flagged, or anytime you suspect insecure cryptography is in use.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer auditing cryptographic usage. Identify all cryptographic operations in the codebase, check them against approved algorithms, and fix any vulnerabilities.

**Step 1: Inventory all cryptographic operations**

```bash
# Find password hashing
grep -rn "bcrypt\|argon2\|scrypt\|pbkdf2\|MD5\|SHA1\|sha1\|sha256\|hash(" \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules

# Find encryption/decryption
grep -rn "createCipher\|createDecipher\|AES\|aes\|encrypt\|decrypt" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find random number generation
grep -rn "Math\.random\|crypto\.random\|randomBytes\|getRandomValues\|secrets\." \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules

# Find JWT operations
grep -rn "jwt\.\|jsonwebtoken\|\.sign(\|\.verify(\|\.decode(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find MAC/signature operations
grep -rn "createHmac\|hmac\|\.sign(\|timingSafeEqual\|===.*token\|token.*===" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find TLS configuration
grep -rn "rejectUnauthorized\|NODE_TLS_REJECT\|minVersion\|secureProtocol" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Python-specific
grep -rn "hashlib\|Fernet\|cryptography\.\|secrets\.\|random\." \
  --include="*.py" . | grep -v __pycache__
```

**Step 2: Audit password hashing**

For each password hash operation found:

```bash
# Check what's being used
grep -rn "bcrypt\|argon2\|MD5\|SHA\|hash" \
  --include="*.ts" --include="*.js" . | grep -v node_modules | grep -i "password\|passwd\|pwd"
```

- Is MD5 or SHA used directly for passwords? **→ Critical, fix immediately**
- Is bcrypt used with cost factor < 12? **→ High, increase cost factor**
- Is bcrypt used with cost factor ≥ 12? **→ Pass**
- Is Argon2id used? **→ Pass (preferred)**

Fix for insecure hashing:
```typescript
// REPLACE: any direct hash for passwords
// WITH: bcrypt cost ≥ 12 or Argon2id

import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(inputPassword, storedHash);

// If migrating from MD5/SHA:
// 1. On login: verify with old algorithm
// 2. If match: rehash with bcrypt, update stored hash
// 3. After 90 days: expire accounts still using old hashes (force reset)
```

**Step 3: Audit symmetric encryption**

```bash
grep -rn "createCipher\b\|createCipheriv\|AES\|aes-" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check each usage:
- `createCipher` (without IV) **→ Critical — uses ECB mode implicitly**
- `createCipheriv('aes-256-cbc', ...)` **→ High — CBC without MAC is malleable**
- `createCipheriv('aes-256-gcm', ...)` **→ Pass (if nonce isn't reused)**
- `libsodium.crypto_secretbox_easy` **→ Pass**

Verify GCM nonce uniqueness:
```bash
# Find GCM usage and check nonce generation
grep -rn "aes-256-gcm\|aes-128-gcm" --include="*.ts" --include="*.js" . | grep -v node_modules
# Near each match, verify: const iv = crypto.randomBytes(12)
# NOT: const iv = Buffer.alloc(12) or const iv = '000000000000'
```

**Step 4: Audit JWT configuration**

```bash
grep -rn "jwt\.verify\|jsonwebtoken" --include="*.ts" --include="*.js" . | grep -v node_modules
```

Check:
- Is `algorithms` array specified in `jwt.verify`? If not → vulnerable to `alg:none` attack
- Is HS256 used? **→ Acceptable for internal tokens**
- Is RS256 used? **→ Better for external/public tokens**
- Is the JWT secret stored in environment variables? **→ Required**
- What is the expiration (`expiresIn`)? **→ Should be ≤ 1 hour for access tokens**

Fix missing algorithm allowlist:
```typescript
// VULNERABLE — accepts alg:none
jwt.verify(token, secret);

// SECURE — explicit algorithm
jwt.verify(token, secret, { algorithms: ['HS256'] });

// SECURE — RSA (for tokens verified by external parties)
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

**Step 5: Audit random number generation**

```bash
grep -rn "Math\.random" --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each `Math.random()` found, determine its purpose:
- Used for security (tokens, session IDs, CSRF tokens, passwords, keys)? **→ Critical, replace**
- Used for UI (random colours, shuffling display items)? **→ Acceptable**

Fix:
```typescript
// REPLACE Math.random() in security contexts:
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex');         // 256-bit token
const resetCode = randomBytes(6).readUInt32BE() % 1000000; // 6-digit code

// Python equivalent:
import secrets
token = secrets.token_hex(32)
reset_code = secrets.randbelow(1000000)
```

**Step 6: Audit MAC and token comparisons**

```bash
# Find string comparisons that could be timing-vulnerable
grep -rn "===.*mac\|mac.*===\|===.*signature\|signature.*===\|===.*token\|token.*===" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Find HMAC usage
grep -rn "createHmac\|timingSafeEqual" --include="*.ts" --include="*.js" . | grep -v node_modules
```

Fix timing-vulnerable comparisons:
```typescript
// VULNERABLE — timing attack
if (providedMac === expectedMac) { ... }

// SECURE — constant-time comparison
import { timingSafeEqual } from 'crypto';
if (timingSafeEqual(Buffer.from(providedMac), Buffer.from(expectedMac))) { ... }
```

**Step 7: Audit TLS configuration**

```bash
grep -rn "rejectUnauthorized.*false\|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]0" \
  --include="*.ts" --include="*.js" --include="*.env*" . | grep -v node_modules

grep -rn "secureProtocol\|minVersion\|maxVersion" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

- `rejectUnauthorized: false` **→ Critical, remove immediately**
- `NODE_TLS_REJECT_UNAUTHORIZED=0` **→ Critical, remove immediately**
- `minVersion: 'TLSv1.0'` or `TLSv1.1` **→ High, upgrade to TLSv1.2**

**Step 8: Produce findings report**

| Category | File | Line | Issue | Severity | Fix Applied |
|----------|------|------|-------|----------|-------------|
| Password hashing | auth/login.ts | 45 | MD5 used | Critical | bcrypt cost=12 ✓ |
| Encryption | utils/encrypt.ts | 23 | AES-CBC no MAC | High | AES-256-GCM ✓ |
| JWT | middleware/auth.ts | 67 | No algorithm spec | High | algorithms:['HS256'] ✓ |
| Random | tokens/generate.ts | 12 | Math.random() | Critical | randomBytes(32) ✓ |
| TLS | api/client.ts | 89 | rejectUnauthorized:false | Critical | Removed ✓ |

Implement fixes for all Critical and High findings.

---

## What to expect

A complete cryptographic audit: all crypto operations inventoried, weak algorithms identified, timing attack vulnerabilities fixed, and an audit report with severity ratings for each finding.

## Learn more

[Never Roll Your Own Crypto](../never-roll-your-own.md)
[Key Rotation](../key-rotation.md)
[Implement Password Hashing](./implement-password-hashing.md)
[A02: Cryptographic Failures](../../02-owasp/web-top10/A02-crypto-failures.md)
