# Prompt: Secure GitHub Repository

## When to use this

Use this when setting up a new repository, after a team expansion, or as part of a security review. Default GitHub repository settings are permissive — this prompt tightens them.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer securing a GitHub repository and organisation. Review and improve repository security settings.

**Step 1: Repository visibility and access**

Check and configure:
- Is the repository public or private? (Should it be public?)
- Who has write/admin access? (Check Settings → Collaborators and Teams)
- Are there any ex-employees with access?
- Is branch protection enabled on the default branch?

**Step 2: Enable branch protection rules**

Navigate to Settings → Branches → Add branch protection rule for `main` (or `master`):

```
Recommended settings:
✓ Require a pull request before merging
  ✓ Require approvals: 1 (or 2 for sensitive repos)
  ✓ Dismiss stale pull request approvals when new commits are pushed
✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  ✓ Add your CI checks here (tests, lint, security scan)
✓ Require conversation resolution before merging
✓ Require signed commits (if your team uses GPG signing)
✓ Include administrators (prevents admins from bypassing rules)
✗ Allow force pushes (keep disabled)
✗ Allow deletions (keep disabled)
```

**Step 3: Enable GitHub Security features**

Navigate to Settings → Code Security:

```
✓ Dependency graph — enable
✓ Dependabot alerts — enable
✓ Dependabot security updates — enable (auto-PR for fixes)
✓ Code scanning (CodeQL) — enable
✓ Secret scanning — enable
  ✓ Push protection — enable (blocks commits containing secrets)
```

**Step 4: Check for secrets in the repository**

Review the repository for accidentally committed secrets:

```bash
# Install git-secrets or truffleHog
pip install trufflehog
trufflehog git file://. --since-commit HEAD~100

# Or use gitleaks
gitleaks detect --source . --verbose

# Or check git history for common patterns
git log --all --full-history -- '*.env'
git log --all --source -- '*password*'
git log -p | grep -i 'api_key\|password\|secret\|token' | head -50
```

If secrets are found in git history:
1. **Rotate them immediately** — assume they're compromised
2. Use BFG Repo Cleaner or `git filter-repo` to remove them from history
3. Force-push the cleaned history (coordinate with team)

**Step 5: Audit GitHub Actions security**

Review all workflow files in `.github/workflows/`:

1. **Check for unpinned actions:**
```bash
grep -r "uses:" .github/workflows/ | grep -v "@[a-f0-9]\{40\}"
# Any result that doesn't show a 40-character SHA is unpinned — flag it
```

2. **Check for dangerous permissions:**
```bash
grep -r "permissions:" .github/workflows/
# Look for 'write-all' or 'contents: write' without justification
```

3. **Check for script injection vulnerabilities:**
```bash
# Look for ${{ github.event.* }} used directly in run: steps
grep -r 'github.event.pull_request.title\|github.event.issue.title\|github.head_ref' .github/workflows/
# If found in a run: command, it's a script injection vulnerability
```

4. **Check for excessive secret exposure:**
```bash
grep -r "env:" .github/workflows/ | grep "secrets\."
# Review each — are these secrets actually needed in this job?
```

Produce a list of findings for each workflow file.

**Step 6: Configure workflow permissions**

Add to each workflow file:

```yaml
permissions:
  contents: read        # read repository content
  # Only add what's actually needed:
  # pull-requests: write  # to comment on PRs
  # issues: write         # to comment on issues
  # packages: write       # to publish packages
```

Set the default token permissions for the organisation:
Settings → Actions → Workflow permissions → "Read repository contents and packages permissions"

**Step 7: Check for misconfigured third-party integrations**

Review Settings → Integrations → GitHub Apps:
- List all installed apps
- Review each app's permissions — do they have more access than needed?
- Remove apps that are no longer used

**Step 8: Produce a security report**

For each finding:
- **Issue:** What's misconfigured?
- **Risk:** What could an attacker do?
- **Fix:** Exact steps to remediate

Then implement all fixes that can be done via configuration files and provide step-by-step instructions for settings that require manual UI changes.

---

## What to expect

A complete GitHub repository security audit: branch protection enabled, security features activated, secrets scan results, GitHub Actions hardened, and a prioritised list of remaining manual actions.

## Learn more

[Secure GitHub Actions](../secure-github-actions.md)
[Environment Variables](../../06-secure-coding/env-secrets-management.md)
[OWASP A08: Data Integrity Failures](../../02-owasp/web-top10/A08-data-integrity-failures.md)
