# semgrep: SAST for Code Vulnerabilities

**30-second summary:** semgrep is a static analysis tool (SAST) that finds code-level security vulnerabilities, not just secrets. It detects SQL injection, hardcoded secrets, authentication bypass, unsafe deserialization, and other OWASP Top 10 issues across 30+ languages. Slower than secret scanners but essential for code security.

## What It Detects

### Code Vulnerabilities
- SQL injection: raw SQL queries without parameterization
- Cross-site scripting (XSS): unsanitized HTML output
- Authentication bypass: weak password checks, missing auth
- Hardcoded secrets: API keys, passwords in code
- Unsafe deserialization: pickle, pickle, eval()
- Insecure cryptography: weak hashing, hardcoded keys
- Directory traversal: unsanitized file paths
- Command injection: unsanitized shell commands
- Insecure randomness: Math.random() for secrets
- Prototype pollution: setting Object properties unsafely

### Example Catches
```python
# ✓ SQL injection (raw query)
query = "SELECT * FROM users WHERE id = " + user_input
db.execute(query)

# ✓ Hardcoded secret
API_KEY = "sk_live_9fdsf9sdfsdf"

# ✓ Unsafe deserialization
data = pickle.loads(untrusted_data)

# ✓ Weak randomness for secret
import random
token = ''.join([random.choice('0123456789') for _ in range(32)])

# ✗ Safe (parameterized query)
db.execute("SELECT * FROM users WHERE id = ?", [user_input])
```

## Why Use semgrep?

| Feature | semgrep | Gitleaks | npm-audit |
|---------|---------|----------|-----------|
| Finds code vulnerabilities | ✓ Yes | ✗ Secrets only | ✗ Dependencies only |
| Finds secrets | ✓ Yes | ✓ Yes | ✗ No |
| Finds dependency CVEs | ✗ No | ✗ No | ✓ Yes |
| SQL injection | ✓ Yes | ✗ No | ✗ No |
| XSS/CSRF | ✓ Yes | ✗ No | ✗ No |
| Auth bypass | ✓ Yes | ✗ No | ✗ No |
| Speed | Slow (2-5s) | Fast (50ms) | Medium (1-3s) |
| Languages | 30+ | Any | JavaScript only |
| Accuracy | <1% FP | <1% FP | <1% FP |

**What's the difference:**
- **Gitleaks** finds secrets in plain text
- **semgrep** finds vulnerabilities in code logic
- **npm-audit** finds known dependency vulnerabilities

**Use all three for defense-in-depth:**
1. Gitleaks (secrets pre-commit)
2. semgrep (code vulnerabilities)
3. npm-audit (dependency vulnerabilities)

## Installation

### Prerequisites
- Python 3.8+
- pip

### Install semgrep
```bash
pip install semgrep
```

### Verify installation
```bash
semgrep --version
# Output: semgrep 1.45.0
```

## Quick Start

### 1. Scan with default rules
```bash
semgrep --config=p/owasp-top-ten .
```

Shows code vulnerabilities in OWASP Top 10 categories.

### 2. Add to pre-commit hooks

In `.pre-commit-config.yaml`:

```yaml
# NOTE: Semgrep is slow (~2-5s per commit)
# Only use in CI, not in local pre-commit
# Uncomment only if you have CI-only config

# - repo: https://github.com/returntocorp/semgrep
#   rev: v1.45.0
#   hooks:
#     - id: semgrep
#       name: Semgrep (code vulnerabilities)
#       entry: semgrep --config=p/owasp-top-ten
#       language: python
#       types: [python, javascript, typescript, java, go, ruby]
#       pass_filenames: false
```

### 3. For CI, run manually:
```bash
# Scan with SARIF output (for GitHub Security tab)
semgrep --config=p/owasp-top-ten --sarif --output=semgrep.sarif .

# Fail if found
semgrep --config=p/owasp-top-ten --fail . || exit 1
```

## How It Works

### Rule Engine
1. **Pattern matching:** Semgrep rules define code patterns (AST matching)
2. **Language parsing:** Parse code into abstract syntax tree (AST)
3. **Pattern search:** Find AST nodes matching rule patterns
4. **Variable tracking:** Track variable scope, assignments, dataflow
5. **False-positive reduction:** Apply semantic checks to eliminate FP
6. **Report findings:** Show vulnerability with code snippet, fix

### Example Rule (YAML)
```yaml
rules:
  - id: hardcoded-sql-secret
    pattern-either:
      - pattern: |
          password = "..."
      - pattern: |
          api_key = "..."
    message: Hardcoded secret in code
    languages: [python]
    severity: HIGH
```

## Configuration

### Built-In Rule Sets
Semgrep provides free rule packs:

| Pack | Rules | Coverage |
|------|-------|----------|
| `p/owasp-top-ten` | 100+ | OWASP Top 10 |
| `p/security-audit` | 200+ | General security |
| `p/cwe-top-25` | 50+ | CWE Top 25 |
| `p/django` | 30+ | Django-specific |
| `p/flask` | 20+ | Flask-specific |
| `p/nodejs` | 40+ | Node.js security |

### Basic .pre-commit-config.yaml
```yaml
- repo: https://github.com/returntocorp/semgrep
  rev: v1.45.0
  hooks:
    - id: semgrep
      name: Semgrep
      entry: semgrep --config=p/owasp-top-ten --config=p/security-audit
      language: python
      types: [python, javascript, typescript]
      pass_filenames: false
```

### Custom Rules (semgrep.yml)

Create `.semgrep.yml`:

```yaml
rules:
  - id: sql-injection-raw-concat
    pattern-either:
      - pattern: |
          query = "SELECT * FROM users WHERE id = " + $X
      - pattern: |
          query = f"SELECT * FROM users WHERE id = {$X}"
      - pattern: |
          query = "SELECT * FROM users WHERE id = " + str($X)
    message: SQL injection risk - use parameterized queries
    languages: [python]
    severity: CRITICAL
    fix: |
      cursor.execute("SELECT * FROM users WHERE id = %s", [$X])

  - id: hardcoded-api-key
    pattern: |
      API_KEY = "sk_...{20,}"
    message: Hardcoded API key found
    languages: [python, javascript]
    severity: CRITICAL

  - id: weak-random-password
    pattern-either:
      - pattern: |
          import random
          ...
          $X = random.choice(...)
      - pattern: |
          import secrets  # secrets is good
    message: Use secrets module for cryptographic randomness, not random
    languages: [python]
    severity: HIGH
```

Use custom rules:
```bash
semgrep --config .semgrep.yml .
```

### Pre-commit with custom rules
```yaml
- repo: https://github.com/returntocorp/semgrep
  rev: v1.45.0
  hooks:
    - id: semgrep
      name: Semgrep (custom)
      entry: semgrep --config .semgrep.yml
      language: python
      types: [python]
      pass_filenames: false
```

## Usage Examples

### Scan with OWASP Top 10 rules
```bash
semgrep --config=p/owasp-top-ten .
```

### Scan with multiple rule packs
```bash
semgrep --config=p/owasp-top-ten --config=p/security-audit --config=p/django .
```

### Output SARIF (for GitHub Security)
```bash
semgrep --config=p/owasp-top-ten --sarif --output=semgrep.sarif .
```

### Output JSON report
```bash
semgrep --config=p/owasp-top-ten --json --output=semgrep.json .
```

### Fail if findings exist
```bash
semgrep --config=p/owasp-top-ten --fail . && echo "Clean!"
```

### Scan specific language
```bash
semgrep --config=p/owasp-top-ten --lang=python .
```

### Exclude patterns
```bash
semgrep --config=p/owasp-top-ten \
  --exclude="test/" \
  --exclude="vendor/" \
  .
```

### Verbose output (see how patterns matched)
```bash
semgrep --config=p/owasp-top-ten --verbose --debug .
```

## Supported Languages

| Language | Rules | Coverage |
|----------|-------|----------|
| Python | 100+ | Excellent |
| JavaScript/TypeScript | 100+ | Excellent |
| Java | 80+ | Good |
| Go | 60+ | Good |
| Ruby | 40+ | Fair |
| PHP | 50+ | Good |
| C/C++ | 30+ | Fair |
| C# | 40+ | Fair |
| SQL | 20+ | Limited |

## Performance

| Scenario | Time |
|----------|------|
| Small project (100 files) | 1-2s |
| Medium project (1000 files) | 3-5s |
| Large project (10K files) | 10-30s |
| Pre-commit check (staged) | 2-5s |

**Optimize for speed:**
```bash
# Exclude large directories
semgrep --config=p/owasp-top-ten \
  --exclude="test/" \
  --exclude="node_modules/" \
  --exclude="vendor/" \
  .

# Scan only changed files
semgrep --config=p/owasp-top-ten $(git diff --name-only)

# Scan specific language only
semgrep --config=p/owasp-top-ten --lang=python .
```

## CI Integration

### GitHub Actions
```yaml
- name: Run semgrep
  run: |
    pip install semgrep
    semgrep --config=p/owasp-top-ten --sarif --output=semgrep.sarif .

- name: Upload to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: semgrep.sarif
    category: semgrep-sast
```

### GitLab CI
```yaml
semgrep-scan:
  image: python:3.11
  script:
    - pip install semgrep
    - semgrep --config=p/owasp-top-ten --json --output=semgrep.json .
  artifacts:
    reports:
      sast: semgrep.json
```

### Jenkins
```groovy
stage('Semgrep Analysis') {
  steps {
    sh '''
      pip install semgrep
      semgrep --config=p/owasp-top-ten --json --output=semgrep.json .
    '''
  }
  post {
    always {
      archiveArtifacts artifacts: 'semgrep.json'
    }
  }
}
```

## Troubleshooting

### "semgrep: command not found"
```bash
# Solution: Install via pip
pip install semgrep
# Verify:
semgrep --version
```

### "Error loading config"
```bash
# Solution: Ensure rule set exists
semgrep --config=p/owasp-top-ten .  # Built-in packs

# Or: Use local file
semgrep --config ./.semgrep.yml .
```

### Too slow for pre-commit
```bash
# Solution: Run in CI only, not pre-commit
# Comment out from .pre-commit-config.yaml
# Add to GitHub Actions/GitLab CI workflow
```

### Too many false positives
```bash
# Solution: Disable specific rules
semgrep --config=p/owasp-top-ten \
  --exclude-rule=rule-id-here \
  .

# Or: Use stricter rule packs
semgrep --config=p/security-audit .  # More conservative
```

### Check matched rules
```bash
# Verbose output
semgrep --config=p/owasp-top-ten --verbose .
```

## When to Use semgrep vs Others

### Use semgrep if:
- Want code vulnerability detection (not just secrets)
- Need OWASP Top 10 coverage
- Language coverage includes your stack
- Willing to run in CI (slower than other hooks)

### Use gitleaks instead if:
- Only secret detection needed
- Pre-commit performance critical
- No code-level vulnerability analysis needed

### Use npm-audit instead if:
- Only dependency vulnerabilities matter
- Node.js/JavaScript project
- Want very fast checks

### Use all three (recommended) for defense-in-depth:
1. **gitleaks** in pre-commit (secrets, fast)
2. **npm-audit** in pre-commit (dependencies, medium)
3. **semgrep** in CI (code vulnerabilities, slow)

## Next Steps

1. **Install:** `pip install semgrep`
2. **Test scan:** `semgrep --config=p/owasp-top-ten .`
3. **For CI:** Add to GitHub Actions workflow
4. **Iterate:** Adjust rule sets based on findings
5. **Combine:** Use with gitleaks for comprehensive coverage

---

**See also:**
- Official docs: https://semgrep.dev/
- Rule marketplace: https://semgrep.dev/r
- Compared with other SAST: `../README.md` comparison table
- CI integration guide: `../ci-integration.md`
