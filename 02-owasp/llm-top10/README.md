# OWASP LLM Top 10

**OWASP Top 10 for Large Language Model Applications: 2025 Edition**

This section covers the ten most critical security risks in applications that use large language models (LLMs), including chatbots, AI agents, RAG systems, and code generation tools.

---

## Why LLM Security Is Different

Traditional web security protects against code injection. LLM security protects against *semantic* injection: malicious instructions hidden in natural language. The attack surface is fundamentally different:

- **Inputs are unbounded natural language**: impossible to fully validate
- **Model behaviour is probabilistic**, not deterministic or provable
- **Context is opaque**: the model may "remember" injected instructions from earlier in the conversation
- **Actions can be real**: agentic LLMs can call APIs, write files, send emails

---

## The Ten Risks (2025 Edition)

| # | Risk | Severity | Changed from 2023 |
|---|------|----------|-------------------|
| LLM01 | [Prompt Injection](./LLM01-prompt-injection.md) | Critical | Same position; now includes multimodal injection |
| LLM02 | [Sensitive Information Disclosure](./LLM02-sensitive-information-disclosure.md) | High | Up from #6 |
| LLM03 | [Supply Chain](./LLM03-supply-chain.md) | High | Up from #5 |
| LLM04 | [Data and Model Poisoning](./LLM04-data-and-model-poisoning.md) | High | Was "Training Data Poisoning"; now includes RAG data |
| LLM05 | [Improper Output Handling](./LLM05-improper-output-handling.md) | High | Was "Insecure Output Handling" (#2) |
| LLM06 | [Excessive Agency](./LLM06-excessive-agency.md) | Critical | Up from #8; absorbs "Insecure Plugin Design" |
| LLM07 | [System Prompt Leakage](./LLM07-system-prompt-leakage.md) | Medium to High | **New** |
| LLM08 | [Vector and Embedding Weaknesses](./LLM08-vector-and-embedding-weaknesses.md) | High | **New** |
| LLM09 | [Misinformation](./LLM09-misinformation.md) | Medium to High | Was "Overreliance" |
| LLM10 | [Unbounded Consumption](./LLM10-unbounded-consumption.md) | High | Merges "Model Denial of Service" and "Model Theft" |

Dropped as separate entries in 2025: Insecure Plugin Design (now in LLM06), Model Denial of Service and Model Theft (now in LLM10).

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

**If you build a chatbot:** LLM01 (prompt injection), LLM05 (output handling), LLM07 (system prompt leakage), LLM09 (misinformation), LLM10 (cost limits).

**If you use RAG:** LLM08 (vector and embedding weaknesses), LLM02 (data disclosure), LLM04 (poisoning), LLM01 (indirect injection).

**If you run AI agents or MCP servers:** LLM06 (excessive agency), LLM01, LLM03 (supply chain: MCP servers and tools).

**If you fine-tune models:** LLM04 (poisoning), LLM03 (supply chain), LLM02 (PII in training data).

**If your AI feature is free or public:** LLM10 first. An uncapped endpoint is an open tab on your provider bill.

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
- [OWASP Top 10 for LLM Applications 2025 (official)](https://genai.owasp.org/llm-top-10/)
