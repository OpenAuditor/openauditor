# Audit Committed Secrets

**Find and remove secrets already committed to git history**

---

## When to Use

- You discovered a secret was committed to git (API key, password, token)
- You want to scan existing repository for accidentally committed credentials
- You're onboarding a new repository and need a security baseline
- You're preparing for a security audit or compliance check

**URGENCY**: If a live secret is exposed in git, treat this as critical (immediate).

---

## Works With Agents

- Claude Code (OpenAuditor)
- GitHub Copilot / Copilot CLI
- Local security scanning tools
- CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins)
- Enterprise secret management systems

---

## Agent Prompt

Copy this prompt and use with your AI agent:

```
You are a security auditor tasked with finding secrets in a git repository.
Your goal is to identify any accidentally committed credentials and provide
removal instructions.

SCAN TASK:
1. Search git history for common secret patterns:
   - API keys (OPENAI_SK_*, ANTHROPIC_*, Google API keys)
   - AWS credentials (AKIA*, AWS_SECRET_ACCESS_KEY)
   - Passwords and tokens (bearer, password, secret, token)
   - Private keys (-----BEGIN, ssh-rsa, id_rsa)
   - Database URLs with credentials
   - OAuth tokens and refresh tokens

2. For each finding:
   - File path and line number
   - Type of secret (API key, password, etc.)
   - Commit hash where it appeared
   - Date committed
   - Whether it's still in current code

3. Provide remediation:
   - Commands to remove from history
   - Instructions to rotate/revoke the secret
   - Verification steps

CONSTRAINTS:
- Do NOT output the actual secret values (redact them as [REDACTED])
- Do NOT commit the list of findings to git (it contains sensitive info)
- Check entire history: git log -p --all

REPORT FORMAT:
For each secret found:
FINDING: [Type of secret]
FILE: [path/to/file]
COMMIT: [hash]
DATE: [when committed]
STATUS: [still present in current code?]
PATTERN: [what was matched - redacted]
ACTION: [how to remove it]
```

---

## What to Expect

A detailed report showing:

### 1. Summary
```
AUDIT RESULTS
Repository: my-app
Scanned: Entire git history (150 commits)
Findings: 3 secrets discovered

SEVERITY: HIGH - Live secrets exposed in commits
ACTION: Immediate rotation required
```

### 2. Detailed Findings
```
FINDING #1: OpenAI API Key
FILE: src/config.js
COMMIT: a1b2c3d (2026-04-15)
DATE: 2026-04-15 10:30 UTC
STATUS: STILL PRESENT in current code
PATTERN: sk_[REDACTED]
ACTION: Remove from code, rotate key in OpenAI dashboard, force-push

---

FINDING #2: AWS Secret Access Key
FILE: .env (2026-03-20)
COMMIT: f4e5d6c
DATE: 2026-03-20 14:22 UTC
STATUS: Removed from current code (but in history)
PATTERN: AKIA[REDACTED]
ACTION: Key already rotated. Remove from history with git-filter-repo.
```

### 3. Remediation Steps
```
REMEDIATION STEPS

1. Immediate (right now):
   - Rotate/revoke all exposed secrets
   - List which secrets: [OpenAI key, AWS key]

2. Remove from history (next 30 minutes):
   - Use git-filter-repo or BFG repo-cleaner
   - Commands provided below
   - Force-push to all branches

3. Prevention (next week):
   - Add .gitignore entries for .env files
   - Install pre-commit hooks
   - Enable branch protection + secret scanning
```

---

## How to Use This Prompt

### Step 1: Run the Scan
With your agent (Claude, GitHub Copilot, etc.):

```
Please audit this git repository for committed secrets.
Repository: /path/to/my-repo
Report format: detailed with findings and remediation
```

Agent will scan and report findings.

### Step 2: Review Findings
Before taking action, verify:
- Are these actually secrets? (vs. test credentials)
- Are they real/live or test/fake values?
- Are they still in use or already rotated?

### Step 3: Rotate Secrets Immediately
For each exposed secret:
```bash
# OpenAI
curl -X DELETE https://api.openai.com/v1/api_keys/[key_id]

# AWS
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE

# Generic: Delete and regenerate in service's dashboard
```

### Step 4: Remove from Git History

**Option A: Using git-filter-repo (Recommended)**
```bash
# Install (if needed)
pip install git-filter-repo

# Remove a file from entire history
git filter-repo --invert-paths --path secrets.txt

# Remove content matching pattern
git filter-repo --replace-text replacements.txt
```

**Option B: Using BFG repo-cleaner**
```bash
# Install (if needed)
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove file from history
bfg --delete-files .env

# Remove secrets matching file
bfg --replace-text secrets-replacements.txt
```

**Option C: Manual git filter-branch (Slow, but works)**
```bash
# Remove .env from history
git filter-branch --tree-filter 'rm -f .env' HEAD

# Remove specific file pattern
git filter-branch --tree-filter 'find . -name "*.key" -delete' HEAD
```

### Step 5: Force-Push
```bash
# CAREFUL: This rewrites history. Ensure team is notified.
git push --force-with-lease origin main
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

### Step 6: Verify
```bash
# Check for any remaining secrets
git log -p --all | grep -i "password\|api_key\|secret" | head -20

# Verify specific files don't exist
git log --all --full-history -- .env | head -5
# Should show no results if successfully removed
```

---

## Manual Scanning Methods

### If You Don't Have an Agent

**Method 1: grep for common patterns**
```bash
# Search entire git history
git log -p --all -S "password=" | head -100
git log -p --all -S "api_key=" | head -100
git log -p --all -S "BEGIN RSA" | head -100

# Search for AWS pattern
git log -p --all | grep "AKIA[0-9A-Z]\{16\}" | head -20

# Search for specific file (e.g., .env)
git log --all --full-history -- .env
```

**Method 2: Using awk/sed**
```bash
# Find lines with "password:" 
git log -p --all | grep -E "password\s*=" | head -20

# Find bearer tokens
git log -p --all | grep -E "bearer\s+[A-Za-z0-9]+" | head -20
```

**Method 3: Tools**

**detect-secrets** (Python):
```bash
pip install detect-secrets

# Scan entire repo
detect-secrets scan

# Scan git history
git log -p --all | detect-secrets scan -

# Generate baseline
detect-secrets scan --baseline .secrets.baseline
```

**trufflehog** (Go):
```bash
# Install
brew install trufflehog  # macOS
# or: go install github.com/trufflesecurity/trufflehog/v3/cmd/trufflehog@latest

# Scan entire history
trufflehog git file:///path/to/repo

# Scan specific branch
trufflehog git --only-verified file:///path/to/repo --branch main
```

**GitGuardian CLI**:
```bash
pip install gitguardian-client

# Scan local repo
ggcli scan path /path/to/repo

# Scan git history
ggcli scan gitlog /path/to/repo
```

---

## Common Secret Patterns

### API Keys
```
OpenAI:        sk_[a-zA-Z0-9]{24,}
Anthropic:     sk-ant-[a-zA-Z0-9]+
Google:        AIza[0-9A-Za-z_-]{35}
AWS:           AKIA[0-9A-Z]{16}
```

### Tokens & OAuth
```
Bearer:        Bearer [A-Za-z0-9_-]+
GitHub:        ghp_[A-Za-z0-9_]{36,}
GitLab:        glpat-[A-Za-z0-9_-]{20,}
```

### Private Keys
```
RSA:           -----BEGIN RSA PRIVATE KEY-----
Ed25519:       -----BEGIN OPENSSH PRIVATE KEY-----
PGP:           -----BEGIN PGP PRIVATE KEY-----
```

### Credentials
```
Password:      password\s*[=:]\s*[^\s]+
Username:      username\s*[=:]\s*[^\s]+
Connection:    postgresql://user:pass@host
```

---

## Prevention: Before Next Incident

### 1. Update .gitignore
```gitignore
# Add to .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
.secrets/
secrets/
```

### 2. Install Pre-Commit Hooks
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
        args: ['--baseline', '.secrets.baseline']
EOF

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### 3. Set Up GitHub Secret Scanning
In GitHub:
1. Settings → Security → Secret scanning
2. Enable "Push protection" (blocks commits with secrets)
3. Enable "Secret scanning" (alerts on exposed secrets)

### 4. Team Training
- Document what counts as a secret
- Show examples of safe vs. unsafe commits
- Explain rotation procedures
- Create runbook for "I accidentally committed a secret"

### 5. Use Secret Management System
Instead of .env files:
- AWS Secrets Manager
- HashiCorp Vault
- Google Secret Manager
- Azure Key Vault

---

## Incident: Exposed Secret in Production

### If This Just Happened

**Timeline:**
- **T+0**: Discover exposure
- **T+5 min**: Rotate/revoke secret immediately
- **T+15 min**: Scan for where it's used
- **T+30 min**: Deploy fix to remove from code
- **T+1 hour**: Remove from git history
- **T+4 hours**: Full remediation & communication

**Commands:**
```bash
# 1. Rotate the secret (use service dashboard or API)
# Example: Rotate OpenAI key
curl -X DELETE https://api.openai.com/v1/api_keys/[exposed_key_id]

# 2. Remove from current code
# Find all references
git grep "sk_[exposed_key]"
# Edit files, remove key
# Use new key from environment variable

# 3. Git commit
git add -A
git commit -m "security: remove exposed API key from codebase"
git push origin main

# 4. Remove from history
git filter-repo --replace-text replacements.txt
git push --force-with-lease origin main

# 5. Verify removal
git log -p --all | grep "sk_[exposed_key]"
# Should return empty
```

### Post-Incident

- [ ] Document what happened (blameless retrospective)
- [ ] Implement .gitignore + pre-commit hooks
- [ ] Audit other repos for same issue
- [ ] Notify security/compliance
- [ ] Update team training
- [ ] Set up secret scanning in CI/CD

---

## Remediation Checklist

For each exposed secret:

- [ ] Identify what was exposed (type, scope, sensitivity)
- [ ] Determine who had access (git history visibility)
- [ ] Rotate/revoke the secret immediately
- [ ] Scan for active usage (logs, running processes)
- [ ] Remove from current code
- [ ] Remove from git history
- [ ] Force-push to all branches
- [ ] Update .gitignore to prevent recurrence
- [ ] Implement pre-commit hooks
- [ ] Notify team
- [ ] Document in incident log
- [ ] Schedule team training

---

## Tools Comparison

| Tool | Language | Speed | Accuracy | Cost |
|------|----------|-------|----------|------|
| detect-secrets | Python | Fast | High | Free |
| trufflehog | Go | Very fast | Very high | Free |
| GitGuardian | SaaS | Real-time | Excellent | Paid ($$$) |
| BFG | Java | Moderate | High | Free |
| git-filter-repo | Python | Moderate | High | Free |

---

## Learn More

- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://github.blog/changelog/2021-10-06-secret-scanning-push-protection/)
- [Detecting Secrets in Code](https://www.trufflesecurity.com/blog)
- [GitGuardian API Docs](https://api.gitguardian.com/docs/)
- [Git Filter Repo Docs](https://github.com/newren/git-filter-repo)

---

## FAQ

**Q: Is it enough to delete the commit?**
A: No. The secret remains in git history. Use `git-filter-repo` or `BFG` to remove from all branches and history.

**Q: Do I need to rotate the secret?**
A: Yes, immediately. Even if removed from git, if it was ever in history, assume it could be accessed.

**Q: Will force-push break anything?**
A: It can break branches based on old commits. Notify team first, ensure no open PRs against those branches.

**Q: How do I know if the secret was used?**
A: Check logs for API calls with that key, check service activity (API usage, data access), contact service provider.

**Q: What if team members have local copies?**
A: Tell them to re-clone the repository after you force-push. Old clones have old history with the secret.

---

**Audit prompt version**: 1.0  
**Last updated**: 2026-04-25  
**Severity if exposed secret found**: HIGH - Requires immediate action
