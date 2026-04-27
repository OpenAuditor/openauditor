# Gitignore Templates

**Curated .gitignore files for all project types**

These templates prevent accidental commits of secrets, credentials, and sensitive files. Use them as starting points for your project—customize based on your specific needs.

---

## Quick Start

### For Node.js/npm projects:
```bash
cp .gitignore.node .gitignore
```

### For Python projects:
```bash
cp .gitignore.python .gitignore
```

### For Next.js/React projects:
```bash
cp .gitignore.nextjs .gitignore
```

### For all projects (universal baseline):
```bash
cp .gitignore.universal .gitignore
# Then add language-specific sections from other templates
```

### For AI/LLM projects with secrets:
```bash
cp .gitignore.ai-apps .gitignore
```

---

## Available Templates

### `.gitignore.universal`
**Use for**: All project types, foundational baseline

Core files to ignore:
- Operating system files (`.DS_Store`, `Thumbs.db`)
- Editor/IDE files (`.vscode`, `.idea`, `.sublime`)
- Environment files (`.env`, `.env.local`, `.env.*.local`)
- Credentials and secrets (API keys, SSH keys, certificates)
- OS-specific files (Windows, macOS, Linux)

**When to use**: Start with this, then add language-specific sections

---

### `.gitignore.nextjs`
**Use for**: Next.js applications (React, TypeScript, Node.js backend)

Includes:
- Next.js build outputs (`.next`, `out`)
- Node modules (`node_modules`)
- Environment files (`.env.local`, `.env.*.local`)
- IDE files (VS Code, JetBrains, Sublime)
- OS files (`.DS_Store`, `Thumbs.db`)
- Optional: Vercel deployments

**Common additions for Next.js projects:**
```gitignore
# Credentials and secrets
.env.local
.env.*.local
.env.production.local

# Build outputs
.next/
out/
build/

# Logs
npm-debug.log*
yarn-debug.log*

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
```

---

### `.gitignore.python`
**Use for**: Python/Django/Flask/FastAPI projects

Includes:
- Python cache (`__pycache__`, `.pyc`, `.pyo`)
- Virtual environments (`venv`, `env`, `.env`)
- Poetry/Pipenv files
- IDE files (PyCharm, VS Code)
- Build/distribution files (`build/`, `dist/`, `*.egg-info/`)
- Environment files

**Common additions for Python projects:**
```gitignore
# Virtual environments
venv/
env/
ENV/
.venv

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Build/distribution
build/
dist/
*.egg-info/
*.egg
```

---

### `.gitignore.node`
**Use for**: Node.js/npm/yarn/pnpm projects

Includes:
- Node modules (`node_modules`)
- npm lock files and package-lock
- Build outputs and caches
- Environment files
- IDE files
- Log files

**Common additions for Node projects:**
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-error.log*

# Build
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
```

---

### `.gitignore.ai-apps`
**Use for**: AI/ML applications using LLM APIs, model files, training data

Special focus on:
- API keys and tokens (OpenAI, Anthropic, Hugging Face, Google API)
- Model files (`.bin`, `.pt`, `.pth`, large ML models)
- Training data (often sensitive or large)
- Temporary notebooks and outputs
- Cache files from model loading
- Conda/virtualenv environments

**Critical items for AI projects:**
```gitignore
# API Keys and credentials
.env
.env.local
*.key
*.pem
*.pfx
openai_key.txt
anthropic_api_key.txt
huggingface_token.txt

# Model files (large binary files)
*.bin
*.pt
*.pth
*.safetensors
models/
checkpoints/
weights/

# Training outputs and data
data/
datasets/
*.csv
*.json (if sensitive)
training_logs/
outputs/

# Jupyter
.ipynb_checkpoints/
*.ipynb_checkpoints
__pycache__/

# Virtual environments
venv/
env/

# IDE and temp
.vscode/
.idea/
*.swp
*.swo
```

---

## How to Use These Templates

### Option 1: Copy and Customize
```bash
# Copy the template matching your project
cp .gitignore.nextjs /path/to/project/.gitignore

# Add any project-specific patterns
echo "dist/" >> /path/to/project/.gitignore
echo "*.log" >> /path/to/project/.gitignore
```

### Option 2: Combine Multiple Templates
```bash
# Create a combined .gitignore from multiple templates
cat .gitignore.universal .gitignore.nextjs > /path/to/project/.gitignore
```

### Option 3: Generate Custom (Use Agent Prompt)
See `prompts/generate-gitignore.md` for an automated approach.

---

## Common Patterns You Should Add

### Secrets and Credentials
```gitignore
# All secrets
*.key
*.pem
*.pfx
*.p12
.secrets
secrets/
credentials/

# API keys
.env
.env.local
.env.*.local

# SSH keys
id_rsa
id_rsa.pub
known_hosts
```

### Build and Temporary Files
```gitignore
# Build outputs
dist/
build/
.cache/
tmp/
temp/

# Package manager lock files (optional - usually want to track these)
package-lock.json  # OR remove this if you want to track lock files
yarn.lock         # OR remove this if you want to track lock files

# Compiled files
*.o
*.obj
*.pyc
*.pyo
```

### Logs and Database
```gitignore
# Logs
*.log
logs/
*.log.*

# Database
*.db
*.sqlite
*.sqlite3
*.dumped
data/
```

### IDE and OS Files
```gitignore
# macOS
.DS_Store
.AppleDouble
.LSOverride

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# Linux
.directory
.Trash-*

# IDE
.vscode/
.idea/
.sublime-project
.sublime-workspace
*.swp
*.swo
*~
```

---

## Best Practices

### 1. Review Before Committing
Always review what's about to be committed:
```bash
git status                    # See what's staged
git diff --cached             # See changes about to be committed
```

### 2. Never Commit Secrets
If you accidentally commit a secret:
1. Immediately rotate/revoke it
2. Remove from git history (see `prompts/audit-committed-secrets.md`)
3. Notify security team

### 3. Use Secret Management Tools
Instead of .env files in git:
- Use AWS Secrets Manager, HashiCorp Vault, or similar
- Use GitHub Secrets for CI/CD
- Use environment variables in production

### 4. Track .env.example (template)
Create a template file showing what env vars are needed:
```bash
# .env.example (safe to commit)
DATABASE_URL=postgresql://user:pass@localhost/dbname
API_KEY=sk_test_...  # DO NOT PUT REAL VALUE HERE
WEBHOOK_SECRET=whsec_...  # DO NOT PUT REAL VALUE HERE
```

Then add to .gitignore:
```gitignore
.env
.env.local
.env.*.local
# But NOT .env.example - that's safe to commit
```

### 5. Pre-commit Hook (Recommended)
Add automated checks before commit:
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
EOF

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### 6. Scanning for Secrets in History
See `prompts/audit-committed-secrets.md` for automated tools and techniques.

---

## Gitignore Syntax

### Basic Patterns
```gitignore
# Comment
*.log          # All files ending in .log

# Directory
node_modules/  # Entire directory
.git/          # But .git is special - already ignored

# File
.env           # Specific file

# Wildcards
test_*.log     # test_1.log, test_2.log, etc.
**/temp        # temp directory anywhere in repo

# Negation (whitelist exceptions)
*.log          # Ignore all logs
!important.log # EXCEPT important.log
```

### Advanced Patterns
```gitignore
# Ignore everything in directory except one file
data/*
!data/.gitkeep
!data/config.json

# Two-level wildcards
logs/**/*.log

# Character class
test_[0-9].log

# Optional trailing slash (directory only)
backup/
```

---

## Testing Your Gitignore

### Check what would be ignored:
```bash
git check-ignore -v *                 # Show what would be ignored
git check-ignore -v path/to/file      # Check specific file
git ls-files --others --exclude-standard  # Show all ignored files
```

### Add file but ignore future changes:
```bash
git add myfile.log
git update-index --assume-unchanged myfile.log  # Stop tracking changes
git update-index --no-assume-unchanged myfile.log  # Resume tracking
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `.env` not in .gitignore | Secrets committed to git | Add to .gitignore immediately, then see `audit-committed-secrets.md` |
| `node_modules/` committed | Huge repository, CI slowdown | Add to .gitignore, run `git rm -r --cached node_modules` |
| `dist/` or `build/` committed | Build artifacts clutter history | Add to .gitignore, remove from history |
| Log files in git | Repository bloats over time | Add `*.log` to .gitignore |
| IDE config committed | Conflicts between developers | Add IDE directories to .gitignore |

---

## Language-Specific Additions

### TypeScript
```gitignore
*.js              # Unless you want compiled output
*.js.map
*.d.ts.map
dist/
build/
tsbuildinfo
```

### React/Vue/Angular
```gitignore
node_modules/
dist/
build/
.cache/
coverage/
.pnp
.pnp.js
```

### Docker
```gitignore
.dockerignore  # Usually fine to commit
Dockerfile    # Usually fine to commit
docker-compose.override.yml  # Local overrides (optional)
```

### Kubernetes
```gitignore
*.yaml          # Only if contains secrets - otherwise track them
*.yml           # Only if contains secrets
kustomization.yaml  # Usually fine to commit
```

### Database
```gitignore
*.sqlite
*.sqlite3
*.db
*.dumped
postgres-data/
mysql-data/
```

---

## Resources

- **Official Gitignore Collection**: https://github.com/github/gitignore
- **Gitignore.io**: https://gitignore.io/ (interactive builder)
- **Git Documentation**: https://git-scm.com/docs/gitignore
- **Pre-commit Framework**: https://pre-commit.com/
- **Secret Detection Tools**: See `prompts/audit-committed-secrets.md`

---

## Next Steps

1. **Use a template**: Pick the one matching your project type
2. **Customize**: Add project-specific patterns
3. **Add secret detection**: Use `prompts/audit-committed-secrets.md`
4. **Audit existing repo**: If adding .gitignore to existing project, see `prompts/audit-committed-secrets.md`
5. **Test**: Run `git check-ignore -v *` to verify patterns work

---

**Template collection version**: 1.0  
**Last updated**: 2026-04-25  
**Maintained by**: Security team
