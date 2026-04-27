# Typosquatting

> **30-second summary:** Typosquatting is when attackers register package names that look almost identical to popular packages — relying on you to mistype or misremember a name. One wrong character installs malware instead of the library you intended.

---

## How It Works

An attacker studies the most downloaded packages on npm, PyPI, or RubyGems, then registers variations:

- **Transposition:** `lodash` → `lodash` (same) vs `ladsoh`, `lodahs`
- **Missing character:** `express` → `expres`
- **Extra character:** `react` → `reactt`, `reeact`
- **Hyphen insertion/removal:** `vue-router` → `vuerouter`, `vue-routerr`
- **Similar-looking characters:** `1` (one) instead of `l` (ell), `0` instead of `O`
- **Different TLD/scope:** `@react` instead of `react`, `react-dom` vs `reactdom`
- **Pluralisation:** `color` → `colors` (the latter exists but was also weaponised)

The malicious package often provides the same functionality as the real one — so the victim never notices anything is wrong. The malware runs silently in the background.

---

## Real Examples

### npm Typosquatting Incidents

| Malicious Package | Target Package | Year | Action |
|---|---|---|---|
| `crossenv` | `cross-env` | 2017 | Stole env vars; 700+ packages affected |
| `ffmepg` | `ffmpeg` | 2017 | Batch typosquatting campaign (36 packages) |
| `jquery-plugins` | `jquery` | 2017 | Exfiltrated credentials |
| `babelcli` | `babel-cli` | 2017 | Stole env vars |
| `d3.js` | `d3` | 2019 | Cryptominer |
| `discordd` | `discord` | 2020 | Token stealer |
| `twilio-npm` | `twilio` | 2020 | Data exfiltration |
| `electron-native-notify` | Multiple | 2020 | Remote code execution |

### PyPI Typosquatting

| Malicious Package | Target Package | Action |
|---|---|---|
| `reqeusts` | `requests` | Credential theft |
| `colourama` | `colorama` | Crypto clipboard hijacker |
| `python-dateutil2` | `python-dateutil` | Backdoor |
| `Urlllib3` | `urllib3` | Remote access trojan |

---

## How to Detect Typosquatting

### Before Installing — Manual Checks

```bash
# 1. Check the exact package name on npm
npm info <package-name>

# 2. Compare the homepage/repository to what you expect
npm info <package-name> homepage
npm info <package-name> repository

# 3. Check who maintains it — does it match the known author?
npm info <package-name> maintainers

# 4. Look at download counts — legitimate packages have consistent history
# Typosquatted packages often have zero downloads or a sudden spike
npm info <package-name> downloads

# 5. Check when it was first published — new packages are higher risk
npm info <package-name> time.created
```

### Use Automated Tools

```bash
# confusable — checks if a package name is visually confusable
npm install -g confusable
confusable lodash

# npm-cli-login with 2FA protects your own published packages
# Socket.dev browser extension — warns before installing suspicious packages
# retire.js — detects use of packages with known vulnerabilities
npx retire
```

### Check the npm Registry Directly

```bash
# See all versions and when they were published
npm view <package-name> time --json

# Inspect the actual files in the package before installing
npx npmfs <package-name>@<version>

# Or use npm pack to download without installing
npm pack <package-name>
tar tzf <package-name>-<version>.tgz
```

### Red Flags When Comparing Packages

```bash
# Run both commands and compare output carefully:
npm info express
npm info expres   # typosquatted — will show different maintainers/dates

# Legitimate package signs:
# - Maintainer: tj <tj@apex.sh> (for express, it's the expressjs org)
# - Repository: https://github.com/expressjs/express
# - Huge download counts over years

# Typosquatted package signs:
# - Unknown maintainer with no other packages
# - No repository or a newly created one
# - Created very recently
# - Zero or suspicious download numbers
```

---

## Package Scope as Protection

Using scoped packages under a verified organisation namespace makes typosquatting harder:

```bash
# More secure — scoped to a verified org
npm install @aws-sdk/client-s3
npm install @supabase/supabase-js
npm install @tanstack/react-query

# Less safe — unscoped, easier to typosquat
npm install aws-sdk-client-s3  # if this existed, it'd be suspicious
```

If your team publishes internal packages, use a private registry scope (e.g., `@yourcompany/`) and configure npm to look there first for that scope.

---

## Protecting Your Own Packages From Being Typosquatted

If you publish popular packages, register obvious typos to prevent attackers from doing so:

```bash
# Register confusable variants as empty packages pointing to the real one
# package.json for the typosquatted variant:
{
  "name": "lodahs",
  "version": "1.0.0",
  "description": "You probably meant to install lodash.",
  "main": "index.js",
  "scripts": {
    "postinstall": "echo 'WARNING: Did you mean lodash?'"
  }
}
```

Major projects like React and Lodash do this proactively.

---

## npm's Built-In Protections

npm has introduced some defences:

- **Package name similarity check** — npm rejects packages that are too similar to popular existing ones
- **Maintainer email verification** — required before publishing
- **2FA enforcement** — top packages now require 2FA for maintainers
- **Automated malware scanning** — npm scans for known malicious patterns

These help but are not foolproof. Attackers find variations that pass automated checks.

---

## Checklist

- [ ] Always copy package names from official documentation, not from memory
- [ ] Verify package name on npmjs.com before running `npm install`
- [ ] Check that the repository URL matches the expected project
- [ ] Confirm maintainer identity for any new package
- [ ] Use scoped packages (`@org/package`) wherever available
- [ ] Configure private registry scope for internal packages
- [ ] Install Socket.dev or similar browser extension for npm page warnings
- [ ] Run `npm audit signatures` to verify package provenance
