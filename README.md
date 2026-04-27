# OpenAuditor: Security Audit Toolkit for Indie Hackers

**A production security audit framework for developers who ship fast and ship secure.**

OpenAuditor is an open source security audit toolkit built for indie hackers, vibe coders, and developers who need to ship to production without compromising on security. Whether you're launching an MVP, scaling an existing app, or responding to a breach, OpenAuditor gives you the checklists, code examples, and agent prompts you need to audit and harden your application in days, not months.

---

## What's Inside

| Section | What You Get |
|---------|-------------|
| **[00 Foundations](./00-foundations/)** | Threat modelling, risk appetite, the human layer of security |
| **[01 Pre-Commit Hooks](./01-pre-commit-hooks/)** | Secrets detection, SAST, automated scanning before you commit |
| **[02 OWASP Top 10](./02-owasp/)** | Web Top 10, API Top 10, LLM Top 10 with code fixes |
| **[03 MITRE ATT&CK](./03-mitre/)** | Threat framework for web, SaaS, and AI apps |
| **[04 CVE Awareness](./04-cve-awareness/)** | How to read CVEs, CVSS scoring, dependency scanning |
| **[05 Supply Chain Security](./05-supply-chain-security/)** | npm risks, typosquatting, lockfile integrity |
| **[06 Secure Coding](./06-secure-coding/)** | Auth, validation, headers, database security, file uploads |
| **[07 Cryptography](./07-cryptography/)** | Password hashing, encryption, token generation |
| **[08 AI App Security](./08-ai-app-security/)** | Prompt injection, RAG security, tool permissions, API keys |
| **[09 Deployment Security](./09-deployment-security/)** | Vercel, GitHub, Docker, DNS, HTTPS headers |
| **[10 Security Testing](./10-security-testing/)** | SAST, DAST, manual testing, fuzzing, OWASP ZAP |
| **[11 Monitoring & Observability](./11-monitoring-and-observability/)** | What to log, alerting, anomaly detection |
| **[12 Privacy & GDPR](./12-privacy-and-gdpr/)** | GDPR essentials, data minimisation, breach notification |
| **[13 SOC 2](./13-soc2/)** | Trust criteria, evidence collection, policy templates |
| **[14 Compliance Lite](./14-compliance-lite/)** | ISO 27001, PCI DSS, HIPAA basics |
| **[15 Post-Breach](./15-post-breach/)** | First 24 hours, user notification, forensics |
| **[16 Checklists](./16-checklists/)** | Pre-launch, MVP, production hardening, incident response |
| **[17 Resources](./17-resources/)** | Tools directory, learning paths, certifications |

---

## Quick Start

### Starting a New Project?
1. Read [START-HERE.md](./START-HERE.md)
2. Use the [MVP Security Checklist](./16-checklists/mvp-security-checklist.md)
3. Run the [Production Readiness Audit](./skills/production-readiness-audit/SKILL.md) before launch

### Auditing an Existing App?
1. Load the [Production Readiness Audit skill](./skills/production-readiness-audit/SKILL.md) into Claude, Cursor, or Copilot
2. Copy a prompt from [PROMPTS.md](./PROMPTS.md) for your specific issue
3. Fix findings and re-audit the failed domains

### Fixing a Specific Issue?
- [Broken access control?](./02-owasp/web-top10/A01-broken-access-control.md)
- [Injection attack risk?](./02-owasp/web-top10/A03-injection.md)
- [Exposed secrets?](./01-pre-commit-hooks/hooks/gitleaks.md)
- [Auth is weak?](./06-secure-coding/auth-best-practices.md)
- [CORS errors?](./06-secure-coding/cors-csp-headers.md)
- [AI app at risk?](./08-ai-app-security/prompt-injection-defense.md)

Browse [PROMPTS.md](./PROMPTS.md) for the full prompt index.

---

## Created By

**[Baffour D. Ampaw](https://baulin.tech)** · Founder, [Baulin Technologies](https://baulin.tech)

Maintained by Baffour and the open source community.

---

## Contributing

Contributions are welcome — new prompts, vulnerability guides, code fixes, and translations.

- **Found a bug or outdated guidance?** [Open an issue](https://github.com/OpenAuditor/openauditor/issues)
- **Want to add a section or prompt?** Read [CONTRIBUTING.md](./CONTRIBUTING.md) first
- **Security vulnerability in the toolkit?** See [SECURITY.md](./SECURITY.md)
- **General discussion?** Use [GitHub Discussions](https://github.com/OpenAuditor/openauditor/discussions)

## Versioning

This project follows [Semantic Versioning](https://semver.org). Current version: **v1.0.0**

See [CHANGELOG.md](./CHANGELOG.md) for the full release history.

## License

MIT — free to use, modify, and distribute. See [LICENSE](./LICENSE) for details.

## Status

241 files · 18 sections · 60+ prompts. See [STATUS.md](./STATUS.md) for full details.

---

## Key Features

✓ **Vibe-coder friendly** — Written for developers, not security experts  
✓ **Works with all major AI coding tools** — Claude Code, Cursor, GitHub Copilot, Gemini CLI, OpenAI Codex, Windsurf, Cline, Aider, Lovable, Base44, Emergent, Replit Agent  
✓ **Real-world context** — Examples from actual breaches (Uber, Twitch, Log4Shell, etc.)  
✓ **Stack-specific guidance** — Next.js + Supabase, Python, Node.js + Express, Django  
✓ **No security theater** — Practical, not hypothetical  
✓ **Automated checklists** — Pre-commit hooks, SAST, supply chain scanning  
✓ **Compliance ready** — SOC 2, GDPR, ISO 27001 templates included  
✓ **Deprecation-aware** — Flags outdated patterns AI tools generate from old training data  

---

## ⚠️ A Note on AI-Generated Code

All AI coding assistants (including those this toolkit runs in) are trained on code that spans several years. They may generate deprecated APIs, removed patterns, or insecure legacy approaches — not out of malice, but because those patterns appear frequently in training data.

**Always verify AI-generated code against the current official documentation** before shipping. The [Deprecation and Version Hygiene](./00-foundations/deprecation-and-version-hygiene.md) guide covers the most common outdated patterns by stack.

---

## Before You Ship

Every section includes a "Why this matters" explainer that shows real-world consequences. Security is not optional—it's the difference between being hacked or not. Use this toolkit.
