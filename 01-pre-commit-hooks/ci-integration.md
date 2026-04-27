# CI Integration: Running Pre-Commit Hooks in GitHub Actions, GitLab CI, Jenkins

**30-second summary:** Pre-commit hooks run locally before commit, but you should also run them in CI as a safety net. This guide shows exact configurations for GitHub Actions, GitLab CI, and Jenkins to catch hooks that were bypassed locally (`git commit --no-verify`), run slower hooks that aren't practical locally, and fail PRs if security checks don't pass.

## Why Run Hooks in CI?

| Scenario | Local Hook | CI Catch |
|----------|-----------|----------|
| Developer bypasses: `git commit --no-verify` | ✗ Missed | ✓ Caught in CI |
| Slower hooks (semgrep, trufflehog) | Slow, skipped locally | ✓ Fast CI pipeline |
| Dependencies changed in lock file | npm-audit skipped | ✓ Caught in CI |
| Secrets in merge commits | Pre-commit didn't scan | ✓ Gitleaks catches it |

## GitHub Actions (Recommended)

### Basic Setup: Run Standard Hooks

Add this to `.github/workflows/security.yml`:

```yaml
name: Pre-Commit Security Checks
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for gitleaks to scan

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - uses: pre-commit/action@v3.0.0
        name: Run pre-commit hooks
        with:
          extra-args: '--all-files --hook-stage commit'
```

**What this does:**
1. Checks out the full repository history (gitleaks needs this)
2. Sets up Python (needed for gitleaks, detect-secrets)
3. Runs all hooks in `.pre-commit-config.yaml`

**Result:** PR will fail if any hook fails.

### Advanced Setup: Separate Fast and Slow Hooks

For large repos, run fast hooks (gitleaks, npm-audit) on every PR, slow hooks (semgrep, trufflehog) only on main:

```yaml
name: Security Checks (Tiered)
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  fast-hooks:
    runs-on: ubuntu-latest
    name: Gitleaks + NPM Audit (fast)
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run gitleaks
        run: |
          pip install gitleaks
          gitleaks protect --verbose --log-level debug

      - name: Run npm audit
        if: hashFiles('package.json') != ''
        run: npm ci && npm audit --audit-level=moderate

  slow-hooks:
    runs-on: ubuntu-latest
    name: Semgrep + Trufflehog (slow)
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run semgrep
        run: |
          pip install semgrep
          semgrep --config=p/owasp-top-ten --config=p/security-audit --json --output=semgrep-report.json .
          # Fail if semgrep found issues
          if [ -s semgrep-report.json ]; then exit 1; fi

      - name: Run trufflehog
        run: |
          pip install trufflehog
          trufflehog filesystem . --json --fail
```

### Reporting: Upload Security Reports to GitHub

```yaml
name: Security Reports
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run semgrep (SARIF output)
        run: |
          pip install semgrep
          semgrep --config=p/owasp-top-ten --config=p/security-audit \
            --sarif --output=semgrep.sarif .
        continue-on-error: true

      - name: Upload to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif
          category: semgrep-sast

      - name: Run gitleaks (JSON output)
        run: |
          pip install gitleaks
          gitleaks detect --json --report-path=gitleaks-report.json || true

      - name: Upload gitleaks report as artifact
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-reports
          path: gitleaks-report.json
```

**Result:** Reports appear in:
- GitHub Security tab (SARIF uploads)
- Actions artifacts (JSON reports)
- PR comments (with external tools like DeepSource)

## GitLab CI

### Basic Setup

Add to `.gitlab-ci.yml`:

```yaml
stages:
  - security
  - build
  - test

pre-commit-security:
  stage: security
  image: python:3.11
  before_script:
    - pip install pre-commit
    - git fetch --unshallow || true  # Full history for gitleaks
  script:
    - pre-commit run --all-files
  allow_failure: false
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### Advanced: Tiered with Reports

```yaml
stages:
  - security
  - build

fast-security:
  stage: security
  image: python:3.11
  script:
    - pip install gitleaks detect-secrets
    - gitleaks protect --verbose --log-level debug
    - detect-secrets scan --all-files --baseline .secrets.baseline
  artifacts:
    reports:
      sast: gitleaks-report.json
  allow_failure: false

slow-security:
  stage: security
  image: python:3.11
  script:
    - pip install semgrep trufflehog
    - semgrep --config=p/owasp-top-ten --json --output=semgrep.json .
    - trufflehog filesystem . --json --fail
  artifacts:
    reports:
      sast: semgrep.json
  allow_failure: false
  only:
    - main
```

## Jenkins

### Pipeline Script (Declarative)

```groovy
pipeline {
  agent any

  options {
    timeout(time: 10, unit: 'MINUTES')
    timestamps()
  }

  stages {
    stage('Pre-Commit Security') {
      steps {
        script {
          sh '''
            pip install pre-commit
            git fetch --unshallow || true
            pre-commit run --all-files
          '''
        }
      }
    }

    stage('Gitleaks Scan') {
      steps {
        script {
          sh '''
            pip install gitleaks
            gitleaks detect --json --report-path=gitleaks.json || true
          '''
        }
      }
    }

    stage('Semgrep Analysis') {
      when {
        branch 'main'
      }
      steps {
        script {
          sh '''
            pip install semgrep
            semgrep --config=p/owasp-top-ten --json --output=semgrep.json .
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: '*.json', allowEmptyArchive: true
      junit testResults: 'test-results.xml', allowEmptyResults: true
    }
    failure {
      emailext(
        subject: "Security checks failed on ${env.BRANCH_NAME}",
        body: "See Jenkins logs at ${env.BUILD_URL}console",
        to: "${env.TEAM_EMAIL}"
      )
    }
  }
}
```

### Freestyle Job Script

In "Build > Execute shell":

```bash
#!/bin/bash
set -e

# Install pre-commit
pip install pre-commit

# Fetch full history (required for secret scanning)
git fetch --unshallow || true

# Run all hooks
pre-commit run --all-files || {
  echo "Pre-commit hooks failed!"
  exit 1
}

# Run gitleaks with JSON output
pip install gitleaks
gitleaks detect --json --report-path=gitleaks.json || true

# Archive results
echo "Security checks complete. Artifacts: gitleaks.json"
```

Post-build action: Archive artifacts `*.json`

## Comparing CI Platforms

| Feature | GitHub Actions | GitLab CI | Jenkins |
|---------|---|---|---|
| Pricing | Free (unlimited OSS) | Free/paid | Self-hosted (free) |
| Setup time | 5 min | 5 min | 20 min |
| Report upload | Native SARIF | Native sast: | Manual artifact |
| Secret masking | ✓ Built-in | ✓ Built-in | ✗ Manual |
| Slack notifications | ✓ Easy | ✓ Easy | ✓ Plugin |
| Docker support | ✓ | ✓ | ✓ |

## Best Practices

### 1. Cache Dependencies for Speed

**GitHub Actions:**
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'  # Cache pip packages

- uses: actions/setup-node@v4
  with:
    node-version: 18
    cache: 'npm'   # Cache node_modules
```

**GitLab CI:**
```yaml
cache:
  paths:
    - .cache/pip
    - node_modules/
```

### 2. Fail PR on Security Failures

**GitHub Actions:**
```yaml
- uses: pre-commit/action@v3.0.0
  with:
    extra-args: '--fail-fast'  # Stop on first failure
```

**All platforms:** Use `allow_failure: false` or `exit 1` in scripts.

### 3. Slack Notifications

**GitHub Actions:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Security checks failed on ${{ github.ref }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Security Failure*\n${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
```

### 4. Allow Override for False Positives

```yaml
# GitHub Actions
env:
  PRE_COMMIT_SKIP_GITLEAKS: false  # Set to true to skip gitleaks

# In script:
if [ "$PRE_COMMIT_SKIP_GITLEAKS" = "true" ]; then
  echo "Skipping gitleaks (override enabled)"
else
  gitleaks protect --verbose
fi
```

### 5. Report Generation for Dashboards

Generate machine-readable reports:

```bash
# Gitleaks (JSON)
gitleaks detect --json --report-path=gitleaks.json

# Semgrep (SARIF, JSON)
semgrep --config=p/owasp-top-ten --sarif --output=semgrep.sarif .

# Detect-secrets (JSON baseline)
detect-secrets scan --all-files --baseline .secrets.baseline
```

Store in artifacts or upload to security dashboards (Snyk, Checkmarx, etc.)

## Troubleshooting CI Failures

### "gitleaks not found"
```bash
# Solution: Install in CI
pip install gitleaks
```

### "fatal: Not a git repository"
```bash
# Solution: Ensure checkout happens first
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history
```

### "npm audit: no vulnerabilities found (but fails)"
```bash
# Solution: Check exit code
npm audit --audit-level=moderate || {
  echo "Vulnerabilities detected"
  exit 1
}
```

### "Hooks timeout in CI"
```bash
# Solution: Increase timeout or move slow hooks to separate job
timeout: 30  # GitHub Actions
timeout: 10m  # GitLab CI
```

### False positives in gitleaks
```bash
# Solution: Create allowlist
gitleaks protect --verbose --log-level debug \
  --config gitleaks-allowlist.toml
```

## Next Steps

1. **Pick your platform:** GitHub Actions (easiest), GitLab CI, or Jenkins
2. **Copy the basic setup** from your platform section above
3. **Customize:** Add Slack notifications, artifact uploads, etc.
4. **Test:** Push to a feature branch and watch the workflow run
5. **Iterate:** Adjust thresholds and timeouts based on real results

---

**See also:** `prompts/ci-pre-commit-integration.md` for an agent-ready prompt to set this up automatically.
