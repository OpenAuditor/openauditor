# What to Log

Log the right things and security incidents become investigations rather than mysteries. This file defines the events you must capture, the structured format to use, and concrete examples for each category.

## The golden rule

**Log decisions, not data.** Log that a user accessed a resource, not the contents of that resource. Log that an authentication attempt failed, not what password was tried.

---

## Log format: structured JSON

Always use structured JSON. Plain text logs are unsearchable, unqueryable, and unparseable at scale.

**Minimum required fields on every log line:**

```json
{
  "timestamp": "2026-04-25T14:32:01.234Z",
  "level": "info",
  "service": "api",
  "event_type": "auth.login.success",
  "user_id": "usr_01HXQ9FKQE8RW6Y7ZBVP3NMJK2",
  "session_id": "sess_01HXQ9FKQE8RW6Y7ZBVP3NMJK3",
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "request_id": "req_01HXQ9FKQE8RW6Y7ZBVP3NMJK4",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

Never log raw request bodies. Never log response bodies containing user data.

---

## Category 1: Authentication events

These are the most critical events. Every authentication action must produce a log line.

### Successful login

```json
{
  "timestamp": "2026-04-25T14:32:01.234Z",
  "event_type": "auth.login.success",
  "user_id": "usr_01HXQ9FK",
  "email_hash": "sha256:a665a45920422f9d417e4867efdc4fb8",
  "auth_method": "password",
  "mfa_used": true,
  "mfa_method": "totp",
  "ip_address": "203.0.113.45",
  "country": "GB",
  "device_fingerprint": "fp_01HXQ9FK",
  "is_new_device": false
}
```

### Failed login

```json
{
  "timestamp": "2026-04-25T14:32:05.891Z",
  "event_type": "auth.login.failure",
  "email_hash": "sha256:a665a45920422f9d417e4867efdc4fb8",
  "failure_reason": "invalid_password",
  "attempt_number": 3,
  "ip_address": "203.0.113.45",
  "country": "GB"
}
```

Note: `email_hash` rather than plain email. Use SHA-256. This lets you correlate events without storing PII in logs.

### Logout

```json
{
  "event_type": "auth.logout",
  "user_id": "usr_01HXQ9FK",
  "session_id": "sess_01HXQ9FK",
  "session_duration_seconds": 3847,
  "initiated_by": "user"
}
```

### Password reset requested

```json
{
  "event_type": "auth.password_reset.requested",
  "user_id": "usr_01HXQ9FK",
  "ip_address": "203.0.113.45",
  "delivery_method": "email"
}
```

### Password reset completed

```json
{
  "event_type": "auth.password_reset.completed",
  "user_id": "usr_01HXQ9FK",
  "ip_address": "203.0.113.45",
  "reset_token_age_seconds": 432
}
```

### MFA enrolled / removed

```json
{
  "event_type": "auth.mfa.enrolled",
  "user_id": "usr_01HXQ9FK",
  "mfa_method": "totp",
  "ip_address": "203.0.113.45"
}
```

### Session created / expired / revoked

```json
{
  "event_type": "auth.session.revoked",
  "user_id": "usr_01HXQ9FK",
  "session_id": "sess_01HXQ9FK",
  "revoked_by": "admin",
  "admin_user_id": "usr_ADMIN01",
  "reason": "suspicious_activity"
}
```

### OAuth / SSO events

```json
{
  "event_type": "auth.oauth.token_exchanged",
  "user_id": "usr_01HXQ9FK",
  "provider": "google",
  "scopes_granted": ["email", "profile"],
  "ip_address": "203.0.113.45"
}
```

---

## Category 2: Authorisation and permission changes

### Access denied

```json
{
  "event_type": "authz.access_denied",
  "user_id": "usr_01HXQ9FK",
  "resource_type": "document",
  "resource_id": "doc_01HXQ9FK",
  "action": "read",
  "reason": "insufficient_permissions",
  "required_role": "admin",
  "user_role": "viewer"
}
```

### Role change

```json
{
  "event_type": "authz.role.changed",
  "target_user_id": "usr_01HXQ9FK",
  "changed_by_user_id": "usr_ADMIN01",
  "old_role": "viewer",
  "new_role": "admin",
  "resource_scope": "organisation",
  "resource_id": "org_01HXQ9FK"
}
```

### Permission granted / revoked

```json
{
  "event_type": "authz.permission.granted",
  "target_user_id": "usr_01HXQ9FK",
  "granted_by_user_id": "usr_ADMIN01",
  "permission": "billing:manage",
  "expires_at": "2026-07-25T00:00:00Z"
}
```

---

## Category 3: Data access events

Log access to sensitive resources. You do not need to log every database read — only access to data classified as sensitive (PII, financial, health, credentials).

### Sensitive record accessed

```json
{
  "event_type": "data.access",
  "user_id": "usr_01HXQ9FK",
  "resource_type": "user_profile",
  "resource_id": "usr_TARGET01",
  "action": "read",
  "fields_accessed": ["email", "phone", "address"],
  "access_context": "support_ticket",
  "support_ticket_id": "tkt_01HXQ9FK"
}
```

### Bulk data export

```json
{
  "event_type": "data.export",
  "user_id": "usr_01HXQ9FK",
  "export_type": "csv",
  "resource_type": "user_list",
  "record_count": 15420,
  "filters_applied": {"date_range": "last_90_days"},
  "ip_address": "203.0.113.45"
}
```

### Data deletion

```json
{
  "event_type": "data.deletion",
  "performed_by_user_id": "usr_ADMIN01",
  "target_user_id": "usr_01HXQ9FK",
  "deletion_type": "gdpr_erasure",
  "tables_affected": ["users", "orders", "sessions", "audit_logs"],
  "records_deleted": 47,
  "request_id": "erasure_req_01HXQ9FK"
}
```

---

## Category 4: API errors and anomalies

### 4xx errors (client errors)

Log 401 and 403 always. Log 400 and 429 when they exceed a threshold.

```json
{
  "event_type": "api.error",
  "status_code": 401,
  "method": "GET",
  "path": "/api/v1/admin/users",
  "user_id": null,
  "ip_address": "203.0.113.45",
  "request_id": "req_01HXQ9FK",
  "error_code": "authentication_required"
}
```

### Rate limit hit

```json
{
  "event_type": "api.rate_limit_exceeded",
  "user_id": "usr_01HXQ9FK",
  "ip_address": "203.0.113.45",
  "endpoint": "/api/v1/auth/login",
  "limit": 10,
  "window_seconds": 60,
  "current_count": 11
}
```

### 5xx errors

```json
{
  "event_type": "api.server_error",
  "status_code": 500,
  "method": "POST",
  "path": "/api/v1/payments",
  "user_id": "usr_01HXQ9FK",
  "request_id": "req_01HXQ9FK",
  "error_class": "DatabaseConnectionError",
  "error_message": "Connection pool exhausted"
}
```

Note: strip stack traces before logging to production log platforms. Stack traces often contain file paths, internal hostnames, or library versions that help attackers.

---

## Category 5: Admin actions

Any action taken by an admin or privileged user must be logged, regardless of whether it is security-related.

### Admin viewed user record

```json
{
  "event_type": "admin.user.viewed",
  "admin_user_id": "usr_ADMIN01",
  "target_user_id": "usr_01HXQ9FK",
  "ip_address": "203.0.113.45",
  "reason": "support_request",
  "ticket_id": "tkt_01HXQ9FK"
}
```

### Admin impersonated user

```json
{
  "event_type": "admin.impersonation.started",
  "admin_user_id": "usr_ADMIN01",
  "target_user_id": "usr_01HXQ9FK",
  "reason": "debugging_reported_issue",
  "session_id": "sess_IMPERSONATE01"
}
```

### Configuration changed

```json
{
  "event_type": "admin.config.changed",
  "admin_user_id": "usr_ADMIN01",
  "config_key": "auth.mfa_required",
  "old_value": false,
  "new_value": true,
  "ip_address": "203.0.113.45"
}
```

### User created / suspended / deleted by admin

```json
{
  "event_type": "admin.user.suspended",
  "admin_user_id": "usr_ADMIN01",
  "target_user_id": "usr_01HXQ9FK",
  "reason": "abuse_report_confirmed",
  "abuse_report_id": "abuse_01HXQ9FK"
}
```

---

## Category 6: Infrastructure and deployment

### Deployment

```json
{
  "event_type": "infra.deployment",
  "service": "api",
  "version": "v2.14.3",
  "deployed_by": "ci_pipeline",
  "pipeline_run_id": "run_01HXQ9FK",
  "environment": "production",
  "previous_version": "v2.14.2"
}
```

### Secret accessed (from vault or secrets manager)

```json
{
  "event_type": "infra.secret.accessed",
  "secret_name": "stripe_api_key",
  "accessed_by": "api-service",
  "environment": "production"
}
```

### Certificate expiry warning

```json
{
  "event_type": "infra.certificate.expiry_warning",
  "domain": "api.example.com",
  "expires_at": "2026-05-10T00:00:00Z",
  "days_remaining": 15
}
```

---

## Log retention requirements

| Log category | Minimum retention | Recommended |
|---|---|---|
| Authentication events | 1 year | 2 years |
| Admin actions | 2 years | 7 years |
| Data access | 1 year | 3 years |
| API errors | 90 days | 1 year |
| Infrastructure | 90 days | 1 year |

Check your jurisdiction. GDPR Article 5(1)(e) requires you not to retain data longer than necessary — but security logs have a legitimate interest basis for extended retention.

---

## Implementation example (Node.js / TypeScript)

```typescript
import { createLogger } from './logger';

const logger = createLogger({ service: 'api' });

// Centralised auth event logger
export function logAuthEvent(
  eventType: string,
  context: {
    userId?: string;
    emailHash?: string;
    ipAddress: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
) {
  logger.info({
    event_type: eventType,
    user_id: context.userId ?? null,
    email_hash: context.emailHash ?? null,
    ip_address: context.ipAddress,
    user_agent: context.userAgent ?? null,
    ...context.metadata,
  });
}

// Usage
logAuthEvent('auth.login.failure', {
  emailHash: hashEmail(email),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: {
    failure_reason: 'invalid_password',
    attempt_number: attempts,
  },
});
```

---

## Quick reference: mandatory events checklist

- [ ] `auth.login.success`
- [ ] `auth.login.failure`
- [ ] `auth.logout`
- [ ] `auth.password_reset.requested`
- [ ] `auth.password_reset.completed`
- [ ] `auth.mfa.enrolled`
- [ ] `auth.mfa.removed`
- [ ] `auth.session.revoked`
- [ ] `authz.access_denied`
- [ ] `authz.role.changed`
- [ ] `data.export` (bulk)
- [ ] `data.deletion`
- [ ] `api.rate_limit_exceeded`
- [ ] `admin.*` (all admin actions)
- [ ] `infra.deployment`
