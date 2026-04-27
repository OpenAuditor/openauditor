# 09 — Deployment Security

Deploying an application is where theoretical security meets the real world. Misconfigured deployments, exposed environment variables, insecure DNS settings, and missing HTTP headers are responsible for a significant share of real-world breaches — not sophisticated zero-days.

This section covers the full deployment surface: cloud platform settings, version control security, containerisation hardening, DNS configuration, HTTP response headers, preview deployment isolation, and backup strategies.

---

## What Is Covered

| File | What It Addresses |
|---|---|
| [vercel-security.md](./vercel-security.md) | Vercel platform settings, env var scoping, preview protection, IP allowlists |
| [github-security.md](./github-security.md) | Branch protection, CODEOWNERS, secret scanning, Dependabot, Actions security |
| [docker-hardening.md](./docker-hardening.md) | Non-root users, multi-stage builds, image scanning, .dockerignore |
| [serverless-edge-security.md](./serverless-edge-security.md) | Edge functions, cold start risks, least-privilege in serverless |
| [dns-domain-security.md](./dns-domain-security.md) | SPF, DKIM, DMARC, DNSSEC, domain locking, expiry monitoring |
| [https-headers-checklist.md](./https-headers-checklist.md) | Complete HTTP security headers table with recommended values |
| [preview-deployments.md](./preview-deployments.md) | Securing preview URLs, isolated data, environment separation |
| [backup-and-recovery.md](./backup-and-recovery.md) | 3-2-1 rule, Supabase backups, testing restores, RTO/RPO |

### Agent Prompts

| Prompt | Purpose |
|---|---|
| [prompts/harden-vercel.md](./prompts/harden-vercel.md) | Audit and harden a Vercel deployment |
| [prompts/secure-github-repo.md](./prompts/secure-github-repo.md) | Secure a GitHub repository end-to-end |
| [prompts/setup-preview-deployments.md](./prompts/setup-preview-deployments.md) | Safely configure preview deployments |
| [prompts/configure-dns-security.md](./prompts/configure-dns-security.md) | Configure SPF, DKIM, DMARC, and DNSSEC |

---

## Why Deployment Security Matters

### Real Incidents

- **Uber (2022)** — A contractor's credentials were harvested via social engineering. The attacker then moved laterally through production deployments because secrets were reused across environments.
- **Toyota (2023)** — An access key for a cloud storage service was accidentally committed to a public GitHub repository and left exposed for nearly five years, leaking location data on 2 million customers.
- **Twitch (2021)** — Misconfigured internal server access resulted in a 125 GB data dump including source code, internal tooling, and revenue figures.
- **CircleCI (2023)** — A malware-infected engineer laptop led to session token theft that gave attackers access to customer secrets stored in environment variables.

### The Deployment Attack Surface

```
Developer machine
       │
       ▼
Source control (GitHub / GitLab)
       │  ← branch protection, secret scanning, Actions security
       ▼
CI/CD pipeline
       │  ← secrets injection, least-privilege runners
       ▼
Build artefacts (Docker images, bundles)
       │  ← image hardening, SBOM, vulnerability scanning
       ▼
Deployment platform (Vercel, AWS, GCP)
       │  ← env var scoping, preview isolation, access controls
       ▼
Running application
       │  ← HTTP headers, TLS, DNS security
       ▼
End user
```

---

## Quick-Start Checklist

- [ ] All production secrets stored in a secrets manager, not `.env` files committed to version control
- [ ] Branch protection enabled on `main` with at least one required review
- [ ] CODEOWNERS file configured for sensitive directories
- [ ] Dependabot alerts enabled and actioned weekly
- [ ] GitHub Actions use minimum-privilege tokens (`permissions: read-all` by default)
- [ ] Docker images built from minimal base (distroless or alpine), non-root user
- [ ] Container images scanned with Trivy before push
- [ ] HTTP security headers verified with [securityheaders.com](https://securityheaders.com)
- [ ] SPF, DKIM, and DMARC records configured and passing
- [ ] Preview deployments password-protected or IP-restricted
- [ ] Automated daily backups with tested restore procedure
- [ ] Domain registrar lock enabled; expiry reminders at 90/30/7 days

---

## How to Use This Section

1. **Start with the checklist above** — fix obvious gaps immediately.
2. **Use the agent prompts** in `prompts/` to automate auditing and remediation.
3. **Read the detailed guides** for any area where you have gaps or uncertainty.
4. **Re-check after every major deployment change** — security settings are often silently reset by platform updates or new team members.

---

> **Critical:** Deployment security is not a one-time task. Every new service, environment variable, domain, and team member expands your attack surface. Build security checks into your deployment pipeline as automated gates, not manual reviews.
