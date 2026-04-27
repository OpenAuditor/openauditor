# Anomaly Detection

An anomaly is a deviation from expected behaviour. Attackers rely on blending into normal traffic — your job is to define what "normal" looks like well enough to notice when it changes.

---

## Why anomaly detection matters

Signature-based detection (blocking known bad IPs, known malware hashes) catches amateur attackers. Anomaly-based detection catches the rest. The most dangerous attacks — insider threats, sophisticated credential stuffing, slow data exfiltration — look like normal traffic individually. Only by establishing a baseline does the pattern become visible.

---

## Establishing a baseline

Before you can detect anomalies, you need to know what normal looks like. Collect baseline metrics for at least 2–4 weeks before enabling anomaly alerts.

### Baseline metrics to track

| Metric | Granularity | Why |
|---|---|---|
| Login success rate | Hourly, by IP range | Drops signal credential stuffing |
| Requests per user per hour | Per user | Spikes signal scraping or exfil |
| API endpoints hit per session | Per session | Unusual paths signal recon |
| Data volume exported per user | Daily | Spikes signal exfiltration |
| Error rate by endpoint | 5-minute window | Spikes signal fuzzing/scanning |
| New device logins | Per user | First-ever device signals account takeover |
| Geographic diversity | Per user | New countries signal account takeover |
| Admin actions per admin per day | Per admin | Spikes signal privilege abuse |

---

## Pattern 1: Impossible travel

**What it is:** The same user successfully authenticates from two locations that are physically impossible to travel between in the elapsed time.

**Real example:** A SaaS company's logs showed a support team member log in from London at 09:00, then from Brazil at 09:15. Travel time: impossible. Investigation revealed credentials had been stolen and were being used by an attacker. The attacker had access for 3 hours before the impossible travel alert fired.

**Detection logic:**

```python
from math import radians, sin, cos, sqrt, atan2

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def detect_impossible_travel(user_id, new_login):
    last_login = get_last_login(user_id)
    if not last_login:
        return False
    
    time_delta_hours = (new_login.timestamp - last_login.timestamp).total_seconds() / 3600
    distance_km = haversine_km(
        last_login.lat, last_login.lon,
        new_login.lat, new_login.lon
    )
    
    # Max speed: commercial aircraft ~900 km/h
    max_possible_km = time_delta_hours * 900
    
    if distance_km > max_possible_km and distance_km > 100:
        alert({
            'type': 'impossible_travel',
            'user_id': user_id,
            'distance_km': round(distance_km),
            'time_delta_hours': round(time_delta_hours, 2),
            'from': last_login.country,
            'to': new_login.country,
        })
        return True
```

**False positives to expect:**
- VPN users whose IP resolves to a different country
- Corporate proxies routing through a central location
- Shared accounts (which you shouldn't have, but often do)

**Mitigation:** Maintain a per-user allowlist of known VPN IP ranges.

---

## Pattern 2: Credential stuffing

**What it is:** Automated login attempts using username/password pairs obtained from other data breaches. Success rates are typically low (0.1–2%) but the volume is enormous.

**Real example:** In 2019, a UK bank saw 14,000 login attempts in 4 minutes from 800 different IP addresses. Only 40 (0.3%) succeeded. They detected it by monitoring the ratio of failed to successful logins — which jumped from a baseline of 8:1 to 350:1 during the attack.

**Key signals:**

```
Signals that distinguish credential stuffing from organic traffic:
- Login failure rate >> baseline (e.g., > 50% failure vs 8% baseline)
- Requests distributed across many IPs (> 50 IPs per 5 minutes)
- Low variety of user agents (all the same browser version)
- Even timing distribution (not organic peaks/troughs)
- Requests targeting only /login, not other pages
```

**Detection query (SQL / Supabase):**

```sql
-- Detect credential stuffing: high failure rate from distributed IPs
SELECT
  date_trunc('minute', created_at) as window,
  COUNT(*) FILTER (WHERE event_type = 'auth.login.failure') as failures,
  COUNT(*) FILTER (WHERE event_type = 'auth.login.success') as successes,
  COUNT(DISTINCT ip_address) as unique_ips,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'auth.login.failure')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as failure_rate_pct
FROM security_events
WHERE 
  event_type IN ('auth.login.failure', 'auth.login.success')
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY window
HAVING
  COUNT(DISTINCT ip_address) > 20
  AND failure_rate_pct > 40
ORDER BY window DESC;
```

---

## Pattern 3: Data exfiltration

**What it is:** An attacker (or malicious insider) gradually extracting large volumes of data. The "slow and low" variant is designed to avoid triggering bulk export alerts.

**Real example:** A healthcare company discovered a former employee had exported patient records over 6 weeks before their access was revoked. Each daily export was under 500 records (below their alert threshold of 1,000), but 42 days × 500 records = 21,000 patient records stolen.

**The lesson:** Threshold-based alerts on individual events are not enough. You also need cumulative alerts.

**Cumulative detection:**

```javascript
// Daily job: check cumulative exports per user over rolling window
async function detectCumulativeExfiltration() {
  const results = await db.query(`
    SELECT
      user_id,
      SUM(record_count) as total_records_30d,
      COUNT(*) as export_events_30d,
      AVG(record_count) as avg_per_export
    FROM data_exports
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
    HAVING SUM(record_count) > 5000
    ORDER BY total_records_30d DESC
  `);

  for (const row of results) {
    // Compare against this user's 30-day baseline from 60-90 days ago
    const baseline = await getUserExportBaseline(row.user_id);
    const deviation = row.total_records_30d / (baseline.avg_30d || 1);

    if (deviation > 3) {  // 3x above their personal baseline
      await triggerAlert({
        event_type: 'security.exfiltration_suspected',
        user_id: row.user_id,
        total_records_30d: row.total_records_30d,
        baseline_30d: baseline.avg_30d,
        deviation_factor: deviation.toFixed(2),
        severity: deviation > 10 ? 'p1' : 'p2',
      });
    }
  }
}
```

---

## Pattern 4: Privilege escalation

**What it is:** A user with limited permissions attempts to access admin functionality, either through a legitimate bug or intentional attack.

**Real example:** A bug in a SaaS platform allowed users to access `/api/admin/users` by adding `?debug=true` to the URL. An attacker discovered this through automated scanning (the 403→200 transition appeared in logs) and downloaded the full user list before it was noticed.

**Detection:** Monitor for sequences of 403 responses followed by 200 responses on admin endpoints from the same user/IP.

```sql
-- Detect: 403 on admin endpoint followed by 200 on same endpoint (within 5 min)
WITH forbidden_attempts AS (
  SELECT user_id, ip_address, path, created_at
  FROM api_logs
  WHERE status_code = 403 AND path LIKE '/api/admin/%'
),
successful_admin AS (
  SELECT user_id, ip_address, path, created_at
  FROM api_logs
  WHERE status_code = 200 AND path LIKE '/api/admin/%'
)
SELECT
  f.user_id,
  f.ip_address,
  f.path,
  f.created_at as forbidden_at,
  s.created_at as success_at
FROM forbidden_attempts f
JOIN successful_admin s
  ON (f.user_id = s.user_id OR f.ip_address = s.ip_address)
  AND f.path = s.path
  AND s.created_at BETWEEN f.created_at AND f.created_at + INTERVAL '5 minutes'
ORDER BY f.created_at DESC;
```

---

## Pattern 5: Account enumeration

**What it is:** Attackers probe your login form to determine which email addresses are registered. Once they know valid emails, they can launch targeted phishing.

**Signal:** Consistent 404/400 responses on `/api/auth/forgot-password` or `/api/auth/login` in rapid sequence from one IP.

```javascript
// Detection: > 20 unique email hashes probed in 5 minutes
async function detectEnumeration(ipAddress: string) {
  const recentAttempts = await redis.zrangebyscore(
    `enum:${ipAddress}`,
    Date.now() - 300_000,  // last 5 minutes
    Date.now()
  );
  
  const uniqueEmails = new Set(recentAttempts).size;
  
  if (uniqueEmails > 20) {
    await triggerAlert({
      event_type: 'security.account_enumeration',
      ip_address: ipAddress,
      unique_emails_probed: uniqueEmails,
      severity: 'p2',
    });
    
    // Block the IP
    await blockIp(ipAddress, '1 hour', 'account_enumeration');
  }
}
```

---

## Pattern 6: API scanning / fuzzing

**What it is:** Automated tools probing your API for undocumented endpoints, hidden parameters, or known vulnerable paths.

**Signals:**
- Requests to paths that don't exist (`/admin`, `/wp-admin`, `/.env`, `/phpinfo.php`)
- Unusually high 404 rate from one IP
- Requests with invalid/empty body for POST endpoints

```bash
# Common probe paths — block immediately on first hit
/.env
/.git/config
/wp-admin
/wp-login.php
/phpinfo.php
/actuator
/actuator/env
/admin/config
/api/swagger.json (if you don't serve this publicly)
/server-status
```

---

## Building your anomaly detection baseline

### Week 1–2: Collect baseline data

Deploy logging (see `what-to-log.md`) and collect data without alerting.

### Week 3: Calculate normal ranges

```python
# For each metric, calculate mean and standard deviation
import statistics

def compute_baseline(values: list[float]) -> dict:
    mean = statistics.mean(values)
    stdev = statistics.stdev(values) if len(values) > 1 else 0
    return {
        'mean': mean,
        'stdev': stdev,
        'p95': sorted(values)[int(len(values) * 0.95)],
        'p99': sorted(values)[int(len(values) * 0.99)],
        'threshold_3sigma': mean + (3 * stdev),  # 3 standard deviations above mean
    }
```

### Week 4+: Enable alerts and tune

- Start with 3σ thresholds (catches unusual but not normal variation)
- Track false positive rate for first 2 weeks
- Adjust thresholds based on false positive rate
- Aim for < 2 false positive P1/P2 alerts per day

---

## Attacks detected too late: real lessons

### Lesson 1 — The insider who left the door open
A support engineer at a fintech company was made redundant. IT revoked their email but not their API key. Over the following 3 months, they used the API key to access customer records. The access pattern was identical to their normal working behaviour, so no thresholds were breached. **Lesson:** Log and alert on access using credentials that belong to former employees. Integrate with your HR offboarding process.

### Lesson 2 — The breach that wasn't logged
A startup was breached through a misconfigured S3 bucket. The attacker downloaded 40GB of user data. The breach was discovered 4 months later. When investigators reviewed logs, there were no API access logs for the S3 bucket — S3 access logging was disabled. **Lesson:** Enable access logging on every data storage resource, not just your application.

### Lesson 3 — The alert that wasn't actionable
A team set up a Datadog monitor that fired 200+ times per day. Within 3 weeks, engineers had muted it. A real attack 2 months later went undetected because the alert was silenced. **Lesson:** An alert that fires too often is worse than no alert. Tune aggressively. One false positive per day is the maximum sustainable rate.
