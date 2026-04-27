# AI App Security

AI applications introduce a new category of vulnerabilities. This section covers prompt injection, RAG security, agent permissions, and API key hygiene.

---

## Why AI Apps Are Different

Traditional web apps have well-understood attack surfaces. AI apps add:
- **Prompt injection** — users can override your system prompt
- **Indirect injection** — malicious content in documents or data poisons the LLM's context
- **Excessive agency** — agents with too many permissions can be weaponised
- **Output trust** — using LLM output in code execution or database writes without validation
- **Supply chain** — models and plugins from untrusted sources

---

## What's Covered

| Guide | What You'll Learn |
|-------|------------------|
| [Prompt Injection Defense](./prompt-injection-defense.md) | Defending against jailbreaks and instruction override |
| [RAG Security](./rag-security.md) | Securing retrieval-augmented generation |
| [Tool and Agent Security](./tool-and-agent-security.md) | Sandboxing agents, tool permissions |
| [API Key Hygiene](./api-key-hygiene.md) | Managing LLM API keys safely |
| [AI Supply Chain](./ai-supply-chain.md) | Model provenance and compromised weights |

### Agent Prompts

- [Defend Prompt Injection](./prompts/defend-prompt-injection.md)
- [Secure RAG Pipeline](./prompts/secure-rag-pipeline.md)
- [Audit Agent Permissions](./prompts/audit-agent-permissions.md)

---

## Related Sections

- [OWASP LLM Top 10](../02-owasp/llm-top10/)
- [Supply Chain Security](../05-supply-chain-security/)
- [API Security](../06-secure-coding/api-security.md)
