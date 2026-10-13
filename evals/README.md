# Evals: Does the Audit Actually Find Bugs?

> **30-second summary:** `vulnerable-saas/` is a small Next.js 16 + Supabase + AI app with 18 deliberately planted security issues and 6 correct "decoy" patterns. Run the [Production Readiness Audit](../skills/production-readiness-audit/SKILL.md) against it in any AI coding tool, score the report against the [answer key](./answer-keys/vulnerable-saas.md), and record the result below. It's how we know whether a change to the skill made it better or worse.

**Never deploy `vulnerable-saas`.** It builds and runs, and every bug in it is real.

---

## Running an Eval

The agent must never see the answer key, or the result is meaningless.

```bash
# 1. Copy ONLY the fixture into a fresh folder outside this repo
cp -r evals/vulnerable-saas ~/eval-run/tasklane
cd ~/eval-run/tasklane
git init -q && git add -A && git commit -qm "initial"

# 2. Install the skill there (Claude Code shown; see the skill's load guides for other tools)
mkdir -p .claude/skills
cp -r /path/to/openauditor/skills/production-readiness-audit .claude/skills/
```

3. Open `~/eval-run/tasklane` in the tool and run the audit with this exact prompt, so runs are comparable:

   > Run the production-readiness-audit on this codebase. It is a Next.js 16 app on Vercel with Supabase. Answer the discovery questions yourself from the code where you can; assume no other documentation exists. Produce the full report. Do not change any files.

4. Save the full report as `evals/results/<YYYY-MM-DD>-<tool>-<model>.md`.
5. Score it against the [answer key](./answer-keys/vulnerable-saas.md) and add a row to the table below.

**Rules for a fair run**
- One run per tool and model per skill version. If you rerun, record both; LLM output varies.
- Don't hint, nudge or ask follow-up questions during the run.
- Score strictly by the key's partial-credit notes. When unsure, give 0.5 and write why in the results file.
- Note the skill commit hash you tested.

---

## Results

| Date | Tool | Model | Skill commit | Planted (of 18) | Critical (of 6) | False positives | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | No runs recorded yet |

---

## When to Run

- Before each release of the skill
- After any change to `skills/production-readiness-audit/`
- When a new major model or tool version ships

Running costs one long agent session per tool. Don't wire it into CI: the cost adds up and results vary between runs, so a per-release manual score is more useful than a flaky check.

---

## Contributing to the Fixture

New planted issues are welcome, especially for domains not yet covered (preview environments, privacy, incident readiness).

- Add the bug to `vulnerable-saas/` without comments or names that give it away
- Add it to the answer key with ID, domain, severity, location, accepted fix and partial-credit notes
- Bump the fixture version in the key; results from different fixture versions aren't comparable
- Make sure `npm run typecheck` still passes
