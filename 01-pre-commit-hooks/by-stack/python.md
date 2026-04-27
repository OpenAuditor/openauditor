# Python: Pre-Commit Hook Setup

**30-second summary:** Python projects need hooks for secrets, dependency vulnerabilities, code quality, and type checking. This guide configures gitleaks, poetry/pip-audit for CVEs, black for formatting, mypy for type safety, and pylint for security issues in your Python codebase.

## Python Security Challenges

### What's At Risk in Python
1. **Hardcoded database credentials** in config files and scripts
2. **API keys and secrets** in constants or configs
3. **Vulnerable dependencies** (e.g., old Django, Flask versions)
4. **Unsafe SQL** (no parameterization)
5. **Weak cryptography** (hardcoded keys, weak hashing)
6. **Pickle deserialization** from untrusted sources

### Example Vulnerabilities
```python
# ✗ Hardcoded secret
DATABASE_URL = "postgresql://admin:hardcoded_pass@localhost/db"

# ✗ Unsafe SQL
query = f"SELECT * FROM users WHERE email = '{user_email}'"
db.execute(query)

# ✗ Weak randomness
import random
token = ''.join(random.choice('abcdef0123456789') for _ in range(32))

# ✗ Unsafe pickle
data = pickle.loads(untrusted_data)

# ✓ Safe
DATABASE_URL = os.environ.get('DATABASE_URL')
query = "SELECT * FROM users WHERE email = %s"
db.execute(query, (user_email,))
```

## Setup: Complete .pre-commit-config.yaml for Python

```yaml
# Pre-commit configuration for Python projects
# Place in repository root: .pre-commit-config.yaml

default_stages: [commit]
fail_fast: false

repos:
  # ============================================================================
  # GITLEAKS: Catch hardcoded secrets
  # ============================================================================
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
        name: Detect secrets (gitleaks)
        description: Scans for hardcoded API keys, DB passwords
        entry: gitleaks protect --verbose
        language: golang
        stages: [commit]
        pass_filenames: false
        always_run: true


  # ============================================================================
  # DETECT-SECRETS: Regex baseline for known secrets
  # ============================================================================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        name: Detect secrets (baseline)
        description: Catches hardcoded passwords, API keys
        args: ['--baseline', '.secrets.baseline']
        exclude: |
          (?x)^(
            poetry.lock|
            requirements\.lock|
            \.venv/
          )$


  # ============================================================================
  # PIP-AUDIT or POETRY-AUDIT: Dependency vulnerability scanning
  # ============================================================================
  # For pip projects:
  - repo: https://github.com/pre-commit/mirrors-pip-tools
    rev: v7.3.0
    hooks:
      - id: pip-audit
        name: Pip audit (dependencies)
        description: Checks for known CVEs in Python packages
        entry: pip-audit --desc --skip-editable
        language: python
        stages: [commit]
        pass_filenames: false

  # For Poetry projects (alternative):
  # - repo: https://github.com/python-poetry/poetry
  #   rev: 1.7.0
  #   hooks:
  #     - id: poetry-check
  #       name: Poetry check
  #       entry: poetry check --lock


  # ============================================================================
  # BLACK: Python code formatting
  # ============================================================================
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        name: Black (code formatting)
        description: Auto-formats Python code
        language: python
        types: [python]
        args: ['--line-length=100']


  # ============================================================================
  # ISORT: Import sorting
  # ============================================================================
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        name: isort (import sorting)
        description: Sorts Python imports
        language: python
        types: [python]


  # ============================================================================
  # FLAKE8: Python linting (code quality)
  # ============================================================================
  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        name: Flake8 (code quality)
        description: Checks for code style and errors
        language: python
        types: [python]
        args:
          - '--max-line-length=100'
          - '--extend-ignore=E203,W503'  # Black compatibility


  # ============================================================================
  # MYPY: Type checking (optional but recommended)
  # ============================================================================
  # - repo: https://github.com/pre-commit/mirrors-mypy
  #   rev: v1.7.1
  #   hooks:
  #     - id: mypy
  #       name: MyPy (type checking)
  #       description: Checks Python type hints
  #       language: python
  #       types: [python]
  #       additional_dependencies: ['types-all']


  # ============================================================================
  # PYLINT: Advanced Python linting (security focused)
  # ============================================================================
  # - repo: https://github.com/PyCQA/pylint
  #   rev: pylint-3.0.3
  #   hooks:
  #     - id: pylint
  #       name: PyLint (security linting)
  #       description: Checks for security issues
  #       language: python
  #       types: [python]
  #       args: ['--disable=W,C,R,F']  # Security warnings only


  # ============================================================================
  # BANDIT: Python security issue scanner
  # ============================================================================
  # - repo: https://github.com/PyCQA/bandit
  #   rev: 1.7.5
  #   hooks:
  #     - id: bandit
  #       name: Bandit (security scan)
  #       description: Scans for security issues
  #       language: python
  #       types: [python]
  #       args: ['-c', '.bandit']  # Use .bandit config


  # ============================================================================
  # SAFETY: Python dependency security scanning
  # ============================================================================
  # - repo: https://github.com/Lucas-C/pre-commit-hooks
  #   rev: v1.5.1
  #   hooks:
  #     - id: python-safety-dependencies-check
  #       name: Safety (CVE check)
  #       description: Checks for known Python CVEs
  #       language: python
  #       types: [python]


  # ============================================================================
  # YAML VALIDATION
  # ============================================================================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        name: Validate YAML
        description: Checks YAML files for syntax errors
        args: ['--unsafe']

      - id: check-json
        name: Validate JSON
        description: Checks JSON files for syntax errors

      - id: check-toml
        name: Validate TOML
        description: Checks TOML files for syntax errors

      - id: trailing-whitespace
        name: Remove trailing whitespace

      - id: end-of-file-fixer
        name: Fix end-of-file

      - id: check-added-large-files
        name: Detect large files
        args: ['--maxkb=5000']

      - id: check-merge-conflict
        name: Detect merge conflicts


  # ============================================================================
  # CI-ONLY HOOKS (Comment out; run in CI instead)
  # ============================================================================
  # These are slow; run in CI pipeline, not pre-commit

  # SEMGREP: Static analysis for vulnerabilities
  # - repo: https://github.com/returntocorp/semgrep
  #   rev: v1.45.0
  #   hooks:
  #     - id: semgrep
  #       name: Semgrep (SAST)
  #       entry: semgrep --config=p/owasp-top-ten --config=p/security-audit
  #       language: python
  #       types: [python]
  #       pass_filenames: false

  # TRUFFLEHOG: Deep entropy scanning
  # - repo: https://github.com/trufflesecurity/trufflehog
  #   rev: v3.63.0
  #   hooks:
  #     - id: trufflehog
  #       name: Trufflehog (entropy scan)
  #       entry: trufflehog filesystem . --json --fail
  #       language: python
  #       pass_filenames: false
```

## Environment Management

### Python .env Files

Always git-ignore environment files:

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production
.env.staging
.env.development
venv/
env/
.venv/
```

### Safe Environment Handling

```python
# ✓ Good: Load from environment
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env.local (git-ignored)

DATABASE_URL = os.getenv('DATABASE_URL')
API_KEY = os.getenv('API_KEY')
SECRET_KEY = os.getenv('SECRET_KEY')

if not all([DATABASE_URL, API_KEY, SECRET_KEY]):
    raise ValueError("Missing required environment variables")
```

### Example .env.local

```bash
# .env.local (git-ignored)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
API_KEY=sk_live_9fdsf9sdfsdf
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Key Files and Patterns

### 1. settings.py (Django)

Common Django security issues:

```python
# ✗ Bad: Hardcoded secrets
SECRET_KEY = 'django-insecure-9fdsf9sdfsdf'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'admin',
        'PASSWORD': 'hardcoded_password',  # CAUGHT!
    }
}

# ✓ Good: Environment variables
import os
from pathlib import Path

SECRET_KEY = os.environ.get('SECRET_KEY')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}

DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')
```

### 2. requirements.txt

Lock specific versions to avoid unexpected updates:

```bash
# ✓ Good: Pinned versions
Django==4.2.8
djangorestframework==3.14.0
psycopg2-binary==2.9.9
celery==5.3.4

# ✗ Bad: Loose versions (allows insecure updates)
Django>=3.0
djangorestframework
psycopg2-binary
```

### 3. Database Queries

```python
# ✗ SQL injection
user_input = request.GET.get('email')
query = f"SELECT * FROM users WHERE email = '{user_input}'"
cursor.execute(query)

# ✓ Safe: Parameterized query
cursor.execute("SELECT * FROM users WHERE email = %s", [user_input])

# ✓ ORM (Django)
User.objects.filter(email=user_input)
```

## Pre-Commit Initialize (First Time)

### For pip projects:
```bash
# 1. Navigate to Python project
cd my-python-app

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install pre-commit
pip install pre-commit

# 4. Copy .pre-commit-config.yaml (above)
cp .pre-commit-config.yaml .

# 5. Install project dependencies (for linting)
pip install -r requirements.txt
pip install black isort flake8

# 6. Initialize baseline
detect-secrets scan --all-files > .secrets.baseline

# 7. Install hooks
pre-commit install

# 8. Run on all files
pre-commit run --all-files

# 9. Commit configuration
git add .pre-commit-config.yaml .secrets.baseline .gitignore
git commit -m "Add pre-commit security hooks"
```

### For Poetry projects:
```bash
# 1. Navigate to Poetry project
cd my-python-app

# 2. Install poetry (if not already)
pip install poetry

# 3. Install pre-commit
pip install pre-commit

# 4. Copy .pre-commit-config.yaml

# 5. Install hooks
pre-commit install

# 6. Run checks
pre-commit run --all-files
```

## Common Vulnerabilities Caught

### Hardcoded Database Passwords
```python
# ✓ Caught by gitleaks
conn = psycopg2.connect(
    host="localhost",
    database="mydb",
    user="admin",
    password="hardcoded_password_123"  # DETECTED!
)
```

### API Keys in Code
```python
# ✓ Caught
STRIPE_API_KEY = "sk_live_9fdsf9sdfsdf"
OPENAI_API_KEY = "sk-proj-xxx"
AWS_SECRET = "AKIAIOSFODNN7EXAMPLE"
```

### Unsafe Deserialization
```python
# ✗ Dangerous: pickle from untrusted source
import pickle
data = pickle.loads(untrusted_user_data)

# ✓ Safe: Use JSON for untrusted input
import json
data = json.loads(untrusted_user_data)
```

### Weak Randomness
```python
# ✗ Bad: Python random (not cryptographic)
import random
token = ''.join(random.choice('0123456789abcdef') for _ in range(32))

# ✓ Good: Use secrets module
import secrets
token = secrets.token_hex(16)
```

## CI Integration for Python

### GitHub Actions Example

```yaml
name: Python Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pre-commit

      - name: Run pre-commit hooks
        run: pre-commit run --all-files

      - name: Run tests
        run: pytest

      - name: Semgrep SAST (CI-only)
        run: |
          pip install semgrep
          semgrep --config=p/owasp-top-ten --config=p/security-audit --fail .
        continue-on-error: true
```

### GitLab CI Example

```yaml
stages:
  - security
  - test

pre-commit:
  stage: security
  image: python:3.11
  before_script:
    - pip install -r requirements.txt pre-commit
  script:
    - pre-commit run --all-files

pip-audit:
  stage: security
  image: python:3.11
  script:
    - pip install -r requirements.txt pip-audit
    - pip-audit
```

## Troubleshooting

### "venv/bin/python: no such file"
```bash
# Solution: Create and activate venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Hook fails but locally works
```bash
# Solution: Hooks run in isolated environment
# Ensure requirements.txt has everything
pip freeze > requirements.txt
```

### Black conflicts with Flake8
```bash
# Solution: Configure Flake8 for Black compatibility
# In .flake8 or setup.cfg:
[flake8]
max-line-length = 100
extend-ignore = E203, W503
```

### mypy too strict
```bash
# Solution: Configure mypy tolerance
# In mypy.ini:
[mypy]
python_version = 3.11
warn_unused_ignores = True
disallow_untyped_defs = False  # Start lenient
```

### Poetry lock file triggering hook
```bash
# Solution: Exclude lock files
# In .pre-commit-config.yaml:
exclude: |
  (?x)^(
    poetry\.lock|
    requirements\.lock
  )$
```

## Next Steps

1. **Copy .pre-commit-config.yaml** above to repo root
2. **Create .env.local** with environment variables (git-ignored)
3. **Initialize:** `pre-commit install`
4. **Test:** `pre-commit run --all-files`
5. **Fix issues:** Remove hardcoded secrets, update requirements
6. **Commit:** `git add .pre-commit-config.yaml .secrets.baseline`
7. **Integrate CI:** Add GitHub Actions or GitLab CI workflow

---

**See also:**
- Python security: https://owasp.org/www-community/attacks/Sensitive_Data_Exposure
- Django security: https://docs.djangoproject.com/en/stable/topics/security/
- Black: https://black.readthedocs.io/
- MyPy: https://www.mypy-lang.org/
- Bandit: https://bandit.readthedocs.io/
- Parent guide: `../README.md`
- Hook details: `../hooks/gitleaks.md`, `../hooks/semgrep.md`
