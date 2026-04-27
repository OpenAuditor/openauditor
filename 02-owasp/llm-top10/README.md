# OWASP LLM Top 10

**OWASP Top 10 for Large Language Model Applications — 2025 Edition**

This section covers the ten most critical security risks in applications that use large language models (LLMs) — including chatbots, AI agents, RAG systems, and code generation tools.

---

## Why LLM Security Is Different

Traditional web security protects against code injection. LLM security protects against *semantic* injection — malicious instructions hidden in natural language. The attack surface is fundamentally different:

- **Inputs are unbounded natural language** — impossible to fully validate
- **Model behaviour is probabilistic** — not deterministic or provable
- **Context is opaque** — the model may "remember" injected instructions from earlier in the conversation
- **Actions can be real** — agentic LLMs can call APIs, write files, send emails

---

## The Ten Risks

| # | Risk | Severity |
|---|------|----------|
| LLM01 | [Prompt Injection](./LLM01-prompt-injection.md) | Critical |
| LLM02 | [Insecure Output Handling](./LLM02-insecure-output-handling.md) | High |
| LLM03 | [Training Data Poisoning](./LLM03-training-data-poisoning.md) | High |
| LLM04 | [Model Denial of Service](./LLM04-model-dos.md) | Medium |
| LLM05 | [Supply Chain Vulnerabilities](./LLM05-supply-chain.md) | High |
| LLM06 | [Sensitive Information Disclosure](./LLM06-sensitive-disclosure.md) | High |
| LLM07 | [Insecure Plugin Design](./LLM07-insecure-plugin-design.md) | High |
| LLM08 | [Excessive Agency](./LLM08-excessive-agency.md) | Critical |
| LLM09 | [Overreliance](./LLM09-overreliance.md) | Medium |
| LLM10 | [Model Theft](./LLM10-model-theft.md) | Medium |

---

## Who This Applies To

If your application does any of the following, this section is for you:

- Accepts user text that is sent to an LLM API (OpenAI, Anthropic, Google, etc.)
- Uses RAG (Retrieval-Augmented Generation) with a vector database
- Runs AI agents that can call tools, APIs, or execute actions
- Generates code that gets executed
- Uses LLM output in HTML, SQL, or shell commands
- Fine-tunes or trains models on user data

---

## Quick Priority Guide

**If you build a chatbot:** Focus on LLM01 (prompt injection), LLM02 (output handling), LLM06 (data disclosure).

**If you run AI agents:** Focus on LLM01, LLM07 (plugins), LLM08 (excessive agency).

**If you use RAG:** Focus on LLM01 (indirect injection in retrieved docs), LLM06, LLM03.

**If you fine-tune models:** Focus on LLM03 (training data poisoning), LLM05 (supply chain).

---

## Prompts for AI Coding Assistants

- [Defend Against Prompt Injection](../../08-ai-app-security/prompts/defend-prompt-injection.md)
- [Audit Agent Permissions](../../08-ai-app-security/prompts/audit-agent-permissions.md)
- [Secure RAG Pipeline](../../08-ai-app-security/prompts/secure-rag-pipeline.md)
- [LLM Top 10 Audit](../prompts/llm-top10-audit.md)

---

## Learn More

- [AI App Security Overview](../../08-ai-app-security/README.md)
- [Prompt Injection Defence](../../08-ai-app-security/prompt-injection-defense.md)
- [Agent Security](../../08-ai-app-security/tool-and-agent-security.md)
- [OWASP LLM Top 10 Official](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
