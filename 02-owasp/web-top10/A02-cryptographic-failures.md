# A02 — Cryptographic Failures

## Summary

Cryptographic failures (formerly "Sensitive Data Exposure") covers cases where sensitive data is inadequately protected in transit or at rest. The rename from 2017 to 2021 reflects a shift in focus: the root cause is not that data is exposed, it is that the cryptographic controls protecting it are absent, weak, or incorrectly implemented. This includes transmitting data over unencrypted HTTP, storing passwords using weak or reversible hashing algorithms, using deprecated cipher suites, failing to encrypt personally identifiable information (PII) in databases, and exposing cryptographic keys in source code or environment variables.

---

## What It Looks Like

### Transmitting sensitive data over HTTP

```javascript
// VULNERABLE: login form posting credentials over plain HTTP
// In your Next.js component:
const handleLogin = async (email, password) => {
  const res = await fetch("http://api.example.com/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};
```

### Storing passwords with a weak or reversible algorithm

```python
# VULNERABLE: SHA-1 is a fast hash — not suitable for passwords
import hashlib

def store_password(plain_text):
    hashed = hashlib.sha1(plain_text.encode()).hexdigest()
    db.execute("UPDATE users SET password = ? WHERE ...", (hashed,))
```

```javascript
// VULNERABLE: MD5 is broken and trivially reversible via rainbow tables
const crypto = require("crypto");
const hashed = crypto.createHash("md5").update(password).digest("hex");
```

### Sensitive data stored unencrypted in a database

```sql
-- VULNERABLE: PII stored in plaintext
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  national_insurance_number TEXT,  -- stored in clear
  date_of_birth DATE
);
```

### Hardcoded secret key

```javascript
// VULNERABLE: secret committed to source code
const JWT_SECRET = "my-super-secret-key-123";
const token = jwt.sign({ userId }, JWT_SECRET);
```

---

## The Fix

### Always use HTTPS; enforce it at the infrastructure level

```javascript
// next.config.js — redirect all HTTP to HTTPS
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://yourapp.com/:path*",
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
```

### Use bcrypt (or Argon2) for password storage

```python
# FIXED: bcrypt with a work factor of at least 12
import bcrypt

def store_password(plain_text: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_text.encode(), salt)
    return hashed.decode()

def verify_password(plain_text: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain_text.encode(), hashed.encode())
```

```javascript
// FIXED: bcrypt in Node.js
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
```

### Encrypt PII at the application layer

```python
# FIXED: encrypt sensitive fields using Fernet (AES-128-CBC + HMAC)
from cryptography.fernet import Fernet
import os

ENCRYPTION_KEY = os.environ["FIELD_ENCRYPTION_KEY"]  # 32-byte key, base64-encoded
fernet = Fernet(ENCRYPTION_KEY)

def encrypt_field(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def decrypt_field(value: str) -> str:
    return fernet.decrypt(value.encode()).decode()
```

### Load secrets from environment variables, never hardcode them

```javascript
// FIXED: secret loaded from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
```

> **Critical:** Never commit secrets to source control. Use a secrets manager (Doppler, Infisical, AWS Secrets Manager) or environment variables injected at deploy time. Rotate any key that has ever appeared in a commit, even briefly.

---

## Real-World Breach

**RockYou — 2009**
RockYou, a social gaming company, stored 32 million user passwords in plaintext in a MySQL database. A SQL injection attack in December 2009 exposed the entire database. Because passwords were unencrypted, the dump was immediately usable for credential-stuffing attacks across the entire internet. The RockYou wordlist derived from this breach is still the most widely used password cracking dictionary in security research today, 15 years later. The fix was trivially simple: bcrypt with a work factor of 10 would have rendered the dump useless.

---

## How to Test

### Check TLS configuration

```bash
# Test TLS certificate and cipher suite strength
docker run --rm drwetter/testssl.sh https://yourapp.com

# Or use nmap
nmap --script ssl-enum-ciphers -p 443 yourapp.com
```

### Check for HTTP Strict Transport Security header

```bash
curl -I https://yourapp.com | grep -i strict-transport
# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Check for passwords stored as weak hashes

```sql
-- If you have access to the database, check the format of stored hashes
SELECT password FROM users LIMIT 5;
-- bcrypt hashes start with $2b$
-- SHA-1 hashes are 40 hex characters
-- MD5 hashes are 32 hex characters
-- Plaintext is obvious
```

### Scan for secrets in source code

```bash
# Using gitleaks
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Using truffleHog
trufflehog git file://. --only-verified
```

---

## Checklist

- [ ] All traffic is served over HTTPS; HTTP redirects to HTTPS automatically
- [ ] HSTS header is set with `max-age` of at least 1 year
- [ ] Passwords are hashed with bcrypt, Argon2id, or scrypt — not MD5, SHA-1, or SHA-256
- [ ] No sensitive data (passwords, tokens, API keys) is stored in source code or version control
- [ ] PII fields (national insurance numbers, payment card data, health records) are encrypted at rest
- [ ] TLS certificates are valid, unexpired, and use TLS 1.2 or higher
- [ ] Cookies containing session data use `Secure` and `HttpOnly` flags
- [ ] Secrets are loaded from environment variables or a secrets manager, not hardcoded

---

## Why This Matters

Cryptographic failures are catastrophic and silent — you do not know the breach happened until attackers have already used the data. Exposed passwords lead to credential stuffing across every service your users use. Exposed PII triggers mandatory GDPR breach notifications within 72 hours, potential fines, and user churn. Payment card data exposure falls under PCI DSS, which carries financial penalties and loss of card processing rights. The RockYou breach, Adobe's 2013 breach (153 million passwords in weak encryption), and LinkedIn's 2012 breach (6.5 million SHA-1 hashed passwords) all share the same root cause: cryptography was treated as optional.

---

## Learn More

- [OWASP A02:2021 — Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OpenAuditor: Cryptography](../../07-cryptography/)
- [OpenAuditor: Secure Coding — Auth Best Practices](../../06-secure-coding/auth-best-practices.md)
