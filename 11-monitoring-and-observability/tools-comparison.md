# Monitoring and Observability Tools

A comparison of the most popular logging, monitoring, and alerting tools for indie hackers and small teams — with honest opinions on what to actually use.

---

## 30-Second Summary

You need three capabilities: **logs** (what happened), **metrics** (how the system is performing), and **alerts** (tell me when something's wrong). Most teams overkill this early on. Start simple: one tool that ships logs externally plus an uptime monitor. Add complexity only when the simple version causes problems.

---

## Hosted Logging Services

### Logtail (BetterStack)

**Verdict: Best starting point for most teams**

- **Free tier:** 1GB/month, 3 days retention
- **Paid:** from $25/month for 50GB, 30 days retention
- **What it does:** Structured log ingestion, search, live tail, basic alerting
- **Best for:** Next.js/Node.js teams who want simple setup and a clean UI
- **Integration:** One-line setup with Pino, Winston, or console

```javascript
// Pino + Logtail (10 minutes to set up)
import pino from 'pino';
import { createWriteStream } from '@logtail/pino';

const logtailStream = createWriteStream({ 
  sourceToken: process.env.LOGTAIL_SOURCE_TOKEN 
});

export const logger = pino({ level: 'info' }, logtailStream);
```

### Axiom

**Verdict: Excellent for teams that query logs heavily**

- **Free tier:** 500GB/month ingest, 30 days retention
- **Paid:** from $25/month
- **What it does:** Very fast log querying (APL query language), excellent dashboards
- **Best for:** Teams who query logs frequently or have high volume
- **Integration:** Vercel native integration (one click)

```typescript
// Axiom + Next.js Vercel integration (literally one click in Vercel dashboard)
// Or manual:
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN });

await axiom.ingest('my-dataset', [{
  event: 'auth.login.failure',
  email: 'test@example.com',
  ip: '1.2.3.4',
}]);
```

### Datadog

**Verdict: Enterprise-grade, expensive, worth it at scale**

- **Cost:** Starts at ~$15/host/month for infrastructure, plus log ingestion costs (expensive at volume)
- **What it does:** Logs + metrics + APM + alerting + dashboards
- **Best for:** Teams that need the full observability picture and can pay for it
- **Integration:** Agent-based, extensive integrations

### Cloudwatch (AWS)

**Verdict: Fine if you're already in AWS, clunky UI**

- **Cost:** $0.50/GB ingested, $0.03/GB stored
- **What it does:** Log storage, metrics, basic alerting
- **Best for:** AWS-native applications, Lambda functions
- **Downside:** Confusing pricing, slow UI, poor search

---

## Application Performance Monitoring (APM)

### Sentry

**Verdict: Essential for error tracking**

- **Free tier:** 5,000 errors/month, 10,000 transactions
- **Paid:** from $26/month
- **What it does:** Error tracking with stack traces, performance monitoring, session replay
- **Best for:** Every production application should have Sentry or equivalent
- **Integration:** One-line setup

```javascript
// Next.js — sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  // Don't log PII:
  beforeSend(event) {
    // Strip email from user context
    if (event.user?.email) delete event.user.email;
    return event;
  },
});
```

### Highlight.io

**Verdict: Good open source alternative to Sentry**

- **Free tier:** 500 sessions/month
- **Paid:** from $50/month
- **What it does:** Error tracking + session replay + logging
- **Best for:** Teams that want session replay alongside errors
- **Notable:** Can self-host

---

## Uptime Monitoring

### BetterStack Uptime (formerly Uptime Robot)

**Verdict: Best free tier for uptime monitoring**

- **Free tier:** 10 monitors, 3-minute intervals
- **Paid:** from $20/month for 50 monitors, 30-second intervals
- **What it does:** HTTP/TCP/keyword monitoring, status pages, PagerDuty integration

### Checkly

**Verdict: Best for API and browser test monitoring**

- **Free tier:** 10 checks/month
- **Paid:** from $20/month
- **What it does:** Run Playwright tests and API checks on a schedule — alerts when they fail
- **Best for:** Teams that want to monitor actual user flows, not just HTTP 200

```javascript
// Checkly — run a Playwright test every 5 minutes
const { test, expect } = require('@playwright/test');

test('Login flow works', async ({ page }) => {
  await page.goto('https://yourapp.com/login');
  await page.fill('[name=email]', process.env.TEST_USER_EMAIL);
  await page.fill('[name=password]', process.env.TEST_USER_PASSWORD);
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Alerting

### PagerDuty

**Verdict: Overkill for most small teams**

- **Free tier:** 1 user (effectively useless for teams)
- **Paid:** from $21/user/month
- **Best for:** Teams with proper on-call rotations

### Opsgenie (Atlassian)

**Verdict: Better value than PagerDuty for small teams**

- **Free tier:** 5 users
- **Paid:** from $9/user/month

### Slack + Webhooks

**Verdict: Good enough for early-stage teams**

```typescript
// Send security alerts to Slack
async function alertSlack(message: string, severity: 'info' | 'warning' | 'critical') {
  const color = { info: '#36a64f', warning: '#ffa500', critical: '#ff0000' }[severity];
  
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `[${severity.toUpperCase()}] Security Alert`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }]
    }),
  });
}
```

---

## Recommended Stacks by Stage

### Early-stage (pre-revenue or < $10k MRR)

```
Logging:  Logtail free tier (1GB/month)
Errors:   Sentry free tier (5k errors/month)
Uptime:   BetterStack free tier (10 monitors)
Alerts:   Slack webhook (free)
Cost:     £0/month
```

### Growing startup ($10k-100k MRR)

```
Logging:  Logtail $25/month or Axiom $25/month
Errors:   Sentry $26/month
Uptime:   BetterStack $20/month
Alerts:   Slack + PagerDuty ($42/month for 2 users)
Cost:     ~£90/month
```

### Scale ($100k+ MRR)

```
Logging:  Datadog or Axiom
Errors:   Sentry Business
APM:      Datadog APM
Alerts:   PagerDuty
Cost:     Negotiate based on volume
```

---

## Learn More

- [What to Log](./README.md)
- [Setup Security Logging prompt](./prompts/setup-security-logging.md)
- [Configure Alerting prompt](./prompts/configure-alerting.md)
- [OWASP A09: Logging Failures](../02-owasp/web-top10/A09-logging-failures.md)
