# LLM04: Model Denial of Service

**Rank #4 — OWASP LLM Top 10 2025 | Severity: Medium**

Attackers send computationally expensive requests to LLM-powered applications, causing service degradation, excessive costs, or complete unavailability.

---

## 30-Second Summary

LLM inference is expensive — both in compute time and API cost. A single request with a 100,000-token context window can cost £1–5 and take 30+ seconds. Without rate limiting and token limits, an attacker can run up your API bill by thousands of pounds or make your service unavailable for real users.

**Real cost impact:** Unrestricted LLM API access costs real money. At $15/million output tokens (GPT-4), a single request generating 100,000 tokens costs $1.50. 1,000 concurrent such requests = $1,500. Without limits, this attack is trivially achievable.

---

## Attack Scenarios

### 1. Infinite Loop Prompting

```python
# Attacker sends prompts designed to generate maximum tokens
malicious_prompts = [
    "Write the complete works of Shakespeare",
    "List every country, city, and town in the world with their populations",
    "Write a novel about artificial intelligence, at least 100,000 words",
    "Repeat the letter A exactly 50,000 times",
    "Continue this sequence forever: 1, 2, 3, 4...",
]

# Without max_tokens limit, each could generate thousands of tokens
response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": malicious_prompt}],
    # No max_tokens = model generates until its own limit (4096-128k tokens)
)
```

### 2. Context Window Flooding

```python
# Attacker submits massive inputs to exhaust the context window
# Each character costs money even if most is truncated

# Image recognition: submitting 100 images in one request
# Document Q&A: submitting a 500-page PDF multiple times
# RAG: forcing retrieval of thousands of chunks

# The cost is in the INPUT tokens, not just output
```

### 3. Recursive Agent Chains

```python
# VULNERABLE — agent can spawn agents indefinitely
def run_agent(task: str, depth: int = 0):
    response = llm.chat(f"Break this task into subtasks: {task}")
    subtasks = parse_subtasks(response)
    
    for subtask in subtasks:
        run_agent(subtask, depth + 1)  # No depth limit!
        # Attacker sends: "Break into subtasks, each of which should also be broken into subtasks"
```

---

## Defences

### 1. Token Limits

```python
# Always set max_tokens based on your use case
def call_llm(prompt: str, use_case: str) -> str:
    MAX_TOKENS = {
        'chat_response': 500,          # Customer service reply
        'document_summary': 1000,       # Document summarisation
        'code_completion': 2000,        # Code generation
        'analysis_report': 3000,        # Detailed analysis
    }
    
    max_tokens = MAX_TOKENS.get(use_case, 500)  # Default to 500
    
    return openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,  # ALWAYS set this
    )

# Also limit input tokens
def truncate_input(text: str, max_chars: int = 10000) -> str:
    """Truncate input before sending to LLM to limit input token cost."""
    if len(text) > max_chars:
        logger.warning({'event': 'llm.input_truncated', 'original_length': len(text)})
        return text[:max_chars] + "\n[Content truncated for length]"
    return text
```

### 2. Rate Limiting for LLM Endpoints

```python
from upstash_ratelimit import Ratelimit, FixedWindow
from upstash_redis import Redis

# Rate limit by user — not just by IP (authenticated users can still DoS)
ratelimit = Ratelimit(
    redis=Redis.from_env(),
    limiter=FixedWindow(max_requests=10, window="1 m"),  # 10 LLM calls/minute
)

async def llm_endpoint(request: Request):
    user_id = get_current_user_id(request)
    
    # Rate limit by user
    result = await ratelimit.limit(f"llm:{user_id}")
    if not result.allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {result.reset_after_ms // 1000} seconds."
        )
    
    # Also add a cost-based rate limit
    user_daily_cost = await get_user_daily_cost(user_id)
    if user_daily_cost > DAILY_COST_LIMIT_USD:
        raise HTTPException(
            status_code=429,
            detail="Daily AI usage limit reached."
        )
    
    return await call_llm(request.body)
```

### 3. Request Timeout

```python
import asyncio

async def call_llm_with_timeout(prompt: str, timeout_seconds: int = 30) -> str:
    try:
        response = await asyncio.wait_for(
            openai.chat.completions.acreate(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
            ),
            timeout=timeout_seconds,
        )
        return response.choices[0].message.content
    except asyncio.TimeoutError:
        logger.warning({'event': 'llm.timeout', 'prompt_length': len(prompt)})
        return "Request timed out. Please try a simpler query."
```

### 4. Cost Monitoring and Alerts

```python
# Track API spend and alert on anomalies
class LLMCostMonitor:
    def __init__(self):
        self.redis = Redis.from_env()
    
    async def track_usage(self, user_id: str, model: str, 
                          input_tokens: int, output_tokens: int):
        # Pricing (approximate — check current OpenAI pricing)
        COSTS_PER_1K = {
            'gpt-4o': {'input': 0.0025, 'output': 0.01},
            'gpt-4o-mini': {'input': 0.00015, 'output': 0.0006},
        }
        
        pricing = COSTS_PER_1K.get(model, {'input': 0.01, 'output': 0.03})
        cost = (input_tokens / 1000 * pricing['input'] + 
                output_tokens / 1000 * pricing['output'])
        
        # Accumulate daily cost per user
        key = f"llm_cost:{user_id}:{date.today()}"
        daily_cost = await self.redis.incrbyfloat(key, cost)
        await self.redis.expire(key, 86400 * 7)  # Keep 7 days
        
        # Alert if user exceeds $5/day
        if daily_cost > 5.0:
            logger.warning({
                'event': 'llm.cost_alert',
                'user_id': user_id,
                'daily_cost_usd': daily_cost,
            })
        
        # Alert on total daily spend > $100
        total_key = f"llm_total_cost:{date.today()}"
        total = await self.redis.incrbyfloat(total_key, cost)
        if total > 100.0:
            await alert_team(f"LLM spend exceeded $100 today: ${total:.2f}")
```

### 5. Agent Depth and Action Limits

```python
# SECURE — limit recursive agent depth and total actions
class BoundedAgent:
    MAX_DEPTH = 3
    MAX_ACTIONS_PER_RUN = 20
    
    def __init__(self):
        self.action_count = 0
    
    def run(self, task: str, depth: int = 0) -> str:
        if depth >= self.MAX_DEPTH:
            return f"Max recursion depth reached. Completed {self.action_count} actions."
        
        if self.action_count >= self.MAX_ACTIONS_PER_RUN:
            return "Action limit reached. Stopping agent."
        
        self.action_count += 1
        
        response = llm.chat(task)
        subtasks = self.parse_subtasks(response)
        
        results = []
        for subtask in subtasks:
            if self.action_count >= self.MAX_ACTIONS_PER_RUN:
                break
            results.append(self.run(subtask, depth + 1))
        
        return '\n'.join(results)
```

---

## Audit Checklist

- [ ] `max_tokens` set on every LLM API call (never use the model default)
- [ ] Input length validated and truncated before sending to LLM
- [ ] Rate limiting applied to LLM endpoints by user (not just IP)
- [ ] Daily/monthly cost caps per user implemented
- [ ] Request timeout configured (fail fast, don't hang forever)
- [ ] LLM API spend monitored — alerts configured for anomalous usage
- [ ] Agentic loops have max depth and max action count limits
- [ ] Concurrent LLM requests limited per user (prevent parallel attacks)
- [ ] Free tier users have stricter limits than paid users

---

## Learn More

- [LLM08: Excessive Agency](./LLM08-excessive-agency.md)
- [Rate Limiting](../../06-secure-coding/rate-limiting.md)
- [API Key Hygiene](../../08-ai-app-security/api-key-hygiene.md)
