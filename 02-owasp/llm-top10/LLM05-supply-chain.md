# LLM05: Supply Chain Vulnerabilities

**Rank #5 — OWASP LLM Top 10 2025 | Severity: High**

LLM applications depend on third-party models, datasets, plugins, and services. A compromise anywhere in this supply chain propagates to your application.

---

## 30-Second Summary

LLM supply chain risks mirror traditional software supply chain risks but with unique twists. You're not just trusting code — you're trusting the *behaviour* of a model trained on data you've never seen. A compromised model provider, a malicious community plugin, or a poisoned prompt template can all compromise your application without any code changes on your end.

---

## Supply Chain Components at Risk

```
Your Application
    ├── LLM API Provider (OpenAI, Anthropic, Google)
    │       └── Their model training data and infrastructure
    ├── Third-party models (Hugging Face Hub, custom fine-tunes)
    │       └── Model weights — could contain backdoors
    ├── Prompt templates and libraries
    │       └── LangChain, LlamaIndex, community prompts
    ├── Vector databases and embedding models
    │       └── Data stored, embedding model behaviour
    ├── Plugins and tools
    │       └── Functions the agent can call
    └── Training/fine-tuning datasets
            └── Quality and safety of the data
```

---

## Risks and Mitigations

### 1. Compromised Model Weights

```python
# VULNERABLE — loading model weights without verification
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "some-org/their-model",  # Who is "some-org"? Is this trusted?
    # No integrity check
)

# SECURE — verify model file integrity before loading
import hashlib
from pathlib import Path

KNOWN_SAFE_HASHES = {
    # Hash of the model config and weights — verify against official release notes
    "config.json": "sha256:abc123...",
    "model.safetensors": "sha256:def456...",
}

def verify_model_files(model_dir: str):
    for filename, expected_hash in KNOWN_SAFE_HASHES.items():
        filepath = Path(model_dir) / filename
        algo, expected = expected_hash.split(':', 1)
        
        h = hashlib.new(algo)
        h.update(filepath.read_bytes())
        actual = h.hexdigest()
        
        if actual != expected:
            raise SecurityError(f"Model file {filename} failed integrity check!")

# Also prefer .safetensors format over .bin (pickle-based)
# .bin files (PyTorch format) can execute arbitrary code on load
# .safetensors cannot — much safer
model = AutoModelForCausalLM.from_pretrained("org/model", use_safetensors=True)
```

### 2. Malicious Community Plugins

```python
# VULNERABLE — loading community plugins without review
# LangChain tool from an unknown community source:
from langchain_community.tools import SomeCommunityTool
tool = SomeCommunityTool()  # What does this actually do?

# Plugin could: exfiltrate prompts, make unexpected API calls,
# read environment variables, or execute arbitrary code

# SECURE — audit every plugin you use
# Before adding any community plugin:
# 1. Review the source code on GitHub
# 2. Check the number of downloads and reviews
# 3. Check when it was last updated (abandoned = unpatched bugs)
# 4. Check maintainer reputation
# 5. Run in a sandboxed environment first
# 6. Review what network access and filesystem access it requests

# Implement tool allowlisting — only approved tools can be registered
APPROVED_TOOLS = {
    'search_database': SearchDatabaseTool,
    'send_email': EmailTool,  # internal implementation you've reviewed
    'get_weather': WeatherTool,  # simple API wrapper
}

def register_tool(name: str, tool_class: type):
    if name not in APPROVED_TOOLS:
        raise ValueError(f"Tool {name} is not in the approved list")
    if not isinstance(tool_class, APPROVED_TOOLS[name]):
        raise ValueError(f"Tool implementation mismatch for {name}")
```

### 3. Prompt Template Libraries

```python
# VULNERABLE — using community prompt templates without review
from langchain import hub

# These prompts are community-contributed and could contain:
# - Prompt injection backdoors
# - Instructions to exfiltrate data
# - Jailbreaks that look like legitimate templates
prompt = hub.pull("some-user/agent-prompt")

# SECURE — maintain your own prompt library
# Store prompts in your version-controlled codebase:
PROMPTS = {
    "customer_service": """You are a customer service assistant for Acme Corp.
    
Your goal: help customers with product questions and returns.
Your limits: do not discuss competitors, pricing strategy, or internal processes.
If asked anything outside this scope, say: "I can help with product and order questions."
""",
}

# Access via internal function — never from external source
def get_prompt(name: str) -> str:
    if name not in PROMPTS:
        raise KeyError(f"Unknown prompt: {name}")
    return PROMPTS[name]
```

### 4. Embedding Model Compromise

```python
# The embedding model converts text to vectors for your RAG system
# A compromised or backdoored embedding model could:
# - Make certain documents always/never retrieved
# - Cause semantic search to return attacker-controlled content

# SECURE — use official, versioned embedding models from major providers
from openai import OpenAI

client = OpenAI()

def create_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small",  # official OpenAI model, versioned
    )
    return response.data[0].embedding

# Pin the embedding model version in your deployment config
# Never use a community embedding model without thorough review
```

### 5. LLM API Provider Risk

```python
# Mitigate provider risk with:

# 1. Abstractions that allow provider switching
class LLMClient:
    def __init__(self, provider: str = "openai"):
        self.provider = provider
    
    def chat(self, messages: list) -> str:
        if self.provider == "openai":
            return self._openai_chat(messages)
        elif self.provider == "anthropic":
            return self._anthropic_chat(messages)
        elif self.provider == "local":
            return self._local_model_chat(messages)
    
    # If OpenAI goes down or is compromised, switch to Anthropic
    # without changing application code

# 2. Never send sensitive PII to external LLM providers
def sanitise_before_llm(text: str) -> str:
    # Remove emails, phone numbers, IDs before sending
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    return text

# 3. Log what you send to external providers (privacy-compliant summary)
logger.info({'event': 'llm.request', 'provider': 'openai', 
             'prompt_length': len(prompt), 'model': 'gpt-4o'})
# Never log the full prompt — it may contain PII
```

---

## Audit Checklist

- [ ] All third-party models verified against official integrity hashes
- [ ] `.safetensors` format preferred over `.bin` for PyTorch models
- [ ] Community plugins reviewed before integration (source code, maintainer, downloads)
- [ ] Prompt templates stored in version control, not fetched from external sources
- [ ] Embedding models pinned to a specific, official version
- [ ] LLM API provider is a major, reputable organisation
- [ ] PII and sensitive data sanitised before sending to external LLM APIs
- [ ] Tool/plugin allowlist maintained — no ad-hoc community tool additions
- [ ] Dependency scanning covers LLM-related packages (langchain, openai, etc.)

---

## Learn More

- [LLM03: Training Data Poisoning](./LLM03-training-data-poisoning.md)
- [AI Supply Chain](../../08-ai-app-security/ai-supply-chain.md)
- [Supply Chain Security](../../05-supply-chain-security/README.md)
- [LLM07: Insecure Plugin Design](./LLM07-insecure-plugin-design.md)
