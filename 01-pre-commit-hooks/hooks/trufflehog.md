# trufflehog: Entropy-Based Deep Secret Scanning

**30-second summary:** trufflehog finds hardcoded secrets by analyzing entropy (randomness) of strings, similar to how bots scan GitHub for leaked credentials. It catches novel secrets that don't match known patterns. Slower than gitleaks but more thorough for zero-day leaks.

## What It Detects

### Entropy-Based Secrets
- Custom API tokens (novel patterns)
- Random-looking strings > 20 chars with high entropy
- Base64-encoded secrets
- Private keys (detected by entropy + headers)
- Database connection strings with embedded credentials
- JWT tokens, bearer tokens, OAuth tokens
- Slack, Discord, GitHub tokens (pattern + entropy)

### What Makes trufflehog Different
Gitleaks and detect-secrets use **known patterns** → fast, accurate, miss novel secrets.
Trufflehog uses **entropy analysis** → slower, catches unknowns, like how attackers scan GitHub.

### Example Catches
```bash
# ✓ Caught by entropy (high randomness)
TOKEN = "a7f3d9c2b8e1f4a6g9h2j5k8m1n4p7q0"  # Random-looking
SECRET = base64("anything_here_is_random_enough")

# ✓ Caught (known pattern + entropy)
export GITHUB_TOKEN="ghp_8e7f9d3c5a2b1f4a6c9d2e5f8g1h4k7m"

# ✗ May not catch (low entropy)
const API_KEY = "apikey_123"  # Looks like placeholder
const TEST_TOKEN = "test"     # Too short
```

## Why Use trufflehog?

| Feature | trufflehog | gitleaks | detect-secrets |
|---------|---|---|---|
| Speed | Slow (500ms-2s) | Fast (50ms) | Medium (100ms) |
| Entropy-based | ✓ Yes | ✗ Pattern only | ✗ Pattern only |
| Novel secrets | ✓ Catches | ✗ Misses | ✗ Misses |
| Known patterns | ✓ Also scans | ✓ Yes | ✓ Yes |
| False positives | 2% (entropy issues) | <1% (pattern accurate) | 5% (regex) |
| Setup | Simple | Simplest | Baseline needed |
| History scan | ✓ Full git | ✓ Full git | ✗ Staged only |
| Like bot scanners | ✓ Yes | ✗ No | ✗ No |

**When to use trufflehog:**
- Want detection like GitHub secret scanners use
- Concerned about novel/custom secrets
- Willing to accept slower performance (run in CI, not pre-commit)
- High-security orgs where defense-in-depth matters

**When to use gitleaks instead:**
- Want fast pre-commit checks
- Maximum accuracy (1% false positives)
- Simple, no tuning needed

**When to use both:**
- Maximum secret detection (gitleaks in pre-commit, trufflehog in CI)
- Defense-in-depth approach

## Installation

### Prerequisites
- Python 3.8+
- pip

### Install trufflehog
```bash
pip install trufflehog
```

### Verify installation
```bash
trufflehog --version
# Output: trufflehog version 3.63.0
```

## Quick Start

### 1. Scan existing repository
```bash
trufflehog filesystem . --json
```

Shows all detected secrets in JSON format.

### 2. Add to pre-commit hooks (CI only, not local)

In `.pre-commit-config.yaml`:

```yaml
# NOTE: Trufflehog is slow (~500ms-2s per commit)
# Only use in CI, not in local pre-commit
# Uncomment only if you have CI-only config

# - repo: https://github.com/trufflesecurity/trufflehog
#   rev: v3.63.0
#   hooks:
#     - id: trufflehog
#       name: Trufflehog (entropy scanning)
#       entry: trufflehog filesystem .
#       language: python
#       stages: [commit]
#       pass_filenames: false
```

### 3. For CI, run manually:
```bash
# GitHub Actions
trufflehog filesystem . --json --fail

# GitLab CI
trufflehog filesystem . --json --report-path=trufflehog.json
```

## How It Works

### Entropy Analysis Algorithm
1. **Split content** into candidate strings (tokens, Base64, hex)
2. **Calculate Shannon entropy** for each candidate:
   - Entropy = -Σ(p_i * log2(p_i)) where p_i = frequency of character i
   - Low entropy (0-3): normal text, less suspicious
   - High entropy (3-8): random-looking, likely secrets
3. **Check adjacent characters** for context clues:
   - Assignment operators (=, :) suggest variable assignment
   - Common secret prefixes (sk_, ghp_, xoxb-, etc.)
4. **Combine pattern + entropy** to reduce false positives
5. **Report findings** with confidence score and line number

### Entropy Formula Example
```
String: "password123"
- p = 1/11, a = 1/11, s = 2/11, w = 1/11, o = 1/11, r = 1/11, d = 1/11, 1 = 1/11, 2 = 1/11, 3 = 1/11
- Entropy ≈ 3.4 bits (medium)

String: "a7f3d9c2b8e1f4a6g9h2j5k8m1n4p7q0"
- Each char appears ~1 time, 32 chars
- Entropy ≈ 5.0 bits (high, likely secret)
```

## Configuration

### Basic .pre-commit-config.yaml (CI-only)
```yaml
- repo: https://github.com/trufflesecurity/trufflehog
  rev: v3.63.0
  hooks:
    - id: trufflehog
      name: Trufflehog entropy scan
      entry: trufflehog filesystem . --json --fail
      language: python
      stages: [commit]
      pass_filenames: false
```

### Custom Configuration (trufflehog.toml)

Create `.trufflehog.toml`:

```toml
[detectors]
basic = true
entropy = true
regex = true

[entropy]
# Minimum entropy threshold (higher = stricter, fewer FP)
shannon_entropy = 4.0
base64_entropy = 4.5

[exclude]
# Paths to skip during scanning
paths = [
  "test/",
  "fixtures/",
  ".git/",
  "node_modules/",
  "vendor/"
]

# File extensions to skip
extensions = [
  ".png",
  ".jpg",
  ".mp4",
  ".zip"
]

# Regex patterns to ignore (false positives)
regexes = [
  "test_key_.*",
  "mock_.*_token",
  "fake_.*_secret"
]

[detectors.custom]
# Custom regex detectors
[[detectors.custom.patterns]]
name = "Custom API Key"
pattern = '''api[_-]?key\s*[=:]\s*['\"]?([a-zA-Z0-9\-_]{32,})'''
```

Use custom config:
```bash
trufflehog filesystem . --config .trufflehog.toml --json
```

### Pre-commit with custom config
```yaml
- repo: https://github.com/trufflesecurity/trufflehog
  rev: v3.63.0
  hooks:
    - id: trufflehog
      name: Trufflehog (custom)
      entry: trufflehog filesystem . --config .trufflehog.toml --json --fail
      language: python
      stages: [commit]
      pass_filenames: false
```

## Usage Examples

### Scan filesystem
```bash
trufflehog filesystem . --json
```

### Scan with GitHub URL (includes private repos)
```bash
trufflehog github --org=my-org --token=ghp_xxx --json
```

### Scan S3 bucket
```bash
trufflehog s3 --bucket=my-bucket --json
```

### Scan Docker image
```bash
trufflehog docker --image=my-app:latest --json
```

### Scan with entropy threshold (reduce false positives)
```bash
trufflehog filesystem . --json --entropy=4.5
```

### Output JSON report
```bash
trufflehog filesystem . --json --report-path=trufflehog.json
```

### Fail if secrets found
```bash
trufflehog filesystem . --json --fail
echo $?  # Exit code 1 if secrets found, 0 if clean
```

### Scan and exclude paths
```bash
trufflehog filesystem . \
  --exclude-path test/ \
  --exclude-path vendor/ \
  --exclude-path node_modules/ \
  --json
```

## Detectors Included

Trufflehog includes 100+ detectors:

| Category | Examples |
|----------|----------|
| Cloud Providers | AWS keys, Azure secrets, GCP tokens |
| VCS | GitHub, GitLab, Bitbucket tokens |
| Messaging | Slack, Discord, Telegram tokens |
| Payment | Stripe, Twilio, Mailchimp keys |
| Databases | PostgreSQL, MySQL, MongoDB URIs |
| APIs | Generic API keys, Bearer tokens, OAuth |
| Crypto | Private keys (RSA, EC, PGP) |
| Entropy | High-entropy custom strings |

## Performance

| Scenario | Time | Notes |
|----------|------|-------|
| Filesystem scan (1000 files) | 1-2s | Depends on file sizes |
| GitHub scan (100 repos) | 10-30s | Depends on API rate limits |
| S3 bucket (10K objects) | 30-60s | Network latency |
| Docker image | 2-5s | Image size dependent |
| Pre-commit check | 500ms-2s | Larger repos slower |

**Optimize for speed:**
```bash
# Increase entropy threshold (fewer FP, faster)
trufflehog filesystem . --entropy=5.0 --json

# Skip large directories
trufflehog filesystem . \
  --exclude-path test/ \
  --exclude-path node_modules/ \
  --exclude-path .git/ \
  --json

# Scan specific branch (git only)
git clone --branch=main --depth=1 repo.git
trufflehog filesystem repo --json
```

## CI Integration

### GitHub Actions
```yaml
- name: Scan for secrets (trufflehog)
  run: |
    pip install trufflehog
    trufflehog filesystem . --json --fail
  continue-on-error: true

- name: Upload report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: trufflehog-report
    path: trufflehog.json
```

### GitLab CI
```yaml
trufflehog-scan:
  image: python:3.11
  script:
    - pip install trufflehog
    - trufflehog filesystem . --json --report-path=trufflehog.json || true
  artifacts:
    reports:
      sast: trufflehog.json
```

### Jenkins
```groovy
stage('Trufflehog Scan') {
  steps {
    sh '''
      pip install trufflehog
      trufflehog filesystem . --json --fail || true
    '''
  }
  post {
    always {
      archiveArtifacts artifacts: 'trufflehog.json'
    }
  }
}
```

## Troubleshooting

### "trufflehog: command not found"
```bash
# Solution: Install via pip
pip install trufflehog
# Verify:
trufflehog --version
```

### Too many false positives (entropy flagging random hex)
```bash
# Solution: Increase entropy threshold
trufflehog filesystem . --entropy=5.0 --json

# Or: Add to .trufflehog.toml
[entropy]
shannon_entropy = 5.0
base64_entropy = 5.0
```

### Scan too slow
```bash
# Solution: Exclude large directories
trufflehog filesystem . \
  --exclude-path .git/ \
  --exclude-path node_modules/ \
  --exclude-path vendor/ \
  --exclude-path test/ \
  --json
```

### Missing detections (should catch but doesn't)
```bash
# Solution: Lower entropy threshold
trufflehog filesystem . --entropy=3.0 --json

# Or: Add custom regex detector in config
```

### Check what was detected
```bash
# View JSON output with jq
trufflehog filesystem . --json | jq '.[] | {type: .detector_name, value: .raw}'
```

## When to Use Trufflehog vs Others

### Use trufflehog if:
- Want entropy-based detection (like GitHub scanners)
- Novel/custom secrets concern you
- Willing to run slower scan in CI
- Defense-in-depth approach wanted

### Use gitleaks instead if:
- Want fastest, most accurate pre-commit checks
- Pattern-based detection sufficient
- No entropy false-positive management wanted

### Use both (recommended) if:
- Maximum coverage desired
- Run gitleaks locally (fast), trufflehog in CI (thorough)
- High-security requirements

### Use detect-secrets instead if:
- Need baseline false-positive allowlisting
- Python repo where regex tuning useful
- Want lightweight local-only scanning

## Next Steps

1. **Install:** `pip install trufflehog`
2. **Test scan:** `trufflehog filesystem . --json`
3. **For CI:** Add to GitHub Actions, GitLab CI, Jenkins workflow
4. **Tune entropy threshold** based on false-positive rates
5. **Combine with gitleaks** for defense-in-depth

---

**See also:**
- Official docs: https://github.com/trufflesecurity/trufflehog
- GitHub article on secret scanning: https://github.blog/2022-04-04-security-briefing-preventing-leaks-of-oauth-tokens-with-trufflehog/
- Compare with gitleaks: `../hooks/gitleaks.md`
- Compare with detect-secrets: `../hooks/detect-secrets.md`
