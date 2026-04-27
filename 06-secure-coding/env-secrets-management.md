# Environment Variables and Secrets Management

Never hardcode secrets. Never commit .env files. Use environment variables and a secret manager for everything sensitive.

---

## The Problem

Secrets — database credentials, API keys, JWT signing keys, third-party tokens — end up in source code constantly. They get committed to git, pushed to GitHub (public or private), and leaked. GitHub scans public repos continuously and attackers do the same.

**The LinkedIn 2016 breach** included hardcoded credentials. **The Uber 2016 breach** exposed AWS keys left in a private GitHub repository that attackers accessed. **GitHub's own 2022 incident** involved OAuth tokens extracted from third-party integrations.

> **Critical:** If a secret is committed to git, it is compromised — even if you delete it in a later commit. Treat it as leaked and rotate it immediately.

---

## What Counts as a Secret

- Database connection strings (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- API keys (Stripe, OpenAI, Twilio, SendGrid, etc.)
- JWT signing keys and session secrets
- OAuth client secrets
- Encryption keys
- SMTP passwords
- Cloud provider credentials (AWS, GCP, Azure keys)
- Webhook signing secrets

---

## The Right Way: Environment Variables

### Local Development

```bash
# .env.local (never committed — add to .gitignore)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_...
JWT_SECRET=a-long-random-string-here
```

```bash
# .env.example (committed — safe placeholder values only)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key
JWT_SECRET=generate-with-openssl-rand-base64-32
```

### .gitignore (Always Include These)

```gitignore
.env
.env.local
.env.production
.env.*.local
*.pem
*.key
```

### Accessing in Code

```javascript
// Next.js / Node.js
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set');

// Python
import os
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    raise ValueError('DATABASE_URL is not set')
```

Always validate that required secrets exist at startup. Fail loudly if they don't.

---

## Production: Use a Secret Manager

Environment variables in `.env` files are fine locally. In production, use a proper secret manager.

### Options

| Tool | Best For | Cost |
|------|----------|------|
| **Vercel Environment Variables** | Next.js on Vercel | Free with Vercel plan |
| **GitHub Secrets** | CI/CD secrets | Free with GitHub Actions |
| **Doppler** | Any stack, team sharing | Free tier available |
| **AWS Secrets Manager** | AWS-hosted apps | ~$0.40/secret/month |
| **HashiCorp Vault** | Self-hosted, enterprise | Open source |
| **1Password Secrets** | Teams using 1Password | Paid |

### Vercel: Scoping Secrets per Environment

```bash
# Set via Vercel CLI
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

Never set production secrets in preview or development environments. Use separate databases and keys per environment.

### GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        run: ./deploy.sh
```

---

## Rotating Secrets

Secrets should be rotated:
- **Quarterly** at minimum
- **Immediately** if potentially exposed
- **When a team member leaves** who had access

### Zero-Downtime Rotation

1. Generate new secret
2. Add new secret alongside old one (support both temporarily)
3. Deploy with new secret
4. Remove old secret
5. Verify everything works
6. Revoke old secret

```javascript
// Support multiple JWT signing keys during rotation
const validSecrets = [
  process.env.JWT_SECRET_NEW,
  process.env.JWT_SECRET_OLD,  // remove after rotation
].filter(Boolean);
```

---

## Detecting Leaked Secrets

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### Scanning Git History

```bash
# Check if secrets are already in your git history
gitleaks detect --source . --log-level debug

# Use trufflehog for deep scan
trufflehog git file://. --only-verified
```

### GitHub Secret Scanning

Enable in GitHub repo → Settings → Code security and analysis → Secret scanning. GitHub will alert you when it detects common secret patterns.

---

## Why This Matters

A single leaked API key can:
- Rack up thousands in cloud charges (crypto miners love compromised AWS keys)
- Give attackers full database access
- Let attackers impersonate your service
- Expose your users' data

The Uber 2016 breach started with engineers pushing AWS keys to a private GitHub repo. Attackers found the keys, accessed Uber's AWS account, and downloaded 57 million user records.

---

## Checklist

- [ ] No secrets in any committed file
- [ ] `.env` files excluded from git
- [ ] `.env.example` committed with placeholder values only
- [ ] Production secrets in a secret manager (not just .env files)
- [ ] Different secrets per environment (dev/staging/prod)
- [ ] Secret scanning in CI/CD pipeline
- [ ] Rotation schedule defined and followed
- [ ] Team members with secret access documented

---

## Learn More

- [Pre-commit hooks for secret detection](../01-pre-commit-hooks/hooks/gitleaks.md)
- [Gitignore templates](../templates/gitignore/)
- [Audit committed secrets prompt](../templates/gitignore/prompts/audit-committed-secrets.md)
