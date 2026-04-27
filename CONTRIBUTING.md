# Contributing to OpenAuditor

OpenAuditor is built by the community. Your contributions make this toolkit better for every developer shipping code.

---

## Ways to Contribute

| Type | How |
|------|-----|
| 🐛 Found outdated or incorrect guidance | [Open an issue](https://github.com/OpenAuditor/openauditor/issues/new?template=bug_report.md) |
| 💡 Suggest a new section or prompt | [Start a discussion](https://github.com/OpenAuditor/openauditor/discussions/new?category=ideas) |
| 📝 Fix a typo or broken link | Open a pull request directly |
| 🔐 Responsible disclosure (security issue in our guidance) | Email security@baulin.tech |
| 🌍 Translate content | [Open an issue](https://github.com/OpenAuditor/openauditor/issues/new) and tag it `translation` |
| ⭐ Show support | Star the repo on GitHub |

---

## Making a Recommendation

Have a security tool, technique, or pattern you think belongs here?

1. **Go to [GitHub Discussions → Ideas](https://github.com/OpenAuditor/openauditor/discussions/new?category=ideas)**
2. Title it: `[Recommendation] Your idea here`
3. Describe:
   - What it covers and why it matters
   - Which section it belongs in
   - Any real-world examples or breaches that motivate it
   - Links to existing documentation or tools

Maintainers review all ideas within 7 days. Accepted recommendations are added to the roadmap and credited to you in the CHANGELOG.

---

## Submitting a Pull Request

### Small fix (typo, broken link, outdated code)
Open a PR directly — no issue needed.

### New content (section, prompt, guide)
1. [Open an issue](https://github.com/OpenAuditor/openauditor/issues/new?template=feature_request.md) describing the addition
2. Wait for a maintainer to confirm it fits the scope
3. Fork the repo, make your changes, submit a PR
4. Link your PR to the issue with `Closes #123`

### New prompt
1. Copy the structure from any existing prompt in a `prompts/` folder
2. Include: **When to use this**, **Works with**, the full agent prompt
3. Test it in at least one AI tool (Claude, Cursor, Copilot, etc.)
4. Place it in the relevant section's `prompts/` folder
5. Add it to [PROMPTS.md](./PROMPTS.md) under the correct category

---

## Content Standards

**We accept:**
- New security guidance grounded in real vulnerabilities or breaches
- Working, tested code examples
- Agent prompts that have been tested in at least one AI tool
- Tool recommendations with honest pros/cons (no marketing)
- Corrections to outdated or incorrect guidance

**We do not accept:**
- Marketing content or sponsored placements
- Unverified claims about tools or techniques
- Content requiring proprietary access or special licences
- Duplicate content from other sources without meaningful additions

---

## Style Guide

- **UK English** — colour, organisation, behaviour, licence
- **Plain English** — write for a developer, not a security researcher
- **30-second summary first** — every file opens with a `> **30-second summary:**` blockquote
- **Be direct** — if something is dangerous, say so plainly
- **Explain the why** — what breaks if this is ignored?
- **Real examples** — actual breaches, real CVEs, production incidents
- **Code must run** — no pseudocode, no "in theory" examples
- **No AI-generated filler** — every sentence must earn its place

---

## Review Process

1. A maintainer will review your PR within **7 days**
2. We may request changes, citations, or test evidence
3. Once approved, we merge and credit you in the CHANGELOG
4. Your GitHub username will appear under `Contributors` in the release notes

---

## Commit Message Format

```
type: short description (under 72 chars)

Optional longer explanation.
Fixes #123
```

Types: `fix`, `add`, `update`, `remove`, `docs`, `refactor`

Examples:
```
add: Kubernetes pod security standards guide
fix: outdated bcrypt cost factor recommendation in A07
update: Supabase auth patterns to use @supabase/ssr
```

---

## Maintainers

**Creator:** [Baffour D. Ampaw](https://baulin.tech) · Baulin Technologies  
**Maintainer:** [@baulintech](https://github.com/baulintech)

---

## Code of Conduct

Be respectful, be helpful, be direct. We're here to ship secure software — not to argue.

Harassment of any kind will result in an immediate ban. No exceptions.

---

## Questions?

Open a [GitHub Discussion](https://github.com/OpenAuditor/openauditor/discussions) — we're here to help.
