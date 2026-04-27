# LLM API Key Hygiene

LLM API keys are expensive to leak. A compromised key can rack up thousands in charges, be used to generate harmful content under your account, or expose your prompt templates.

---

## Never Expose API Keys to the Client

```javascript
// WRONG — key in client-side code or NEXT_PUBLIC_ variable
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY }); 
// Now in JS bundle, visible to everyone

// RIGHT — API calls made server-side only
// pages/api/chat.ts (server-side API route)
export default async function handler(req, res) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // server-only
  const completion = await openai.chat.completions.create({ ... });
  res.json({ content: completion.choices[0].message.content });
}
```

---

## Set Hard Spending Limits

In every LLM provider dashboard, set monthly spending limits:

- **OpenAI:** Settings → Billing → Usage limits → Hard limit
- **Anthropic:** Settings → Billing → Set limit
- **Google AI (Gemini):** Cloud Console → APIs → Quotas

Set the limit to 2-3x your expected monthly spend. This prevents a compromised key from generating unlimited costs.

---

## Use Scoped Keys Where Possible

```javascript
// OpenAI supports project-specific keys with limited permissions
// Create separate keys for: development, staging, production
// Use project keys instead of organisation keys

// Anthropic — each API key tied to workspace
// Use separate workspaces for different environments

// Never share one key across all environments
```

---

## Rotate Keys Regularly

- Rotate every 90 days at minimum
- Rotate immediately if potentially exposed
- Rotate when a team member who had access leaves

```bash
# Process: generate new key first, then revoke old
1. Generate new API key in provider dashboard
2. Update environment variable / secret manager
3. Deploy new key
4. Verify app works with new key
5. Revoke old key
```

---

## Monitor Usage

Set up alerts for:
- Unusual spike in API calls (10x normal)
- Calls from unexpected IPs (if you know your server IPs)
- Calls at unusual times (3am with no deploys)

```javascript
// Log every LLM call with metadata for monitoring
console.log({
  event: 'llm_call',
  model: 'claude-sonnet-4-6',
  promptTokens: usage.input_tokens,
  completionTokens: usage.output_tokens,
  userId: req.user?.id,
  timestamp: new Date().toISOString(),
});
```

---

## Rate Limit Your AI Endpoints

```javascript
// LLM API calls are expensive — rate limit per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,                   // 50 AI requests per hour per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'AI request limit reached. Upgrade for more.' },
});

app.use('/api/ai', aiRateLimiter);
```

---

## Checklist

- [ ] API keys stored in environment variables, not in code
- [ ] No API key in NEXT_PUBLIC_ or other client-exposed variables
- [ ] Hard spending limits set in all LLM provider dashboards
- [ ] Separate keys for dev, staging, and production
- [ ] Key rotation schedule defined (90-day minimum)
- [ ] Usage monitoring and anomaly alerts configured
- [ ] AI endpoints rate-limited per user

---

## Learn More

- [Environment Secrets Management](../06-secure-coding/env-secrets-management.md)
- [OWASP LLM06: Sensitive Info Disclosure](../02-owasp/llm-top10/LLM06-sensitive-info-disclosure.md)
