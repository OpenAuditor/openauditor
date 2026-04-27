# Cryptography for Developers

Cryptography is the foundation of application security. It protects passwords, secures data in transit and at rest, verifies identity, and ensures data integrity. Despite its importance, cryptography is one of the most frequently misimplemented areas in software development.

This section covers practical cryptography for developers — not the mathematics, but the correct libraries, configurations, and patterns you need to write secure code.

---

## Why Cryptography Matters

Every major breach involving stolen credentials traces back to one of two failures:

1. **Weak or missing password hashing** — storing plaintext passwords, or using fast hashing algorithms like MD5 or SHA-1.
2. **Broken or home-grown encryption** — implementing custom ciphers, misusing standard algorithms, or neglecting authenticated encryption.

### Real-World Consequences

| Breach | Year | Failure | Impact |
|--------|------|---------|--------|
| LinkedIn | 2012 | Unsalted SHA-1 password hashes | 117 million accounts cracked |
| Ashley Madison | 2015 | MD5 password hashes | 11 million passwords cracked in days |
| Adobe | 2013 | ECB-mode 3DES encryption (not hashing) | 153 million records exposed |
| RockYou | 2009 | Plaintext password storage | 32 million passwords leaked |
| Dropbox | 2012 | Unsalted SHA-1 (some SHA-256) | 68 million hashes leaked |

---

## Contents of This Section

### Core Topics

| File | What It Covers |
|------|----------------|
| [password-hashing.md](./password-hashing.md) | bcrypt, Argon2, PBKDF2 — correct configuration and implementation |
| [encryption-basics.md](./encryption-basics.md) | AES-256-GCM, RSA, when to use symmetric vs asymmetric |
| [secure-random-tokens.md](./secure-random-tokens.md) | Cryptographically secure token generation; why `Math.random()` is dangerous |
| [key-rotation.md](./key-rotation.md) | How and when to rotate keys without downtime |
| [never-roll-your-own.md](./never-roll-your-own.md) | Why custom cryptography always fails, and approved alternatives |

### Agent Prompts

| Prompt | Purpose |
|--------|---------|
| [prompts/audit-crypto-usage.md](./prompts/audit-crypto-usage.md) | Audit a codebase for cryptographic weaknesses |
| [prompts/implement-password-hashing.md](./prompts/implement-password-hashing.md) | Implement password hashing correctly from scratch |

---

## The Golden Rules

> **Critical:** Never implement your own cryptographic algorithm. The probability of a custom implementation being secure is effectively zero.

1. **Use approved algorithms only** — AES-256-GCM for symmetric encryption, RSA-4096 or Ed25519 for asymmetric, Argon2id for password hashing.
2. **Never reuse IVs or nonces** — a single reuse can completely break encryption.
3. **Always use authenticated encryption** — unauthenticated encryption allows tampering.
4. **Use a CSPRNG** — cryptographically secure pseudo-random number generator for all security-sensitive values.
5. **Keep keys out of source code** — use environment variables, secrets managers, or key management services.
6. **Hash passwords, don't encrypt them** — encryption is reversible; hashing (with bcrypt/Argon2) is one-way.

---

## Choosing the Right Tool

```
Do you need to store a password and verify it later?
  → Use Argon2id (or bcrypt if Argon2 is unavailable)

Do you need to encrypt data you'll decrypt later?
  → Use AES-256-GCM (symmetric) or RSA (asymmetric, small data only)

Do you need a secure random token (session ID, API key, reset token)?
  → Use crypto.randomBytes (Node.js) or secrets.token_hex (Python)

Do you need to verify a message hasn't been tampered with?
  → Use HMAC-SHA256 (or use authenticated encryption like AES-GCM)

Do you need to sign data (prove it came from you)?
  → Use RSA-PSS or Ed25519 digital signatures
```

---

## Approved Libraries

### Node.js / JavaScript

| Purpose | Library | Install |
|---------|---------|---------|
| Password hashing | `bcryptjs` or `argon2` | `npm install bcryptjs` / `npm install argon2` |
| General crypto | Built-in `crypto` module | (built-in) |
| TLS/HTTPS | Built-in `https` / `tls` | (built-in) |
| JWT signing | `jsonwebtoken` | `npm install jsonwebtoken` |
| Encryption utilities | `node-forge` | `npm install node-forge` |

### Python

| Purpose | Library | Install |
|---------|---------|---------|
| Password hashing | `passlib` with `argon2-cffi` | `pip install passlib[argon2]` |
| Symmetric encryption | `cryptography` | `pip install cryptography` |
| TLS | Built-in `ssl` | (built-in) |
| JWT signing | `PyJWT` | `pip install PyJWT` |
| Secrets | Built-in `secrets` | (built-in) |

---

## Further Reading

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST SP 800-63B — Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Cryptopals Challenges](https://cryptopals.com/) — Learn by breaking bad crypto
