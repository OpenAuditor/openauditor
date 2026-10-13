# LLM10: Unbounded Consumption

**LLM10:2025 · Rank #10 in the OWASP Top 10 for LLM Applications 2025 (merges "Model Denial of Service" and "Model Theft" from 2023) · Severity: High for anything with a public AI endpoint**

An LLM feature lets users (or attackers) consume model resources without effective limits. The result is a huge bill ("denial of wallet"), a service that's unavailable for real users, or a competitor quietly cloning your model's behaviour through your API.

---

## 30-Second Summary

Every LLM call costs money and compute, and the cost scales with input size, output size, images, tool calls and agent loops. Without limits, one script can:

- **Run up your bill:** long outputs, huge inputs, many parallel requests, agents that loop
- **Starve real users:** saturate your rate limits with the provider or your own GPUs
- **Extract your model:** send thousands of varied prompts and use the answers to train a copy (the old "Model Theft" category)

For a solo founder the bill is usually the real risk. A free tier with an AI feature and no per-user cap is an open tab.

**Real pattern:** In 2024 Sysdig documented "LLMjacking": attackers stole cloud credentials and used them to run expensive hosted models, estimating costs to the victim of tens of thousands of dollars per day if left unchecked. The same thing happens with leaked provider API keys pushed to GitHub. A leaked key and an unprotected endpoint are the same problem: someone else spending your money.

---

## Attack Scenarios

### 1. Output and Input Flooding

```python
# Prompts designed to produce maximum output
"Write a novel of at least 100,000 words about..."
"Repeat the letter A 50,000 times"

# Inputs designed to maximise input tokens
# 500-page PDFs, dozens of images per request, pasting the same document repeatedly,
# or forcing RAG to stuff the context window with retrieved chunks
```

### 2. Runaway Agents

```python
# VULNERABLE: no depth, step or budget limit
def run_agent(task: str):
    for subtask in plan(task):
        run_agent(subtask)          # "break every subtask into further subtasks"
```

### 3. Model Extraction

Systematic, varied queries collected to fine-tune a cheaper model that imitates yours. Only worth defending if your model or fine-tune is a genuine asset; if you're wrapping a public model, your exposure is cost, not theft.

---

## Defences

### 1. Cap Every Request

```typescript
// Hard limits on every call: output tokens, input size, time
const MAX_INPUT_CHARS = 20_000;

export async function POST(req: Request) {
  const user = await requireUser();
  const { message } = z.object({ message: z.string().min(1).max(MAX_INPUT_CHARS) }).parse(await req.json());

  const result = await generateText({
    model,
    prompt: message,
    maxOutputTokens: 800,                     // always set; never rely on the model default
    abortSignal: AbortSignal.timeout(30_000), // fail fast
  });

  await recordUsage(user.id, result.usage);   // provider-reported token counts
  return Response.json({ text: result.text });
}
```

Also cap: number of files and pages per upload, image count and resolution, retrieved chunks per query (`k`), and conversation length (summarise or truncate old turns).

### 2. Rate Limit and Budget Per User

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const today = () => new Date().toISOString().slice(0, 10); // UTC date

// Requests per minute, by authenticated user (not just IP)
const perMinute = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'ai:rpm' });

export async function checkAiAllowance(userId: string, plan: 'free' | 'pro') {
  const { success, reset } = await perMinute.limit(userId);
  if (!success) throw new HttpError(429, `Too many requests. Try again at ${new Date(reset).toISOString()}`);

  // Daily token budget by plan
  const budget = plan === 'free' ? 50_000 : 1_000_000;
  const used = Number(await redis.get(`ai:tokens:${userId}:${today()}`)) || 0;
  if (used >= budget) throw new HttpError(429, 'Daily AI allowance used. It resets at midnight UTC.');
}

export async function recordUsage(userId: string, usage: { totalTokens?: number }) {
  const key = `ai:tokens:${userId}:${today()}`;
  await redis.incrby(key, usage.totalTokens ?? 0);
  await redis.expire(key, 60 * 60 * 48);
}
```

- Budget in **tokens**, not pounds or dollars: prices change, token counts don't. Convert to cost in reporting only.
- Limit **concurrent** requests per user, not just requests per minute.
- Put stricter limits on free and anonymous users; require sign-up (and ideally a verified email) before any AI feature.

### 3. Set Hard Limits at the Provider

Application limits can have bugs. Most providers and AI gateways let you set **monthly spend limits and alerts per project or key**. Set them, use a separate key per environment, and keep production keys out of development machines. A capped key turns a disaster into an outage.

### 4. Bound Agents

```python
class BoundedAgent:
    MAX_DEPTH = 3
    MAX_STEPS = 20
    MAX_TOKENS = 200_000

    def __init__(self):
        self.steps = 0
        self.tokens = 0

    def run(self, task: str, depth: int = 0) -> str:
        if depth >= self.MAX_DEPTH or self.steps >= self.MAX_STEPS or self.tokens >= self.MAX_TOKENS:
            return "Stopped: agent budget reached."
        self.steps += 1
        response = llm.chat(task, max_tokens=1000)
        self.tokens += response.usage.total_tokens
        return "\n".join(self.run(sub, depth + 1) for sub in parse_subtasks(response.text))
```

### 5. Monitor and Alert

Alert on: a single user's daily tokens far above their usual, total daily spend above your threshold, spikes in 429s or timeouts, and many varied queries from one account (possible extraction). Route alerts somewhere you'll see them on a weekend. See [Alerting Setup](../../11-monitoring-and-observability/alerting-setup.md).

### 6. If Your Model Is the Asset

If you've invested in a fine-tune or proprietary model:

- Require authenticated accounts and agree terms that prohibit using outputs to train competing models
- Keep per-account volume low enough that collecting a useful training set is slow and visible
- Don't return token probabilities (logprobs) or other internals unless customers need them
- Watch for accounts with high volume and unusually diverse prompts

---

## Audit Checklist

- [ ] Every model call sets a maximum output token count and a timeout
- [ ] Input size, uploads, images, retrieved chunks and conversation length are capped
- [ ] Per-user rate limits (requests and concurrency) and daily token budgets by plan
- [ ] AI features require an authenticated account; free and anonymous use is tightly limited
- [ ] Provider-side spend limits and alerts are set; separate keys per environment
- [ ] Agents have depth, step and token budgets
- [ ] Token usage is recorded from provider responses and alerting covers spikes and spend thresholds
- [ ] If the model is proprietary: terms prohibit extraction, logprobs are off, extraction patterns are monitored

---

## Learn More

- [OWASP LLM10:2025 Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/)
- [LLM06: Excessive Agency](./LLM06-excessive-agency.md)
- [Rate Limiting](../../06-secure-coding/rate-limiting.md)
- [API Key Hygiene](../../08-ai-app-security/api-key-hygiene.md)
- [Alerting Setup](../../11-monitoring-and-observability/alerting-setup.md)
