# Auditing a Package Before Installing

> **30-second summary:** Before adding any new npm package, spend 5 minutes vetting it. This single habit prevents the most common supply chain attack vector — installing a malicious or compromised package.

---

## The 5-Minute Vetting Process

When you're about to run `npm install some-package`, do this first:

---

### Step 1 — Verify the Package Exists and Check Metadata

```bash
npm info <package-name>
```

**What to look for:**

```
some-package@1.2.3
  ...
maintainers: ['known-author <author@example.com>']
dist-tags: latest: 1.2.3
published 6 months ago by known-author <author@example.com>
```

**Red flags in `npm info` output:**
- Published very recently (days or weeks ago)
- Maintainer you've never heard of with no other packages
- No `homepage` or `repository` field
- Version number is very high (e.g., `99.0.0`) — possible confusion attack

```bash
# Check when the package was first created
npm info <package-name> time.created

# Check who maintains it
npm info <package-name> maintainers

# Check all published versions and their dates
npm info <package-name> time --json
```

---

### Step 2 — Inspect the Repository

```bash
npm info <package-name> repository
# Should return: { type: 'git', url: 'https://github.com/org/repo' }
```

Then visit the GitHub repository and check:

- **Stars and forks** — popular packages have community engagement
- **Recent commits** — when was the last commit?
- **Issues and PRs** — is it actively maintained?
- **Contributors** — single contributor or a team?
- **License** — is there one? Is it appropriate for your use?

```bash
# Open repository directly from terminal
npm info <package-name> homepage | xargs open
```

---

### Step 3 — Check the Install Scripts

Many attacks use `postinstall` scripts. Check if the package has any:

```bash
npm info <package-name> scripts
```

If there are `preinstall`, `install`, or `postinstall` scripts, inspect what they do:

```bash
# Download without installing, then inspect
npm pack <package-name>
# Creates: some-package-1.2.3.tgz

tar tzf some-package-1.2.3.tgz
# Lists all files in the package

tar xzf some-package-1.2.3.tgz package/package.json
cat package/package.json | python3 -m json.tool | grep -A5 '"scripts"'
```

Or inspect directly on npm's website: `https://www.npmjs.com/package/<name>?activeTab=code`

> **Critical:** Never install a package with a `postinstall` script you haven't reviewed. The script runs with your user's permissions the moment `npm install` completes.

---

### Step 4 — Run npm Audit

```bash
# Check for known vulnerabilities in your current dependencies
npm audit

# Check what a new package would add before installing
npm install <package-name> --dry-run
npm audit
```

For a deeper check, use `npm audit --json` and pipe to `jq`:

```bash
npm audit --json | jq '.vulnerabilities | to_entries[] | {name: .key, severity: .value.severity, via: .value.via}'
```

---

### Step 5 — Check Download Statistics

```bash
# Use npms.io for comprehensive stats
curl "https://api.npms.io/v2/package/<package-name>" | python3 -m json.tool

# Check weekly downloads via npm API
curl "https://api.npmjs.org/downloads/point/last-week/<package-name>"
```

**What the numbers mean:**

| Weekly Downloads | Risk Level |
|---|---|
| > 1 million | Low — heavily scrutinised |
| 100k–1M | Low-Medium — reasonably popular |
| 10k–100k | Medium — some scrutiny |
| 1k–10k | Medium-High — limited scrutiny |
| < 1k | High — almost no scrutiny |

---

### Step 6 — Cross-Reference the Source Code

Verify that what's published on npm matches what's in the GitHub repository:

```bash
# Method 1: Use npmfs to browse package files
npx npmfs <package-name>@<version>

# Method 2: Pack and inspect manually
npm pack <package-name>@<version>
tar xzf <package-name>-<version>.tgz

# Compare the published package's main file with GitHub source
# Look for minified/obfuscated code that doesn't match the repo
```

Legitimate packages publish readable source or a build artefact that clearly corresponds to the source. Obfuscated code with no corresponding source is a major red flag.

---

### Step 7 — Check for Recent Owner Transfers

```bash
# See full version history with dates
npm info <package-name> time --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
versions = [(v, t) for v, t in data.items() if v not in ('created', 'modified')]
for v, t in sorted(versions, key=lambda x: x[1])[-10:]:
    print(f'{t}  {v}')
"
```

Watch for: a long gap in releases followed by a sudden new version with a new maintainer. This pattern matches the `event-stream` and `ua-parser-js` attacks.

---

## Quick Reference: Full Audit Command Sequence

```bash
PACKAGE="some-package"

echo "=== Basic Info ==="
npm info $PACKAGE

echo "=== Maintainers ==="
npm info $PACKAGE maintainers

echo "=== Install Scripts ==="
npm info $PACKAGE scripts

echo "=== Repository ==="
npm info $PACKAGE repository

echo "=== Version History (last 10) ==="
npm info $PACKAGE time --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
versions = [(v, t) for v, t in data.items() if v not in ('created', 'modified')]
for v, t in sorted(versions, key=lambda x: x[1])[-10:]:
    print(f'  {t}  {v}')
"

echo "=== Download Stats ==="
curl -s "https://api.npmjs.org/downloads/point/last-week/$PACKAGE" | python3 -m json.tool

echo "=== Audit Signatures ==="
npm pack $PACKAGE --dry-run 2>/dev/null
```

---

## Tools That Automate This

| Tool | What It Does |
|---|---|
| **Socket.dev** | Analyses package behaviour before install; browser extension + CLI |
| **Snyk** | Vulnerability scanning + supply chain analysis |
| **npm audit** | Built-in; checks against known vulnerability database |
| **OSSF Scorecard** | Rates open source project security practices |
| **deps.dev** | Google's open source insights tool |
| **Renovate / Dependabot** | Automated PRs for dependency updates with changelogs |

```bash
# Socket CLI
npm install -g @socket/cli
socket npm install <package-name>  # Scans before installing

# Snyk
npm install -g snyk
snyk test  # Scans your current project
```

---

## Decision Framework

```
Is this package from a major organisation (Google, Meta, Vercel, AWS)?
  YES → Lower risk, still check for version anomalies
  NO  → Continue checklist

Does it have > 500k weekly downloads and > 2 years of history?
  YES → Lower risk
  NO  → Investigate maintainer carefully

Does it have a postinstall script?
  YES → Read every line before installing
  NO  → Continue

Does the npm package source match the GitHub source?
  YES → Good
  NO  → Do not install

Have there been any suspicious recent maintainer changes?
  YES → Do not install, find alternative
  NO  → Proceed with caution
```

---

## Checklist

- [ ] `npm info` run — verified maintainer identity and publication date
- [ ] Repository URL confirmed and GitHub page reviewed
- [ ] Install scripts (`preinstall`, `postinstall`) inspected
- [ ] `npm audit` run — no high/critical vulnerabilities
- [ ] Download statistics reviewed — package is appropriately popular
- [ ] Source code spot-checked — no suspicious obfuscation
- [ ] Version history reviewed — no suspicious ownership changes
- [ ] Alternative packages considered if risk is high
- [ ] Decision documented for team (e.g., in PR description or ADR)
