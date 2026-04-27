# 11 — Monitoring and Observability

Security monitoring is the difference between discovering a breach in minutes and discovering it six months later when a journalist calls you. This section covers what to log, what never to log, how to set up alerts, and how to detect anomalous behaviour before it becomes a headline.

## Why security monitoring matters

Most breaches are not detected by the organisation being attacked — they are discovered by third parties (law enforcement, security researchers, affected customers). The median time from intrusion to discovery is measured in months. Effective security monitoring closes that gap.

## Files in this section

| File | What it covers |
|------|----------------|
| [what-to-log.md](./what-to-log.md) | Security events that must be logged, with structured JSON examples |
| [what-not-to-log.md](./what-not-to-log.md) | PII, credentials, and tokens that must never appear in logs |
| [alerting-setup.md](./alerting-setup.md) | Alert rules with thresholds, Datadog/Grafana configs, on-call escalation |
| [anomaly-detection.md](./anomaly-detection.md) | Detecting unusual patterns: impossible travel, brute force, data exfiltration |
| [tools-comparison.md](./tools-comparison.md) | Datadog, Sentry, Logtail, Axiom, Grafana — pricing, features, best-for |
| [prompts/setup-security-logging.md](./prompts/setup-security-logging.md) | Agent prompt to add security logging to your application |
| [prompts/configure-alerting.md](./prompts/configure-alerting.md) | Agent prompt to configure security alerts |

## The three pillars

**Logs** — a timestamped, immutable record of what happened. Logs answer: "what did the system do?"

**Metrics** — aggregated numbers over time. Metrics answer: "is the system behaving normally?"

**Alerts** — notifications triggered when metrics or log patterns cross a threshold. Alerts answer: "do I need to act right now?"

## Quick-start checklist

- [ ] Structured JSON logging enabled (not plain text)
- [ ] Authentication events logged (login, logout, failure, MFA)
- [ ] Logs shipped to a centralised platform (not just stdout)
- [ ] Log retention set to at least 90 days (1 year recommended)
- [ ] Alerts configured for brute force and impossible travel
- [ ] PII absent from all log lines — verified with a grep scan
- [ ] On-call rotation documented and tested

## Compliance context

GDPR Article 32 requires "appropriate technical measures" including "a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures." Security logging is a core part of that evidence base.

ISO 27001 control A.12.4 (Logging and Monitoring) requires event logs, protection of log information, and administrator/operator logs.

SOC 2 (CC7.2) requires the organisation to monitor system components for anomalies.
