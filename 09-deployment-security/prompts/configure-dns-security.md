# Prompt: Configure DNS Security

## When to use this

Use this when setting up a new domain, after moving to a new email provider, when your emails are landing in spam, or when doing a pre-launch security review.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer configuring DNS security for a domain. Set up SPF, DKIM, DMARC, DNSSEC, and subdomain takeover prevention. Improve email deliverability and protect the domain from email spoofing.

**Domain:** [YOUR_DOMAIN]
**Email provider:** [SendGrid / Postmark / AWS SES / Google Workspace / other]
**DNS provider:** [Cloudflare / Route 53 / Namecheap / other]
**Hosting:** [Vercel / AWS / other]

**Step 1: Audit existing DNS records**

```bash
# Check current MX records
dig MX [YOUR_DOMAIN] +short

# Check SPF record
dig TXT [YOUR_DOMAIN] | grep spf

# Check DMARC record
dig TXT _dmarc.[YOUR_DOMAIN] | grep dmarc

# Check DKIM (need to know the selector — check with email provider)
dig TXT [SELECTOR]._domainkey.[YOUR_DOMAIN]

# Check for subdomain takeover risks
dig CNAME www.[YOUR_DOMAIN] +short
dig CNAME app.[YOUR_DOMAIN] +short
dig CNAME blog.[YOUR_DOMAIN] +short
dig CNAME staging.[YOUR_DOMAIN] +short
# Check any CNAME pointing to *.vercel.app, *.github.io, *.herokuapp.com etc.
# If the target service is not configured, it's vulnerable to takeover
```

**Step 2: Configure SPF**

SPF (Sender Policy Framework) specifies which mail servers can send email on behalf of your domain.

```bash
# Current SPF record format:
# v=spf1 include:[email-provider] ~all

# For SendGrid:
# v=spf1 include:sendgrid.net ~all

# For Postmark:
# v=spf1 include:spf.mtasv.net ~all

# For AWS SES (us-east-1):
# v=spf1 include:amazonses.com ~all

# For Google Workspace:
# v=spf1 include:_spf.google.com ~all

# For multiple providers (comma separate the includes):
# v=spf1 include:sendgrid.net include:_spf.google.com ~all

# Add this TXT record to your domain:
# Name: @ (or blank, for the root domain)
# Value: v=spf1 include:[provider] ~all
```

**Important SPF rules:**
- Use `~all` (softfail) initially; graduate to `-all` (hardfail) after testing
- Maximum 10 DNS lookups (count each `include:` and `mx` as one lookup)
- Do NOT have two SPF records — combine into one

**Step 3: Configure DKIM**

DKIM signs outgoing emails with a private key; recipients verify with the public key in DNS.

```bash
# Most email providers will give you:
# 1. A selector name (e.g., "s1", "k1", "20240101")
# 2. A CNAME or TXT record to add

# For SendGrid (automatic DKIM via CNAME):
# Add to DNS:
# Name: s1._domainkey.[YOUR_DOMAIN]
# Type: CNAME
# Value: s1.domainkey.u[SENDGRID_SENDER_ID].wl.sendgrid.net

# For Postmark:
# Name: [selector]._domainkey.[YOUR_DOMAIN]
# Type: TXT
# Value: v=DKIM1; k=rsa; p=[PUBLIC_KEY]

# Verify DKIM is working after DNS propagates (24-48 hours):
dig TXT [SELECTOR]._domainkey.[YOUR_DOMAIN]
# Should return: v=DKIM1; k=rsa; p=[key]

# Test by sending an email to mail-tester.com or use:
curl -s "https://api.sendgrid.com/v3/whitelabel/domains" \
  -H "Authorization: Bearer ${SENDGRID_API_KEY}" | jq '.[] | {id, domain, valid}'
```

**Step 4: Configure DMARC (3-phase rollout)**

DMARC tells receivers what to do when SPF/DKIM fails.

**Phase 1 — Monitor (deploy immediately)**
```
Name: _dmarc.[YOUR_DOMAIN]
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@[YOUR_DOMAIN]; ruf=mailto:dmarc-forensic@[YOUR_DOMAIN]; fo=1
```

Wait 2 weeks and review the aggregate reports. Free tools for reading DMARC reports:
- dmarcian.com (free tier)
- dmarc.postmarkapp.com (free)
- Google Postmaster Tools (for Gmail senders)

**Phase 2 — Quarantine (after 2 weeks of clean reports)**
```
Value: v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc-reports@[YOUR_DOMAIN]; fo=1
```
Start at `pct=10` (10% of failing messages quarantined) and gradually increase to 100%.

**Phase 3 — Reject (the goal)**
```
Value: v=DMARC1; p=reject; rua=mailto:dmarc-reports@[YOUR_DOMAIN]; fo=1; adkim=s; aspf=s
```

**Step 5: Check and fix subdomain takeover risks**

```bash
# List all DNS records for your domain
# (Use your DNS provider's export — Cloudflare, Route 53, etc.)

# Check each CNAME for dangling references
# Dangerous targets include:
# - *.vercel.app (if project is deleted)
# - *.github.io (if repository/pages is disabled)
# - *.netlify.app (if site is deleted)
# - *.s3-website-*.amazonaws.com (if bucket is deleted)
# - *.azurewebsites.net (if app service is deleted)
# - *.herokuapp.com (if app is deleted)

# For each suspicious CNAME, verify the target responds:
curl -I https://[target-subdomain].[YOUR_DOMAIN]

# If you get: "This domain name hasn't been claimed"
# or: "There isn't a GitHub Pages site here"
# → The subdomain is vulnerable to takeover
# → Fix: Either delete the CNAME or re-configure the target service
```

**Step 6: Configure DNSSEC (if your DNS provider supports it)**

DNSSEC adds cryptographic signatures to DNS responses, preventing DNS spoofing.

```bash
# Enable DNSSEC in Cloudflare:
# Dashboard → DNS → DNSSEC → Enable
# Cloudflare will generate DS records to give to your registrar

# For Route 53:
# Hosted Zones → [your domain] → Enable DNSSEC
# Then add the DS record at your registrar

# Verify DNSSEC after enabling:
dig +dnssec [YOUR_DOMAIN] A
# Look for: flags: qr rd ra ad  (the 'ad' flag means DNSSEC validated)

# Test at: https://dnssec-analyzer.verisignlabs.com/[YOUR_DOMAIN]
```

**Step 7: Verify everything is working**

```bash
# Run a comprehensive email security check
# 1. Send a test email to: check-auth@verifier.port25.com
#    You'll receive a report showing SPF/DKIM/DMARC results

# 2. Use mail-tester.com
#    Send an email to their random address and get a score out of 10

# 3. Command-line verification:
# SPF
dig TXT [YOUR_DOMAIN] | grep spf
# Expected: v=spf1 include:... ~all or -all

# DKIM
dig TXT [selector]._domainkey.[YOUR_DOMAIN]
# Expected: v=DKIM1; k=rsa; p=...

# DMARC
dig TXT _dmarc.[YOUR_DOMAIN]
# Expected: v=DMARC1; p=...

# 4. Google Postmaster Tools (if sending to Gmail)
# Register at: https://postmaster.google.com
# Shows domain reputation and spam rate

# 5. Check Cloudflare Email Security (if using Cloudflare):
# Dashboard → Security → Email Security → DMARC Management
```

**Step 8: Produce a DNS security summary**

```markdown
## DNS Security Status: [YOUR_DOMAIN]

| Control | Status | Record | Notes |
|---------|--------|--------|-------|
| SPF | ✅ / ❌ | v=spf1 ... | |
| DKIM | ✅ / ❌ | selector: [name] | |
| DMARC | ✅ Phase 1 / ❌ | p=none/quarantine/reject | |
| DNSSEC | ✅ / ❌ | — | |
| Subdomain takeover | ✅ / ⚠️ N found | — | |

**Actions taken:**
- [List each DNS record added or modified]

**Remaining tasks:**
- [ ] Review DMARC reports in 2 weeks
- [ ] Graduate DMARC to quarantine (2 weeks after monitoring)
- [ ] Graduate DMARC to reject (2 weeks after quarantine)
- [ ] Set calendar reminder for quarterly DNS audit
```

---

## What to expect

SPF, DKIM, and DMARC configured in monitoring mode (p=none) with aggregate reports being received. Subdomain takeover risks identified and resolved. DNSSEC enabled if the DNS provider supports it. A clear timeline for graduating DMARC to p=reject.

## Learn more

[DNS and Domain Security](../dns-domain-security.md)
[Harden Vercel](./harden-vercel.md)
[Deployment Security README](../README.md)
