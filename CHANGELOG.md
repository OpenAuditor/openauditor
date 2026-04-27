# Changelog

All notable changes to OpenAuditor are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-27

First complete, production-ready release.

### Added

**Core**
- README, START-HERE, PROMPTS master index, CONTRIBUTING, SECURITY, CHANGELOG, STATUS
- MIT licence

**00 Foundations** (11 files)
- Threat modelling 101, secure by default, risk appetite framework
- The human layer, why security matters, glossary
- Deprecation and version hygiene — detecting outdated AI-generated patterns
- Prompt agents: STRIDE analysis, threat discovery, risk prioritisation, deprecated pattern check

**01 Pre-Commit Hooks** (15 files)
- Stack guides: Next.js, Node/Express, Python, Django
- Hook guides: gitleaks, detect-secrets, TruffleHog, Semgrep, npm-audit
- Prompts: setup, audit existing hooks, CI integration

**02 OWASP** (40 files)
- Web Top 10 (2021): A01–A10 with code fixes
- API Top 10 (2023): API1–API10 with code fixes
- LLM Top 10 (2025): LLM01–LLM10 with AI-specific defences
- Prompts: full Web audit, API audit, LLM audit, fix broken access control, fix injection, fix auth failures

**03 MITRE ATT&CK** (6 files)
- ATT&CK for web apps, SaaS, and AI apps
- MITRE to OWASP cross-reference mapping with attack chain examples
- Prompt: MITRE threat review

**04 CVE Awareness** (10 files)
- How to read a CVE, CVSS v3.1 scoring guide, dependency scanning
- Stack CVE histories: Node/npm, Python/pip, Next.js/React
- Staying current (NVD, CISA KEV, Dependabot)
- Prompts: scan dependencies, evaluate CVE impact

**05 Supply Chain Security** (8 files)
- npm package risks, typosquatting, lockfile integrity, dependency confusion
- Auditing a package guide
- Prompts: supply chain audit, package vetting

**06 Secure Coding** (26 files)
- Auth best practices, input validation, CORS/CSP headers, database security
- File upload security, rate limiting, error handling, env/secrets management
- OAuth deep dive, WebSocket security, multi-tenancy patterns, third-party scripts, API security
- Known insecure patterns: Next.js, Node.js, Python, Supabase
- Prompts: harden auth, add rate limiting, add input validation, add security headers,
  secure API routes, secure env setup, secure file uploads, secure Supabase RLS

**07 Cryptography** (8 files)
- Password hashing, encryption basics, secure random tokens
- Never roll your own crypto, key rotation
- Prompts: audit crypto usage, implement password hashing

**08 AI App Security** (9 files)
- Prompt injection defence, RAG security, tool and agent security
- AI supply chain, API key hygiene
- Prompts: defend prompt injection, secure RAG pipeline, audit agent permissions

**09 Deployment Security** (13 files)
- Vercel security, GitHub security, Docker hardening
- DNS and domain security (SPF/DKIM/DMARC), HTTPS headers checklist
- Preview deployments, serverless/edge security, backup and recovery
- Prompts: harden Vercel, secure GitHub repo, configure DNS security, setup preview deployments

**10 Security Testing** (11 files)
- SAST overview, DAST overview, OWASP ZAP guide
- Manual testing guide, fuzzing inputs, testing your auth
- Vulnerable sample apps (WebGoat, DVWA, Juice Shop, crAPI, PortSwigger)
- Prompts: run SAST scan, fuzz API inputs, test auth flows

**11 Monitoring & Observability** (8 files)
- What to log, what NOT to log, alerting setup, anomaly detection
- Tools comparison (Logtail, Axiom, Datadog, Sentry)
- Prompts: setup security logging, configure alerting

**12 Privacy & GDPR** (11 files)
- UK GDPR for founders, lawful basis, data minimisation, privacy by design
- Cookie consent, right to erasure, breach notification
- Prompts: GDPR audit, implement cookie consent, add right to erasure

**13 SOC 2** (10 files)
- SOC 2 for SaaS startups, trust service criteria, evidence collection, tools comparison
- Policy templates: access control, incident response, data retention, vendor management
- Prompt: SOC 2 readiness audit

**14 Compliance Lite** (6 files)
- Which compliance applies to you, ISO 27001, PCI DSS, HIPAA awareness
- Prompt: compliance triage

**15 Post-Breach** (6 files)
- First 24 hours, forensic evidence, GDPR 72-hour timeline, user notification guide
- Prompt: breach response runbook

**16 Checklists** (5 files)
- MVP security checklist, pre-launch checklist, production hardening, incident response runbook

**17 Resources** (4 files)
- Tools directory, learning paths, certifications, community resources

**Skills** (8 files)
- Production Readiness Audit: SKILL.md, scoring rubric, report template, question bank
- Skill loaders: Cursor, Claude Code, GitHub Copilot, Gemini/Codex/Lovable/Replit/others

**Templates** (15 files)
- GitHub Actions: security scan, dependency check
- .gitignore: Next.js, Node.js, Python, AI apps, universal
- .env examples: Next.js+Supabase, Node.js, Python
- security.txt (RFC 9116), negative prompts guide

---

## Versioning Scheme

| Version range | Meaning |
|---------------|---------|
| `1.0.x` | Patches — typo fixes, clarifications, broken links |
| `1.x.0` | Minor — new content, new prompts, new stack coverage |
| `x.0.0` | Major — structural changes, breaking prompt format changes |

Versions are tagged on GitHub: [github.com/OpenAuditor/openauditor/releases](https://github.com/OpenAuditor/openauditor/releases)

---

## Roadmap

### [1.1.0] — May 2026
- [ ] Kubernetes and container orchestration security
- [ ] GraphQL security guide
- [ ] AWS and GCP deployment hardening
- [ ] Additional CVE stack histories (Ruby, Go, Rust)

### [1.2.0] — June 2026
- [ ] Community-reviewed prompt contributions
- [ ] Interactive risk calculator (web tool)
- [ ] Automated pre-audit questionnaire

### [2.0.0] — Q3 2026
- [ ] Machine-readable audit output format (JSON/YAML)
- [ ] GitHub App integration
- [ ] Multi-language translations
