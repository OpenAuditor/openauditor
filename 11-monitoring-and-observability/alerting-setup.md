# Alerting Setup

Logs without alerts are archaeology. Alerts let you respond to security events while they are still happening, not after the damage is done. This file covers concrete alert rules with thresholds, configuration examples, and on-call escalation patterns.

---

## Alert tiers

Before defining rules, classify alerts by urgency:

| Tier | Response time | Examples | Channel |
|---|---|---|---|
| P1 — Critical | Immediately (24/7) | Active breach, credential stuffing, mass data export | PagerDuty wake-up |
| P2 — High | Within 30 minutes | Brute force, unusual admin access, certificate expiry | Slack + PagerDuty |
| P3 — Medium | Within 4 hours | Rate limit spikes, error rate increase, new device login | Slack channel |
| P4 — Low | Next business day | Single failed login, minor config change | Email digest |

---

## Alert rules

### 1. Brute force / credential stuffing

**Trigger:** More than 10 failed login attempts from the same IP within 60 seconds.

**Datadog monitor (JSON):**

```json
{
  "name": "Security: Brute Force Login Attempt",
  "type": "log alert",
  "query": "logs(\"service:api @event_type:auth.login.failure\").index(\"*\").rollup(\"count\").by(\"@ip_address\").last(\"1m\") > 10",
  "message": "{{value}} failed login attempts from IP {{@ip_address}} in the last 60 seconds.\n\n@pagerduty-security-p2",
  "tags": ["security", "brute-force"],
  "priority": 2,
  "options": {
    "thresholds": { "critical": 10, "warning": 5 }
  }
}
```

**Grafana alert rule (YAML):**

```yaml
groups:
  - name: security.brute_force
    rules:
      - alert: BruteForceLoginAttempt
        expr: |
          sum by (ip_address) (
            increase(auth_login_failure_total[1m])
          ) > 10
        for: 0m
        labels:
          severity: high
          team: security
        annotations:
          summary: "Brute force attempt from {{ $labels.ip_address }}"
          description: "{{ $value }} failed logins in 60 seconds"
          runbook: "https://wiki.internal/runbooks/brute-force"
```

---

### 2. Impossible travel

**Trigger:** The same user authenticates successfully from two geographic locations that are physically impossible to travel between in the elapsed time.

```javascript
// Detection logic (run on each successful login)
async function detectImpossibleTravel(userId: string, currentLogin: LoginEvent) {
  const lastLogin = await getLastLoginEvent(userId);
  if (!lastLogin) return;

  const timeDeltaSeconds = 
    (currentLogin.timestamp - lastLogin.timestamp) / 1000;
  const distanceKm = haversineDistance(lastLogin.location, currentLogin.location);
  
  // Maximum plausible speed: 900 km/h (commercial flight)
  const maxPossibleDistanceKm = (timeDeltaSeconds / 3600) * 900;

  if (distanceKm > maxPossibleDistanceKm && distanceKm > 100) {
    await triggerAlert({
      event_type: 'security.impossible_travel',
      user_id: userId,
      from_location: lastLogin.location,
      to_location: currentLogin.location,
      distance_km: distanceKm,
      time_delta_seconds: timeDeltaSeconds,
      severity: 'p1',
    });
  }
}
```

---

### 3. Bulk data export

**Trigger:** A single user exports more than 1,000 records within a 10-minute window, or any export exceeding 10,000 records.

```json
{
  "name": "Security: Bulk Data Export",
  "type": "log alert",
  "query": "logs(\"service:api @event_type:data.export @record_count:>1000\").index(\"*\").rollup(\"count\").last(\"10m\") > 0",
  "message": "Large data export detected.\nUser: {{@user_id}}\nRecords: {{@record_count}}\nExport type: {{@export_type}}\n\n@pagerduty-security-p1",
  "tags": ["security", "data-exfiltration"],
  "priority": 1
}
```

---

### 4. Admin action outside business hours

**Trigger:** Any admin action (role changes, user deletions, config changes) occurring outside 08:00–20:00 UTC on weekdays.

```yaml
# Grafana alert
- alert: AdminActionOutOfHours
  expr: |
    increase(admin_actions_total[5m]) > 0
    and
    (hour() < 8 or hour() >= 20 or day_of_week() == 0 or day_of_week() == 6)
  labels:
    severity: high
  annotations:
    summary: "Admin action outside business hours"
    description: "Admin {{ $labels.admin_user_id }} performed {{ $labels.event_type }}"
```

---

### 5. Elevated API error rate

**Trigger:** 5xx error rate exceeds 5% of requests over a 5-minute window.

```json
{
  "name": "API Error Rate Elevated",
  "type": "metric alert",
  "query": "sum:api.errors.5xx{*}.as_rate() / sum:api.requests.total{*}.as_rate() * 100 > 5",
  "message": "5xx error rate is {{value}}% over last 5 minutes.\n@slack-engineering @pagerduty-p2",
  "options": {
    "thresholds": { "critical": 5, "warning": 2 },
    "evaluation_window": "last_5m"
  }
}
```

---

### 6. New admin account created

**Trigger:** Immediately on any event of type `admin.user.created` or `authz.role.changed` to an admin role.

```json
{
  "name": "Security: New Admin Account",
  "type": "log alert",
  "query": "logs(\"@event_type:(admin.user.created OR authz.role.changed) @new_role:admin\").index(\"*\").rollup(\"count\").last(\"5m\") > 0",
  "message": "New admin account created or role escalated to admin.\nTarget user: {{@target_user_id}}\nChanged by: {{@changed_by_user_id}}\n\nVerify this was intentional.\n@slack-security @pagerduty-security-p2",
  "priority": 2
}
```

---

### 7. Rate limiting triggered repeatedly

**Trigger:** More than 5 rate limit events from the same IP within 10 minutes (indicates automated scanning or attack tooling).

```yaml
- alert: RepeatedRateLimiting
  expr: |
    sum by (ip_address) (
      increase(api_rate_limit_exceeded_total[10m])
    ) > 5
  labels:
    severity: medium
  annotations:
    summary: "Repeated rate limiting from {{ $labels.ip_address }}"
```

---

### 8. Certificate expiry

**Trigger:** TLS certificate expires within 14 days.

```yaml
- alert: CertificateExpiringSoon
  expr: |
    (probe_ssl_earliest_cert_expiry - time()) / 86400 < 14
  labels:
    severity: high
  annotations:
    summary: "Certificate for {{ $labels.instance }} expires in {{ $value | humanizeDuration }}"
```

---

### 9. Failed MFA attempts

**Trigger:** More than 3 failed MFA attempts from the same user within 10 minutes.

```json
{
  "name": "Security: MFA Brute Force",
  "type": "log alert",
  "query": "logs(\"@event_type:auth.mfa.failure\").index(\"*\").rollup(\"count\").by(\"@user_id\").last(\"10m\") > 3",
  "message": "Possible MFA brute force for user {{@user_id}}.\nConsider locking the account.\n@pagerduty-security-p1"
}
```

---

### 10. New country login

**Trigger:** User logs in from a country they have never logged in from before.

```typescript
async function detectNewCountryLogin(userId: string, country: string) {
  const seenCountries = await getSeenCountries(userId);
  
  if (!seenCountries.includes(country)) {
    await logSecurityEvent({
      event_type: 'auth.login.new_country',
      user_id: userId,
      country,
      severity: 'medium',
    });
    
    // Optionally: send verification email to user
    await sendNewCountryAlert(userId, country);
  }
}
```

---

## Notification channel configuration

### Slack integration (Datadog)

```yaml
# In your Datadog notification template
@slack-security-alerts

# Channel webhook (set in Datadog integrations)
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/T.../B.../...
```

### PagerDuty integration

```yaml
# datadog-pagerduty.yaml
integrations:
  pagerduty:
    - service_name: "security-p1"
      service_key: "${PAGERDUTY_SERVICE_KEY_P1}"
    - service_name: "security-p2"
      service_key: "${PAGERDUTY_SERVICE_KEY_P2}"
```

### Email digest (for P4 alerts)

Configure daily digest in your log platform to batch low-priority alerts rather than sending individual emails.

---

## On-call escalation policy

### Escalation tiers

```
P1 (Critical):
  Immediately → On-call engineer (PagerDuty)
  5 min no ack → Secondary on-call
  15 min no ack → Engineering manager
  30 min no ack → CTO

P2 (High):
  Immediately → On-call engineer (Slack + PagerDuty)
  30 min no ack → Secondary on-call

P3 (Medium):
  Slack notification only
  No automated escalation

P4 (Low):
  Daily email digest
```

### Runbook template

Every P1/P2 alert should link to a runbook. Minimum runbook content:

```markdown
# Runbook: [Alert Name]

## What triggered this
[Description of the alert condition]

## Immediate actions
1. [Step 1 — usually: assess scope]
2. [Step 2 — usually: contain if active]
3. [Step 3 — escalate if needed]

## Investigation steps
- Check: [specific log query]
- Check: [specific dashboard]

## Resolution steps
- [How to resolve]

## Post-incident
- Create incident report
- Review alert threshold (was it appropriate?)
```

---

## Alert fatigue prevention

Alerts are worthless if they are ignored. To prevent alert fatigue:

1. **Every alert must be actionable.** If there is no action to take, it is not an alert — it is a metric. Put it on a dashboard.
2. **Review alert volume weekly.** More than 5 P2+ alerts per week from the same rule means the threshold is wrong.
3. **Suppress during deployments.** Use maintenance windows in your alert platform during planned deployments.
4. **Track alert-to-action rate.** If more than 20% of alerts require no action, recalibrate thresholds.
5. **Rotate on-call.** A single person on 24/7 indefinite on-call will stop responding.
