# Password Hashing

Password hashing is one of the most critical and most frequently misimplemented security controls in application development. This guide explains why standard hashing algorithms like SHA-256 are wrong for passwords, which algorithms to use, and how to configure them correctly.

---

## Why Passwords Are Different

Regular cryptographic hash functions (SHA-256, SHA-512, MD5) are designed to be **fast**. That is exactly what you do not want for passwords.

An attacker with a leaked password database can test billions of password guesses per second against fast hashes using commodity hardware:

| Algorithm | Hashes per second (single RTX 4090 GPU) |
|-----------|------------------------------------------|
| MD5 | ~164 billion/s |
| SHA-1 | ~63 billion/s |
| SHA-256 | ~23 billion/s |
| bcrypt (cost 10) | ~184,000/s |
| Argon2id (tuned) | ~1,000/s |

The LinkedIn breach (2012) involved 117 million unsalted SHA-1 hashes. The majority were cracked within days of the database being leaked. A proper password hashing algorithm would have made that attack economically infeasible.

---

## The Right Algorithms

### Recommendation Order

1. **Argon2id** — Winner of the Password Hashing Competition (2015). Recommended by OWASP and NIST. Resistant to both GPU and side-channel attacks.
2. **bcrypt** — Proven algorithm, widely supported. Use if Argon2 is unavailable.
3. **PBKDF2** — Acceptable when FIPS compliance is required. Less memory-hard than the above.
4. **scrypt** — Strong but harder to tune safely than Argon2id.

> **Critical:** Never use MD5, SHA-1, SHA-256, or any general-purpose hash function directly for password storage. They are not designed for this purpose and will be cracked rapidly.

---

## Argon2id

Argon2id is the recommended algorithm. It has three parameters:

| Parameter | Purpose | OWASP Minimum | Recommended |
|-----------|---------|---------------|-------------|
| `memoryCost` | RAM used (KiB) | 19 MiB (19456) | 64 MiB (65536) |
| `timeCost` | Iterations | 2 | 3 |
| `parallelism` | Threads | 1 | 4 |

### Node.js — Argon2id

```bash
npm install argon2
```

```javascript
const argon2 = require('argon2');

// Hashing a password
async function hashPassword(plaintext) {
  const hash = await argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MiB
    timeCost: 3,
    parallelism: 4,
  });
  return hash; // Stores algorithm, params, salt, and hash in one string
}

// Verifying a password
async function verifyPassword(hash, plaintext) {
  try {
    return await argon2.verify(hash, plaintext);
  } catch (err) {
    // Invalid hash format or other error
    return false;
  }
}

// Usage
const hash = await hashPassword('correct horse battery staple');
// => '$argon2id$v=19$m=65536,t=3,p=4$...'

const isValid = await verifyPassword(hash, 'correct horse battery staple');
// => true
```

### Python — Argon2id (passlib)

```bash
pip install passlib[argon2]
# or
pip install argon2-cffi
```

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

# Configure Argon2id with secure parameters
ph = PasswordHasher(
    time_cost=3,          # Number of iterations
    memory_cost=65536,    # 64 MiB in KiB
    parallelism=4,        # Parallel threads
    hash_len=32,          # Output length in bytes
    salt_len=16,          # Salt length in bytes
)

def hash_password(plaintext: str) -> str:
    return ph.hash(plaintext)

def verify_password(hashed: str, plaintext: str) -> bool:
    try:
        ph.verify(hashed, plaintext)
        # Check if hash needs rehashing (e.g. after parameter upgrade)
        if ph.check_needs_rehash(hashed):
            return True  # Signal caller to update stored hash
        return True
    except VerifyMismatchError:
        return False
    except InvalidHashError:
        return False

# Usage
hashed = hash_password('correct horse battery staple')
# => '$argon2id$v=19$m=65536,t=3,p=4$...'

is_valid = verify_password(hashed, 'correct horse battery staple')
# => True
```

---

## bcrypt

bcrypt is a mature, battle-tested algorithm that is acceptable when Argon2 is unavailable. Its key parameter is the **work factor** (also called cost factor).

### Understanding the Work Factor

The work factor is an exponent: bcrypt performs `2^N` iterations of its internal function. Each increment doubles the computation time.

| Work Factor | Approx. Time (modern server) | Recommendation |
|-------------|------------------------------|----------------|
| 10 | ~100ms | Minimum acceptable |
| 12 | ~400ms | Recommended default |
| 14 | ~1.6s | High-security contexts |
| 6 | ~1ms | Never use in production |

> **Critical:** The work factor must be tuned to your hardware. Target 200–500ms per hash on production hardware. Benchmark with `bcrypt.getRounds()` and time your operations. Increase the factor annually as hardware improves.

bcrypt also has a **72-byte input limit**. Passwords longer than 72 characters are silently truncated. If you need to support longer passphrases, pre-hash with SHA-256 before passing to bcrypt (see below).

### Node.js — bcrypt

```bash
npm install bcryptjs
# Note: Use bcryptjs (pure JS) rather than bcrypt (native) for portability.
# Use bcrypt (native) only if you need maximum performance.
```

```javascript
const bcrypt = require('bcryptjs');

const WORK_FACTOR = 12; // Tune this for your hardware

// Hashing a password
async function hashPassword(plaintext) {
  // Protect against >72 byte truncation vulnerability
  if (Buffer.byteLength(plaintext, 'utf8') > 72) {
    const crypto = require('crypto');
    plaintext = crypto
      .createHash('sha256')
      .update(plaintext)
      .digest('hex'); // 64 chars, safely within 72 bytes
  }
  return bcrypt.hash(plaintext, WORK_FACTOR);
}

// Verifying a password — MUST use bcrypt.compare, NOT string comparison
async function verifyPassword(plaintext, hash) {
  if (Buffer.byteLength(plaintext, 'utf8') > 72) {
    const crypto = require('crypto');
    plaintext = crypto
      .createHash('sha256')
      .update(plaintext)
      .digest('hex');
  }
  // bcrypt.compare is timing-safe — always use it, never ===
  return bcrypt.compare(plaintext, hash);
}

// Benchmark work factor on your hardware
function benchmarkWorkFactor() {
  const start = Date.now();
  bcrypt.hashSync('benchmark', 12);
  const elapsed = Date.now() - start;
  console.log(`Work factor 12: ${elapsed}ms`);
}
```

### Python — bcrypt (passlib)

```bash
pip install passlib[bcrypt]
```

```python
from passlib.context import CryptContext

# CryptContext manages algorithm selection and upgrades
pwd_context = CryptContext(
    schemes=['bcrypt'],
    deprecated='auto',        # Auto-upgrade old hashes on next login
    bcrypt__rounds=12,        # Work factor — tune for your hardware
)

def hash_password(plaintext: str) -> str:
    return pwd_context.hash(plaintext)

def verify_password(plaintext: str, hashed: str) -> tuple[bool, bool]:
    """
    Returns (is_valid, needs_rehash).
    If needs_rehash is True, update the stored hash.
    """
    is_valid, new_hash = pwd_context.verify_and_update(plaintext, hashed)
    needs_rehash = new_hash is not None
    return is_valid, needs_rehash

# Usage
hashed = hash_password('my-secure-password')
is_valid, needs_rehash = verify_password('my-secure-password', hashed)

if is_valid and needs_rehash:
    # Store the new hash — user's password stays the same, params upgraded
    store_new_hash(new_hash)
```

---

## PBKDF2

Use PBKDF2 only when FIPS 140-2 compliance is required, as it is less memory-hard than Argon2 or bcrypt.

### OWASP Recommended Parameters

| Hash Function | Minimum Iterations |
|---------------|--------------------|
| PBKDF2-HMAC-SHA256 | 600,000 |
| PBKDF2-HMAC-SHA512 | 210,000 |
| PBKDF2-HMAC-SHA1 | 1,300,000 |

### Node.js — PBKDF2

```javascript
const crypto = require('crypto');
const { promisify } = require('util');
const pbkdf2 = promisify(crypto.pbkdf2);
const randomBytes = promisify(crypto.randomBytes);

const ITERATIONS = 600000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

async function hashPassword(plaintext) {
  const salt = await randomBytes(32);
  const key = await pbkdf2(plaintext, salt, ITERATIONS, KEY_LEN, DIGEST);
  // Store algorithm:iterations:salt:hash together
  return `pbkdf2:${ITERATIONS}:${salt.toString('hex')}:${key.toString('hex')}`;
}

async function verifyPassword(plaintext, storedHash) {
  const [, iterations, saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const key = await pbkdf2(plaintext, salt, parseInt(iterations), KEY_LEN, DIGEST);
  // Timing-safe comparison
  return crypto.timingSafeEqual(key, Buffer.from(hashHex, 'hex'));
}
```

---

## Timing Attack Prevention

> **Critical:** Never compare password hashes with `===` or any standard string comparison. These return early on the first non-matching character, leaking timing information that can allow an attacker to determine whether a guess was close.

Always use:

- **Node.js**: `crypto.timingSafeEqual(a, b)` or bcrypt/argon2's built-in `verify` methods.
- **Python**: `hmac.compare_digest(a, b)` or passlib's `verify` methods.
- **Go**: `subtle.ConstantTimeCompare(a, b)`.
- **Java**: `MessageDigest.isEqual(a, b)`.

```javascript
// WRONG — vulnerable to timing attack
if (userHash === storedHash) { ... }

// CORRECT — constant-time comparison
const crypto = require('crypto');
if (crypto.timingSafeEqual(
  Buffer.from(userHash),
  Buffer.from(storedHash)
)) { ... }
```

```python
import hmac

# WRONG
if user_hash == stored_hash:
    ...

# CORRECT
if hmac.compare_digest(user_hash, stored_hash):
    ...
```

---

## Salting

All modern password hashing libraries (bcrypt, argon2, passlib) handle salting automatically. The salt is stored alongside the hash in the output string. Do not implement salting manually.

> **Critical:** Never use a global salt (sometimes called a "pepper" applied without per-user salts). Without per-user salts, an attacker can test one password guess against every hash simultaneously. bcrypt and Argon2 generate a unique random salt for every hash automatically.

---

## Re-hashing on Login (Algorithm Upgrades)

When you upgrade your hashing algorithm or work factor, you cannot retroactively rehash stored passwords — you don't know the plaintext. The correct approach:

1. On successful login, check if the stored hash uses the current parameters.
2. If not, hash the plaintext with the new parameters and update the stored hash.
3. Old hashes are migrated transparently as users log in.

```javascript
// Node.js — rehash on login if work factor has changed
const CURRENT_WORK_FACTOR = 12;

async function login(plaintext, storedHash) {
  const isValid = await bcrypt.compare(plaintext, storedHash);
  if (!isValid) return { success: false };

  const currentRounds = bcrypt.getRounds(storedHash);
  if (currentRounds < CURRENT_WORK_FACTOR) {
    const newHash = await bcrypt.hash(plaintext, CURRENT_WORK_FACTOR);
    await db.updatePasswordHash(userId, newHash);
  }

  return { success: true };
}
```

---

## Common Mistakes

| Mistake | Risk | Fix |
|---------|------|-----|
| MD5 or SHA-1 for passwords | Cracked in seconds | Use Argon2id or bcrypt |
| No salt | Rainbow table attacks | Let the library handle salts |
| Global/shared salt | Same as no salt | Per-user salts (automatic in Argon2/bcrypt) |
| Low work factor (bcrypt < 10) | Brute force feasible | Use work factor 12+ |
| String comparison of hashes | Timing attack | Use `timingSafeEqual` |
| Encrypting passwords | Reversible if key leaked | Hash, never encrypt |
| Storing plaintext | Immediate compromise | Always hash |

---

## Further Reading

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST SP 800-63B Section 5.1.1 — Memorised Secrets](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Argon2 Reference Implementation](https://github.com/P-H-C/phc-winner-argon2)
- [Password Hashing Competition](https://www.password-hashing.net/)
