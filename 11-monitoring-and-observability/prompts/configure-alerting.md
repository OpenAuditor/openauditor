# Prompt: Configure Security Alerting

## When to use this

Use this after setting up logging, or when you realise you only discover security incidents when a customer reports them. Good alerting means you know about attacks before your users do.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer configuring security alerting for a web application. Your goal: ensure the right person is notified within minutes when an attack is underway, rather than discovering it hours or days later.

**Step 1: Identify the current monitoring setup**

What logging/monitoring tools are in use?
- Logtail, Axiom, Datadog, CloudWatch, or other?
- Is there an existing alerting system?
- Where do alerts currently go (email, Slack, PagerDuty)?

Read the monitoring configuration files and identify what's already in place.

**Step 2: Define the alert matrix**

Set up alerts for these security events (priority order):

**P0 — Immediate alert (within 5 minutes):**

| Event | Threshold | What it indicates |
|-------|-----------|------------------|
| Failed logins from single IP | > 20 in 5 minutes | Brute force attack |
| Login failures across many IPs | > 100 in 15 minutes | Credential stuffing |
| Error rate spike | > 10x baseline in 5 minutes | Attack or incident |
| Admin account login (outside hours) | Any time between 11pm-6am | Potential compromise |
| New admin user created | Any event | Privilege escalation |

**P1 — Urgent alert (within 15 minutes):**

| Event | Threshold | What it indicates |
|-------|-----------|------------------|
| High volume password reset requests | > 50/hour | Account takeover campaign |
| 403 errors from single IP | > 100 in 10 minutes | IDOR scanning |
| Large data export | > 10,000 rows in one request | Potential data exfiltration |
| 500 errors | > 5x baseline | Application under attack |

**P2 — Daily digest:**

| Event | Period | What it indicates |
|-------|--------|------------------|
| Total failed login count | Daily | Baseline attack volume |
| New user registrations | Daily | Bot registrations |
| API key rotations | Weekly | Key hygiene |

**Step 3: Implement Slack alerting**

Create a Slack webhook and implement the alerting function:

```typescript
// lib/security-alerts.ts
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

interface AlertEvent {
  title: string;
  description: string;
  severity: AlertSeverity;
  data?: Record<string, unknown>;
}

const COLORS: Record<AlertSeverity, string> = {
  critical: '#FF0000',
  high: '#FF6600',
  medium: '#FFAA00',
  low: '#0099FF',
};

export async function sendSecurityAlert(event: AlertEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_SECURITY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SLACK_SECURITY_WEBHOOK_URL not configured');
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Security Alert: ${event.title}`,
      attachments: [{
        color: COLORS[event.severity],
        fields: [
          { title: 'Severity', value: event.severity.toUpperCase(), short: true },
          { title: 'Time', value: new Date().toISOString(), short: true },
          { title: 'Description', value: event.description, short: false },
          ...(event.data ? 
            Object.entries(event.data).map(([k, v]) => ({
              title: k, 
              value: String(v), 
              short: true
            })) : []
          ),
        ],
      }],
    }),
  });
}
```

**Step 4: Wire up brute force detection**

```typescript
// In your login handler:
import { Redis } from '@upstash/redis';
import { sendSecurityAlert } from '@/lib/security-alerts';

const redis = Redis.fromEnv();

async function trackFailedLogin(ip: string, email: string): Promise<void> {
  const key = `login_failures:${ip}`;
  const count = await redis.incr(key);
  await redis.expire(key, 300); // 5-minute window
  
  if (count === 10) {
    await sendSecurityAlert({
      title: 'Brute Force Detected',
      description: `${count} failed login attempts from single IP in 5 minutes`,
      severity: 'high',
      data: { ip, last_email_attempted: email, attempt_count: count },
    });
  }
  
  if (count === 50) {
    await sendSecurityAlert({
      title: 'Severe Brute Force Attack',
      description: `${count} failed login attempts — possible automated attack`,
      severity: 'critical',
      data: { ip, attempt_count: count },
    });
  }
}

async function trackGlobalFailures(): Promise<void> {
  const key = `global_login_failures:${Math.floor(Date.now() / 900000)}`; // 15-min bucket
  const count = await redis.incr(key);
  await redis.expire(key, 1800);
  
  if (count === 100) {
    await sendSecurityAlert({
      title: 'Credential Stuffing Attack Suspected',
      description: `${count} login failures across multiple IPs in 15 minutes`,
      severity: 'critical',
      data: { window: '15 minutes', failure_count: count },
    });
  }
}
```

**Step 5: Configure alerts in your logging provider**

Based on the logging tool in use, set up automated alerts:

**For Logtail (BetterStack):**
- Alerts → New Alert
- Condition: `json.event = "auth.login.failure"` — threshold: 20 in 5 minutes
- Notification: Slack channel `#security-alerts`

**For Datadog:**
```
Monitor type: Log alert
Search query: @event:auth.login.failure
Threshold: 20 occurrences in last 5 minutes
Notification: @slack-security-alerts
```

**For CloudWatch (AWS):**
```bash
# Create a metric filter for failed logins
aws logs put-metric-filter \
  --log-group-name '/app/security' \
  --filter-name 'LoginFailures' \
  --filter-pattern '{ $.event = "auth.login.failure" }' \
  --metric-transformations \
    metricName=LoginFailures,metricNamespace=AppSecurity,metricValue=1

# Create an alarm
aws cloudwatch put-metric-alarm \
  --alarm-name 'BruteForceAttempt' \
  --metric-name LoginFailures \
  --namespace AppSecurity \
  --statistic Sum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:SecurityAlerts
```

**Step 6: Set up uptime monitoring**

Configure uptime monitoring for all public-facing endpoints:

```
Using BetterStack (or equivalent):

Monitor 1: Public homepage
  URL: https://yourapp.com
  Interval: 1 minute
  Alert when: Status != 200 for 2 consecutive checks

Monitor 2: API health check
  URL: https://yourapp.com/api/health
  Interval: 1 minute
  Expected response: {"status":"ok"}

Monitor 3: Auth endpoint
  URL: https://yourapp.com/api/auth/session
  Method: GET
  Interval: 5 minutes
```

**Step 7: Test the alerting pipeline**

Verify alerts are working:

```typescript
// Test script — run manually
import { sendSecurityAlert } from '@/lib/security-alerts';

await sendSecurityAlert({
  title: 'Alert System Test',
  description: 'This is a test of the security alerting system. No action required.',
  severity: 'low',
  data: { test: true, timestamp: new Date().toISOString() },
});

// Verify this appears in Slack within 60 seconds
```

Also test brute force detection:
```bash
# Send 25 rapid login attempts to verify the alert fires
for i in {1..25}; do
  curl -X POST https://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}'
done
# Verify Slack alert received
```

**Step 8: Document the alert runbook**

For each alert, document:
- What triggered it
- First-response steps
- Escalation path
- How to resolve/acknowledge

---

## What to expect

Security alerting configured with thresholds for brute force, credential stuffing, IDOR scanning, and error spikes; alerts routed to Slack or equivalent; uptime monitoring for all key endpoints; tested and verified end-to-end.

## Learn more

[Monitoring README](../README.md)
[Tools Comparison](../tools-comparison.md)
[Post-Breach First 24 Hours](../../15-post-breach/first-24-hours.md)
