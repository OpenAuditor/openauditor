# Start Here

This guide routes you to the right place based on where you are right now.

---

## Are you starting a new project?

You're building something new and want to ship secure from day one.

**Your next steps:**
1. Read [MVP Security Checklist](./16-checklists/mvp-security-checklist.md) — 15 essentials before you launch
2. Set up [pre-commit hooks](./01-pre-commit-hooks/README.md) — catch secrets before they leave your machine
3. Run [Production Readiness Audit](./skills/production-readiness-audit/SKILL.md) — one week before launch

**Time to first fix:** 2–4 hours  
**Time to production ready:** 2–3 days

---

## Are you auditing an existing app?

You have code in production (or about to ship) and need a security review.

**Your next steps:**
1. Load [Production Readiness Audit skill](./skills/production-readiness-audit/SKILL.md) into your AI agent
2. The skill will ask you questions, examine your code, and give you a priority list
3. Use [PROMPTS.md](./PROMPTS.md) to copy-paste fixes for each finding

**Time to first audit:** 2–4 hours  
**Time to fix findings:** 1–7 days depending on severity

---

## Do you need to fix a specific issue right now?

You know what's broken and need a fix.

**Pick your issue:**

- **Secrets are exposed** → [Pre-commit hooks guide](./01-pre-commit-hooks/hooks/gitleaks.md)
- **Access control is broken** → [Broken Access Control](./02-owasp/web-top10/A01-broken-access-control.md)
- **SQL injection risk** → [Injection guide](./02-owasp/web-top10/A03-injection.md)
- **Auth is weak** → [Auth best practices](./06-secure-coding/auth-best-practices.md)
- **CORS/CSP headers missing** → [Headers guide](./06-secure-coding/cors-csp-headers.md)
- **File uploads are risky** → [File upload security](./06-secure-coding/file-upload-security.md)
- **Prompt injection in AI app** → [Prompt injection defense](./08-ai-app-security/prompt-injection-defense.md)
- **Deployment is insecure** → [Vercel security](./09-deployment-security/vercel-security.md)
- **Don't know what to fix** → Use [PROMPTS.md](./PROMPTS.md) to find the right prompt

**Time to fix:** 15 minutes to 2 hours

---

## What happens if you skip security?

Real breach costs:
- **Reputational damage** — Users leave, investors pull out
- **Legal liability** — GDPR fines (4% of annual revenue), lawsuits
- **Operational chaos** — Incident response, forensics, notification, monitoring
- **Career damage** — "We got hacked" is not a resume bullet

The Uber breach (2016) cost them $100M+ in total impact. Equifax (2017) cost billions. You can afford 3 days now, or you'll pay millions later.

---

## Are you using an AI coding assistant?

All prompts in this toolkit work with:

| Tool | Type | How to use |
|------|------|-----------|
| Claude Code | CLI / Desktop | Paste prompt directly or load via CLAUDE.md |
| Cursor | IDE | Paste into Cmd+L chat or add to .cursorrules |
| GitHub Copilot | IDE / Web | Use `@workspace` in Copilot Chat |
| Gemini CLI | CLI | `gemini -p "$(cat prompt.md)"` |
| OpenAI Codex / ChatGPT | Web / API | Paste prompt into conversation |
| Windsurf | IDE | Paste into Cascade chat |
| Cline | VS Code extension | Paste into task |
| Aider | CLI | `aider --message "$(cat prompt.md)"` |
| Lovable | Web IDE | Paste into chat |
| Base44 | Web IDE | Paste into assistant |
| Emergent | Web IDE | Paste into chat |
| Replit Agent | Web IDE | Paste into agent tab |

**Important for all AI tools:** AI assistants are trained on code from multiple years and may generate deprecated patterns. Always verify generated code against current official documentation. See [Deprecation and Version Hygiene](./00-foundations/deprecation-and-version-hygiene.md).

---

## Do you have AI-generated code to audit?

If an AI tool wrote significant portions of your codebase:

1. Run [Check for Deprecated Patterns](./00-foundations/prompts/check-deprecated-patterns.md) — finds outdated APIs from old training data
2. Run [Production Readiness Audit](./skills/production-readiness-audit/SKILL.md) — finds security issues
3. Verify Supabase patterns at [supabase.com/docs](https://supabase.com/docs)
4. Verify Next.js patterns at [nextjs.org/docs](https://nextjs.org/docs)

---

## Need help?

- **Lost?** See [00 Foundations](./00-foundations/) for threat modelling basics
- **No security background?** Read [Threat Modeling 101](./00-foundations/threat-modeling-101.md)
- **Your stack is X?** Search [PROMPTS.md](./PROMPTS.md) for stack-specific guidance
- **AI-generated code?** See [Deprecation and Version Hygiene](./00-foundations/deprecation-and-version-hygiene.md)
- **Contributing?** See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**You are here. Pick a path above. Ship secure.**
