# OpenAuditor Status

## Build Completion

| Section | Status | Files |
|---------|--------|-------|
| Core (README, START-HERE, PROMPTS, CHANGELOG) | ✓ Complete | 6 |
| 00 Foundations | ✓ Complete | 11 |
| 01 Pre-Commit Hooks | ✓ Complete | 15 |
| 02 OWASP (Web Top 10, API Top 10, LLM Top 10) | ✓ Complete | 40 |
| 03 MITRE ATT&CK | ✓ Complete | 6 |
| 04 CVE Awareness | ✓ Complete | 10 |
| 05 Supply Chain Security | ✓ Complete | 8 |
| 06 Secure Coding | ✓ Complete | 26 |
| 07 Cryptography | ✓ Complete | 8 |
| 08 AI App Security | ✓ Complete | 9 |
| 09 Deployment Security | ✓ Complete | 13 |
| 10 Security Testing | ✓ Complete | 11 |
| 11 Monitoring & Observability | ✓ Complete | 8 |
| 12 Privacy & GDPR | ✓ Complete | 11 |
| 13 SOC 2 | ✓ Complete | 10 |
| 14 Compliance Lite | ✓ Complete | 6 |
| 15 Post-Breach | ✓ Complete | 6 |
| 16 Checklists | ✓ Complete | 5 |
| 17 Resources | ✓ Complete | 4 |
| Skills (Production Readiness Audit) | ✓ Complete | 8 |
| Templates (Gitignore, env, GitHub Actions, negative prompts) | ✓ Complete | 15 |

**Total: 229 files across 18 sections**

## Current Version

**v1.0.0 — Initial Complete Release** (2026-04-27)

All 18 sections are complete with production-quality content, real-world breach examples, and copy-paste agent prompts for Claude, Cursor, GitHub Copilot, Windsurf, Cline, and Aider.

## What's Included

### Content
- ✓ OWASP Web Top 10 (2021) — all 10 categories with code fixes
- ✓ OWASP API Top 10 (2023) — all 10 categories with code fixes
- ✓ OWASP LLM Top 10 (2025) — all 10 categories with AI-specific defences
- ✓ MITRE ATT&CK for Web, SaaS, and AI apps
- ✓ MITRE to OWASP cross-reference mapping
- ✓ CVE triage framework with CVSS v3.1 guide
- ✓ Stack-specific CVE history (Node.js, Python, Next.js/React)
- ✓ Supply chain security (typosquatting, lockfile integrity, GitHub Actions pinning)
- ✓ 18 secure coding guides (auth, validation, headers, database, file upload, OAuth, WebSockets, etc.)
- ✓ 8 known-insecure-pattern guides (Next.js, Node.js, Python, Supabase)
- ✓ Cryptography guide (password hashing, encryption, never-roll-your-own, key rotation)
- ✓ AI app security (prompt injection, RAG security, tool permissions, excessive agency)
- ✓ Deployment security (Vercel, GitHub, Docker, DNS, HTTPS, preview environments, backups)
- ✓ Security testing (SAST, DAST, fuzzing, ZAP guide, manual testing, vulnerable sample apps)
- ✓ Monitoring and observability (what to log, alerting, anomaly detection, tools comparison)
- ✓ Privacy and GDPR (lawful basis, data minimisation, cookie consent, right to erasure, breach notification)
- ✓ SOC 2 (trust criteria, evidence collection, policy templates, tools comparison)
- ✓ Compliance lite (ISO 27001, PCI DSS, HIPAA awareness)
- ✓ Post-breach response (first 24 hours, forensics, GDPR timeline, user notification)

### Prompts (60+)
- ✓ Pre-commit setup, audit, CI integration
- ✓ OWASP Web Top 10 full audit
- ✓ OWASP API Top 10 full audit
- ✓ OWASP LLM Top 10 audit
- ✓ Fix broken access control, injection, auth failures
- ✓ MITRE threat review
- ✓ CVE scan and impact evaluation
- ✓ Supply chain audit and package vetting
- ✓ 8 secure coding prompts (rate limiting, headers, env, Supabase RLS, file uploads, etc.)
- ✓ AI security prompts (prompt injection defense, RAG pipeline, agent permissions)
- ✓ Deployment prompts (Vercel hardening, GitHub repo security, DNS security, preview deployments)
- ✓ Security testing prompts (SAST scan, fuzz inputs, test auth flows)
- ✓ Monitoring prompts (security logging, alerting)
- ✓ Privacy prompts (GDPR audit, cookie consent, right to erasure)
- ✓ SOC 2 readiness audit
- ✓ Compliance triage
- ✓ Breach response runbook
- ✓ Cryptography audit and password hashing implementation
- ✓ Foundations (threat discovery, STRIDE, risk prioritisation)

### Templates
- ✓ GitHub Actions: security scan, dependency check
- ✓ .gitignore for Next.js, Node.js, Python, AI apps, universal
- ✓ .env examples for Next.js+Supabase, Node.js, Python
- ✓ security.txt (RFC 9116 compliant)
- ✓ Negative prompts (anti-patterns for AI coding assistants)

### Skills
- ✓ Production Readiness Audit: SKILL.md, scoring rubric, report template, question bank
- ✓ Skill loaders for Cursor, Claude Code, GitHub Copilot

## Known Limitations

- **Not a certification program** — This is guidance, not a formal compliance audit
- **Not a replacement for security professionals** — For critical apps, hire specialists
- **Stack coverage** — Primarily Next.js, Python, Node.js, Django. Other stacks may vary.
- **Point-in-time advice** — Security evolves; check back for updates and watch for CVE advisories

## How to Use

1. **New project?** Start with [START-HERE.md](./START-HERE.md)
2. **Pre-launch audit?** Run the [Production Readiness Audit](./skills/production-readiness-audit/SKILL.md)
3. **Fixing a specific issue?** Browse [PROMPTS.md](./PROMPTS.md) for copy-paste prompts
4. **Want to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Maintenance

- **Last updated:** 2026-04-27
- **Next planned update:** 2026-05-27 (monthly cycle)
- **Maintained by:** Baulin Technologies + community contributors

## Feedback & Issues

Found a gap or inaccuracy? [Open an issue](https://github.com/baulintech/openauditor/issues).

## Roadmap

### v1.1.0 (May 2026)
- [ ] Kubernetes / container orchestration security section
- [ ] GraphQL-specific security guide
- [ ] AWS & GCP deployment hardening guides
- [ ] Additional stack CVE histories (Ruby, Go)

### v1.2.0 (June 2026)
- [ ] Community-contributed prompts review and merge
- [ ] Interactive risk calculator (web tool)
- [ ] Automated pre-audit questionnaire
- [ ] Video walkthroughs for complex topics

### v2.0.0 (Q3 2026)
- [ ] Multi-language translations
- [ ] CI/CD integration (GitHub App)
- [ ] Structured machine-readable audit format (JSON/YAML output)
- [ ] Commercial support tier (Baulin Technologies)
