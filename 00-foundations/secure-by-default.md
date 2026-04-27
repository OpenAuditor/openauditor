# Secure by Default: Principles That Prevent Most Attacks

In 30 seconds: Stop thinking "how do I add security?" and start thinking "how do I remove security failures?" Use defaults that are safe (HTTPS, not HTTP), validate *everything*, give users the least access they need, and assume attackers will find ways in. If you follow 10 principles here, you'll prevent the vast majority of common vulnerabilities.

## The mindset shift

Most developers think of security as something added after the fact: "Let's encrypt the password field." But this is backwards.

**Secure by default means:**
- The safe choice is the default choice
- Developers have to *try* to do something insecure
- Unsafe operations require explicit opt-in and documentation

Example: If your framework defaults to parameterized queries and string interpolation requires special flags to enable, developers won't accidentally create SQL injection bugs.

## The 10 principles

### 1. Validate everything, always

**Never trust the client.** Every piece of data from a user, browser, API, or external system should be validated.

**This means:**
- Check that fields are the right type (string, not int where int expected)
- Check that strings are the right length (not 10 MB when expecting 100 chars)
- Check that values are in expected ranges (not negative when positive required)
- Use allowlists, not blocklists (allow specific chars, not deny specific chars)

**Example: Vulnerable**
```python
# Frontend sends { age: "somedata" }
def process_age(age):
    if age > 0:  # Only checks if positive
        save_to_db(age)  # But age could be a string, SQL injection vector, etc.
```

**Example: Secure**
```python
def process_age(age):
    try:
        age_int = int(age)
        if age_int < 0 or age_int > 150:
            raise ValueError("Invalid age")
        save_to_db(age_int)  # Type-checked and range-checked
    except (ValueError, TypeError):
        return error("Invalid age format")
```

**Why it matters:** Most injection attacks (SQL, command, path traversal) work because input validation is missing or weak.

---

### 2. Use parameterized queries, always

Never build SQL by string concatenation.

**Example: Vulnerable**
```python
# NEVER do this
user_input = request.args.get("name")
query = f"SELECT * FROM users WHERE name = '{user_input}'"  # SQL injection!
```

**Example: Secure**
```python
# Use parameterized queries
cursor.execute("SELECT * FROM users WHERE name = %s", (user_input,))
```

**Why it matters:** String concatenation is how SQL injection happens, and SQL injection leads to data theft.

---

### 3. Assume the network is untrusted—encrypt in transit

Every piece of data in flight should be encrypted.

**This means:**
- HTTPS everywhere (not HTTP)
- HSTS headers (force HTTPS)
- TLS 1.2 or higher
- Certificate pinning for mobile apps talking to your API
- VPN or TLS for service-to-service communication

**Example: Secure**
```
# In your web server config (nginx example)
server {
    listen 443 ssl http2;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**Why it matters:** Without encryption, anyone on the network (coffee shop WiFi, ISP, attackers) can read and modify data.

---

### 4. Encrypt sensitive data at rest

Data on disk should be encrypted.

**This means:**
- Database encryption (AWS RDS encryption, Google Cloud SQL encryption)
- Disk encryption (BitLocker, FileVault, dm-crypt)
- PII fields encrypted (credit cards, SSNs, medical records)
- Backups encrypted
- API keys and secrets encrypted in your config store

**Example: Encrypted field**
```python
# Use a library like cryptography
from cryptography.fernet import Fernet

encryption_key = os.getenv("ENCRYPTION_KEY")
cipher = Fernet(encryption_key)

def save_ssn(ssn):
    encrypted = cipher.encrypt(ssn.encode())
    db.save(encrypted)

def get_ssn(user_id):
    encrypted = db.get(user_id)
    return cipher.decrypt(encrypted).decode()
```

**Why it matters:** If your database is stolen, encrypted data is useless to the attacker (if the key isn't also stolen).

---

### 5. Enforce authentication and authorization everywhere

**Authentication** = Are you who you say you are?  
**Authorization** = Are you allowed to do what you're asking?

**This means:**
- Every endpoint checks authentication (not just some)
- Every action checks authorization (not just some)
- Authorization checks happen server-side, never client-side
- Checks can't be bypassed by modifying client code or requests

**Example: Vulnerable**
```python
# This endpoint only checks if user is logged in
@app.route("/api/posts/<post_id>")
def get_post(post_id):
    if not current_user:
        return error("Not logged in")
    post = db.get_post(post_id)
    return json(post)  # But didn't check if user owns the post!
```

**Example: Secure**
```python
@app.route("/api/posts/<post_id>")
def get_post(post_id):
    if not current_user:
        return error("Not logged in")
    post = db.get_post(post_id)
    if post.owner_id != current_user.id:
        return error("Unauthorized", 403)  # Server-side check
    return json(post)
```

**Why it matters:** Broken access control is the #1 vulnerability on OWASP Top 10. Attackers use it to read data they shouldn't, modify other users' data, or escalate privileges.

---

### 6. Use defense in depth—don't rely on one control

If one security measure fails, others catch the attack.

**Example: Multi-factor defense against account takeover**
1. Strong password requirements (90% of attacks stop here)
2. Rate limiting on login attempts (slows brute force)
3. CAPTCHA after N failed attempts (stops bots)
4. Unusual login notifications (alerts you to compromise)
5. Optional MFA (your last line of defense)

If you only have #5, you're relying on users enabling it (most don't). If you have all five, you're protected even if one fails.

**Example: Defense against SQL injection**
1. Parameterized queries (prevents it entirely)
2. Input validation (catches malformed input)
3. Least-privilege database user (limits damage if #1 fails)
4. Database monitoring (alerts you to suspicious queries)

**Why it matters:** No single control is perfect. Attackers are creative; defense in depth means they have to find multiple ways through.

---

### 7. Never trust client-side security

Anything a user can see or modify in their browser can't be a security control.

**Example: Vulnerable**
```html
<!-- Client: checking if user is admin -->
<script>
  if (user.isAdmin) {
    show_admin_panel();
  }
</script>

<!-- Attacker opens browser console and runs: -->
user.isAdmin = true; // Boom, admin access
```

**Example: Secure**
```python
# Server checks before returning admin panel
@app.route("/admin")
def admin_panel():
    if not is_admin(current_user):
        return error("Unauthorized", 403)
    return render_admin_panel()
```

**Why it matters:** Every security decision must be made server-side, where the attacker can't intercept or modify it.

---

### 8. Minimize what you store; delete what you don't need

The data you don't have can't be stolen.

**This means:**
- Only collect PII you actually need
- Delete old data (implement retention policies)
- Don't log sensitive values (passwords, tokens, card numbers)
- Archive old data off-system if needed for compliance

**Example: Good data retention**
```python
# Delete old logs after 90 days
def cleanup_old_logs():
    cutoff = datetime.now() - timedelta(days=90)
    logs.delete_where(timestamp < cutoff)

# Delete old user records (GDPR "right to be forgotten")
def delete_user_data(user_id):
    posts.delete_where(user_id == user_id)
    user_sessions.delete_where(user_id == user_id)
    users.delete(user_id)
```

**Why it matters:** The best attack is one that finds nothing. Less data = lower breach impact.

---

### 9. Use strong, salted password hashing

Never store plaintext passwords. Use modern hashing algorithms.

**Example: Vulnerable**
```python
# NEVER do this
password_hash = hashlib.sha1(password)  # No salt, old algorithm
```

**Example: Secure**
```python
# Use bcrypt or argon2
import bcrypt

password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
db.save(password_hash)

# To verify:
if bcrypt.checkpw(password.encode(), stored_hash):
    login_user()
```

**Why it matters:** If your password database is stolen, strong hashing makes the passwords worthless to the attacker (it would take years to crack each one). Weak hashing (SHA1, MD5) can be cracked in seconds.

---

### 10. Log security events and alert on anomalies

You can't respond to attacks you don't detect.

**Log these:**
- Login attempts (successful and failed)
- Changes to sensitive data (who changed what when)
- Admin actions
- Unusual access patterns (user from new IP, data exports, etc.)
- Authentication failures after successful login (possible token theft)

**Example: Security logging**
```python
import logging

security_logger = logging.getLogger("security")

def login(username, password):
    user = find_user(username)
    if not user or not verify_password(password, user.hash):
        security_logger.warning(f"Failed login: {username} from {request.remote_addr}")
        return error("Invalid credentials")
    
    security_logger.info(f"Login: {username} from {request.remote_addr}")
    return create_session(user)

def update_payment_method(user_id, new_card):
    security_logger.info(f"Payment method changed: user={user_id}")
    # ... save card ...
```

**Alert on:**
- 5+ failed logins in 5 minutes (brute force attempt)
- Login from unexpected geographic location (account compromise)
- Large data exports (insider threat or exfiltration)
- Admin actions at odd hours (may indicate compromise)

**Why it matters:** Breaches often go undetected for months. Good logging means you catch attacks before serious damage.

---

## Secure by default in your framework

### Node.js/Express
```javascript
// Use helmet for security headers
const helmet = require('helmet');
app.use(helmet());

// Use rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### Python/Django
```python
# Django has many defaults right
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Next.js
```javascript
// Use next-safe for security headers
import { csp } from 'next-safe/headers';

export const contentSecurityPolicy = csp({
  'default-src': "'self'",
  'script-src': "'self'",
});
```

## The OWASP Top 10 (what these principles prevent)

Following these 10 principles prevents most of the OWASP Top 10:

1. **Broken Access Control** — Prevented by #5 (enforce auth/authz everywhere)
2. **Cryptographic Failures** — Prevented by #3, #4 (encrypt in transit and at rest)
3. **Injection** — Prevented by #1, #2 (validate everything; use parameterized queries)
4. **Insecure Design** — Prevented by #6 (defense in depth)
5. **Security Misconfiguration** — Prevented by all 10 (systematic approach)
6. **Vulnerable Components** — Keep dependencies updated
7. **Auth Failures** — Prevented by #5 (strong authentication)
8. **Data Integrity Issues** — Prevented by #4 (encrypt at rest)
9. **Logging Failures** — Prevented by #10 (log security events)
10. **SSRF** — Prevented by #1 (validate everything)

## Why this matters

Companies that follow these 10 principles have dramatically fewer vulnerabilities. They ship faster because they don't have to rework auth, database queries, or encryption schemes. They sleep better knowing their systems are built to be secure.

The cost of following these principles is low. The cost of not following them is millions.

## What comes next

- **[Threat Modeling 101](./threat-modeling-101.md)** — Use these principles to design threat-resistant systems
- **[Risk Appetite Framework](./risk-appetite-framework.md)** — Decide which risks are acceptable
- **01-architecture/** — Design patterns that bake these principles in
- **02-code/** — Implementation patterns for your specific framework

---

**Related:**
- [Why Security Matters](./why-security-matters.md)
- [Threat Modeling 101](./threat-modeling-101.md)
- [Glossary](./glossary.md) (look up: encryption, hashing, parameterized query, HTTPS, authentication, authorization)
