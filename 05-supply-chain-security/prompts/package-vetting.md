# Prompt: Package Vetting Before Installation

## When to use this

Use this before installing any new npm or pip package that will go into production — especially packages from unfamiliar authors, packages with few stars, or packages that solve a security-sensitive problem (auth, crypto, parsing).

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer vetting a package before installation. Before any new dependency is added to this project, perform a thorough security review and produce a go/no-go decision.

**Package to vet:** [PACKAGE_NAME]
**Version:** [VERSION or "latest"]
**Intended use:** [what you need it for]

**Step 1: Basic provenance checks**

```bash
# View package metadata on npm
npm info [PACKAGE_NAME] | head -50

# Key fields to check:
# - author: who is the maintainer?
# - maintainers: how many people maintain it?
# - homepage: does it link to a real repo?
# - bugs: is there an issue tracker?
# - license: is it compatible with your project?

# Check for known vulnerabilities
npm audit --dry-run --package-lock-only
# (after adding to package.json temporarily)

# Or use OSV
osv-scanner --lockfile=package-lock.json 2>/dev/null || echo "Install: https://github.com/google/osv-scanner"
```

**Step 2: Repository health checks**

Visit the package's GitHub/GitLab repository and check:

```markdown
## Repository Health Checklist

**Activity**
- [ ] Last commit within the past 6 months
- [ ] Issues are being responded to (not just accumulating)
- [ ] Has had releases in the past year
- [ ] Stars > 100 (for an established package) or growing trend

**Security**
- [ ] Has a SECURITY.md or vulnerability disclosure policy
- [ ] No open critical security issues
- [ ] Past security issues were addressed promptly
- [ ] No suspicious recent commits (audit the last 10 commits)

**Maintenance**
- [ ] More than one active maintainer (reduces bus factor)
- [ ] CI/CD pipeline exists and is passing
- [ ] Has tests (check test coverage if visible)

**Legitimacy**
- [ ] Package name matches repository name (prevents confusion)
- [ ] Author organisation is real and verifiable
- [ ] Not recently transferred to a new owner (common attack vector)
```

**Step 3: Typosquatting check**

```bash
# Compare against packages you already use
# Look for single-character differences, transposed letters, extra words

# Common typosquatting patterns:
# lodash → Iodash (capital I vs lowercase l)
# express → expres, expresss, express-js
# react → reacts, reactjs (as standalone package)
# axios → axiso, axois

# Check npm for similar names
npm search [PACKAGE_NAME] | head -10

# Known typosquatting database (manual check)
# https://github.com/nicowillis/typosquatting-package-list
```

**Step 4: Install script audit**

```bash
# Does the package run code during installation?
npm info [PACKAGE_NAME] scripts

# Or download and inspect:
mkdir /tmp/pkg-audit && cd /tmp/pkg-audit
npm pack [PACKAGE_NAME]@[VERSION]
tar -tzf *.tgz | grep -E "install\.js|preinstall|postinstall"
tar -xzf *.tgz package/package.json
cat package/package.json | python3 -m json.tool | grep -A 5 '"scripts"'
```

If postinstall or preinstall scripts exist, read them:
```bash
tar -xzf *.tgz
cat package/scripts/postinstall.js
# Red flags:
# - network requests (http, https, axios, fetch, request)
# - reading environment variables (process.env)
# - file system access outside the package directory
# - obfuscated or minified code in a script
```

**Step 5: Source code review**

For high-risk packages (auth, crypto, file parsing, network):

```bash
# Download and review source
mkdir /tmp/pkg-source && cd /tmp/pkg-source
npm pack [PACKAGE_NAME]@[VERSION]
tar -xzf *.tgz

# Check for network calls
grep -rn "require('http')\|require('https')\|require('net')\|fetch(\|axios\." package/ | head -20

# Check for environment variable access
grep -rn "process\.env" package/ | head -20

# Check for eval or Function constructor
grep -rn "eval(\|new Function(" package/ | head -10

# Check for dynamic require
grep -rn "require(.*\+\|require(.*variable" package/ | head -10

# Check for obfuscated code (long single lines, character codes)
find package/ -name "*.js" -exec awk 'length > 500 {print FILENAME": line "NR": "length" chars"; exit}' {} \;
```

**Step 6: Dependency chain analysis**

```bash
# How many transitive dependencies does this add?
npm install [PACKAGE_NAME] --dry-run 2>&1 | tail -5

# Or list all dependencies of the package
npm info [PACKAGE_NAME] dependencies
npm info [PACKAGE_NAME] peerDependencies

# Check if any dependency has known CVEs
# (best done after a dry-run install with npm audit)
```

**Step 7: Existing alternatives assessment**

Before deciding to install, consider:

```markdown
## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| [package-name] v[X] | Feature-complete, popular | 3 transitive deps | Considering |
| Native Node.js | No deps | More code to write | |
| [alternative-1] | | | |
| [alternative-2] | | | |

**Recommendation:** [Use package / Use native / Use alternative X]
```

**Step 8: Final go/no-go decision**

```markdown
## Package Vetting Report: [PACKAGE_NAME]@[VERSION]

**Provenance**
- Author: [name/org]
- Maintainers: [count] active
- Downloads/week: [number]
- Repository: [URL]

**Security Assessment**
- Known CVEs: [none/list]
- Install scripts: [none/description]
- Suspicious code: [none/description]
- Transitive dependencies added: [count]

**Health**
- Last commit: [date]
- Stars: [count]
- Open issues: [count]
- Active maintenance: [yes/no]

**Decision: ✅ APPROVED / ⚠️ CONDITIONAL / ❌ REJECTED**

Reason: [1-2 sentences]

**If conditional:**
- Install with: `npm install [PACKAGE_NAME] --ignore-scripts`
- Monitor with: Dependabot alert configured
- Review again if: [trigger — new version, CVE published, etc.]
```

**Step 9: If approved — safe installation**

```bash
# Install with --ignore-scripts if package has postinstall
npm install [PACKAGE_NAME] --ignore-scripts

# Or with exact version pinning
npm install [PACKAGE_NAME]@[EXACT_VERSION] --save-exact

# Verify the lockfile was updated correctly
git diff package-lock.json | head -50

# Run your test suite to confirm nothing broke
npm test
```

---

## What to expect

A complete vetting report for the package: provenance verified, install scripts reviewed, source code audited for suspicious patterns, transitive dependencies counted, and a clear go/no-go decision.

## Learn more

[Supply Chain Audit](./supply-chain-audit.md)
[Supply Chain Security README](../README.md)
[OWASP A06: Vulnerable Components](../../02-owasp/web-top10/A06-vulnerable-components.md)
