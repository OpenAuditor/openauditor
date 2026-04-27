# Changelog

All notable changes to OpenAuditor are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [0.1.0] — 2026-04-25

### Added

- ✨ Initial release of OpenAuditor
- Core navigation: README, START-HERE, contributing guidelines
- 18 main security sections covering:
  - Foundations and threat modelling
  - Pre-commit hook setup
  - OWASP Top 10 (Web, API, LLM)
  - MITRE ATT&CK framework
  - CVE awareness and dependency scanning
  - Supply chain security
  - Secure coding practices
  - Cryptography essentials
  - AI app security (LLM-specific)
  - Deployment security
  - Security testing (SAST, DAST, fuzzing)
  - Monitoring and observability
  - Privacy and GDPR
  - SOC 2 compliance
  - Lite compliance guide (ISO 27001, PCI DSS, HIPAA)
  - Post-breach response
  - Pre-launch and production checklists
  - Resource directory
- Production Readiness Audit skill — comprehensive 18-domain audit with scoring
- 50+ copy-paste agent prompts for Cursor, Claude, Copilot, Windsurf, Cline, Aider
- Template .gitignore files for multiple stacks
- GitHub Actions security scanning templates
- MIT license

### Why This Release Matters

OpenAuditor fills a gap: there's no single, comprehensive, vibe-coder-friendly security audit toolkit. Security guides exist, but they're scattered, academic, or written for security professionals. This toolkit is written for developers who code first and need security to not get in the way.

### Not Included Yet

- Kubernetes security (coming v0.2)
- GraphQL security (coming v0.2)
- AWS/GCP hardening (coming v0.2)
- Video tutorials (coming v0.3)
- Automated questionnaire (coming v0.3)
- Multi-language translations (future)

---

## Versioning

- **0.1.x** — Content additions and clarifications
- **0.2.x** — New sections (Kubernetes, GraphQL, cloud platforms)
- **0.3.x** — Tooling and automation (questionnaires, integrations)
- **1.0.0** — Stable API and community-vetted best practices

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose changes.

## Maintenance Schedule

- **Patch updates** (0.1.1, 0.1.2, etc.) — As needed, within days
- **Minor updates** (0.2.0, 0.3.0) — Monthly reviews, rolling out new sections
- **Major updates** (1.0.0) — Stabilisation, major API changes
