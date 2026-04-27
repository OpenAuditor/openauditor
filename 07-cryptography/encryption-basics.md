# Encryption Basics

Encryption protects data confidentiality — it makes data unreadable without the correct key. This guide covers the two main categories of encryption, when to use each, and how to implement them correctly.

---

## Symmetric vs Asymmetric Encryption

| Property | Symmetric | Asymmetric |
|----------|-----------|------------|
| Keys | One shared secret key | Public key + private key pair |
| Speed | Very fast | 100–1000x slower |
| Key distribution | Requires secure key exchange | Public key can be shared openly |
| Data size limits | None (stream/block modes) | Small data only (e.g. < 446 bytes for RSA-4096) |
| Common algorithms | AES-256 | RSA, ECDH, Ed25519 |
| Typical use | Bulk data encryption | Key exchange, digital signatures |

**The standard pattern for encrypting large data with asymmetric keys is hybrid encryption:** generate a random symmetric key, encrypt the data with AES, then encrypt the symmetric key with the recipient's public RSA key. TLS uses exactly this approach.

---

## AES-256-GCM — The Right Choice for Symmetric Encryption

AES (Advanced Encryption Standard) with a 256-bit key in GCM (Galois/Counter Mode) is the recommended symmetric encryption algorithm.

### Why GCM?

GCM is an **authenticated encryption** mode. It provides:
- **Confidentiality** — data is encrypted
- **Integrity** — any tampering is detected
- **Authenticity** — the authentication tag proves the ciphertext was produced by someone with the key

> **Critical:** Never use AES in ECB (Electronic Codebook) mode. ECB encrypts each block independently, so identical plaintext blocks produce identical ciphertext blocks. This leaks structural information. The famous Adobe breach involved ECB-mode 3DES, allowing researchers to deduce passwords from the ciphertexts.

| Mode | Authenticated | Parallelisable | Notes |
|------|--------------|----------------|-------|
| ECB | No | Yes | Never use — leaks patterns |
| CBC | No | Decrypt only | Vulnerable to padding oracle attacks |
| CTR | No | Yes | No authentication — data can be tampered |
| GCM | Yes | Yes | **Recommended** |
| CCM | Yes | No | Use for constrained environments |
| ChaCha20-Poly1305 | Yes | Yes | Good alternative, especially on mobile |

### The IV/Nonce

GCM requires an **Initialisation Vector (IV)**, also called a nonce (number used once). Rules:

- **Must be unique for every encryption operation with the same key.** Never reuse an IV.
- **Must be randomly generated** (not a counter, not derived from message content).
- **Standard length is 96 bits (12 bytes).**
- The IV is not secret — it is stored or transmitted alongside the ciphertext.

> **Critical:** Reusing a nonce with GCM is catastrophic. With a single reused nonce, an attacker can recover the authentication key and decrypt all messages encrypted with that key. Always generate a fresh random IV for every encryption operation.

---

## AES-256-GCM in Node.js

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;   // 256 bits
const IV_LENGTH = 12;    // 96 bits — recommended for GCM
const TAG_LENGTH = 16;   // 128-bit authentication tag

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns a buffer containing: IV (12 bytes) + Auth Tag (16 bytes) + Ciphertext
 */
function encrypt(plaintext, key) {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Store: IV + AuthTag + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Expects input in the format produced by encrypt().
 */
function decrypt(encryptedBuffer, key) {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes`);
  }

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(), // Throws if authentication tag is invalid
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    // Authentication failed — data was tampered or key is wrong
    throw new Error('Decryption failed: authentication tag mismatch');
  }
}

// Generating a secure key
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

// Example usage
const key = generateKey();
const ciphertext = encrypt('Sensitive data here', key);
const plaintext = decrypt(ciphertext, key);
console.log(plaintext); // => 'Sensitive data here'
```

### Storing Keys

```javascript
// Keys should come from environment variables or a KMS, never hardcoded
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
// ENCRYPTION_KEY should be a 64-character hex string (32 bytes)

// Generate a key and print it (run once, store in secrets manager)
// node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'))"
```

---

## AES-256-GCM in Python

```bash
pip install cryptography
```

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_LENGTH = 32   # 256 bits
IV_LENGTH = 12    # 96 bits — recommended for GCM

def generate_key() -> bytes:
    """Generate a cryptographically secure 256-bit AES key."""
    return os.urandom(KEY_LENGTH)

def encrypt(plaintext: str, key: bytes) -> bytes:
    """
    Encrypt plaintext with AES-256-GCM.
    Returns: nonce (12 bytes) + ciphertext+tag (variable length)
    The AESGCM class appends the 16-byte auth tag to the ciphertext automatically.
    """
    if len(key) != KEY_LENGTH:
        raise ValueError(f"Key must be {KEY_LENGTH} bytes ({KEY_LENGTH * 8} bits)")

    aesgcm = AESGCM(key)
    nonce = os.urandom(IV_LENGTH)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    return nonce + ciphertext  # Prepend nonce for storage/transmission

def decrypt(data: bytes, key: bytes) -> str:
    """
    Decrypt AES-256-GCM ciphertext.
    Expects input in the format produced by encrypt().
    Raises cryptography.exceptions.InvalidTag if authentication fails.
    """
    if len(key) != KEY_LENGTH:
        raise ValueError(f"Key must be {KEY_LENGTH} bytes")

    nonce = data[:IV_LENGTH]
    ciphertext = data[IV_LENGTH:]

    aesgcm = AESGCM(key)
    # Raises InvalidTag exception if tampered
    plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext_bytes.decode('utf-8')

# Example usage
key = generate_key()
encrypted = encrypt('Sensitive data here', key)
plaintext = decrypt(encrypted, key)
print(plaintext)  # => 'Sensitive data here'

# With additional authenticated data (AAD)
# AAD is authenticated but not encrypted (e.g. record ID, metadata)
def encrypt_with_aad(plaintext: str, key: bytes, aad: bytes) -> bytes:
    aesgcm = AESGCM(key)
    nonce = os.urandom(IV_LENGTH)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), aad)
    return nonce + ciphertext

def decrypt_with_aad(data: bytes, key: bytes, aad: bytes) -> str:
    nonce = data[:IV_LENGTH]
    ciphertext = data[IV_LENGTH:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, aad).decode('utf-8')
```

---

## RSA — Asymmetric Encryption

RSA is used for key exchange, digital signatures, and encrypting small payloads. Use RSA-4096 for new systems; RSA-2048 is acceptable if 4096 introduces unacceptable latency.

> **Critical:** Never use RSA with PKCS#1 v1.5 padding (also known as PKCS1Padding). It is vulnerable to padding oracle attacks (Bleichenbacher's attack). Always use OAEP padding for encryption, or PSS padding for signatures.

| Use Case | Correct Padding |
|----------|----------------|
| Encryption | OAEP with SHA-256 |
| Digital signatures | PSS with SHA-256 |
| Avoid | PKCS#1 v1.5 (legacy, vulnerable) |

### RSA in Node.js

```javascript
const crypto = require('crypto');

// Generate RSA key pair (do this once; store securely)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Encrypt with public key (OAEP padding)
function rsaEncrypt(plaintext, publicKeyPem) {
  return crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(plaintext, 'utf8')
  );
}

// Decrypt with private key
function rsaDecrypt(ciphertext, privateKeyPem) {
  return crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    ciphertext
  ).toString('utf8');
}

// Sign data
function rsaSign(data, privateKeyPem) {
  return crypto.sign('sha256', Buffer.from(data), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
}

// Verify signature
function rsaVerify(data, signature, publicKeyPem) {
  return crypto.verify('sha256', Buffer.from(data), {
    key: publicKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }, signature);
}
```

---

## Hybrid Encryption Pattern

For encrypting data larger than RSA can handle, use hybrid encryption:

```javascript
const crypto = require('crypto');

async function hybridEncrypt(plaintext, recipientPublicKey) {
  // 1. Generate a random AES key
  const aesKey = crypto.randomBytes(32);

  // 2. Encrypt the data with AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encryptedData = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 3. Encrypt the AES key with RSA-OAEP
  const encryptedKey = crypto.publicEncrypt(
    { key: recipientPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );

  return {
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encryptedData.toString('base64'),
  };
}
```

---

## Elliptic Curve Cryptography (ECC)

ECC provides equivalent security to RSA with much shorter keys, making it ideal for performance-sensitive applications.

| Algorithm | Key Size | Equivalent RSA | Use Case |
|-----------|----------|----------------|----------|
| P-256 (secp256r1) | 256-bit | RSA-3072 | ECDH key exchange, ECDSA signatures |
| P-384 | 384-bit | RSA-7680 | High-security environments |
| X25519 | 255-bit | RSA-3072 | Diffie-Hellman key exchange |
| Ed25519 | 255-bit | RSA-3072 | Digital signatures (preferred) |

Ed25519 is the recommended algorithm for digital signatures in new systems — it is fast, secure, and immune to several classes of implementation mistakes that affect ECDSA.

---

## What NOT to Do

| Practice | Risk | Alternative |
|----------|------|-------------|
| AES-ECB mode | Reveals data patterns | AES-GCM |
| Reusing IV/nonce | Catastrophic key recovery | Generate fresh random IV every time |
| RSA PKCS#1v1.5 padding | Padding oracle attack | RSA-OAEP |
| Hardcoding keys | Instant compromise if code is leaked | Environment variables / KMS |
| No authentication | Data tampering undetected | AES-GCM, ChaCha20-Poly1305 |
| DES or 3DES | Computationally broken / weak | AES-256 |
| RC4 | Biased output, cryptanalytically broken | ChaCha20-Poly1305 |
| MD5 for integrity | Collisions are trivially computed | HMAC-SHA256 or authenticated encryption |

---

## Further Reading

- [NIST SP 800-175B — Guideline for Using Cryptographic Standards](https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Serious Cryptography by Jean-Philippe Aumasson](https://nostarch.com/seriouscrypto) — Practical reference
- [Node.js crypto documentation](https://nodejs.org/api/crypto.html)
- [Python cryptography library documentation](https://cryptography.io/en/latest/)
