# detect-secrets: Baseline-Driven Secret Detection

**30-second summary:** detect-secrets finds hardcoded secrets (API keys, passwords, tokens) using regex patterns and entropy analysis. Unlike gitleaks, it stores a "baseline" of known secrets to ignore, letting you allowlist false positives without ignoring future secrets in the same file.

## What It Detects

### Secrets
- AWS keys: `AKIA3FJSLDKKD...`
- API tokens: `sk_live_`, `ghp_`, `GITHUB_TOKEN=...`
- Database passwords: `password=mydb_pass_123`
- Private keys: `-----BEGIN RSA PRIVATE KEY-----`
- PII: SSN patterns, credit card numbers
- Slack/Discord tokens: `xoxb-`, `xoxp-`

### Example Catches
```python
# ✓ Caught
DB_PASSWORD = "prod_database_password"
api_key = "sk_live_9fdsf9sdfsdf"
AWS_SECRET_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"

# ✗ Missed (because it's in a comment or test mock)
test_key = "test_key_12345"  # Regex too broad, add to baseline
```

## Why Use detect-secrets?

| Feature | detect-secrets | gitleaks | Comparison |
|---------|---|---|---|
| Speed | Fast (100ms) | Faster (50ms) | detect-secrets 2x slower |
| Accuracy | 95% (5% false positives) | 99% (<1% FP) | gitleaks more accurate |
| Baseline allowlisting | ✓ Yes | ✗ No | detect-secrets wins for FP management |
| Pattern count | 50+ patterns | 200+ patterns | gitleaks more comprehensive |
| Python ecosystem | ✓ Native | ✗ Go binary | detect-secrets better for Python repos |
| Configuration | Simple (.secrets.baseline) | Complex (patterns) | detect-secrets easier |

**When to use detect-secrets:**
- Python-heavy repos where regex tuning is common
- Projects with baseline of known false positives
- Want easy allowlisting without code changes

**When to use gitleaks instead:**
- Maximum accuracy needed
- Simple, no false-positive management
- Non-Python repos

## Installation

### Prerequisites
- Python 3.6+
- pip

### Install detect-secrets
```bash
pip install detect-secrets
```

### Verify installation
```bash
detect-secrets --version
# Output: detect-secrets v1.4.0
```

## Quick Start

### 1. Initialize baseline (first time only)
```bash
detect-secrets scan --all-files > .secrets.baseline
```

This creates `.secrets.baseline` with all current (known) secrets. You'll version-control this file.

### 2. Add to pre-commit hooks

In `.pre-commit-config.yaml`:

```yaml
- repo: https://github.com/Yelp/detect-secrets
  rev: v1.4.0
  hooks:
    - id: detect-secrets
      name: Detect secrets
      entry: detect-secrets-hook
      language: python
      types: [python]
      args: ['--baseline', '.secrets.baseline']
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
# detect-secrets: Found potential secret in myfile.py:5
```

## How It Works

### Scanning Phase
1. Regex scans files for known patterns (AWS keys, tokens, etc.)
2. Entropy analysis flags random-looking strings
3. Compares against baseline—ignores known secrets
4. Fails if any NEW secrets found

### Baseline Management
The `.secrets.baseline` file tracks known secrets:

```json
{
  "version": "1.4.0",
  "plugins_used": [
    {
      "name": "ArtifactoryDetector"
    },
    {
      "name": "AWSKeyDetector"
    }
  ],
  "results": {
    "test/fixtures/aws_key": [
      {
        "type": "AWS Access Key",
        "filename": "test/fixtures/aws_key",
        "hashed_secret": "8d3c25e02c3f5d5c",
        "is_verified": false,
        "line_number": 1
      }
    ]
  },
  "generated_at": "2024-04-25T15:30:00Z"
}
```

### False Positive Allowlisting
When a secret is flagged but it's a test value or legitimate constant:

```bash
# 1. detect-secrets fails the commit
detect-secrets: Found potential secret in tests/test_auth.py:15

# 2. Review the secret—confirm it's safe (test data, mock, etc.)

# 3. Update baseline to allowlist it
detect-secrets scan --all-files \
  --baseline .secrets.baseline \
  --update-baseline

# 4. Commit baseline change + code
git add tests/test_auth.py .secrets.baseline
git commit -m "Add test fixtures (approved in baseline)"
```

## Configuration

### Basic .pre-commit-config.yaml
```yaml
- repo: https://github.com/Yelp/detect-secrets
  rev: v1.4.0
  hooks:
    - id: detect-secrets
      name: Detect secrets
      entry: detect-secrets-hook
      language: python
      types: [python]
      args: ['--baseline', '.secrets.baseline']
```

### Custom Plugins (Advanced)

Create `.detectsecretsrc`:

```json
{
  "version": "1.4.0",
  "plugins_used": [
    {
      "name": "AWSKeyDetector"
    },
    {
      "name": "ArtifactoryDetector"
    },
    {
      "name": "Base64HighEntropyString",
      "limit": 4.5
    },
    {
      "name": "BasicAuthDetector"
    },
    {
      "name": "CloudantDetector"
    },
    {
      "name": "DiscordBotTokenDetector"
    },
    {
      "name": "GitHubTokenDetector"
    },
    {
      "name": "HexHighEntropyString",
      "limit": 3.0
    },
    {
      "name": "IbmCloudIamDetector"
    },
    {
      "name": "JwtTokenDetector"
    },
    {
      "name": "KeywordDetector",
      "keyword_exclude": ""
    },
    {
      "name": "MailchimpDetector"
    },
    {
      "name": "NpmDetector"
    },
    {
      "name": "PrivateKeyDetector"
    },
    {
      "name": "SendgridDetector"
    },
    {
      "name": "SlackDetector"
    },
    {
      "name": "SoftlayerDetector"
    },
    {
      "name": "SquareOAuthDetector"
    },
    {
      "name": "StripeDetector"
    },
    {
      "name": "TwilioKeyDetector"
    }
  ],
  "filters_used": [
    {
      "path": "detect_secrets.filters.allowlist.is_line_allowlisted"
    },
    {
      "path": "detect_secrets.filters.common.is_baseline_file",
      "filename": ".secrets.baseline"
    },
    {
      "path": "detect_secrets.filters.common.is_ignored_due_to_verification_policies",
      "policies": [
        "DEFAULT"
      ]
    }
  ]
}
```

### Scan with Custom Config
```bash
detect-secrets scan --baseline .secrets.baseline \
  --settings .detectsecretsrc
```

## Common Patterns (Detectors)

| Detector | Pattern | Example |
|----------|---------|---------|
| AWSKeyDetector | `AKIA[0-9A-Z]{16}` | `AKIAIOSFODNN7EXAMPLE` |
| GitHubTokenDetector | `ghp_[0-9a-zA-Z]{36}` | `ghp_8e7f9d3c5a2b...` |
| StripeDetector | `sk_live_[0-9a-zA-Z]{24}` | `sk_live_9fdsf9sdfsdf` |
| PrivateKeyDetector | `-----BEGIN.*PRIVATE KEY-----` | RSA/EC keys |
| BasicAuthDetector | `Authorization: Basic [A-Za-z0-9+/=]+` | HTTP auth headers |
| JwtTokenDetector | JWT patterns | `eyJhbGciOiJIUzI1...` |
| SlackDetector | `xoxb-` or `xoxp-` | Slack bot tokens |
| TwilioKeyDetector | `AC[a-zA-Z0-9_]{32}` | Twilio account SIDs |

## Usage Examples

### Scan all files and generate baseline
```bash
detect-secrets scan --all-files > .secrets.baseline
```

### Scan specific directories
```bash
detect-secrets scan app/ config/ > .secrets.baseline
```

### Exclude patterns
```bash
detect-secrets scan --all-files \
  --exclude-files "\.git|\.venv|node_modules" \
  --baseline .secrets.baseline
```

### Audit and approve secrets
```bash
# Review and approve known secrets
detect-secrets audit .secrets.baseline

# Interactively approve/reject each flagged secret
# Marks as "verified" in baseline
```

### Update baseline with new secrets
```bash
detect-secrets scan --all-files \
  --baseline .secrets.baseline \
  --update-baseline
```

### Check before commit (pre-commit hook)
```bash
detect-secrets-hook --baseline .secrets.baseline
```

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Initial scan (1000 files) | 500ms | One-time cost |
| Pre-commit check | 100ms | Only checks staged files |
| Baseline update | 200ms | When adding false positives |

**Optimize for large repos:**
```bash
# Exclude test/vendor directories
detect-secrets scan --all-files \
  --exclude-files "test/|vendor/|node_modules/" \
  --baseline .secrets.baseline
```

## Troubleshooting

### "baseline file is not found"
```bash
# Solution: Create baseline first
detect-secrets scan --all-files > .secrets.baseline
pre-commit install
```

### "Secret found but it's a test value"
```bash
# Solution: Update baseline to allowlist
detect-secrets scan --all-files \
  --baseline .secrets.baseline \
  --update-baseline

git add .secrets.baseline
git commit -m "Allowlist test secret in baseline"
```

### Too many false positives
```bash
# Solution: Disable high-entropy detectors
# Edit .detectsecretsrc and remove or adjust:
# - Base64HighEntropyString (limit: 4.5)
# - HexHighEntropyString (limit: 3.0)

detect-secrets scan --all-files --baseline .secrets.baseline
```

### Check what's in baseline
```bash
# View all secrets in baseline (hashed, not plaintext)
cat .secrets.baseline | jq '.results'

# Audit and verify
detect-secrets audit .secrets.baseline
```

## Integration with CI

### GitHub Actions
```yaml
- name: Check for secrets
  run: |
    pip install detect-secrets
    detect-secrets scan --baseline .secrets.baseline \
      --all-files --fail-on-unverified
```

### GitLab CI
```yaml
detect-secrets:
  image: python:3.11
  script:
    - pip install detect-secrets
    - detect-secrets scan --baseline .secrets.baseline --all-files
```

## When to Use detect-secrets vs Others

### Use detect-secrets if:
- Python repo where baseline management is useful
- Want to allowlist false positives without code changes
- Need offline scanning (no cloud API)
- Team familiar with regex patterns

### Use gitleaks instead if:
- Want maximum accuracy (1% false positives)
- Simple setup, no baseline management
- Prefer pre-built patterns to tuning

### Use both if:
- Maximum coverage needed
- Willing to maintain two hook configurations
- Different teams (Python uses detect-secrets, others use gitleaks)

## Next Steps

1. **Initialize baseline:** `detect-secrets scan --all-files > .secrets.baseline`
2. **Add to pre-commit:** Copy config above to `.pre-commit-config.yaml`
3. **Install:** `pre-commit install`
4. **Test:** Add a fake secret, try to commit, see it fail
5. **Integrate CI:** See `../ci-integration.md` for GitHub Actions, GitLab CI setup

---

**See also:**
- Official docs: https://github.com/Yelp/detect-secrets
- Compare with gitleaks: `../hooks/gitleaks.md`
- Pre-commit setup: `../hooks/README.md`
