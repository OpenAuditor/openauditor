# Forensic Evidence Preservation

Before you fix anything, preserve evidence. Wiping logs to "clean up" after a breach destroys the evidence you need to understand what happened — and can be a crime.

---

## What to Preserve

### Logs (Highest Priority)

```bash
# Server/application logs
/var/log/nginx/access.log
/var/log/nginx/error.log
/var/log/auth.log           # SSH, sudo activity
/var/log/syslog             # system events
application logs             # your app's output

# Database logs (if enabled)
PostgreSQL: pg_log directory
MySQL: general_log, error_log, binary_log
```

### Cloud and Service Logs

- **Vercel:** Dashboard → Project → Functions → Logs
- **AWS:** CloudTrail (API activity), CloudWatch (application logs), S3 access logs
- **Supabase:** Dashboard → Database → Logs → API and Database logs
- **GitHub:** Settings → Security → Audit log
- **Cloudflare:** Analytics → Security → Firewall Events

### Preserve Immediately (Before They Rotate)

```bash
# Export logs before they're overwritten
cp /var/log/nginx/access.log /forensics/nginx-access-$(date +%Y%m%d-%H%M).log
cp /var/log/auth.log /forensics/auth-$(date +%Y%m%d-%H%M).log

# Create checksums so you can prove logs weren't tampered with
sha256sum /forensics/*.log > /forensics/checksums.txt
```

---

## Memory Capture (If System Is Compromised)

If you suspect malware or a rootkit is active on a server:

```bash
# Do NOT reboot — memory evidence is lost on reboot
# Capture a memory image before taking the system offline
# Use volatility or other forensics tools
# Or: engage a professional forensics firm

# If cloud-hosted: snapshot the VM/disk before terminating
aws ec2 create-snapshot --volume-id vol-xxx --description "forensics-$(date)"
```

---

## Network Captures

```bash
# Capture network traffic if attack may be ongoing
tcpdump -i eth0 -w /forensics/capture-$(date +%Y%m%d).pcap

# Set a size limit
tcpdump -i eth0 -w /forensics/capture.pcap -C 100  # rotate at 100MB
```

---

## Chain of Custody

For legal purposes, document:
- Who accessed the evidence
- When
- What they did with it
- Where it's stored

```
Evidence Log:
2026-04-26 02:30 — [Name] copied nginx access.log to /forensics/
2026-04-26 02:35 — [Name] created SHA256 checksums
2026-04-26 03:00 — [Name] uploaded to S3 forensics bucket (private)
```

---

## What NOT to Do

- **Don't reboot compromised servers** until memory is captured
- **Don't delete suspicious files** — they're evidence
- **Don't modify access logs** to "remove the attacker's traces"
- **Don't run forensics on a compromised system** — use a clean machine
- **Don't share evidence publicly** before legal review

---

## Engage Professionals for Serious Breaches

For breaches involving:
- Payment data (PCI-DSS mandate for forensics)
- Health data
- Large-scale PII
- Criminal activity
- Enterprise customers with SLAs

Engage a professional incident response firm. In the UK: CREST-accredited firms. In the US: firms listed on the CISA resources page.

---

## Learn More

- [First 24 Hours](./first-24-hours.md)
- [Monitoring and Observability](../11-monitoring-and-observability/)
