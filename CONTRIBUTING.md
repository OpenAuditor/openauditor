# Contributing to OpenAuditor

OpenAuditor is built by the community. Your contributions make this toolkit better for everyone shipping code.

## What We Accept

- **New security guidance** — A vulnerability or pattern you've seen in the wild
- **Code examples** — Working, tested fixes for OWASP, MITRE, or CVE topics
- **Tool recommendations** — A SAST, DAST, or monitoring tool worth documenting
- **Real-world breach stories** — With permission, case studies that teach
- **Prompts** — Agent prompts that help developers implement security faster
- **Fixes to existing docs** — Typos, clarity, outdated recommendations
- **Translations** — Additional languages beyond English

## What We Don't Accept

- Marketing language or sales pitches
- Unsubstantiated claims about tools or techniques
- Content that requires proprietary access or special licenses
- SEO padding or duplicate content from other sources
- Anything that undermines the toolkit's integrity

## Before You Submit

1. **Read the relevant section** — Understand the style and depth we use
2. **Check the build prompt** — Is your contribution aligned with the toolkit's scope?
3. **Follow the format** — Use the templates for prompts and checklist items
4. **Test your code examples** — They must work. Tested on at least one stack.
5. **Cite sources** — If you reference a breach, paper, or tool, link it

## How to Contribute

### Small fix (typo, clarity, links)
Open a pull request directly with the change.

### New section or major update
1. Open an issue describing what you want to add
2. Wait for feedback from maintainers
3. Submit a PR once approved
4. Link your PR to the issue

### New prompt
1. Follow the [prompt template](./templates/negative-prompts.md)
2. Test it in Claude, Cursor, or Copilot
3. Include what you expect the agent to output
4. Place it in the relevant `prompts/` folder

### New vulnerability or pattern
1. Describe the risk clearly in 2–3 sentences
2. Explain the real-world impact (has this cost companies money?)
3. Provide at least one code example showing the risk
4. Provide at least one fix with code
5. Link to related OWASP, MITRE, or CVE material

## Style Guide

- **UK English spelling** — colour, organisation, behaviour
- **Plain English** — Write for a developer, not a security researcher
- **Be direct** — No padding, no marketing, no hedging
- **Explain the why** — Why does this matter? What breaks if you ignore it?
- **Real examples** — Actual breaches, real CVEs, production incidents
- **One-sentence summary first** — Every section opens with a 30-second explanation
- **Code examples must run** — No pseudocode, no "in theory" examples

## Tone

- Not condescending. You're writing for smart developers.
- Not alarmist. Facts and context, not fear.
- Direct. If it's dangerous, say so plainly.
- Practical. Every recommendation must have a code path.

## Review Process

1. Maintainers will review your PR within 7 days
2. We may ask for changes, citations, or testing
3. Once approved, we'll merge and credit you
4. Your contribution will be in the next release

## Questions?

Open an issue. We're here to help.

---

## Maintainers

OpenAuditor is maintained by [Baulin Technologies](https://baulin.tech) and contributors like you.
