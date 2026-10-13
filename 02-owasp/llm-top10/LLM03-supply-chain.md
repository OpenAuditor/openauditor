# LLM03: Supply Chain

**LLM03:2025 · Rank #3 in the OWASP Top 10 for LLM Applications 2025 (up from #5 in 2023) · Severity: High**

LLM apps depend on models, adapters, datasets, MCP servers, agent tools, prompt libraries and SDKs that you didn't write. Any of them can be malicious, abandoned or quietly changed.

---

## 30-Second Summary

The AI supply chain has every classic software supply chain risk (typosquatted packages, compromised maintainers, vulnerable dependencies) plus some new ones: **model files that execute code when loaded**, **MCP servers and agent tools that see everything your agent sees**, **models and adapters with unknown training data**, and **AI coding assistants that invent package names** attackers then register.

For most indie and SaaS builders, the highest-risk links are not model weights but the **MCP servers, agent tools and npm/PyPI packages** you install to wire AI into your app.

**Real incident:** In September 2025, researchers found `postmark-mcp`, an npm package impersonating Postmark's email MCP server. It worked normally for 15 releases to build trust; version 1.0.16 added one line that silently BCC'd every email the agent sent to the attacker. Anyone whose AI assistant sent password resets, invoices or internal memos through it leaked them all.

---

## Supply Chain Map

```
Your application
├── Model provider API (OpenAI, Anthropic, Google, etc.)
├── Open-weight models and LoRA adapters (Hugging Face, community fine-tunes)
├── Datasets used for fine-tuning or evaluation
├── Embedding models and vector database
├── MCP servers and agent tools        <- highest risk for most apps
├── SDKs and frameworks (openai, @anthropic-ai/sdk, ai, langchain, llamaindex)
├── Prompt templates pulled from hubs
└── Packages your AI coding assistant suggested
```

---

## 1. MCP Servers and Agent Tools

An MCP server or agent tool runs with your agent's permissions and sees the data your agent handles. Installing one is equivalent to giving its author access to that data.

**Before installing an MCP server:**

- [ ] It is published by the vendor itself (check the vendor's docs link to this exact package or repo), not a lookalike name
- [ ] Pin an exact version (`"@vendor/mcp": "2.3.1"`, never `^2.3.1` or `latest`) and review diffs before upgrading
- [ ] Prefer remote MCP servers run by the vendor over community packages that run locally with your credentials
- [ ] Give it the narrowest credentials possible (a scoped API token, not your admin key)
- [ ] Run local servers in a container or sandbox with no access to your home directory or other secrets
- [ ] Read its tool descriptions: they are fed to your model and can carry prompt injection ("tool poisoning")

```jsonc
// .mcp.json: pinned versions, scoped tokens, nothing floating
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["-y", "@vendor/official-mcp@2.3.1"],   // exact version
      "env": { "API_TOKEN": "${EMAIL_SEND_ONLY_TOKEN}" } // send-only scope
    }
  }
}
```

Register tools from an allowlist so a dependency can't add new ones at runtime:

```python
APPROVED_TOOLS = {
    "search_docs": SearchDocsTool,
    "get_order_status": OrderStatusTool,
}

def register_tool(name: str, tool_class: type) -> None:
    if APPROVED_TOOLS.get(name) is not tool_class:
        raise ValueError(f"Tool '{name}' is not approved or the implementation changed")
```

---

## 2. Packages Your AI Assistant Invented

AI coding assistants sometimes suggest packages that don't exist. Attackers watch for commonly hallucinated names and publish malware under them (sometimes called "slopsquatting").

- Verify every unfamiliar package exists, has real history and is the one the docs point to before installing
- Check publish date, weekly downloads, repository link and maintainers
- Use a lockfile and `npm ci` / `pip install --require-hashes` in CI

See [Package Vetting](../../05-supply-chain-security/prompts/package-vetting.md) and [Typosquatting](../../05-supply-chain-security/typosquatting.md).

---

## 3. Model Files and Adapters

```python
# VULNERABLE: unpinned model, pickle weights allowed, remote code enabled
model = AutoModelForCausalLM.from_pretrained(
    "some-org/their-model",
    trust_remote_code=True,   # runs Python from the model repo on your machine
)
```

```python
# SECURE: pinned revision, safetensors only, no remote code
model = AutoModelForCausalLM.from_pretrained(
    "org/model",
    revision="3f2a9c1e8b7d...",   # exact commit hash, not a branch or tag
    use_safetensors=True,         # refuse pickle-based .bin weights
    trust_remote_code=False,
)
```

- **Pickle files execute code on load.** Prefer `.safetensors`; scan anything else before loading.
- **Pin by commit hash.** A repo owner can push new weights under the same name.
- **LoRA adapters and community fine-tunes** inherit every risk of the base model plus whatever the fine-tuner added. Treat them as untrusted code. See [LLM04: Data and Model Poisoning](./LLM04-data-and-model-poisoning.md).
- **Licences** are a supply chain risk too: some open-weight licences restrict commercial use or user counts. Check before you build a product on one.

---

## 4. Prompt Templates From Hubs

```python
# VULNERABLE: pulling a community prompt at runtime
prompt = hub.pull("some-user/agent-prompt")  # can change under you, may carry injection
```

Keep prompts in your repository, reviewed and versioned like code. If you start from a community template, copy it in, read it, and own it.

---

## 5. Model Providers

You are trusting the provider's security, uptime, data handling and model changes.

- Pin model versions where the provider allows it (dated model IDs rather than floating aliases) and run your evals before switching
- Check training, retention and data residency terms; see [LLM02: Sensitive Information Disclosure](./LLM02-sensitive-information-disclosure.md)
- Keep a thin abstraction so you can switch provider during an outage or incident, but don't build a framework for it
- Store provider API keys server-side only, with spend limits set in the provider dashboard

---

## Audit Checklist

- [ ] Every MCP server and agent tool is from the official vendor, pinned to an exact version and reviewed on upgrade
- [ ] MCP servers and tools run with scoped credentials and, if local, sandboxed
- [ ] Tools are registered from an allowlist
- [ ] Every package added on an AI assistant's suggestion was verified to be real and legitimate
- [ ] Lockfiles committed and enforced in CI; dependency scanning covers AI SDKs and frameworks
- [ ] Open-weight models and adapters pinned by commit hash, safetensors only, `trust_remote_code` off
- [ ] Model licences checked for commercial use
- [ ] Prompt templates live in version control, not fetched at runtime
- [ ] Model versions pinned and changes gated by evals

---

## Learn More

- [OWASP LLM03:2025 Supply Chain](https://genai.owasp.org/llmrisk/llm032025-supply-chain/)
- [AI Supply Chain](../../08-ai-app-security/ai-supply-chain.md)
- [Tool and Agent Security](../../08-ai-app-security/tool-and-agent-security.md)
- [Supply Chain Security](../../05-supply-chain-security/README.md)
- [LLM04: Data and Model Poisoning](./LLM04-data-and-model-poisoning.md)
- [LLM06: Excessive Agency](./LLM06-excessive-agency.md)
