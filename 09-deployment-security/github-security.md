# GitHub Repository Security

GitHub is the entry point to your entire deployment pipeline. A compromised repository means compromised deployments, leaked secrets, and potentially backdoored production code. This guide covers every security layer GitHub provides.

---

## Branch Protection Rules

Branch protection prevents direct pushes, requires reviews, and enforces status checks before merging. Configure it for every long-lived branch (`main`, `develop`, `release/*`).

### Configuring via GitHub UI

1. **Repository → Settings → Branches → Add Rule**
2. Set the branch name pattern (e.g., `main`)
3. Enable the following:

| Setting | Recommended value | Why |
|---|---|---|
| Require a pull request before merging | ✅ Enabled | No direct pushes to main |
| Required approving reviews | 1 (minimum), 2 for critical repos | Peer review catches mistakes |
| Dismiss stale reviews when new commits are pushed | ✅ Enabled | Prevents approval-then-backdoor commits |
| Require review from Code Owners | ✅ Enabled | Domain experts must review sensitive areas |
| Require status checks to pass | ✅ Enabled | CI must pass before merge |
| Require branches to be up to date | ✅ Enabled | Prevents merging stale branches |
| Do not allow bypassing the above settings | ✅ Enabled | Admins cannot skip checks in an emergency |
| Restrict who can push to matching branches | Specific teams only | Limits blast radius if a personal account is compromised |

### Configuring via GitHub CLI

```bash
# Enable branch protection with required reviews and status checks
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/tests","ci/lint"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null
```

### Rulesets (Newer API — Recommended)

GitHub Rulesets supersede branch protection rules and apply to the entire repository, including forks:

```bash
# Create a ruleset via API
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --input - <<EOF
{
  "name": "Protect main branch",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_linear_history"},
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true
      }
    }
  ]
}
EOF
```

---

## CODEOWNERS

The `CODEOWNERS` file automatically assigns reviewers to pull requests based on which files are changed. Place it at `.github/CODEOWNERS`.

```
# .github/CODEOWNERS

# Global fallback — all PRs require at least one review from the team
*                           @your-org/engineering

# Authentication and authorisation — always needs a security review
/src/auth/                  @your-org/security-team
/src/middleware/            @your-org/security-team

# Infrastructure and deployment configs
/vercel.json                @your-org/devops
/.github/workflows/         @your-org/devops
/Dockerfile                 @your-org/devops
/docker-compose*.yml        @your-org/devops

# Database migrations — needs DBA sign-off
/db/migrations/             @your-org/dba-team

# Payment and financial logic
/src/billing/               @your-org/payments-team @your-org/security-team

# Dependencies — changes to these are high-risk
package.json                @your-org/security-team
package-lock.json           @your-org/security-team
requirements.txt            @your-org/security-team
go.sum                      @your-org/security-team
```

> **Critical:** `CODEOWNERS` only works when "Require review from Code Owners" is enabled in branch protection rules. Without that setting, it is advisory only.

---

## Secret Scanning

GitHub's secret scanning detects accidentally committed credentials and alerts you before they are exploited.

### Enable Secret Scanning

1. **Repository → Settings → Security & Analysis**
2. Enable **Secret scanning** (free for public repos; requires GitHub Advanced Security for private)
3. Enable **Push protection** — this blocks pushes containing detected secrets

```bash
# Enable via GitHub CLI
gh api repos/{owner}/{repo} \
  --method PATCH \
  --field security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'
```

### Custom Secret Patterns

Define patterns for secrets specific to your organisation:

```yaml
# .github/secret_scanning.yml
patterns:
  - name: Internal API Key
    regex: 'INTERNAL_KEY_[A-Z0-9]{32}'
    secret_group: 1
```

### If a Secret Is Detected

1. **Rotate the secret immediately** — assume it was already read by automated scanners
2. Revoke the exposed credential at the issuing service
3. Audit logs at that service for any usage of the exposed key
4. Remove the secret from git history using `git-filter-repo`:

```bash
pip install git-filter-repo

# Remove a specific file from all history
git filter-repo --path path/to/secrets.env --invert-paths

# Remove a specific string from all files in history
git filter-repo --replace-text <(echo "ACTUAL_SECRET==>REMOVED")
```

> **Critical:** `git filter-repo` rewrites history. All contributors must re-clone or rebase. Coordinate this carefully. Consider the secret permanently compromised regardless.

---

## Dependabot

Dependabot automatically opens pull requests to update vulnerable dependencies.

### Enable Dependabot Alerts and Security Updates

1. **Repository → Settings → Security & Analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates** (auto-creates PRs for security fixes)
4. Enable **Dependabot version updates** (keeps dependencies current)

### dependabot.yml Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm / Node.js
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Europe/London"
    open-pull-requests-limit: 10
    groups:
      production-dependencies:
        dependency-type: "production"
      development-dependencies:
        dependency-type: "development"
    ignore:
      # Only ignore minor/patch for major-version pinned deps
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## GitHub Actions Security

GitHub Actions is a privileged CI/CD system — it has access to secrets and can deploy to production. A compromised workflow is a critical incident.

### Minimum-Privilege Token

By default, `GITHUB_TOKEN` has broad write permissions. Restrict it:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

# Deny all permissions by default
permissions: read-all

jobs:
  test:
    runs-on: ubuntu-latest
    # Grant only what this job needs
    permissions:
      contents: read
      pull-requests: write   # only if you post PR comments
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

### Pin Actions to Commit SHA

Pinning to a tag (e.g., `@v4`) is vulnerable to tag mutation — a compromised action maintainer can change what `v4` points to. Pin to the full SHA instead:

```yaml
steps:
  # Bad — tag can be moved
  - uses: actions/checkout@v4

  # Good — immutable commit reference
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

  # Add a comment to track the version
  # Dependabot will update both the SHA and the comment automatically
```

### Prevent Script Injection

When using `${{ github.event.pull_request.title }}` or other user-controlled inputs in `run:` steps, an attacker can inject shell commands via the PR title.

```yaml
# Vulnerable — user controls github.event.pull_request.title
- run: echo "Processing PR: ${{ github.event.pull_request.title }}"

# Safe — pass via environment variable (shell does not interpret it)
- name: Process PR title
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Processing PR: $PR_TITLE"
```

### Handling Untrusted Input from Forks

Pull requests from forks do not have access to repository secrets. Never grant them access:

```yaml
# Safe pattern — separate jobs for trusted vs untrusted code
on:
  pull_request_target:  # Runs in context of base repo
    types: [opened, synchronize]

jobs:
  # This job has no access to secrets
  test-untrusted:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm test
```

> **Critical:** Never use `pull_request_target` with a checkout of the PR's head commit AND secret access in the same job. This is a documented critical vulnerability class.

### Secrets in Actions

```yaml
# Reference secrets — never hardcode
- name: Deploy
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: vercel --prod --token $VERCEL_TOKEN
```

Auditing which secrets are used:

```bash
# Find all secret references in workflows
grep -r 'secrets\.' .github/workflows/
```

### Required Workflow Checks

Prevent workflows from being bypassed via rules:

```yaml
# .github/workflows/required-security-scan.yml
name: Security Scan (Required)

on:
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@6e7b7d1fd3e4fef0c5fa8cce1229c54b2c9bd0d8  # v0.24.0
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Repository-Level Security Settings

### Enable All Free Security Features

```bash
# Via GitHub CLI — enable all free security features at once
gh api repos/{owner}/{repo} \
  --method PATCH \
  --field has_vulnerability_alerts=true

gh api repos/{owner}/{repo} \
  --method PATCH \
  --field security_and_analysis='{
    "dependabot_alerts": {"status": "enabled"},
    "dependabot_security_updates": {"status": "enabled"},
    "secret_scanning": {"status": "enabled"},
    "secret_scanning_push_protection": {"status": "enabled"}
  }'
```

### Visibility and Fork Settings

- Set repositories to **Private** unless open source
- Disable **Allow forking** for private repositories containing sensitive business logic
- Disable **Allow public access to GitHub Pages** if not needed

---

## GitHub Security Checklist

- [ ] Branch protection on `main` with required reviews and status checks
- [ ] `CODEOWNERS` covers auth, infra, migrations, and payment code
- [ ] Secret scanning and push protection enabled
- [ ] Dependabot alerts and security updates enabled
- [ ] `dependabot.yml` configured for all package ecosystems used
- [ ] All Actions workflows have `permissions: read-all` at workflow level
- [ ] Actions pinned to commit SHA (not tags)
- [ ] No script injection via `${{ }}` expressions in `run:` steps
- [ ] Secrets managed via repository/organisation secrets, never hardcoded
- [ ] 2FA enforced for all organisation members
