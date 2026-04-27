# Django: Pre-Commit Hook Setup

**30-second summary:** Django projects have unique security risks: SECRET_KEY leaks, SQL injection in raw queries, hardcoded database credentials, and debug mode accidentally enabled in production. This guide adds specific hooks to catch these patterns in settings.py, models.py, and views.py.

## Django Security Risks

### Critical Django Vulnerabilities

| Vulnerability | Location | Impact |
|---------------|----------|--------|
| Hardcoded SECRET_KEY | settings.py | Session hijacking, CSRF bypass |
| Hardcoded database password | DATABASES | Full database compromise |
| DEBUG=True in production | settings.py | Source code exposure |
| Raw SQL injection | views.py, models.py | Full database compromise |
| Hardcoded API keys | settings.py, views.py | Account takeover |
| ALLOWED_HOSTS misconfigured | settings.py | Host header injection |
| Insecure session cookies | settings.py | Session hijacking |

### Example Vulnerabilities
```python
# ✗ In settings.py
SECRET_KEY = 'django-insecure-abc123xyz'  # Hardcoded!
DEBUG = True  # Production should be False!
DATABASES = {
    'default': {
        'PASSWORD': 'hardcoded_password'  # CAUGHT!
    }
}

# ✗ In views.py
query = f"SELECT * FROM users WHERE email = '{request.GET.get('email')}'"
User.objects.raw(query)  # SQL INJECTION!

# ✗ Weak configuration
ALLOWED_HOSTS = ['*']  # Too permissive
SESSION_COOKIE_SECURE = False  # Should be True in production
CSRF_COOKIE_SECURE = False  # Should be True in production

# ✓ Safe: settings.py
import os
SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')
SESSION_COOKIE_SECURE = not DEBUG
```

## Setup: Django .pre-commit-config.yaml

```yaml
# Pre-commit configuration for Django projects
# Place in repository root: .pre-commit-config.yaml

default_stages: [commit]
fail_fast: false

repos:
  # ============================================================================
  # GITLEAKS: Catch hardcoded secrets specific to Django
  # ============================================================================
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
        name: Detect Django secrets
        description: Scans for hardcoded SECRET_KEY, DB passwords, API keys
        entry: gitleaks protect --verbose
        language: golang
        stages: [commit]
        pass_filenames: false
        always_run: true


  # ============================================================================
  # DETECT-SECRETS: Django-specific baseline
  # ============================================================================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        name: Detect Django secrets
        description: Catches SECRET_KEY, passwords, API keys
        args: ['--baseline', '.secrets.baseline']
        exclude: |
          (?x)^(
            requirements\.lock|
            poetry\.lock|
            \.venv/
          )$


  # ============================================================================
  # CUSTOM DJANGO PATTERNS: Detect DEBUG=True, raw SQL, etc.
  # ============================================================================
  - repo: https://github.com/pre-commit/mirrors-pylint
    rev: pylint-3.0.3
    hooks:
      - id: pylint
        name: PyLint (Django security)
        description: Scans for common Django security issues
        language: python
        types: [python]
        files: |
          (?x)^(
            .*settings\.py|
            .*models\.py|
            .*views\.py
          )


  # ============================================================================
  # BANDIT: Django-specific security scanning
  # ============================================================================
  # - repo: https://github.com/PyCQA/bandit
  #   rev: 1.7.5
  #   hooks:
  #     - id: bandit
  #       name: Bandit (Django SAST)
  #       description: Detects Django security issues
  #       language: python
  #       types: [python]
  #       args: ['-c', '.bandit']


  # ============================================================================
  # PIP-AUDIT: Dependency scanning
  # ============================================================================
  - repo: https://github.com/pre-commit/mirrors-pip-tools
    rev: v7.3.0
    hooks:
      - id: pip-audit
        name: Pip audit
        description: Checks for vulnerable Django/DRF versions
        entry: pip-audit --desc
        language: python
        stages: [commit]
        pass_filenames: false


  # ============================================================================
  # BLACK: Code formatting
  # ============================================================================
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        name: Black
        description: Auto-formats Python code
        language: python
        types: [python]


  # ============================================================================
  # ISORT: Import sorting
  # ============================================================================
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        name: isort
        description: Sorts imports
        language: python
        types: [python]


  # ============================================================================
  # FLAKE8: Code quality
  # ============================================================================
  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        name: Flake8
        description: Checks code style
        language: python
        types: [python]
        args: ['--max-line-length=100']


  # ============================================================================
  # YAML VALIDATION
  # ============================================================================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        name: Validate YAML
        description: Checks YAML syntax
        args: ['--unsafe']

      - id: check-json
        name: Validate JSON

      - id: trailing-whitespace
        name: Remove trailing whitespace

      - id: end-of-file-fixer
        name: Fix end-of-file

      - id: check-added-large-files
        name: Detect large files
        args: ['--maxkb=5000']


  # ============================================================================
  # CI-ONLY: Semgrep for deeper SAST
  # ============================================================================
  # - repo: https://github.com/returntocorp/semgrep
  #   rev: v1.45.0
  #   hooks:
  #     - id: semgrep
  #       name: Semgrep (SAST)
  #       entry: semgrep --config=p/owasp-top-ten --config=p/django
  #       language: python
  #       types: [python]
  #       pass_filenames: false
```

## Django Security Patterns to Protect

### 1. settings.py: Critical Configuration

```python
# ✗ INSECURE: Hardcoded values
import os

SECRET_KEY = 'django-insecure-9fdsf9sdfsdf'  # CAUGHT by gitleaks!
DEBUG = True  # CAUGHT by custom checks!

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'admin',
        'PASSWORD': 'hardcoded_password',  # CAUGHT!
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

ALLOWED_HOSTS = ['*']  # Too permissive
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
```

```python
# ✓ SECURE: Environment-based configuration
import os
from pathlib import Path

# Validate required env vars
required_env_vars = ['SECRET_KEY', 'DB_PASSWORD', 'DEBUG']
for var in required_env_vars:
    if not os.environ.get(var):
        raise ValueError(f"Missing required env var: {var}")

SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Security settings (enabled in production)
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# API keys (never hardcoded)
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
```

### 2. models.py: Safe Database Queries

```python
# ✗ SQL Injection Risk
from django.db import connection
from django.db.models import Q

def search_users(email):
    query = f"SELECT * FROM users WHERE email = '{email}'"  # VULNERABLE!
    cursor = connection.cursor()
    cursor.execute(query)
    return cursor.fetchall()

# ✗ Another variant
def find_user(email):
    return User.objects.raw(f"SELECT * FROM users WHERE email = '{email}'")


# ✓ SAFE: Use ORM
def search_users(email):
    return User.objects.filter(email=email)

# ✓ SAFE: Use parameterized queries
def find_user_raw(email):
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", [email])
    return cursor.fetchall()

# ✓ SAFE: Q objects for complex queries
def search(email=None, name=None):
    query = Q()
    if email:
        query &= Q(email=email)
    if name:
        query &= Q(name__icontains=name)
    return User.objects.filter(query)
```

### 3. views.py: Prevent Information Disclosure

```python
# ✗ DEBUG information leak
from django.http import JsonResponse

def api_view(request):
    try:
        data = process_data(request)
        return JsonResponse({'status': 'ok', 'data': data})
    except Exception as e:
        # VULNERABLE: exposes stack trace
        return JsonResponse({'error': str(e)})

# ✓ SAFE: Generic error messages in production
def api_view(request):
    try:
        data = process_data(request)
        return JsonResponse({'status': 'ok', 'data': data})
    except Exception as e:
        logger.error(f"Error in api_view: {e}", exc_info=True)
        return JsonResponse(
            {'error': 'Internal server error'},
            status=500
        )
```

### 4. Authentication and Passwords

```python
# ✗ BAD: Plain text or weak hashing
def create_user(username, password):
    user = User(username=username, password=password)  # Not hashed!
    user.save()

import hashlib
def weak_hash(password):
    return hashlib.md5(password.encode()).hexdigest()  # MD5 is broken!

# ✓ GOOD: Django's built-in hashing
from django.contrib.auth.models import User

user = User.objects.create_user(
    username=username,
    password=password  # Django handles bcrypt hashing
)

# ✓ GOOD: Custom hash with strong algorithm
from django.contrib.auth.hashers import make_password, check_password

hashed = make_password(password)  # Uses PBKDF2 by default
is_valid = check_password(password, hashed)
```

## Environment Configuration

### .env.local Example

```bash
# .env.local (git-ignored)
SECRET_KEY=your-super-secret-key-min-50-chars
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=myapp_db
DB_USER=myapp_user
DB_PASSWORD=very_secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Third-party APIs
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
SENDGRID_API_KEY=SG.xxx
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

### Load Environment in manage.py
```python
# manage.py
import os
import sys

# Load .env.local BEFORE Django setup
from dotenv import load_dotenv
load_dotenv()

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    # ... rest of manage.py
```

## Pre-Commit Initialize (First Time)

```bash
# 1. Navigate to Django project
cd my-django-app

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install pre-commit
pip install pre-commit

# 4. Copy .pre-commit-config.yaml (above)
cp .pre-commit-config.yaml .

# 5. Install project dependencies
pip install -r requirements.txt
pip install black isort flake8 pylint

# 6. Initialize baseline
detect-secrets scan --all-files > .secrets.baseline

# 7. Create .env.local (git-ignored)
echo ".env.local" >> .gitignore
cat > .env.local << EOF
SECRET_KEY=your-secret-key-here
DEBUG=False
DB_PASSWORD=your-db-password
EOF

# 8. Install hooks
pre-commit install

# 9. Run on all files
pre-commit run --all-files

# 10. Commit
git add .pre-commit-config.yaml .secrets.baseline .gitignore
git commit -m "Add pre-commit hooks for Django security"
```

## Common Django Vulnerabilities Caught

### Hardcoded SECRET_KEY
```python
# ✓ Caught by gitleaks
SECRET_KEY = 'django-insecure-abc123xyz'
```

### DEBUG Mode Enabled
```python
# ✓ Can be detected with custom pylint rules
DEBUG = True  # This should be environment-based
```

### Raw SQL with User Input
```python
# ✓ Semgrep detects in CI
query = "SELECT * FROM users WHERE id = " + str(request.GET.get('id'))
```

### Weak Password Hashing
```python
# ✓ Bandit detects
import hashlib
password_hash = hashlib.md5(user_password.encode()).hexdigest()
```

## Custom .bandit Configuration

Create `.bandit`:

```yaml
# .bandit - Bandit configuration for Django projects

# Exclude test directories
exclude: /test/,/tests/

skips:
  # Ignore assert_used in test files
  - test_*.py: B101

tests:
  # Check for hardcoded SQL
  - B608
  # Check for exec/eval
  - B102
  # Check for insecure random
  - B311
  # Check for hardcoded passwords
  - B105,B106,B107
  # Check for insecure hashing
  - B303,B304,B305,B306
```

## CI Integration for Django

### GitHub Actions Example

```yaml
name: Django Security
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: 3.11
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pre-commit

      - name: Run pre-commit hooks
        run: pre-commit run --all-files

      - name: Run tests
        env:
          DEBUG: 'False'
          DB_NAME: test_db
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_HOST: localhost
        run: |
          python manage.py test

      - name: Semgrep SAST
        run: |
          pip install semgrep
          semgrep --config=p/owasp-top-ten --config=p/django --fail .
        continue-on-error: true
```

## Troubleshooting

### "SECRET_KEY is hardcoded"
```bash
# Solution: Move to .env.local
echo "SECRET_KEY=your-secret-key" >> .env.local
# Remove from settings.py, use os.environ.get('SECRET_KEY')
```

### "DEBUG=True not allowed"
```python
# Solution: Use environment variable
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
```

### Bandit triggers on test fixture passwords
```yaml
# .bandit - ignore in test files
exclude: /tests/

# Or mark specific lines
def test_login():
    password = 'test_password'  # nosec B105 (test fixture)
```

### Pre-commit running during migrations
```bash
# Solution: Skip specific files in exclude
exclude: |
  (?x)^(
    migrations/|
    .venv/
  )$
```

## Next Steps

1. **Copy .pre-commit-config.yaml** above
2. **Create .env.local** with environment variables
3. **Update settings.py** to use environment variables
4. **Initialize:** `pre-commit install`
5. **Test:** `pre-commit run --all-files`
6. **Fix issues:** Remove hardcoded secrets, parameterize queries
7. **Integrate CI:** Add GitHub Actions workflow

---

**See also:**
- Django security docs: https://docs.djangoproject.com/en/stable/topics/security/
- OWASP Django: https://owasp.org/www-project-web-security-testing-guide/
- Django environment best practices: https://12factor.net/
- Parent guide: `../README.md`
- Hook details: `../hooks/gitleaks.md`, `../hooks/semgrep.md`
