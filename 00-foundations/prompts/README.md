# Agent Prompts for Threat Modeling and Security Design

This folder contains AI agent prompts designed to help your team perform threat modeling, analyze security risks, and prioritize mitigations.

## How to use these prompts

### For design reviews
When designing a new feature or system:
1. Sketch your architecture
2. Use **[Threat Discovery Agent](./threat-discovery.md)** to find potential threats
3. Use **[STRIDE Analysis Agent](./stride-analysis.md)** to systematically ask "what could go wrong?"
4. Use **[Risk Prioritization Agent](./risk-prioritization.md)** to decide what to fix first
5. Document decisions and mitigations

### For code review
Use **[Security Code Review Agent](./security-code-review.md)** to guide peer review of security-sensitive code.

### For incident response
Use **[Incident Analysis Agent](./incident-analysis.md)** to understand what happened and how to prevent it.

---

## Prompts in this folder

- **[threat-discovery.md](./threat-discovery.md)** — Generate threats for your architecture
- **[stride-analysis.md](./stride-analysis.md)** — Apply STRIDE framework to find attack vectors
- **[risk-prioritization.md](./risk-prioritization.md)** — Prioritize threats by impact/likelihood
- **[security-code-review.md](./security-code-review.md)** — Review code for common vulnerabilities
- **[incident-analysis.md](./incident-analysis.md)** — Analyze what happened during an incident

---

## What to expect

Each prompt is designed to:
- **Give context** (here's my system, here's my threat model)
- **Ask clarifying questions** (the agent will ask for details)
- **Generate structured output** (list of threats, prioritized risks, etc.)
- **Suggest mitigations** (specific, actionable fixes)

You'll see the agent ask questions like:
- "Does this system handle user authentication?"
- "What data is stored in the database?"
- "Who has access to admin functions?"

Answer truthfully. The more honest you are, the more useful the output.

---

## Integration with OpenAuditor sections

These prompts reference:
- [Threat Modeling 101](../threat-modeling-101.md) — The framework these prompts use
- [Secure by Default](../secure-by-default.md) — Principles the prompts check for
- [Risk Appetite Framework](../risk-appetite-framework.md) — How to evaluate and prioritize risks

---

## Tips for best results

1. **Have your architecture documented** (even a simple diagram helps)
2. **Be specific about your tech stack** (Node.js? Python? Database type?)
3. **Know your constraints** (what risks can you accept?)
4. **Involve your team** (a security engineer + a developer + product = better discussion)
5. **Document decisions** (write down what you decided and why)
6. **Revisit regularly** (threat modeling isn't one-time; redo it when architecture changes)

---

## Getting started

1. Read [Threat Modeling 101](../threat-modeling-101.md) if you're new to threat modeling
2. Sketch your system (5 minutes)
3. Open the **[Threat Discovery Agent](./threat-discovery.md)** prompt
4. Copy it and run it with Claude
5. Review the output
6. Document mitigations

---

**Learn more:**
- [Threat Modeling 101](../threat-modeling-101.md)
- [Secure by Default](../secure-by-default.md)
- [Risk Appetite Framework](../risk-appetite-framework.md)
