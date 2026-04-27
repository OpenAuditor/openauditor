# Prompt: Run SAST Scan

## When to use this

Use this when setting up CI security scanning for the first time, when auditing a codebase you've inherited, or before a release. SAST should run on every commit.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer setting up and interpreting SAST (Static Application Security Testing) for this codebase.

**Step 1: Identify the stack**
What languages and frameworks are in use? Identify the appropriate SAST tools:
- JavaScript/TypeScript: Semgrep + ESLint security plugin + CodeQL
- Python: Semgrep + Bandit
- Go: Semgrep + GoSec
- Multiple: Semgrep (covers all)

**Step 2: Run Semgrep**
Run a Semgrep scan with the security rule sets appropriate for this codebase:
```bash
semgrep --config=p/security-audit \
        --config=p/owasp-top-ten \
        --config=p/javascript \
        --config=p/typescript \
        --json \
        --output=semgrep-results.json .
```

If Semgrep is not installed, show how to install it and run it.

**Step 3: Interpret results**
For each finding:
- Is this a true positive or a false positive?
- What severity is this? (Critical, High, Medium, Low)
- What is the real-world exploit scenario?
- What is the exact fix?

Group findings by severity. Present Critical and High first.

**Step 4: Run ESLint security (if JavaScript/TypeScript)**
```bash
npx eslint --plugin security --ext .js,.ts,.jsx,.tsx .
```
Interpret key findings.

**Step 5: Run Bandit (if Python)**
```bash
bandit -r . -f txt --severity-level medium
```

**Step 6: Set up CI integration**
Create a GitHub Actions workflow that runs this scan on every PR:

```yaml
# .github/workflows/sast.yml
name: SAST Security Scan
on: [push, pull_request]
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/security-audit p/owasp-top-ten p/javascript p/typescript
```

**Step 7: Triage all findings**
For each finding:
- **Severity:** Critical / High / Medium / Low
- **File:** path:line
- **Issue:** What the tool found
- **Real risk:** Is this actually exploitable?
- **Fix:** Exact code change

---

## What to expect

A complete SAST audit with all findings triaged. You'll get: a working CI configuration, a prioritised list of genuine security issues with fixes, and dismissed false positives with explanations.

## Learn more

[SAST Overview](../sast-overview.md)
