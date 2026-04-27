# AI Supply Chain Security

Models, plugins, and datasets sourced from untrusted providers can contain backdoors, biases, or compromised weights.

---

## Model Provenance

Before using any model, verify its source:

```python
# Only use models from verified, reputable sources
# Major providers: OpenAI, Anthropic, Google, Meta (Llama), Mistral AI

# If using HuggingFace — vet the model carefully:
# 1. Check the organisation (huggingface.co/openai is official)
# 2. Check download count and age (new models with no history = risk)
# 3. Check the model card for red flags
# 4. Check the safetensors format (safer than .bin pickle files)

from transformers import AutoModelForCausalLM

# Prefer safetensors format to avoid pickle-based RCE
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-1B",
    use_safetensors=True,  # requires safetensors, rejects pickle
)
```

---

## Avoiding Pickle-Based Model Files

PyTorch `.bin` files use Python's `pickle` format, which can execute arbitrary code on load.

```python
# DANGEROUS — pickle can execute code on load
model = torch.load('model.bin')  # don't do this with untrusted models

# SAFER — safetensors format cannot execute code
from safetensors.torch import load_file
tensors = load_file('model.safetensors')  # safe
```

---

## Plugin and Tool Verification

For MCP servers, LangChain tools, or other plugins:

```javascript
// Verify plugins before integrating
// 1. Source: Is this from the official provider or a trusted maintainer?
// 2. Permissions: What can this plugin do? (File system? Network? Database?)
// 3. Updates: Is it maintained? When was the last update?
// 4. Open source: Can you audit the code?

// For MCP servers — verify the server's identity
// Only use MCP servers over HTTPS with valid certificates
// Never use MCP servers from unknown sources
```

---

## Dataset Poisoning Awareness

If you're fine-tuning on external data:

- Data from the internet can be manipulated to introduce backdoors
- Poisoned training data can cause models to behave maliciously for specific triggers
- If fine-tuning, verify data provenance and scan for injection patterns
- Use differential privacy techniques where possible

---

## Checklist

- [ ] Models only sourced from verified providers or official HuggingFace orgs
- [ ] Safetensors format used instead of pickle (.bin) for downloaded models
- [ ] Plugin sources and permissions reviewed before integration
- [ ] Fine-tuning datasets come from verified sources
- [ ] Model checksums verified after download
- [ ] No public HuggingFace models with < 1000 downloads or < 6 months old (unless from known org)

---

## Learn More

- [Supply Chain Security](../05-supply-chain-security/)
- [OWASP LLM05: Supply Chain Vulnerabilities](../02-owasp/llm-top10/LLM05-supply-chain-vulnerabilities.md)
