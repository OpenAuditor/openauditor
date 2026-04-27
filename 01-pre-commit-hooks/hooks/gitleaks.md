# gitleaks: Pattern-Based Secret Scanning (Recommended)

**30-second summary:** gitleaks scans git repositories for hardcoded secrets using an extensive library of 200+ known patterns. It's the fastest, most accurate secret detector with <1% false positives. No baseline management needed—just run it and fail on any detected secret.

## What It Detects

### Secrets (200+ patterns)
- AWS keys: `AKIA[0-9A-Z]{16}`
- GitHub tokens: `ghp_[0-9a-zA-Z]{36}`
- Stripe keys: `sk_live_[0-9a-zA-Z]{24}`
- Slack tokens: `xoxb-`, `xoxp-`
- Twilio credentials: `AC[a-zA-Z0-9_]{32}`
- Private keys: RSA, EC, PGP
- Database passwords: hardcoded strings
- API tokens: Bearer, Basic auth headers
- Passwords in URLs: `postgres://user:pass@host`

### Example Catches
```bash
# ✓ Caught
export AWS_SECRET_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"
DATABASE_URL="postgresql://admin:password123@prod.db.com:5432/db"
export SLACK_BOT_TOKEN="xoxb-9238472834-9238472389-secret"
const API_KEY = 'sk_live_9fdsf9sdfsdf'

# ✗ Missed (legitimate patterns)
const TEST_KEY = "test_key_12345"  # Test data
const PLACEHOLDER = "xxx-xxx-xxx"  # Placeholder
```

## Why Use gitleaks? (Comparison)

| Feature | gitleaks | detect-secrets | trufflehog |
|---------|----------|---|---|
| Speed | Fast (50ms) | Medium (100ms) | Slow (500ms) |
| Accuracy | 99% (<1% FP) | 95% (5% FP) | 98% (2% FP) |
| Patterns | 200+ | 50+ | Custom + entropy |
| Setup | Simple | Baseline needed | Simple |
| False-positive handling | None (but patterns good) | Allowlist baseline | Manual review |
| Scans git history | ✓ Full history | ✗ Only staged | ✓ Full history |
| Language | Go (native binary) | Python | Python |
| Maintenance | Active | Active | Active |

**When to use gitleaks:**
- Want the simplest, most accurate setup
- No baseline false-positive management
- Want to scan full git history

**When to use detect-secrets:**
- Need baseline allowlisting for false positives
- Python repo with regex tuning needed
- Want offline local setup

**When to use trufflehog:**
- Need entropy-based detection (novel secrets)
- Willing to accept slower performance
- Want historical deep scan

## Installation

### Prerequisites
- Go 1.17+ (OR use pre-built binary)
- git (any version)

### Option 1: Install via Homebrew (macOS/Linux)
```bash
brew install gitleaks
gitleaks --version  # v8.18.4+
```

### Option 2: Install via pip (Python wrapper)
```bash
pip install gitleaks
gitleaks --version
```

### Option 3: Download binary (Windows/Linux/macOS)
Visit https://github.com/gitleaks/gitleaks/releases and download the latest binary for your OS.

```bash
# macOS
curl -L https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks-darwin-amd64 -o gitleaks
chmod +x gitleaks

# Linux
curl -L https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks-linux-amd64 -o gitleaks
chmod +x gitleaks

# Verify
./gitleaks --version
```

## Quick Start

### 1. Scan existing repository
```bash
gitleaks detect --source . --verbose
```

Output shows all secrets found in current directory and history.

### 2. Add to pre-commit hooks

In `.pre-commit-config.yaml`:

```yaml
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.4
  hooks:
    - id: gitleaks
      name: Detect secrets with gitleaks
      entry: gitleaks protect --verbose
      language: golang
      stages: [commit]
      pass_filenames: false
      always_run: true
```

### 3. Install hooks
```bash
pre-commit install
```

### 4. Now commits are checked
```bash
git add myfile.py
git commit -m "Add database config"

# Output:
# gitleaks protect: Found secret in: myfile.py
# Ensure this is not sensitive data.
```

## How It Works

### Pre-Commit Mode (`protect`)
Scans **staged changes only** (fast):
```bash
gitleaks protect --verbose --log-level debug
```

**Time:** ~50ms per commit

### Full Scan Mode (`detect`)
Scans **entire repository and history** (comprehensive):
```bash
gitleaks detect --source . --verbose
```

**Time:** ~5-30s depending on repo size

### Scan Pipeline
1. Enumerate all commits or staged changes
2. For each commit, check each file
3. For each file, run 200+ regex patterns
4. Match against known secret formats
5. Skip common false positives (test keys, placeholders)
6. Report findings with line numbers

## Configuration

### Basic .pre-commit-config.yaml
```yaml
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.4
  hooks:
    - id: gitleaks
      name: Detect secrets (gitleaks)
      entry: gitleaks protect --verbose
      language: golang
      stages: [commit]
      pass_filenames: false
      always_run: true
```

### With Custom Config File

Create `gitleaks-config.toml`:

```toml
title = "Gitleaks Config"
description = "Custom rules for our repo"
version = "1.0"

[rules]
[[rules.Rulesets]]
id = "custom-api-key"
description = "Custom API key detector"
regex = '''(?i)(api[_-]?key|api[_-]?secret)\s*[=:]\s*['\"]?([a-zA-Z0-9\-_]{32,})'''
SecretGroup = 3
Entropy = 3.5

[allowlist]
regexes = [
  "test.*key",
  "example.*secret",
  "dummy.*token"
]
paths = [
  "test/fixtures/.*",
  "docs/examples/.*"
]
commits = [
  "abc123def456",  # Specific commit hash to ignore
]

[whitespace]
# Don't report findings if secret is surrounded by certain characters
before = []
after = []
```

Use custom config:
```bash
gitleaks protect --config gitleaks-config.toml --verbose
```

### Pre-commit with custom config
```yaml
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.4
  hooks:
    - id: gitleaks
      name: Detect secrets (custom config)
      entry: gitleaks protect --config gitleaks-config.toml --verbose
      language: golang
      stages: [commit]
      pass_filenames: false
      always_run: true
```

## Usage Examples

### Scan staged changes (pre-commit)
```bash
gitleaks protect --verbose
```

### Scan entire repo with JSON report
```bash
gitleaks detect --source . --json --report-path=gitleaks.json
```

### Scan specific commit range
```bash
gitleaks detect --source . --log-opts "-S main..develop"
```

### Fail on findings (for CI)
```bash
gitleaks detect --source . --fail  # Exit code 1 if found
```

### Scan with verbose logging
```bash
gitleaks detect --source . --verbose --log-level debug
```

### Check a specific file
```bash
gitleaks detect --source . --path config.py
```

## Built-In Patterns (Selection)

Gitleaks includes 200+ patterns:

| Pattern | Detects | Example |
|---------|---------|---------|
| AWS_KEY | AWS Access Key ID | `AKIA3FJSLDKKD...` |
| GITHUB_TOKEN | GitHub Personal Access Token | `ghp_8e7f9d3c...` |
| SLACK_BOT_TOKEN | Slack Bot Token | `xoxb-1234567890...` |
| STRIPE_API_KEY | Stripe live key | `sk_live_9fdsf9...` |
| PRIVATE_KEY | RSA/EC/PGP private key | `-----BEGIN RSA PRIVATE KEY-----` |
| DATABASE_PASSWORD | Hardcoded DB credentials | `password=prod_123` |
| JWT_TOKEN | JWT Bearer tokens | `eyJhbGciOiJIUzI1...` |
| BASIC_AUTH | HTTP Basic Auth | `Authorization: Basic dXNlcjpwYXNz` |
| MAILCHIMP_API | Mailchimp API key | `[a-z0-9]{32}-us[0-9]{1,2}` |
| TWILIO_API | Twilio account SID | `AC[a-zA-Z0-9_]{32}` |

## Performance

| Scenario | Time |
|----------|------|
| Pre-commit (staged files only) | 50ms |
| Full repo scan (1000 commits) | 5-30s |
| First CI run (all files) | 30s |
| Subsequent CI runs (new commits) | 1-5s |

**Optimize for large repos:**
```bash
# Skip shallow repos if already scanned
gitleaks detect --source . --max-target-megabytes 500

# Limit commit depth
gitleaks detect --source . --log-opts "-n 100"  # Last 100 commits only
```

## CI Integration

### GitHub Actions
```yaml
- name: Scan for secrets (gitleaks)
  run: |
    pip install gitleaks
    gitleaks detect --source . --json --report-path=gitleaks.json || true

- name: Upload to artifacts
  uses: actions/upload-artifact@v4
  with:
    name: security-reports
    path: gitleaks.json
```

### GitLab CI
```yaml
gitleaks-scan:
  image: zricethezav/gitleaks:latest
  script:
    - gitleaks detect --source . --json --report-path=gitleaks.json
  artifacts:
    reports:
      sast: gitleaks.json
```

### Jenkins
```groovy
stage('Gitleaks Scan') {
  steps {
    sh '''
      pip install gitleaks
      gitleaks detect --source . --fail || true
    '''
  }
}
```

## Troubleshooting

### "gitleaks: command not found"
```bash
# Solution: Ensure installation
pip install gitleaks
# OR
brew install gitleaks
# Verify:
gitleaks --version
```

### "can't load config file"
```bash
# Solution: Use full path to config
gitleaks protect --config ./gitleaks-config.toml --verbose
```

### "no secrets found" (but I committed one)
```bash
# Solution: Gitleaks may have skipped due to patterns
# Enable verbose to see details
gitleaks detect --source . --verbose --log-level debug

# Or: Check if your secret matches a known pattern
# Add custom rule to gitleaks-config.toml
```

### False positives (test data flagged as secret)
```bash
# Solution: Add to allowlist in gitleaks-config.toml
[allowlist]
regexes = [
  "test.*key",     # Matches "test_key_12345"
  "mock.*secret",  # Matches "mock_secret_xyz"
]
paths = [
  "test/.*",       # All files in test/ directory
  ".*fixtures.*"   # Any fixtures directory
]
```

### Hook fails on rebase/merge
```bash
# Solution: Run full scan on merge commits
gitleaks detect --source . --fail
```

## When to Use gitleaks vs Others

### Use gitleaks if:
- Want simplest, most accurate setup
- No false-positive management needed
- Fast pre-commit checks important
- Comprehensive 200+ pattern library needed

### Use detect-secrets instead if:
- Need baseline allowlisting for FP management
- Python repo where regex tuning is expected
- Want to approve/audit specific secrets

### Use trufflehog instead if:
- Novel secrets (entropy-based detection) important
- Need deep historical scan
- Happy with slower performance

## Next Steps

1. **Install:** `pip install gitleaks` or `brew install gitleaks`
2. **Test scan:** `gitleaks detect --source . --verbose`
3. **Add to pre-commit:** Copy config above to `.pre-commit-config.yaml`
4. **Install hooks:** `pre-commit install`
5. **Integrate CI:** See `../ci-integration.md`

---

**See also:**
- Official docs: https://github.com/gitleaks/gitleaks
- Pattern rules: https://github.com/gitleaks/gitleaks/tree/master/cmd/generate/config
- Compare with detect-secrets: `../hooks/detect-secrets.md`
- Compare with trufflehog: `../hooks/trufflehog.md`
