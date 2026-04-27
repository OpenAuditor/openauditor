# Pre-Commit Hooks: Catch Secrets Before They're Committed

**30-second summary:** Pre-commit hooks are automation that runs tests, checks, and scans before code is committed to git. This module teaches you to set up six essential security hooks that catch leaked secrets, vulnerable dependencies, and common misconfigurations in seconds—before they reach your repository or CI pipeline.

## What This Section Covers

1. **Hooks overview** — What they are, how they work, why they matter
2. **Hook catalog** — Six production hooks: detect-secrets, gitleaks, trufflehog, semgrep, npm-audit-hook, and git-lfs
3. **Stack-specific setups** — Exact configs for Next.js, Python, Django, Node/Express
4. **CI integration** — Wiring pre-commit checks into GitHub Actions, GitLab CI, etc.
5. **Agent prompts** — Copy-paste tasks to set up, audit, and integrate hooks

## Why This Matters

**Real-world cost of secrets in git:**

| Incident | Impact | Root Cause |
|----------|--------|-----------|
| **AWS breach (2019)** | $4M+ costs, exposed DB credentials | Secrets committed, scanned by bots, used for cryptomining |
| **GitHub secret exposure** | 10K+ API keys leaked per week | No pre-commit scanning |
| **Docker Hub incident (2019)** | 190M users' database records | Container registry credentials in git |

**What pre-commit hooks prevent:**
- API keys, database passwords, private keys reaching git
- Vulnerable dependencies shipped to production
- Hardcoded credentials in env files
- Binary files accidentally versioned (`.env`, keyfiles)
- Code quality regressions before review

## The Six Essential Hooks

| Hook | Purpose | Speed | Coverage | False Positives |
|------|---------|-------|----------|-----------------|
| **detect-secrets** | Find hardcoded secrets using regex + heuristics | Fast (100ms) | Passwords, API keys, tokens | Medium (~5%) |
| **gitleaks** | Deep scan for known secret patterns | Fast (50ms) | Comprehensive secret patterns | Low (<1%) |
| **trufflehog** | Entropy-based secret detection (what bots use) | Medium (500ms) | Novel secrets, custom patterns | Low (<2%) |
| **semgrep** | Static analysis for OWASP Top 10 + custom rules | Slow (2-5s) | SQL injection, auth bypass, hardcoded secrets | Low (<1%) |
| **npm-audit-hook** | Dependency vulnerability scanning | Medium (1-3s) | npm/yarn/pnpm packages | Medium (dev deps) |
| **git-lfs** | Prevent large/binary files in git | Instant | `.psd`, `.zip`, `.jar`, model files | None |

## Quick Start

### 1. Install pre-commit framework
```bash
pip install pre-commit
```

### 2. Add .pre-commit-config.yaml to repo root
See `.pre-commit-config.yaml` in this directory for a working example.

### 3. Install the hooks
```bash
pre-commit install
```

### 4. Run manually on existing code
```bash
pre-commit run --all-files
```

### 5. Commit as normal
Hooks now run automatically on every commit.

## Files in This Section

### Root Files
- **README.md** (this file) — Overview and quick start
- **.pre-commit-config.yaml** — Working example configuration
- **ci-integration.md** — GitHub Actions, GitLab CI, Jenkins setup

### Hooks/ (Detailed guides for each hook)
- **detect-secrets.md** — Regex + entropy baseline for secret detection
- **gitleaks.md** — Pattern-based scanning (most accurate)
- **trufflehog.md** — Entropy detection (what attackers use)
- **semgrep.md** — Static analysis for code vulnerabilities
- **npm-audit-hook.md** — Dependency security scanning

### By-Stack/ (Stack-specific configurations)
- **nextjs.md** — Next.js-specific hooks and env setup
- **python.md** — Python, pip, and virtual environment hooks
- **django.md** — Django + sensitive settings patterns
- **node-express.md** — Express.js and npm project setup

### Prompts/ (Ready-to-use agent prompts)
- **setup-pre-commit.md** — Install and configure hooks from scratch
- **audit-existing-hooks.md** — Audit your existing configuration
- **ci-pre-commit-integration.md** — Integrate hooks with your CI pipeline

## Common Patterns These Hooks Catch

### Secrets
```bash
API_KEY=sk_live_9fdsf9sdfsdf  # Caught by gitleaks
DATABASE_PASSWORD="prod_password_123"  # Caught by detect-secrets
```

### Vulnerable Dependencies
```bash
npm install express@2.5.11  # CVE-2022-24999 caught by npm-audit-hook
pip install django==2.2.0   # CVE-2020-7471 caught by pre-commit
```

### Hardcoded Credentials
```python
conn = psycopg2.connect(
    dbname="mydb",
    user="admin",
    password="hardcoded_password"  # Caught by semgrep
)
```

### Large/Binary Files
```bash
git add model.h5  # Caught by git-lfs hook (if configured)
```

## Hook Comparison: Choose the Right Ones

### Gitleaks vs Trufflehog
- **Gitleaks** uses known patterns → fewer false positives, faster
- **Trufflehog** uses entropy → catches novel secrets, slower
- **Recommendation:** Use both. Gitleaks first (fast), trufflehog second (thorough)

### Detect-secrets vs Gitleaks
- **Detect-secrets** is lightweight, includes baseline (allowlist)
- **Gitleaks** is more accurate, no false-positive management needed
- **Recommendation:** Use gitleaks in pre-commit, detect-secrets in CI for allowlisting

### Semgrep vs npm-audit
- **Semgrep** finds code-level vulnerabilities (SQL injection, auth bypass)
- **npm-audit** finds dependency vulnerabilities (known CVEs)
- **Recommendation:** Use both. They catch different threat classes.

## Performance Impact

Typical commit with all hooks:

| Setup | Time | Slowdown |
|-------|------|----------|
| No hooks | 50ms | — |
| gitleaks only | 100ms | 2x |
| gitleaks + npm-audit | 1.5s | 30x |
| All six hooks | 5s | 100x |

**Optimization:** Run slower hooks (semgrep, npm-audit) in CI only, use fast ones (gitleaks) in pre-commit.

## Next Steps

1. **For your stack:** See `by-stack/` for language-specific setup
2. **To integrate with CI:** See `ci-integration.md`
3. **For detailed hook info:** See `hooks/` for each hook's guide
4. **To set up now:** Copy the agent prompt from `prompts/setup-pre-commit.md`

## Additional Resources

- [Pre-commit framework docs](https://pre-commit.com/)
- [Gitleaks official guide](https://github.com/gitleaks/gitleaks)
- [Trufflehog documentation](https://github.com/trufflesecurity/trufflehog)
- [OWASP Pre-commit Security Checklist](https://owasp.org/www-community/attacks/Source_Code_Disclosure)

---

**Questions?** See `by-stack/` for your language, or run the setup prompt from `prompts/setup-pre-commit.md`.
