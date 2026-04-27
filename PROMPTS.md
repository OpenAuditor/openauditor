# Master Prompt Index

This is the master index of every agent prompt in OpenAuditor, organized by what you're trying to do, not by section.

**How to use:** Find your task below, copy the linked prompt, paste into Claude / Cursor / Copilot, and run it.

---

## 🚀 Getting Started

| Task | Prompt | Where |
|------|--------|-------|
| Set up pre-commit hooks from scratch | [Setup Pre-Commit](./01-pre-commit-hooks/prompts/setup-pre-commit.md) | Pre-commit hooks |
| Audit existing pre-commit config | [Audit Existing Hooks](./01-pre-commit-hooks/prompts/audit-existing-hooks.md) | Pre-commit hooks |
| Integrate pre-commit with CI | [CI Pre-Commit Integration](./01-pre-commit-hooks/prompts/ci-pre-commit-integration.md) | Pre-commit hooks |
| Generate a .gitignore for my stack | [Generate Gitignore](./templates/gitignore/prompts/generate-gitignore.md) | Templates |
| Run full production audit (before launch) | [Production Readiness Audit](./skills/production-readiness-audit/SKILL.md) | Skills |
| Check for deprecated / outdated AI-generated patterns | [Check Deprecated Patterns](./00-foundations/prompts/check-deprecated-patterns.md) | Foundations |

---

## 🔐 Secrets & Environment

| Task | Prompt | Where |
|------|--------|-------|
| Find and remove secrets from git history | [Audit Committed Secrets](./templates/gitignore/prompts/audit-committed-secrets.md) | Templates |
| Set up secure environment variables | [Secure Env Setup](./06-secure-coding/prompts/secure-env-setup.md) | Secure coding |
| Rotate API keys safely | (See Key Rotation guide) | [Key Rotation](./07-cryptography/key-rotation.md) |

---

## 🛡️ OWASP Vulnerabilities

### Web Top 10

| Vulnerability | Prompt | Where |
|---|---|---|
| **Full Web Top 10 Audit** | [Web Top 10 Audit](./02-owasp/prompts/web-top10-audit.md) | OWASP |
| **A01: Broken Access Control** | [Fix Broken Access Control](./02-owasp/prompts/fix-broken-access-control.md) | OWASP |
| **A02: Cryptographic Failures** | [Audit Crypto Usage](./07-cryptography/prompts/audit-crypto-usage.md) | Cryptography |
| **A03: Injection** | [Fix Injection](./02-owasp/prompts/fix-injection.md) | OWASP |
| **A04: Insecure Design** | (See Threat Modelling) | [Threat Modelling 101](./00-foundations/threat-modeling-101.md) |
| **A05: Security Misconfiguration** | [Harden Vercel](./09-deployment-security/prompts/harden-vercel.md) | Deployment |
| **A06: Vulnerable Components** | [Scan Dependencies](./04-cve-awareness/prompts/scan-dependencies.md) | CVE Awareness |
| **A07: Auth Failures** | [Fix Auth Failures](./02-owasp/prompts/fix-auth-failures.md) | OWASP |
| **A08: Data Integrity Failures** | (See Database Security) | [Database Security](./06-secure-coding/database-security.md) |
| **A09: Logging Failures** | [Setup Security Logging](./11-monitoring-and-observability/prompts/setup-security-logging.md) | Monitoring |
| **A10: SSRF** | [Fix Injection](./02-owasp/prompts/fix-injection.md) | OWASP |

### API Top 10

| Vulnerability | Prompt | Where |
|---|---|---|
| **Full API Top 10 Audit** | [API Top 10 Audit](./02-owasp/prompts/api-top10-audit.md) | OWASP |
| **API1: Broken Object-Level Auth** | [Secure API Routes](./06-secure-coding/prompts/secure-api-routes.md) | Secure coding |
| **API2: Broken Authentication** | [Fix Auth Failures](./02-owasp/prompts/fix-auth-failures.md) | OWASP |
| **API3: Broken Property-Level Auth** | [Secure API Routes](./06-secure-coding/prompts/secure-api-routes.md) | Secure coding |
| **API4: Unrestricted Resource Consumption** | [Add Rate Limiting](./06-secure-coding/prompts/add-rate-limiting.md) | Secure coding |
| **API5: Broken Function-Level Auth** | [Secure API Routes](./06-secure-coding/prompts/secure-api-routes.md) | Secure coding |
| **API6: Unrestricted Access to Sensitive Flows** | [Secure API Routes](./06-secure-coding/prompts/secure-api-routes.md) | Secure coding |
| **API7: SSRF** | [Fix Injection](./02-owasp/prompts/fix-injection.md) | OWASP |
| **API8: Security Misconfiguration** | [Harden Vercel](./09-deployment-security/prompts/harden-vercel.md) | Deployment |
| **API9: Improper Inventory Management** | [Supply Chain Audit](./05-supply-chain-security/prompts/supply-chain-audit.md) | Supply Chain |
| **API10: Unsafe Consumption of APIs** | [Package Vetting](./05-supply-chain-security/prompts/package-vetting.md) | Supply Chain |

### LLM Top 10

| Vulnerability | Prompt | Where |
|---|---|---|
| **Full LLM Top 10 Audit** | [LLM Top 10 Audit](./02-owasp/prompts/llm-top10-audit.md) | OWASP |
| **LLM01: Prompt Injection** | [Defend Prompt Injection](./08-ai-app-security/prompts/defend-prompt-injection.md) | AI Security |
| **LLM02: Insecure Output Handling** | (See Output Validation in Injection Defense) | [Prompt Injection Defense](./08-ai-app-security/prompt-injection-defense.md) |
| **LLM03: Training Data Poisoning** | (See Supply Chain for AI) | [AI Supply Chain](./08-ai-app-security/ai-supply-chain.md) |
| **LLM04: Model DoS** | [Add Rate Limiting](./06-secure-coding/prompts/add-rate-limiting.md) | Secure coding |
| **LLM05: Supply Chain** | [Supply Chain Audit](./05-supply-chain-security/prompts/supply-chain-audit.md) | Supply Chain |
| **LLM06: Sensitive Info Disclosure** | [Secure RAG Pipeline](./08-ai-app-security/prompts/secure-rag-pipeline.md) | AI Security |
| **LLM07: Insecure Plugin Design** | [Audit Agent Permissions](./08-ai-app-security/prompts/audit-agent-permissions.md) | AI Security |
| **LLM08: Excessive Agency** | [Audit Agent Permissions](./08-ai-app-security/prompts/audit-agent-permissions.md) | AI Security |
| **LLM09: Overreliance** | (See Human Layer) | [The Human Layer](./00-foundations/the-human-layer.md) |
| **LLM10: Model Theft** | (See AI Supply Chain) | [AI Supply Chain](./08-ai-app-security/ai-supply-chain.md) |

---

## 🔑 Authentication & Authorisation

| Task | Prompt | Where |
|------|--------|-------|
| Audit existing auth system | [Full Web Top 10 Audit](./02-owasp/prompts/web-top10-audit.md) | OWASP |
| Fix authentication vulnerabilities | [Fix Auth Failures](./02-owasp/prompts/fix-auth-failures.md) | OWASP |
| Implement bcrypt or Argon2 correctly | [Implement Password Hashing](./07-cryptography/prompts/implement-password-hashing.md) | Cryptography |
| Implement OAuth 2.0 correctly | (See OAuth Deep Dive) | [OAuth Deep Dive](./06-secure-coding/oauth-deep-dive.md) |
| Harden Supabase auth | [Secure Supabase RLS](./06-secure-coding/prompts/secure-supabase-rls.md) | Secure coding |
| Add rate limiting to APIs | [Add Rate Limiting](./06-secure-coding/prompts/add-rate-limiting.md) | Secure coding |
| Test auth flows | [Test Auth Flows](./10-security-testing/prompts/test-auth-flows.md) | Testing |
| Harden auth broadly | [Harden Auth](./06-secure-coding/prompts/harden-auth.md) | Secure coding |

---

## 📝 Input Validation & Injection

| Task | Prompt | Where |
|------|--------|-------|
| Add input validation | [Add Input Validation](./06-secure-coding/prompts/add-input-validation.md) | Secure coding |
| Fix SQL / XSS / command injection | [Fix Injection](./02-owasp/prompts/fix-injection.md) | OWASP |
| Implement CSP/CORS/security headers | [Add Security Headers](./06-secure-coding/prompts/add-security-headers.md) | Secure coding |

---

## 🗄️ Database Security

| Task | Prompt | Where |
|------|--------|-------|
| Set up Supabase RLS correctly | [Secure Supabase RLS](./06-secure-coding/prompts/secure-supabase-rls.md) | Secure coding |
| Harden database access | (See Database Security) | [Database Security](./06-secure-coding/database-security.md) |
| Fix SQL injection | [Fix Injection](./02-owasp/prompts/fix-injection.md) | OWASP |

---

## 📤 File Uploads

| Task | Prompt | Where |
|------|--------|-------|
| Secure file upload implementation | [Secure File Uploads](./06-secure-coding/prompts/secure-file-uploads.md) | Secure coding |

---

## 🔐 Cryptography

| Task | Prompt | Where |
|------|--------|-------|
| Audit all crypto usage in codebase | [Audit Crypto Usage](./07-cryptography/prompts/audit-crypto-usage.md) | Cryptography |
| Implement secure password hashing | [Implement Password Hashing](./07-cryptography/prompts/implement-password-hashing.md) | Cryptography |
| Understand key rotation strategy | (See Key Rotation guide) | [Key Rotation](./07-cryptography/key-rotation.md) |

---

## 🚀 Deployment & Infrastructure

| Task | Prompt | Where |
|------|--------|-------|
| Harden Vercel deployment | [Harden Vercel](./09-deployment-security/prompts/harden-vercel.md) | Deployment |
| Secure GitHub repo | [Secure GitHub Repo](./09-deployment-security/prompts/secure-github-repo.md) | Deployment |
| Set up secure preview deployments | [Setup Preview Deployments](./09-deployment-security/prompts/setup-preview-deployments.md) | Deployment |
| Configure SPF, DKIM, DMARC | [Configure DNS Security](./09-deployment-security/prompts/configure-dns-security.md) | Deployment |
| Integrate pre-commit with CI | [CI Pre-Commit Integration](./01-pre-commit-hooks/prompts/ci-pre-commit-integration.md) | Pre-commit hooks |

---

## 📦 Dependencies & Supply Chain

| Task | Prompt | Where |
|------|--------|-------|
| Audit full supply chain | [Supply Chain Audit](./05-supply-chain-security/prompts/supply-chain-audit.md) | Supply Chain |
| Vet a new package before installing | [Package Vetting](./05-supply-chain-security/prompts/package-vetting.md) | Supply Chain |
| Scan for vulnerable dependencies | [Scan Dependencies](./04-cve-awareness/prompts/scan-dependencies.md) | CVE Awareness |
| Evaluate CVE impact | [Evaluate CVE Impact](./04-cve-awareness/prompts/evaluate-cve-impact.md) | CVE Awareness |

---

## 🧪 Security Testing

| Task | Prompt | Where |
|------|--------|-------|
| Run SAST scan | [Run SAST Scan](./10-security-testing/prompts/run-sast-scan.md) | Testing |
| Test auth flows | [Test Auth Flows](./10-security-testing/prompts/test-auth-flows.md) | Testing |
| Fuzz API inputs | [Fuzz API Inputs](./10-security-testing/prompts/fuzz-api-inputs.md) | Testing |
| Run threat model against MITRE | [MITRE Threat Review](./03-mitre/prompts/mitre-threat-review.md) | MITRE |

---

## 🤖 AI App Security

| Task | Prompt | Where |
|------|--------|-------|
| Full LLM Top 10 audit | [LLM Top 10 Audit](./02-owasp/prompts/llm-top10-audit.md) | OWASP |
| Defend against prompt injection | [Defend Prompt Injection](./08-ai-app-security/prompts/defend-prompt-injection.md) | AI Security |
| Secure RAG pipeline | [Secure RAG Pipeline](./08-ai-app-security/prompts/secure-rag-pipeline.md) | AI Security |
| Audit agent permissions | [Audit Agent Permissions](./08-ai-app-security/prompts/audit-agent-permissions.md) | AI Security |

---

## 📊 Monitoring & Observability

| Task | Prompt | Where |
|------|--------|-------|
| Set up security logging | [Setup Security Logging](./11-monitoring-and-observability/prompts/setup-security-logging.md) | Monitoring |
| Configure alerting | [Configure Alerting](./11-monitoring-and-observability/prompts/configure-alerting.md) | Monitoring |

---

## 🛠️ Compliance & Privacy

| Task | Prompt | Where |
|------|--------|-------|
| Prepare for SOC 2 audit | [SOC 2 Readiness Audit](./13-soc2/prompts/soc2-readiness-audit.md) | SOC 2 |
| Run GDPR audit | [GDPR Audit](./12-privacy-and-gdpr/prompts/gdpr-audit.md) | Privacy |
| Add cookie consent banner | [Implement Cookie Consent](./12-privacy-and-gdpr/prompts/implement-cookie-consent.md) | Privacy |
| Implement right to erasure | [Add Right to Erasure](./12-privacy-and-gdpr/prompts/add-right-to-erasure.md) | Privacy |
| Determine compliance scope | [Compliance Triage](./14-compliance-lite/prompts/compliance-triage.md) | Compliance |

---

## 🚨 Incident Response

| Task | Prompt | Where |
|------|--------|-------|
| Respond to a breach | [Breach Response Runbook](./15-post-breach/prompts/breach-response-runbook.md) | Post-Breach |

---

## 📋 Checklists & Planning

| Task | Checklist | Where |
|------|-----------|-------|
| Pre-launch security checklist | [Pre-Launch Checklist](./16-checklists/pre-launch-checklist.md) | Checklists |
| MVP security checklist | [MVP Security Checklist](./16-checklists/mvp-security-checklist.md) | Checklists |
| Production hardening | [Production Hardening](./16-checklists/production-hardening.md) | Checklists |
| Incident response runbook | [Incident Response Runbook](./16-checklists/incident-response-runbook.md) | Checklists |

---

## 📚 Learning & Reference

| Task | Resource | Where |
|------|----------|-------|
| Understand threat modelling | [Threat Modelling 101](./00-foundations/threat-modeling-101.md) | Foundations |
| Learn MITRE ATT&CK for web apps | [ATT&CK for Web Apps](./03-mitre/attck-for-web-apps.md) | MITRE |
| Map MITRE to OWASP | [MITRE to OWASP Mapping](./03-mitre/mitre-to-owasp-mapping.md) | MITRE |
| Learn to read a CVE | [How to Read a CVE](./04-cve-awareness/how-to-read-a-cve.md) | CVE Awareness |
| Find tools for your task | [Tools Directory](./17-resources/tools-directory.md) | Resources |
| Security learning paths | [Learning Paths](./17-resources/learning-paths.md) | Resources |

---

## 🏪 Stack-Specific

### Next.js + Supabase

- [Next.js Pre-Commit Setup](./01-pre-commit-hooks/by-stack/nextjs.md)
- [Next.js Common Mistakes](./06-secure-coding/known-insecure-patterns/nextjs-common-mistakes.md)
- [Supabase Common Mistakes](./06-secure-coding/known-insecure-patterns/supabase-common-mistakes.md)
- [Next.js & React CVEs](./04-cve-awareness/critical-cves-by-stack/nextjs-react.md)

### Python

- [Python Pre-Commit Setup](./01-pre-commit-hooks/by-stack/python.md)
- [Python Common Mistakes](./06-secure-coding/known-insecure-patterns/python-common-mistakes.md)
- [Django Pre-Commit Setup](./01-pre-commit-hooks/by-stack/django.md)
- [Python CVEs](./04-cve-awareness/critical-cves-by-stack/python-pip.md)

### Node.js + Express

- [Node Pre-Commit Setup](./01-pre-commit-hooks/by-stack/node-express.md)
- [Node Common Mistakes](./06-secure-coding/known-insecure-patterns/node-common-mistakes.md)
- [Node/npm CVEs](./04-cve-awareness/critical-cves-by-stack/node-npm.md)

---

## 💡 Tips for Using These Prompts

1. **Copy the whole prompt** — Paste the entire agent prompt into your AI tool
2. **Give it context** — Tell the agent about your app first (what stack, what does it do)
3. **Follow its findings** — If it says "Critical", act on it before shipping
4. **Re-audit after fixes** — Run the same prompt again to confirm the fix worked
5. **Link to the deep-dive** — If a finding confuses you, read the linked OpenAuditor section

---

## Need a Prompt That's Not Here?

[Open an issue](https://github.com/baulintech/openauditor/issues) or [contribute one](./CONTRIBUTING.md).
