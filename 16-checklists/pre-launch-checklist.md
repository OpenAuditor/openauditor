# Pre-Launch Security Checklist

**50+ comprehensive security items for production deployment**

Complete this checklist 1-2 weeks before launch. Assign items to team members and track completion. Estimated time: 4-6 hours per team.

---

## 1. Authentication & Access Control (8 items)

### Must-Do
- [ ] All user passwords require minimum 12 characters with complexity (uppercase, lowercase, number, symbol)
- [ ] Failed login attempts locked after 5 attempts within 15 minutes
- [ ] Session tokens expire after configurable timeout (default 24h for users, 1h for admins)
- [ ] Admin/privileged accounts use separate authentication system from regular users
- [ ] Multi-factor authentication (MFA) available for sensitive operations or roles

**Why this matters**: Credential compromise accounts for 43% of breaches. Okta (2023) was breached partly due to weak MFA on support systems.

### Should-Do
- [ ] Single sign-on (SSO) integrated if handling multiple services
- [ ] Password reset flow sends one-time-use tokens (not permanent links)
- [ ] User session revocation implemented (logout actually terminates session)

---

## 2. Cryptography & Secrets (8 items)

### Must-Do
- [ ] All network traffic uses HTTPS/TLS 1.2 or higher (verify with SSL Labs)
- [ ] Database passwords stored in environment variables, never in code
- [ ] Passwords hashed with bcrypt, Argon2, or PBKDF2 (10+ rounds/iterations)
- [ ] No API keys, tokens, or secrets in git history
- [ ] `.env`, `.env.local`, and similar files in `.gitignore`
- [ ] Sensitive data encrypted at rest in database (field-level encryption for PII)

**How to check credentials in git:**
```bash
# Scan git history
git log -p --all -S "password\|secret\|api_key" | head -50

# Alternative: Use dedicated tool
pip install detect-secrets
detect-secrets scan --baseline .secrets.baseline
```

### Should-Do
- [ ] Encryption keys rotated every 90 days
- [ ] Backup encryption keys stored separately from primary keys

**Why this matters**: 41% of breaches involve data theft. Proper encryption makes stolen data useless.

---

## 3. Input Validation & Injection Prevention (7 items)

### Must-Do
- [ ] All user input validated on server-side (never trust client-side validation)
- [ ] SQL injection prevention: parameterized queries used everywhere
- [ ] Command injection prevention: never pass user input to shell commands
- [ ] File upload validation: whitelist file types, enforce max size (e.g., 10MB)
- [ ] JSON/XML parsing: disabled XXE (external entity) processing

**SQL injection example - WRONG:**
```python
query = f"SELECT * FROM users WHERE email = '{email}'"  # VULNERABLE
```

**SQL injection example - CORRECT:**
```python
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (email,))  # Safe: parameter binding
```

### Should-Do
- [ ] Whitelist approach for input (accept known-good, reject everything else)
- [ ] Regular expression validation with length limits

---

## 4. Output Encoding & XSS Prevention (5 items)

### Must-Do
- [ ] All user input escaped when rendered in HTML (use templating engine escaping)
- [ ] JSON responses use proper Content-Type header
- [ ] CSP (Content Security Policy) header configured
- [ ] No inline JavaScript (all JS in external files, no `<script>` tags in HTML)
- [ ] DOM manipulation uses `.textContent` instead of `.innerHTML` for user data

**XSS example - WRONG:**
```html
<!-- User input: <img src=x onerror=alert('hacked')> -->
<p>Welcome, <%= user_comment %></p>  <!-- VULNERABLE if not escaped -->
```

**XSS example - CORRECT:**
```html
<!-- Template engine auto-escapes by default -->
<p>Welcome, {{ user_comment }}</p>  <!-- Safe in most frameworks -->
```

**Content Security Policy example:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com; img-src *
```

---

## 5. Cross-Site Request Forgery (CSRF) Prevention (3 items)

### Must-Do
- [ ] CSRF tokens generated and validated on all state-changing requests (POST, PUT, DELETE)
- [ ] SameSite cookie attribute set (SameSite=Strict or SameSite=Lax)
- [ ] Verify `Origin` and `Referer` headers on sensitive operations

**CSRF token example:**
```html
<form method="POST" action="/transfer-money">
  <input type="hidden" name="csrf_token" value="<%= token %>">
  <input type="text" name="amount">
  <button type="submit">Transfer</button>
</form>
```

---

## 6. Authentication Headers & CORS (4 items)

### Must-Do
- [ ] CORS configured to allow only trusted domains (whitelist approach, not `*`)
- [ ] `X-Frame-Options: DENY` header set (prevent clickjacking)
- [ ] `X-Content-Type-Options: nosniff` header set (prevent MIME type sniffing)
- [ ] `Strict-Transport-Security` (HSTS) header set with preload flag

**CORS example - WRONG:**
```javascript
res.header("Access-Control-Allow-Origin", "*");  // VULNERABLE: allows any origin
```

**CORS example - CORRECT:**
```javascript
const allowedOrigins = ["https://example.com", "https://app.example.com"];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.header("Access-Control-Allow-Origin", origin);
}
```

---

## 7. Dependency Management (6 items)

### Must-Do
- [ ] All dependencies from official package repositories (npm, PyPI, Maven, etc.)
- [ ] Dependency audit tool configured in CI/CD pipeline
- [ ] All critical/high severity vulnerabilities patched before launch
- [ ] No abandoned or unmaintained dependencies
- [ ] Dependency versions pinned or using semantic versioning constraints
- [ ] Supply chain risk: verify package maintainers are legitimate

**Dependency audit commands:**
```bash
# Node.js
npm audit --production
npm audit fix  # Auto-fix fixable vulnerabilities

# Python
pip audit
poetry check  # If using Poetry

# Ruby
bundle audit check --update

# Java/Maven
mvn dependency-check:check
```

**Why this matters**: Equifax (2017) was breached by a known vulnerability in Apache Struts that was 2 months old and patched.

---

## 8. Secrets Management (5 items)

### Must-Do
- [ ] All secrets stored in secure secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Production secrets never logged or printed in debug output
- [ ] Secret rotation schedule documented and automated if possible
- [ ] Access to secrets requires authentication and is logged
- [ ] Separate credentials for dev/staging/production (never reuse production credentials)

**Secrets to secure:**
- Database connection strings
- API keys for third-party services
- Private encryption keys
- OAuth tokens
- SSH keys
- Webhook signing secrets

### Should-Do
- [ ] Secrets Manager access logs monitored for unusual access patterns
- [ ] Backup of encrypted secrets stored offline

---

## 9. Error Handling & Information Disclosure (4 items)

### Must-Do
- [ ] Production error messages don't expose system details (stack traces, file paths, database structure)
- [ ] User-friendly error messages shown to clients, detailed errors logged server-side
- [ ] 404 pages don't reveal information about valid/invalid endpoints
- [ ] No sensitive data in error responses (e.g., don't return user IDs in error messages)

**Error handling example - WRONG:**
```python
@app.route('/api/user/<user_id>')
def get_user(user_id):
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")  # Stack trace if fails
    return user
```

**Error handling example - CORRECT:**
```python
@app.route('/api/user/<user_id>')
def get_user(user_id):
    try:
        user = db.query("SELECT * FROM users WHERE id = %s", (user_id,))
        if not user:
            return {"error": "User not found"}, 404
        return user, 200
    except Exception as e:
        logger.error(f"Database query failed: {e}")  # Log details
        return {"error": "Internal error"}, 500  # Generic response
```

---

## 10. Data Protection & Privacy (6 items)

### Must-Do
- [ ] Data classification completed (public, internal, confidential, restricted)
- [ ] PII (personally identifiable information) encrypted at rest and in transit
- [ ] Data retention policy documented (when to delete old data)
- [ ] Right to deletion (GDPR/CCPA) implemented where applicable
- [ ] Privacy policy published and accessible to users
- [ ] Data processing agreements (DPAs) signed with third-party vendors

**Data classification example:**
| Classification | Examples | Protection |
|---|---|---|
| Public | Product names, public docs | None |
| Internal | Employee directory | Encrypted, restricted access |
| Confidential | User passwords, API keys | Encrypted, MFA access |
| Restricted | Credit cards, medical data | Field-level encryption, audit log |

### Should-Do
- [ ] Data anonymization techniques applied where possible
- [ ] PII logging disabled in production

---

## 11. Access Control & Authorization (6 items)

### Must-Do
- [ ] Role-based access control (RBAC) implemented (Admin, Moderator, User, etc.)
- [ ] Principle of least privilege enforced (users have minimum necessary permissions)
- [ ] Authorization checked on every endpoint (not just login page)
- [ ] Admin functions require separate authentication/additional verification
- [ ] API rate limiting enforced (e.g., 1000 requests/hour per user)
- [ ] Inactive sessions automatically terminated (e.g., after 30 minutes)

**Authorization check example - WRONG:**
```python
@app.route('/api/user/<user_id>/delete')
def delete_user(user_id):
    db.delete_user(user_id)  # No permission check!
    return "User deleted"
```

**Authorization check example - CORRECT:**
```python
@app.route('/api/user/<user_id>/delete')
@require_auth
def delete_user(user_id):
    current_user = get_current_user()
    if current_user.id != user_id and not current_user.is_admin:
        return {"error": "Unauthorized"}, 403
    db.delete_user(user_id)
    return "User deleted", 200
```

---

## 12. Database Security (5 items)

### Must-Do
- [ ] Database access restricted to application servers only (no public internet access)
- [ ] Database credentials never stored in code or git
- [ ] Least privilege database users (separate users for read, write, admin)
- [ ] Automated backups configured and tested monthly
- [ ] Database queries use parameterized statements (prevent SQL injection)

**Database setup example:**
```sql
-- Create read-only user for application
CREATE USER app_user@'10.0.0.0/8' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE ON mydb.* TO app_user@'10.0.0.0/8';

-- Separate backup user
CREATE USER backup_user@localhost IDENTIFIED BY 'strong_password';
GRANT SELECT ON mydb.* TO backup_user@localhost;

-- Disable root remote access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
```

### Should-Do
- [ ] Database encryption enabled (Transparent Data Encryption, BitLocker, etc.)
- [ ] Audit logging enabled on database to track queries and schema changes

---

## 13. Infrastructure & Cloud Configuration (7 items)

### Must-Do
- [ ] Firewall rules implemented (inbound restricted to required ports only)
- [ ] Cloud storage buckets have public access disabled by default
- [ ] IAM roles use least privilege (verify permissions on AWS/GCP/Azure)
- [ ] Load balancer configured with health checks
- [ ] DDoS protection enabled (via CDN like Cloudflare or cloud provider)
- [ ] Disaster recovery plan documented (RTO, RPO targets)
- [ ] Production infrastructure isolated from development/staging

**Cloud storage security example - WRONG:**
```bash
# AWS S3 bucket publicly readable
aws s3 cp secret.txt s3://my-bucket/ --acl public-read  # VULNERABLE
```

**Cloud storage security example - CORRECT:**
```bash
# AWS S3 bucket private (default)
aws s3 cp secret.txt s3://my-bucket/
# Or explicitly:
aws s3api put-object-acl --bucket my-bucket --key secret.txt --acl private
```

### Should-Do
- [ ] Infrastructure as Code (IaC) used (Terraform, CloudFormation, etc.)
- [ ] Automated infrastructure security scanning in CI/CD

---

## 14. Logging & Monitoring (7 items)

### Must-Do
- [ ] Centralized logging configured (ELK, DataDog, Splunk, CloudWatch, etc.)
- [ ] Application logs include: timestamp, user ID, action, result, IP address
- [ ] Failed login attempts logged and monitored for anomalies
- [ ] Security-relevant events logged: permission changes, data access, configuration changes
- [ ] Logs retained for minimum 90 days (or per compliance requirements)
- [ ] Real-time alerts configured for critical events (deployment, failed auth, errors)
- [ ] Log access restricted (only authorized personnel can view logs)

**What to log:**
- ✅ Failed authentication attempts
- ✅ Permission denied errors
- ✅ Admin actions (user creation, permission changes, configuration updates)
- ✅ Data access and exports
- ✅ API key generation and rotation
- ❌ Passwords, API keys, credit cards
- ❌ Debug output or stack traces in production

### Should-Do
- [ ] Log aggregation tool configured with full-text search capability
- [ ] Log monitoring rules configured for common attack patterns

---

## 15. API Security (5 items)

### Must-Do
- [ ] All API endpoints require authentication
- [ ] API versioning implemented (v1, v2) to support backward compatibility
- [ ] API responses include security headers (X-Content-Type-Options, X-Frame-Options)
- [ ] Webhook signatures verified (HMAC validation)
- [ ] API rate limiting enforced per API key/user

**Webhook verification example:**
```python
import hmac
import hashlib

def verify_webhook(request):
    signature = request.headers.get('X-Signature')
    payload = request.body
    secret = os.environ['WEBHOOK_SECRET']
    
    expected_sig = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_sig):
        return False
    return True
```

### Should-Do
- [ ] GraphQL endpoints have query complexity limits (prevent denial-of-service)
- [ ] API documentation doesn't expose sensitive endpoints or internal details

---

## 16. Testing & Vulnerability Assessment (6 items)

### Must-Do
- [ ] Static Application Security Testing (SAST) tool configured in CI/CD
- [ ] Dependency scanning tool configured (for known vulnerabilities)
- [ ] Dynamic Application Security Testing (DAST) / security testing performed
- [ ] Penetration test scheduled (pre-launch or within 90 days of launch)
- [ ] Security regression tests written (to prevent re-introduction of known vulns)
- [ ] Code review process requires security review for sensitive changes

**SAST tools to consider:**
- SonarQube (free community edition available)
- Semgrep (free tier)
- CodeQL (free for public repos)
- Snyk (free tier with limits)

### Should-Do
- [ ] Bug bounty program launched (BugCrowd, HackerOne)
- [ ] Security testing automated in pipeline

---

## 17. Incident Response & Business Continuity (5 items)

### Must-Do
- [ ] Incident response plan documented and reviewed
- [ ] Key contacts identified (security lead, ops, legal, executive)
- [ ] Backup and disaster recovery procedures documented and tested
- [ ] Recovery Time Objective (RTO) and Recovery Point Objective (RPO) defined
- [ ] Incident response runbook created with escalation procedures

**Incident response team (example):**
| Role | Name | Contact |
|------|------|---------|
| Incident Commander | | |
| Security Lead | | |
| Engineering Lead | | |
| Ops/Infrastructure | | |
| Legal/Compliance | | |
| Executive (VP Eng or CEO) | | |

### Should-Do
- [ ] Backup restoration drills conducted monthly
- [ ] Incident response tabletop exercises conducted annually

---

## 18. Third-Party & Supply Chain Security (4 items)

### Must-Do
- [ ] Third-party services and integrations security reviewed
- [ ] Vendor data processing agreements (DPAs) signed
- [ ] Service Level Agreements (SLAs) include security requirements
- [ ] Sub-processors identified and approved

**Vendor assessment checklist:**
- [ ] SOC 2 Type II certification (or equivalent)
- [ ] Data encryption in transit and at rest
- [ ] Incident response policy documented
- [ ] Regular penetration testing conducted
- [ ] Clear data deletion/retention policy

### Should-Do
- [ ] Vendor security assessment updated annually
- [ ] Vendor risk scoring implemented

---

## 19. Compliance & Regulatory (5 items)

### Must-Do
- [ ] Privacy policy published and includes data processing, retention, rights
- [ ] Terms of Service updated and reviewed by legal
- [ ] Compliance requirements identified (GDPR, CCPA, HIPAA, PCI-DSS, etc.)
- [ ] Data protection impact assessment (DPIA) completed if required
- [ ] Compliance roadmap documented with timelines

**Compliance checklist by regulation:**
| Requirement | GDPR | CCPA | HIPAA | PCI-DSS |
|---|---|---|---|---|
| Encryption in transit | Yes | Recommended | Required | Required |
| Encryption at rest | Recommended | Recommended | Required | Required |
| Data retention policy | Required | Required | Required | Varies |
| Incident notification | 72h | 30-60d | 60d | Immediate |
| Right to access | Yes | Yes | Yes | No |
| Right to deletion | Yes | Yes | Limited | No |

### Should-Do
- [ ] Regular compliance audit scheduled (annual or per requirements)
- [ ] Compliance training completed by team members

---

## 20. Documentation & Knowledge Transfer (3 items)

### Must-Do
- [ ] Security architecture documented (threat model, components, data flow)
- [ ] Deployment and runbook documentation completed
- [ ] Security checklist results documented and signed off

### Should-Do
- [ ] Security training completed for development team
- [ ] Security best practices documentation published internally

---

## Sign-Off & Deployment Gate

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | | | |
| Engineering Lead | | | |
| Product Manager | | | |
| Executive Sponsor | | | |

---

## Post-Deployment (First 30 Days)

- [ ] Monitor logs daily for suspicious activity
- [ ] Respond to any security alerts within 1 hour
- [ ] Verify backups are working by attempting restore
- [ ] Collect feedback from security team and operations
- [ ] Schedule post-launch security review (7 days after launch)

---

**Checklist version**: 2.0  
**Last updated**: 2026-04-25  
**Review cycle**: Before major releases, quarterly minimum  
**Estimated completion time**: 4-6 hours
