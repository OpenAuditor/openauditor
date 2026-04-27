# Generate Custom .gitignore

**Agent prompt to generate a tailored .gitignore file for your project**

---

## When to Use

- You have a unique project setup that doesn't match standard templates
- You're combining multiple frameworks or tools
- You need to document why specific patterns are ignored
- You want to ensure nothing sensitive is accidentally committed

---

## Works With Agents

- Claude Code (via OpenAuditor)
- GitHub Copilot
- Any LLM with access to your project structure
- Any agent that can read and write files

---

## Agent Prompt

Copy this prompt and paste it into your AI agent or IDE:

```
You are a security-focused .gitignore generator. Your task is to create a comprehensive
and safe .gitignore file for a project.

PROJECT CONTEXT:
- Technology stack: [DESCRIBE YOUR STACK - e.g., "Next.js + Python FastAPI + PostgreSQL"]
- Purpose: [PROJECT PURPOSE - e.g., "AI chatbot web application"]
- Sensitive data: [WHAT YOU HANDLE - e.g., "API keys, user data, training logs"]
- Team size: [TEAM SIZE - e.g., "5 people"]
- CI/CD system: [SYSTEM - e.g., "GitHub Actions", "GitLab CI", "Jenkins"]
- Deployment platform: [PLATFORM - e.g., "AWS", "Vercel", "Docker"]
- Special requirements: [ANY SPECIAL NEEDS - e.g., "HIPAA compliance", "PCI-DSS", etc.]

TASK:
1. Analyze the project structure and identify what should be ignored
2. Start with critical security items (secrets, credentials, API keys)
3. Add framework/language-specific patterns
4. Add OS and editor files
5. Document each section with clear comments
6. Explain why certain patterns are needed

OUTPUT:
Generate a .gitignore file that:
- Prioritizes security (credentials first)
- Is well-commented
- Includes explanations for non-obvious patterns
- Follows best practices for the technology stack
- Is maintainable and extendable

GUIDELINES:
- Never ignore .env.example (it's a template, safe to commit)
- Always include comments explaining the purpose of each section
- Include version control for lock files (package-lock.json, yarn.lock, poetry.lock)
- Be explicit about what's ignored and why
- Group related patterns together
- Include section headers for easy navigation

START with the most critical items (secrets, credentials) at the top.
```

---

## What to Expect

A well-structured .gitignore file with:

### 1. Critical Security Section (First)
```gitignore
# ==============================================================================
# CREDENTIALS & SECRETS (CRITICAL - NEVER COMMIT THESE)
# ==============================================================================

.env
.env.local
.env.*.local
*.key
*.pem
.secrets/

# API Keys
OPENAI_API_KEY
ANTHROPIC_API_KEY
...
```

### 2. Framework-Specific Sections
```gitignore
# Next.js
.next/
out/
.vercel/

# Python
__pycache__/
*.pyc
venv/

# Node.js
node_modules/
npm-debug.log*
```

### 3. OS and Editor Files
```gitignore
# macOS
.DS_Store

# IDE
.vscode/
.idea/

# Editors
*.swp
*.swo
```

### 4. Build and Test Artifacts
```gitignore
# Build
dist/
build/
coverage/

# Testing
.pytest_cache/
.jest-cache/
```

### 5. Common Patterns with Comments
```gitignore
# Environment variables
# Note: .env.example can be committed (it's a template)
.env
.env.local

# Database files
*.db
*.sqlite3
```

---

## Example Output Format

Your .gitignore should look like:

```gitignore
# [PROJECT NAME] GITIGNORE
# Generated: [DATE]
# Technology: [STACK]

# ============================================================================
# CRITICAL SECURITY
# ============================================================================

# API Keys and credentials
.env
.env.local
.env.*.local
.secrets/

# ============================================================================
# FRAMEWORK/LANGUAGE
# ============================================================================

# Node.js
node_modules/
npm-debug.log*

# ============================================================================
# BUILD & TEST
# ============================================================================

dist/
coverage/

# ============================================================================
# OS & EDITOR
# ============================================================================

.DS_Store
.vscode/

# ============================================================================
# TEMPORARY
# ============================================================================

*.bak
*.tmp
```

---

## How to Use

### Step 1: Prepare Project Info
Before running the agent, gather:
```
Stack: Next.js + FastAPI + PostgreSQL
Purpose: Real estate marketplace
Sensitive: API keys, user photos, listings
Team: 8 people
CI/CD: GitHub Actions
Deployment: AWS + Vercel
```

### Step 2: Run the Agent Prompt
Paste the agent prompt into your AI tool with your project info filled in.

### Step 3: Review Generated File
- Check all sections are present
- Verify sensitive files are included
- Ensure no false negatives (accidentally ignoring important files)
- Add any project-specific patterns

### Step 4: Validate
```bash
# Check what would be ignored
git check-ignore -v *

# Verify important files are NOT ignored
git check-ignore -v package.json    # Should NOT be ignored
git check-ignore -v .env.example    # Should NOT be ignored
git check-ignore -v .env            # Should be ignored
git check-ignore -v src/app.js      # Should NOT be ignored
```

### Step 5: Deploy
```bash
# Move to project root
cp generated.gitignore /path/to/project/.gitignore

# Test
cd /path/to/project
git status  # Verify sensitive files are ignored
git add .
# Review what's staged before commit
```

---

## Common Patterns by Stack

### Web: Next.js + Node.js + TypeScript
```
Stack: Next.js + Node.js + TypeScript
Add: .next/, node_modules/, *.js (if transpiling), *.js.map, coverage/
```

### Backend: Python + FastAPI + PostgreSQL
```
Stack: FastAPI + PostgreSQL
Add: __pycache__/, *.pyc, venv/, .pytest_cache/, *.db, *.sqlite3
```

### ML/AI: Python + TensorFlow/PyTorch + Jupyter
```
Stack: Python + PyTorch + Jupyter
Add: *.bin, *.pt, models/, checkpoints/, data/, .ipynb_checkpoints/, *.log
```

### Mobile: React Native + Node.js
```
Stack: React Native
Add: node_modules/, .expo/, build/, dist/, *.jks, *.keystore
```

### Monorepo: Lerna + Workspaces
```
Stack: Lerna monorepo
Add: node_modules/, dist/, coverage/, lerna-debug.log*
```

---

## Refinement Tips

### If You're Over-Ignoring
(Accidentally ignoring important files)

Check what's being ignored:
```bash
git check-ignore -v .gitignore    # Should NOT be ignored
git check-ignore -v README.md     # Should NOT be ignored
git check-ignore -v package.json  # Should NOT be ignored
```

Add exceptions with negation:
```gitignore
# Ignore all logs
*.log

# EXCEPT important logs
!important.log
```

### If You're Under-Ignoring
(Accidentally committing sensitive files)

Add missing patterns:
```gitignore
# Database connections
database.yml
database.local.yml

# API keys
.api_keys
keys.json
```

### Check Before First Commit
```bash
# See what WOULD be committed (respects .gitignore)
git add -n .
git diff --cached --name-only

# See what IS being ignored
git check-ignore -v *
```

---

## Advanced: .gitignore with Negation

Use negation patterns to whitelist exceptions:

```gitignore
# Ignore all logs
logs/
*.log

# BUT keep critical logs
!logs/critical.log
!logs/audit.log

# Ignore all env files
.env
.env.*

# BUT keep example template
!.env.example

# Ignore node_modules
node_modules/

# Keep only .pnp (pnpm)
!node_modules/.pnp
!node_modules/.pnp.js
```

---

## Version Control for .gitignore

### Track .gitignore Changes
```bash
git add .gitignore
git commit -m "docs: update .gitignore for AI/ML models"
```

### Create .gitignore Changelog
```markdown
# .gitignore Changes

## 2026-04-25
- Added *.bin, *.pt for model files
- Added models/, checkpoints/ directories
- Added .env.production.local

## 2026-04-20
- Added .next/ for Next.js
- Added npm-debug.log patterns
```

---

## Learn More

- [Official .gitignore Docs](https://git-scm.com/docs/gitignore)
- [GitHub gitignore Collection](https://github.com/github/gitignore)
- [gitignore.io](https://gitignore.io/) - Interactive generator
- [Detecting Secrets in Git](./audit-committed-secrets.md)

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| `.env` not ignored but `.env.local` is | Ignore `.env*` or all variants |
| Lock files ignored | Usually track: `package-lock.json`, `poetry.lock`, `yarn.lock` |
| `.env.example` ignored | Don't ignore - it's a template for developers |
| IDE files only partially ignored | Ignore entire `.vscode/`, `.idea/` directories |
| Forgetting to ignore `node_modules/` | This is critical - huge impact on repo size |
| Inconsistent patterns | Group patterns by category, add comments |

---

**Prompt version**: 1.0  
**Last updated**: 2026-04-25  
**Recommended for**: Teams starting new projects, refactoring existing repos
