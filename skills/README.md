# Skills

Skills are multi-step security workflows designed to be loaded into AI coding assistants (Cursor, Claude, GitHub Copilot Agent, Windsurf) as a complete context-aware task.

Unlike simple prompts, skills are structured workflows that guide the AI through a complete investigation or implementation — with defined phases, decision points, and output formats.

---

## Available Skills

### Production Readiness Audit

**The flagship skill.** A comprehensive 18-domain security audit that produces a scored report with GREEN/AMBER/RED verdict.

| File | Purpose |
|------|---------|
| [SKILL.md](./production-readiness-audit/SKILL.md) | The full skill — copy this into your AI assistant |
| [Question Bank](./production-readiness-audit/question-bank.md) | 37 discovery questions used in Phase 1 |
| [Scoring Rubric](./production-readiness-audit/scoring-rubric.md) | How PASS/PARTIAL/FAIL maps to scores and verdicts |
| [Report Template](./production-readiness-audit/report-template.md) | Output template for the final audit report |

**Use when:**
- Before launch (first production deployment)
- After a significant architecture change
- When a security incident prompts a full review
- As an annual security assessment

---

## How to Load a Skill

### Cursor

1. Open Cursor
2. Press `Ctrl+Shift+P` → "Cursor: Open Composer"
3. Paste the contents of [SKILL.md](./production-readiness-audit/SKILL.md)
4. Press Enter — Cursor will begin the multi-step workflow

### Claude (claude.ai or Claude API)

1. Open a new conversation
2. Paste the contents of [SKILL.md](./production-readiness-audit/SKILL.md) as your first message
3. Claude will guide you through each phase

### GitHub Copilot Agent (VS Code)

1. Open VS Code with Copilot Chat enabled
2. Type `@workspace` then paste the skill content
3. Copilot will work through your codebase

### Windsurf

1. Open the Cascade panel
2. Paste the skill content
3. Windsurf will execute the multi-step workflow

---

## Difference Between Prompts and Skills

| | Prompts | Skills |
|--|---------|--------|
| Length | Short (1 page) | Long (5-20 pages) |
| Scope | Single task | Multi-phase workflow |
| Output | Findings for one area | Complete audit with scoring |
| Use | Fix a specific issue | Before-launch or annual review |
| Examples | "Add rate limiting" | "Full production readiness audit" |

---

## Learn More

- [Production Readiness Audit SKILL](./production-readiness-audit/SKILL.md)
- [Security Testing](../10-security-testing/README.md)
- [All Prompts](../PROMPTS.md)
