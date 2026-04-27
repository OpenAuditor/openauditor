# A08: Software and Data Integrity Failures

**New entry — OWASP Web Top 10 2021**

This category covers failures to verify the integrity of software updates, critical data, and CI/CD pipelines. It includes insecure deserialisation (formerly its own category) and supply chain attacks.

---

## 30-Second Summary

Integrity failures happen when code or data is used without verifying it hasn't been tampered with. The most devastating modern form is supply chain attacks — malicious code injected into a dependency, build pipeline, or auto-update mechanism. Insecure deserialisation is the classic form: accepting serialised objects from users and deserialising them server-side without validation.

**Real breach:** The 2020 SolarWinds attack injected malicious code into a build pipeline, distributing a backdoor to 18,000 organisations including the US Treasury. The code was signed with a legitimate certificate. Build pipeline integrity is not theoretical.

---

## Attack Scenarios

### 1. Insecure Deserialisation

```javascript
// VULNERABLE — deserialising user-controlled data
app.post('/restore-cart', (req, res) => {
  const cart = deserialize(req.body.cartData); // user controls this
  // Attackers can craft objects that execute code on deserialisation
  res.json(cart);
});

// PHP unserialize() — Classic RCE vector
// $cart = unserialize($_COOKIE['cart']); // NEVER

// Python pickle — same problem
// import pickle
// cart = pickle.loads(request.data) # NEVER with user data

// SECURE — use JSON (no code execution on parse)
app.post('/restore-cart', (req, res) => {
  try {
    const cart = JSON.parse(req.body.cartData); // JSON only, no magic methods
    // Validate the structure
    const validCart = CartSchema.parse(cart); // Zod validation
    res.json(validCart);
  } catch {
    res.status(400).json({ error: 'Invalid cart data' });
  }
});
```

### 2. Unsigned Packages / Auto-Update Without Verification

```bash
# VULNERABLE — curl | bash with no verification
curl https://example.com/install.sh | bash

# VULNERABLE — npm install from untrusted source
npm install some-package@latest --ignore-scripts=false

# SECURE — verify checksums for downloaded files
curl -O https://releases.example.com/app-v2.0.0.tar.gz
curl -O https://releases.example.com/app-v2.0.0.tar.gz.sha256

sha256sum --check app-v2.0.0.tar.gz.sha256

# SECURE — pin package versions with lockfiles
# Never use ^ or ~ for critical security dependencies in package.json
{
  "dependencies": {
    "jsonwebtoken": "9.0.2",  // exact version, no caret
    "bcrypt": "5.1.1"
  }
}
```

### 3. Compromised CI/CD Pipeline

```yaml
# VULNERABLE — using unpinned action versions
- uses: actions/checkout@v4        # Could be updated to malicious version
- uses: some-org/some-action@main  # 'main' can be changed at any time

# SECURE — pin to commit SHA (immutable)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2

# Add GitHub's built-in security scanning
- name: Run CodeQL
  uses: github/codeql-action/analyze@c7f9125735019aa87cfc361530512d50ea439c71 # v3
```

### 4. Dependency Confusion / Typosquatting

```bash
# VULNERABLE — no lockfile integrity check
npm install # installs whatever versions resolve today

# SECURE — use lockfile and verify integrity
npm ci # uses package-lock.json exactly, fails if it doesn't match

# Audit for typosquatting — check names carefully
# lodash vs Iodash (capital I looks like l)
# express vs expres (missing s)
# react vs reeact

# SECURE — use npm audit
npm audit
npm audit --audit-level=high # fail CI on high+ severity

# SECURE — Dependabot config
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
```

---

## Subresource Integrity (SRI)

When loading external scripts or stylesheets, always use SRI to ensure the file hasn't been tampered with:

```html
<!-- VULNERABLE — no integrity check, CDN can serve malicious code -->
<script src="https://cdn.example.com/jquery-3.7.1.min.js"></script>

<!-- SECURE — SRI hash ensures the file is exactly what you expect -->
<script 
  src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"
  integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
  crossorigin="anonymous"
></script>

<!-- Generate SRI hash -->
<!-- openssl dgst -sha256 -binary < file.js | openssl base64 -A -->
```

Next.js — avoid external CDN scripts where possible. Use npm packages instead:

```javascript
// next.config.js — add Content Security Policy
const cspHeader = `
  script-src 'self' 'nonce-${nonce}' https://trusted-cdn.com;
  require-trusted-types-for 'script';
`;
```

---

## JWT Algorithm Confusion

```javascript
// VULNERABLE — accepting 'none' algorithm or trusting header
const decoded = jwt.decode(token, { complete: true });
const algorithm = decoded.header.alg; // attacker controls this!
jwt.verify(token, secret, { algorithms: [algorithm] }); // never do this

// VULNERABLE — algorithm confusion attack (RS256 → HS256)
// If server accepts HS256, attacker can sign with public key as HMAC secret

// SECURE — always specify allowed algorithms explicitly
jwt.verify(token, process.env.JWT_SECRET, { 
  algorithms: ['HS256'], // only accept what you issue
});

// SECURE — for RS256, use the public key (not the private key) for verification
jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
  algorithms: ['RS256'],
});
```

---

## Build Pipeline Security

```yaml
# .github/workflows/security.yml
name: Build Integrity

on: [push, pull_request]

jobs:
  integrity:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      
      - name: Verify lockfile integrity
        run: npm ci --ignore-scripts
      
      - name: Run dependency audit
        run: npm audit --audit-level=high
      
      - name: Check for known vulnerable packages
        uses: snyk/actions/node@b98d498629f1c5e001b02839e95fe3a63eba4c42
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@713efdd345f3035192eaa63f56867b88e63e4e5d
        with:
          config: p/security-audit
```

---

## Secure Object Handling (Python)

```python
# VULNERABLE — pickle with user data
import pickle
import base64

@app.route('/restore', methods=['POST'])
def restore():
    data = base64.b64decode(request.data)
    obj = pickle.loads(data)  # RCE vulnerability
    return jsonify(obj)

# SECURE — use JSON with schema validation
from pydantic import BaseModel
import json

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

@app.route('/restore', methods=['POST'])
def restore():
    data = request.get_json()
    try:
        items = [CartItem(**item) for item in data['items']]
        return jsonify([item.dict() for item in items])
    except Exception:
        return jsonify({'error': 'Invalid cart data'}), 400
```

---

## Audit Checklist

- [ ] No `pickle`, `marshal`, Java's `ObjectInputStream`, or PHP `unserialize()` used on user-controlled data
- [ ] All external scripts loaded with SRI hashes
- [ ] `npm ci` used in CI (not `npm install`)
- [ ] `npm audit` runs in CI with failure on high/critical
- [ ] GitHub Actions pinned to commit SHAs
- [ ] Package versions pinned (no `^` or `~` in lockfile-critical deps)
- [ ] JWT algorithms explicitly allowlisted
- [ ] Dependabot or Renovate configured for dependency updates
- [ ] `--ignore-scripts` flag used for untrusted package installs
- [ ] Build artifacts signed or checksummed

---

## Learn More

- [Supply Chain Security](../../05-supply-chain-security/README.md)
- [CVE Awareness](../../04-cve-awareness/README.md)
- [OWASP A06: Vulnerable Components](./A06-vulnerable-components.md)
- [Secure GitHub Actions](../../09-deployment-security/secure-github-actions.md)
