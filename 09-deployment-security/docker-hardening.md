# Docker Hardening

A default Docker setup is rarely secure. Running as root, bloated base images, secrets baked into layers, and missing health checks are all common. This guide covers hardening Docker images from first principles.

---

## Non-Root User

The single most impactful change: never run your container process as root. If an attacker achieves remote code execution in your container, running as non-root severely limits what they can do to the host.

```dockerfile
FROM node:20-alpine

# Create a non-root user and group
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

WORKDIR /app

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production

COPY --chown=appuser:appgroup . .

# Switch to non-root user before starting the process
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
```

Verify the running user:

```bash
docker run --rm your-image id
# Expected output: uid=1001(appuser) gid=1001(appgroup)
```

> **Critical:** Many official images default to running as root. Always check with `docker inspect your-image | jq '.[0].Config.User'`. Empty string means root.

---

## Multi-Stage Builds

Multi-stage builds dramatically reduce image size and attack surface by discarding build tools, dev dependencies, and intermediate files from the final image.

### Node.js Multi-Stage Build

```dockerfile
# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================================
# Stage 2: Builder (separate stage to avoid dev deps in prod)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Stage 3: Final runtime image (minimal)
# ============================================================
FROM node:20-alpine AS runner

# Security hardening
RUN apk add --no-cache dumb-init && \
    addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed from previous stages
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser

# Use dumb-init as PID 1 to handle signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# Expose only the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

### Next.js Standalone Multi-Stage Build

```dockerfile
FROM node:20-alpine AS base

# ============================================================
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.js must have: output: 'standalone'
RUN npm run build

# ============================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (includes only needed node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Add to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

---

## .dockerignore

`.dockerignore` prevents sensitive files from being included in the build context, which would bake them into image layers.

```
# .dockerignore

# Version control
.git
.gitignore

# Environment files — NEVER bake secrets into images
.env
.env.local
.env.development
.env.production
.env.staging
*.env

# Dev dependencies and local tooling
node_modules
.npm

# Build output (re-built in container)
dist
build
.next
out

# Test files
coverage
.nyc_output
__tests__
*.test.js
*.spec.js

# CI/CD configs
.github
.circleci
.travis.yml

# Editor configs
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Documentation
README.md
docs/

# Docker files themselves
Dockerfile*
docker-compose*
.dockerignore

# Logs
*.log
logs/

# Certificates and keys
*.pem
*.key
*.crt
*.p12
*.pfx
id_rsa
id_ed25519
```

Verify your build context size before building:

```bash
# Check what would be sent to the Docker daemon
docker build --no-cache --progress=plain . 2>&1 | head -20
# Look for "Sending build context to Docker daemon  X.XX MB"
# Should be < 50MB for most apps
```

---

## Secrets in Builds — What Not to Do

### Never Use ARG for Secrets

`ARG` values appear in the image history and are retrievable by anyone with pull access:

```dockerfile
# WRONG — secret visible in docker history
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npm run db:migrate
```

```bash
# Attacker can run this to retrieve it
docker history --no-trunc your-image | grep DATABASE_URL
```

### Correct Pattern: Runtime Environment Variables

Pass secrets at runtime, never at build time:

```bash
# Correct — secrets injected at runtime only
docker run \
  -e DATABASE_URL="postgres://..." \
  -e SUPABASE_SECRET_KEY="eyJ..." \
  your-image
```

### Docker Secrets (Swarm / Compose)

For managed secrets in Docker Compose or Swarm:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: your-image
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    external: true   # Created with: docker secret create db_password -
  api_key:
    external: true
```

Read secrets from files in your application:

```javascript
// Read secret from mounted file (Docker secrets pattern)
const fs = require('fs')

function getSecret(name) {
  const secretPath = `/run/secrets/${name}`
  try {
    return fs.readFileSync(secretPath, 'utf8').trim()
  } catch {
    return process.env[name.toUpperCase()]
  }
}

const dbPassword = getSecret('db_password')
```

### Build-Time Secrets via BuildKit

When you genuinely need a secret during the build (e.g., to install from a private registry):

```dockerfile
# syntax=docker/dockerfile:1.5

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./

# Secret is mounted at build time only — never stored in image layers
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN && \
    npm ci && \
    npm config delete //registry.npmjs.org/:_authToken
```

```bash
# Pass secret to build
docker buildx build \
  --secret id=npm_token,src=$HOME/.npmrc \
  -t your-image .
```

---

## Minimal Base Images

| Base Image | Compressed Size | Shell | Use Case |
|---|---|---|---|
| `scratch` | 0 MB | None | Static Go/Rust binaries only |
| `gcr.io/distroless/nodejs:20` | ~50 MB | None | Node.js — no package manager |
| `node:20-alpine` | ~40 MB | sh | Node.js — general use |
| `node:20-slim` | ~80 MB | bash | Node.js — needs apt |
| `node:20` | ~350 MB | bash | Avoid in production |

Distroless images have no shell, no package manager, and no debugging tools — which also means no `exec` for an attacker:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Distroless final image — no shell, minimal attack surface
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER 1001
CMD ["dist/server.js"]
```

---

## Image Scanning with Trivy

Trivy scans container images for known CVEs, misconfigurations, and exposed secrets.

### Install Trivy

```bash
# macOS
brew install trivy

# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Docker (no install required)
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image your-image
```

### Scan an Image

```bash
# Full vulnerability scan
trivy image your-image:latest

# Scan and fail CI if HIGH or CRITICAL vulns found
trivy image --exit-code 1 --severity HIGH,CRITICAL your-image:latest

# Scan filesystem (before building)
trivy fs --severity HIGH,CRITICAL .

# Scan for secrets in the repository
trivy fs --scanners secret .

# Output as JSON for processing
trivy image --format json --output trivy-report.json your-image:latest

# Output as SARIF for GitHub Security tab
trivy image --format sarif --output trivy.sarif your-image:latest
```

### GitHub Actions Integration

```yaml
# .github/workflows/container-security.yml
name: Container Security

on:
  push:
    branches: [main]
  pull_request:

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - name: Build image
        run: docker build -t test-image:${{ github.sha }} .

      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@6e7b7d1fd3e4fef0c5fa8cce1229c54b2c9bd0d8
        with:
          image-ref: test-image:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: HIGH,CRITICAL
          exit-code: 1   # Fail the build on findings

      - name: Upload results to GitHub Security
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif
```

---

## Read-Only Root Filesystem

Prevent write operations to the container filesystem at runtime:

```yaml
# docker-compose.yml
services:
  app:
    image: your-image
    read_only: true
    tmpfs:
      - /tmp          # Allow writes to /tmp only
      - /var/run      # PID files, sockets
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE   # Only if binding to port < 1024
```

```bash
# Equivalent docker run flags
docker run \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  your-image
```

---

## Docker Hardening Checklist

- [ ] Container process runs as non-root user (UID > 0)
- [ ] Multi-stage build discards build tools from final image
- [ ] `.dockerignore` excludes `.env` files, `.git`, and test code
- [ ] No secrets passed via `ARG` or `ENV` at build time
- [ ] Base image is minimal (alpine, slim, or distroless)
- [ ] Image scanned with Trivy before pushing to registry
- [ ] Trivy scan integrated into CI/CD pipeline with `--exit-code 1` on HIGH/CRITICAL
- [ ] Container runs with `--read-only` root filesystem where possible
- [ ] `no-new-privileges` security option set
- [ ] All unnecessary Linux capabilities dropped
- [ ] Health check defined in Dockerfile
