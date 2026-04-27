# Secure Random Token Generation

Session IDs, API keys, password reset tokens, CSRF tokens, and OAuth state parameters all depend on randomness for their security. If that randomness is predictable, attackers can forge tokens, hijack sessions, or reset accounts without authorisation.

---

## The Core Problem: `Math.random()` Is Not Secure

`Math.random()` and similar pseudo-random number generators (PRNGs) are designed for simulation, games, and statistical sampling — not security. They produce deterministic output seeded from a small state, meaning:

1. The internal state can often be recovered by observing a handful of outputs.
2. Once the state is known, all past and future outputs can be predicted.
3. The entropy is far too low for security-sensitive values.

### Demonstration: Predicting Math.random()

```javascript
// An attacker who observes a few Math.random() outputs can predict future ones.
// Multiple academic papers and tools (e.g. "untwist" for V8's Mersenne Twister)
// demonstrate full state recovery from ~50-100 values.

// This is what an attacker sees:
const leaked = Array.from({ length: 5 }, () => Math.random());
// Given these values, the V8 XorShift128+ state can be fully recovered,
// and all subsequent (and many prior) values can be predicted.

// NEVER use this for:
const badSessionId = Math.random().toString(36).slice(2);        // Predictable
const badToken = Math.floor(Math.random() * 1e16).toString();    // Predictable
const badApiKey = btoa(Math.random() + Math.random());           // Predictable
```

> **Critical:** Never use `Math.random()`, `rand()`, `random.random()`, or any general-purpose PRNG for security-sensitive values. Use a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG).

---

## Cryptographically Secure Alternatives

A CSPRNG draws entropy from the operating system's randomness pool (`/dev/urandom` on Linux/macOS, `BCryptGenRandom` on Windows), which collects entropy from hardware events, hardware RNGs (RDRAND/RDSEED on modern CPUs), and other unpredictable sources.

### Node.js — `crypto.randomBytes`

```javascript
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);

// Raw bytes as hex string (most common for tokens)
const token = crypto.randomBytes(32).toString('hex');
// => '7f3a9b2c1e4d5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1'
// 32 bytes = 256 bits of entropy, 64 hex characters

// Base64url-encoded (URL-safe, shorter than hex)
const tokenB64 = crypto.randomBytes(32).toString('base64url');
// => 'fzqbLh5NX2qLnA0eL6S1xm3X6JoLHC0-T1prvI2e8PE'
// 32 bytes = ~43 base64url characters

// Async version (preferred in production to avoid blocking)
async function generateToken(bytes = 32) {
  const buf = await randomBytes(bytes);
  return buf.toString('hex');
}

// Numeric PIN (e.g. 6-digit OTP)
function generateNumericPin(digits = 6) {
  // Use modulo bias mitigation for strict uniformity
  const max = Math.pow(10, digits);
  let value;
  do {
    value = crypto.randomBytes(4).readUInt32BE(0);
  } while (value >= Math.floor(0xFFFFFFFF / max) * max); // Reject biased values
  return (value % max).toString().padStart(digits, '0');
}

// Session IDs, reset tokens, CSRF tokens
const sessionId = crypto.randomBytes(32).toString('base64url');
const resetToken = crypto.randomBytes(32).toString('hex');
const csrfToken = crypto.randomBytes(24).toString('base64url');
const apiKey = crypto.randomBytes(32).toString('hex');
```

### Node.js — `crypto.randomUUID`

```javascript
const crypto = require('crypto');

// UUID v4 — 122 bits of randomness
const uuid = crypto.randomUUID();
// => '550e8400-e29b-41d4-a716-446655440000'

// Suitable for: record IDs, idempotency keys, correlation IDs
// Note: UUID format includes hyphens and version bits, reducing entropy slightly
// Use randomBytes(32) when maximum entropy is needed
```

### Python — `secrets` Module

The `secrets` module was added in Python 3.6 specifically to replace `random` for security-sensitive operations.

```python
import secrets

# Hex token — 32 bytes = 64 hex characters
token = secrets.token_hex(32)
# => '7f3a9b2c1e4d5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1'

# URL-safe base64 token
token_url = secrets.token_urlsafe(32)
# => 'fzqbLh5NX2qLnA0eL6S1xm3X6JoLHC0-T1prvI2e8PE'

# Raw bytes
token_bytes = secrets.token_bytes(32)

# Choosing token length
# 16 bytes (32 hex chars) = 128-bit entropy — minimum for session tokens
# 32 bytes (64 hex chars) = 256-bit entropy — recommended
# 64 bytes (128 hex chars) = 512-bit entropy — long-lived API keys

# Password reset token
reset_token = secrets.token_urlsafe(32)

# API key with prefix (improves debuggability and secret scanning)
api_key = f"sk_{secrets.token_urlsafe(32)}"
# => 'sk_fzqbLh5NX2qLnA0eL6S1xm3X6JoLHC0-T1prvI2e8PE'

# Random integer in range (for OTPs)
otp = secrets.randbelow(1_000_000)   # 0 to 999999
otp_str = str(otp).zfill(6)

# Choosing from an alphabet
import string
alphabet = string.ascii_letters + string.digits
password = ''.join(secrets.choice(alphabet) for _ in range(24))
```

---

## UUID Versions

| Version | Generation | Entropy | Security Use |
|---------|-----------|---------|-------------|
| v1 | Timestamp + MAC address | Low | Never for security — leaks timing and network identity |
| v3 | MD5 hash of namespace+name | Deterministic | Never for security tokens |
| v4 | Random | 122 bits | Acceptable for IDs; use `randomBytes` for tokens |
| v5 | SHA-1 hash of namespace+name | Deterministic | Never for security tokens |
| v7 | Unix timestamp + random | ~74 bits random | Database IDs (sortable) — not for secrets |

```javascript
// Node.js built-in UUID v4 — adequate for record IDs
const { randomUUID } = require('crypto');
const id = randomUUID(); // => '110e8400-e29b-41d4-a716-446655440000'

// npm uuid package for more control
// npm install uuid
const { v4: uuidv4 } = require('uuid');
const id2 = uuidv4();
```

```python
import uuid

# UUID v4 in Python
record_id = str(uuid.uuid4())
# => '550e8400-e29b-41d4-a716-446655440000'

# For security tokens, prefer secrets.token_urlsafe over UUID
# UUID v4 has 122 bits of entropy vs 256 bits from secrets.token_urlsafe(32)
```

> **Note:** UUID v4 is acceptable for database primary keys and correlation IDs. For password reset tokens, session IDs, API keys, and other security credentials, use `crypto.randomBytes` (Node.js) or `secrets.token_urlsafe` (Python) for maximum entropy.

---

## Token Length and Entropy Guide

| Use Case | Recommended | Entropy | Why |
|----------|-------------|---------|-----|
| Session ID | 32 bytes hex | 256 bits | Resist brute-force over session lifetime |
| Password reset token | 32 bytes hex | 256 bits | Short-lived but high value target |
| CSRF token | 16–24 bytes | 128–192 bits | Per-request, short validity |
| API key | 32 bytes hex | 256 bits | Long-lived, high privilege |
| OAuth state param | 16 bytes | 128 bits | Short-lived, prevents CSRF |
| Email verification | 32 bytes hex | 256 bits | Single use, high value |
| OTP (numeric) | 6 digits (TOTP) | ~20 bits | Rate-limiting and time window compensate |

---

## Timing-Safe Token Comparison

Comparing tokens with standard string equality (`===`, `==`) can leak timing information. Always use constant-time comparison.

```javascript
// WRONG — returns early on first mismatch (timing leak)
if (userToken === storedToken) { ... }

// CORRECT — Node.js
const crypto = require('crypto');
function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run the comparison to avoid length timing leak
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
```

```python
import hmac

# WRONG
if user_token == stored_token:
    ...

# CORRECT — Python
if hmac.compare_digest(user_token.encode(), stored_token.encode()):
    ...
```

---

## API Key Design Best Practices

Well-designed API keys are easier to audit, rotate, and detect when accidentally leaked.

```javascript
// Good API key format: prefix + random bytes
// The prefix helps secret scanning tools identify leaked keys automatically
// (GitHub, GitLab, and many security tools scan for patterns like 'sk_live_', 'ghp_', etc.)

const crypto = require('crypto');

function generateApiKey(prefix = 'sk') {
  const random = crypto.randomBytes(32).toString('base64url');
  return `${prefix}_${random}`;
  // => 'sk_fzqbLh5NX2qLnA0eL6S1xm3X6JoLHC0-T1prvI2e8PE'
}

// Never store the raw API key — store a hash of it
async function storeApiKey() {
  const apiKey = generateApiKey('sk_live');
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  // Show the full key to the user once
  console.log(`Your API key: ${apiKey}`);
  console.log('Store this safely — it will not be shown again.');
  
  // Store only the hash in the database
  await db.insert({ key_hash: hash, prefix: apiKey.slice(0, 10) + '...' });
  
  return apiKey; // Return to user once, then discard
}
```

---

## Comparison Summary

| Method | CSPRNG? | Safe for Tokens? | Notes |
|--------|---------|-----------------|-------|
| `Math.random()` | No | Never | Predictable internal state |
| `Date.now()` | No | Never | Sequential, trivially guessable |
| `crypto.randomBytes()` | Yes | Yes | Recommended for Node.js |
| `crypto.randomUUID()` | Yes | For IDs | 122-bit entropy; prefer randomBytes for secrets |
| `secrets.token_hex()` | Yes | Yes | Recommended for Python |
| `secrets.token_urlsafe()` | Yes | Yes | URL-safe variant |
| `uuid.uuid4()` | Yes | For IDs | 122-bit entropy; prefer secrets for secrets |
| `random.random()` (Python) | No | Never | Mersenne Twister — not cryptographically secure |
| `os.urandom()` | Yes | Yes | Direct OS entropy — fine to use |

---

## Further Reading

- [Node.js crypto.randomBytes documentation](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
- [Python secrets module documentation](https://docs.python.org/3/library/secrets.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Exploiting Math.random() (V8)](https://security.stackexchange.com/questions/84906/predicting-math-random-numbers)
