# Never Roll Your Own Crypto

> **30-second summary:** Implementing your own encryption, hashing, or key exchange is one of the most reliable ways to introduce critical vulnerabilities. Even experienced cryptographers routinely get it wrong. Use audited, battle-tested libraries and standard algorithms instead.

## Why Custom Crypto Always Fails

The problem is not that developers are incompetent. The problem is that cryptographic security requires avoiding dozens of non-obvious pitfalls simultaneously:

- **Timing attacks:** Your `==` comparison leaks timing information that reveals the secret
- **Padding oracles:** Incorrect padding handling allows decrypting arbitrary ciphertext
- **Nonce reuse:** Reusing a nonce in AES-GCM with the same key reveals the key
- **Weak IV generation:** Sequential IVs in CBC mode leak plaintext structure
- **Key derivation errors:** Deriving two keys from one secret incorrectly can expose both

Professional cryptographers have teams reviewing their implementations for months and still ship vulnerabilities. The correct answer is: **don't implement it yourself**.

## The Hall of Shame: Custom Crypto Gone Wrong

### Heartbleed (2014) — OpenSSL
OpenSSL, written by cryptography experts, had a buffer over-read that exposed 64KB of server memory per request — including private keys. The vulnerability was introduced by a well-intentioned developer implementing a feature. If experts at OpenSSL make this mistake, your custom implementation will too.

### Debian OpenSSL Weak Keys (2008)
A Debian developer removed what appeared to be a "dead" line of code in OpenSSL's random number seeder. The removed line was essential — it seeded the random number generator. For two years, all Debian-generated SSL keys were predictable from only 15 bits of entropy. Millions of keys had to be regenerated.

### The iMessage Cryptography Bug (2016)
Apple's iMessage used a custom CBC-mode encryption scheme. Researchers demonstrated a chosen-ciphertext attack that recovered message plaintext by sending 2^18 specially crafted messages. Apple had professional cryptographers review this. It still shipped with a critical flaw.

## What to Use Instead

### Password Hashing

```typescript
// ❌ NEVER — these are not password hashing functions
import crypto from 'crypto';
const bad1 = crypto.createHash('md5').update(password).digest('hex');
const bad2 = crypto.createHash('sha256').update(password).digest('hex');
const bad3 = crypto.createHash('sha256').update(password + salt).digest('hex');
// SHA-256, even with a salt, can be computed billions of times per second on GPUs

// ✅ CORRECT — bcrypt (intentionally slow, memory-hard)
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12); // cost factor 12
const valid = await bcrypt.compare(inputPassword, hash);

// ✅ BETTER — Argon2id (memory-hard, modern standard, recommended by OWASP)
import argon2 from 'argon2';
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
});
const valid = await argon2.verify(hash, inputPassword);
```

### Symmetric Encryption (at-rest data)

```typescript
// ❌ NEVER — ECB mode reveals patterns in identical plaintext blocks
import crypto from 'crypto';
const cipher = crypto.createCipher('aes-256-ecb', key); // BROKEN

// ❌ NEVER — CBC mode without authentication is vulnerable to padding oracle
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); // Malleable

// ✅ CORRECT — AES-256-GCM provides authenticated encryption
// (confidentiality + integrity in one)
function encrypt(plaintext: string, key: Buffer): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // GCM requires 12-byte IV — NEVER REUSE
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'), // Authentication tag — verify on decrypt
  };
}

function decrypt(ciphertext: string, iv: string, tag: string, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'base64')); // Fails if data was tampered with
  
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// Better yet: use a library like libsodium which handles all this correctly
import sodium from 'libsodium-wrappers';
await sodium.ready;

const key = sodium.crypto_secretbox_keygen();
const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
const encrypted = sodium.crypto_secretbox_easy(message, nonce, key);
const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
```

### Token Generation (CSRF, password reset, API keys)

```typescript
// ❌ NEVER — Math.random() is not cryptographically secure
const token = Math.random().toString(36).slice(2);
const token = Date.now().toString();
const token = `${userId}-${Date.now()}`;

// ✅ CORRECT — crypto.randomBytes()
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex'); // 64-char hex string, 256 bits of entropy

// For URL-safe tokens
const token = randomBytes(32).toString('base64url'); // base64 without +/= chars
```

### MAC / Signature (data integrity)

```typescript
// ❌ NEVER — this is vulnerable to hash length extension attacks
const signature = sha256(key + data);

// ✅ CORRECT — HMAC-SHA256 (standard MAC construction)
import { createHmac } from 'crypto';
const mac = createHmac('sha256', secretKey)
  .update(data)
  .digest('hex');

// ✅ CORRECT — Constant-time comparison to prevent timing attacks
import { timingSafeEqual } from 'crypto';
const isValid = timingSafeEqual(
  Buffer.from(expectedMac),
  Buffer.from(providedMac)
);
// NEVER use: expectedMac === providedMac  (timing attack)
```

### TLS / Transport Security

```typescript
// ❌ NEVER — disable certificate validation
const agent = new https.Agent({ rejectUnauthorized: false }); // CRITICAL VULNERABILITY
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Same — never do this in production

// ✅ CORRECT — default Node.js HTTPS (validates certificates)
const response = await fetch('https://api.example.com/data');

// For custom TLS options:
const agent = new https.Agent({
  rejectUnauthorized: true,  // Always true
  minVersion: 'TLSv1.2',    // Reject TLS 1.0 and 1.1
});
```

## Red Flags in Code Review

When reviewing code, flag these immediately:

```bash
# Find dangerous crypto patterns
grep -rn "createCipher\b" --include="*.ts" --include="*.js" . | grep -v node_modules
# createCipher (without 'iv') uses ECB mode — always a bug

grep -rn "MD5\|md5\|sha1\b\|SHA1" --include="*.ts" --include="*.js" . | grep -v node_modules
# MD5/SHA1 for passwords = critical vulnerability
# MD5/SHA1 for checksums = acceptable (not a security issue in this context)

grep -rn "Math\.random" --include="*.ts" --include="*.js" . | grep -v node_modules
# Check each usage — is it used for anything security-sensitive?

grep -rn "rejectUnauthorized.*false\|NODE_TLS_REJECT_UNAUTHORIZED" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
# Disabling TLS verification = man-in-the-middle vulnerability

grep -rn "===.*mac\|mac.*===\|===.*token\|token.*===" \
  --include="*.ts" --include="*.js" . | grep -v node_modules
# String comparison of secrets = timing attack vulnerability
# Should use timingSafeEqual
```

## Approved Cryptographic Algorithms

| Use Case | Approved | Forbidden |
|----------|----------|-----------|
| Password hashing | Argon2id, bcrypt (cost≥12), scrypt | MD5, SHA-1, SHA-256, SHA-512 (any direct hash) |
| Symmetric encryption | AES-256-GCM, ChaCha20-Poly1305 | DES, 3DES, AES-CBC without MAC, AES-ECB |
| Asymmetric encryption | RSA-OAEP-SHA256 (≥2048-bit), ECDH P-256 | RSA PKCS#1 v1.5 (padding oracle), RSA < 2048-bit |
| Digital signatures | Ed25519, ECDSA P-256, RSA-PSS | RSA PKCS#1 v1.5 signatures, DSA |
| Key derivation | HKDF, PBKDF2 (≥600k iterations) | Truncated hash, XOR with key |
| Random tokens | crypto.randomBytes(), crypto.getRandomValues() | Math.random(), Date.now() |
| MAC | HMAC-SHA256, HMAC-SHA3 | Plain hash + secret prefix/suffix |
| TLS | TLS 1.2+, TLS 1.3 | SSL, TLS 1.0, TLS 1.1 |

## Learn More

- [Key Rotation](./key-rotation.md)
- [Audit Crypto Usage](./prompts/audit-crypto-usage.md)
- [Implement Password Hashing](./prompts/implement-password-hashing.md)
- [A02: Cryptographic Failures](../02-owasp/web-top10/A02-crypto-failures.md)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
