# Dependency Confusion

> **30-second summary:** Dependency confusion attacks trick package managers into downloading a malicious public package instead of your private internal one — by exploiting how registries are resolved when the same name exists in both a private and public registry.

---

## The Attack Explained

Most organisations use a **private npm registry** (Artifactory, Nexus, GitHub Packages, etc.) to host internal packages not meant for public use. These packages typically have names like:

```
company-auth-utils
internal-api-client
mycompany-logger
```

The attack works like this:

```
1. Attacker discovers your internal package name
   (from job postings, error messages, GitHub leaks, npm error logs)

2. Attacker publishes a package with THE SAME NAME to public npm

3. Attacker gives it a HIGHER VERSION NUMBER than your private package

4. Developer runs: npm install

5. npm resolves the public registry first (or alongside private)

6. Higher version on public npm wins — malware installed
```

---

## Real-World Discovery: Alex Birsan (2021)

Security researcher Alex Birsan demonstrated this attack at scale in February 2021. He:

1. Found internal package names in public repositories and npm error logs for Apple, Microsoft, Yelp, Netflix, PayPal, Shopify, and 30+ other companies
2. Published empty packages with those names on public npm — but with **high version numbers** (e.g., `99.0.0`)
3. Received execution callbacks from inside those companies' internal systems — proving the packages were auto-installed in CI pipelines

He was paid **over $130,000 in bug bounties** for the research. The attack was entirely passive — he did nothing more than register package names.

---

## Why It Happens

Package managers like npm resolve dependencies across multiple registries. The default behaviour when a package exists in both a private and public registry is often **version-based resolution** — whichever registry has the highest version number wins.

```
npm lookup process:
  1. Check configured registries (private + public)
  2. Find all versions of 'company-auth-utils'
  3. Private registry: v1.2.3
  4. Public npm:      v99.0.0 (malicious)
  5. Install v99.0.0 ← WRONG
```

---

## How to Defend Against It

### 1. Use Scoped Packages with a Private Scope

The most effective defence. Configure your private scope to **only** resolve from your private registry:

```ini
# .npmrc in your project
@mycompany:registry=https://your-private-registry.com
//your-private-registry.com/:_authToken=${NPM_TOKEN}
```

Then name all internal packages with your scope:

```json
{
  "dependencies": {
    "@mycompany/auth-utils": "^1.2.3",
    "@mycompany/api-client": "^2.0.0"
  }
}
```

Now `@mycompany/*` will **never** be fetched from public npm, regardless of version numbers. Public npm doesn't have your scope registered (as long as you've claimed it).

> **Critical:** Claim your npm scope (`@yourcompany`) on the public registry even if you never publish to it publicly. This prevents attackers from registering it.

### 2. Claim Your Package Names on Public npm

For any private package that is **not** scoped, publish a placeholder to public npm:

```bash
# Create an empty placeholder package
mkdir internal-api-client && cd internal-api-client
npm init -y
# Edit package.json, set version to 9999.0.0 so yours always wins

cat > index.js << 'EOF'
throw new Error('This package is private. If you see this, something is wrong.');
EOF

npm publish --access public
```

This ensures if someone looks up your internal package name on public npm, it resolves to your controlled placeholder.

### 3. Configure Registry Priority Correctly

If using a private registry that proxies/mirrors public npm:

```ini
# .npmrc — route ALL traffic through your private registry
registry=https://your-private-registry.com

# The private registry should be configured to:
# - Serve private packages from internal storage
# - Proxy public packages from npmjs.com
# - Never allow public packages to override private ones at the same name
```

Most enterprise registries (Artifactory, Nexus) have a setting to **prefer internal over external** when names conflict. Enable it.

### 4. Pin Exact Versions and Use Lockfiles

```bash
# Install with exact versions — no range resolution
npm install --save-exact @mycompany/auth-utils

# Always commit your lockfile
git add package-lock.json
git commit -m "chore: add auth utils dependency"
```

Lockfiles specify exact resolved URLs — not just version numbers. If your lockfile says the package resolves to `https://your-private-registry.com/...`, a public npm version at `99.0.0` won't override it.

### 5. Verify Package Integrity in CI

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci  # Uses lockfile — does not resolve differently

- name: Verify registry sources
  run: |
    # Check that no internal package names resolved from public registry
    npm ls --json | grep -E '"resolved"' | grep -v "your-private-registry.com" | \
    grep -E "@mycompany" && echo "ALERT: Internal package from wrong registry!" && exit 1 || true
```

---

## Detecting If You've Been Targeted

```bash
# Check where each installed package actually came from
npm ls --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
def check(name, dep):
    resolved = dep.get('resolved', '')
    if '@mycompany' in name and 'your-private-registry' not in resolved:
        print(f'SUSPICIOUS: {name} resolved from {resolved}')
    for dep_name, dep_data in dep.get('dependencies', {}).items():
        check(dep_name, dep_data)
check('root', data)
"
```

---

## Platform-Specific Guidance

### npm / Node.js

```ini
# .npmrc
@mycompany:registry=https://your-registry.com
//your-registry.com/:_authToken=${PRIVATE_REGISTRY_TOKEN}
```

### pip / Python

```ini
# pip.conf or requirements.txt with --index-url
--index-url https://your-private-pypi.com/simple
--extra-index-url https://pypi.org/simple

# Better: use --index-url only (not --extra-index-url) to avoid confusion attacks
```

> **Critical (Python):** Using `--extra-index-url` is still vulnerable to confusion attacks because pip will install from whichever index has the highest version. Use `--index-url` alone and ensure your private registry mirrors public packages.

### Maven / Java

```xml
<!-- settings.xml — configure private repo with higher priority -->
<mirrors>
  <mirror>
    <id>private-repo</id>
    <mirrorOf>*</mirrorOf>
    <url>https://your-private-repo.com/repository/maven-public/</url>
  </mirror>
</mirrors>
```

---

## Checklist

- [ ] All internal packages use a scoped name (`@yourcompany/`)
- [ ] Scope is registered and claimed on public npm (even if never published)
- [ ] `.npmrc` routes scoped packages exclusively to private registry
- [ ] Lockfile committed and `npm ci` used in CI (not `npm install`)
- [ ] Private registry configured to prefer internal over external on name conflicts
- [ ] Placeholder packages published to public npm for any unscoped internal names
- [ ] CI pipeline verifies packages resolve from expected registry URLs
- [ ] Python `--extra-index-url` replaced with single `--index-url` pointing to private mirror
