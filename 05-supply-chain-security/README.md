# 05 — Supply Chain Security

> **30-second summary:** Your application is only as secure as every package it depends on. Supply chain attacks target the tools and libraries you install rather than your own code — and they are increasingly common, sophisticated, and devastating.

---

## What Is a Software Supply Chain Attack?

A supply chain attack occurs when an adversary compromises software **upstream** of the target — infecting a library, build tool, or update mechanism — so that every downstream user installs the malicious code automatically. Instead of hacking you directly, attackers hack the things you trust.

```
Attacker → compromises package → published to npm/PyPI → you run npm install → malware in prod
```

The attack surface is enormous. A typical Node.js project has **hundreds of transitive dependencies** — code written by thousands of strangers whose security practices you cannot control.

---

## Why It Matters

| Incident | Year | Impact |
|---|---|---|
| **event-stream** | 2018 | Malicious code targeting Copay Bitcoin wallet; 8 million weekly downloads |
| **ua-parser-js** | 2021 | Cryptominer + credential stealer injected; 8 million weekly downloads |
| **colors / faker** | 2022 | Maintainer intentionally sabotaged own packages; thousands of apps broken |
| **SolarWinds Orion** | 2020 | Build pipeline compromised; ~18,000 organisations infected including US government |
| **node-ipc** | 2022 | Maintainer added wiper malware targeting Russian/Belarusian IP addresses |
| **XZ Utils** | 2024 | 2-year social engineering attack to insert backdoor into widely used compression library |

---

## Files in This Section

| File | What It Covers |
|---|---|
| [npm-package-risks.md](./npm-package-risks.md) | What makes a package risky, red flags to watch for |
| [typosquatting.md](./typosquatting.md) | How name-confusion attacks work, real examples, detection |
| [dependency-confusion.md](./dependency-confusion.md) | Private vs public package namespace attacks |
| [lockfile-integrity.md](./lockfile-integrity.md) | Why lockfiles matter and how to protect them |
| [auditing-a-package.md](./auditing-a-package.md) | Step-by-step guide to vetting a package before installing |
| [prompts/supply-chain-audit.md](./prompts/supply-chain-audit.md) | Agent prompt: audit your project's supply chain posture |
| [prompts/package-vetting.md](./prompts/package-vetting.md) | Agent prompt: vet a specific package before installing |

---

## The Attack Surface

```
Your Code
    └── Direct Dependencies (package.json)
            └── Transitive Dependencies (their node_modules)
                    └── Dev Dependencies (also installed in CI)
                            └── Build Tools (webpack, babel, eslint...)
                                    └── Their Plugins
```

Every level is a potential attack vector.

---

## Core Defences

1. **Commit your lockfile** — prevents resolution drift and version substitution attacks
2. **Run `npm audit` in CI** — catches known vulnerabilities before deployment
3. **Pin exact versions** — use `=` or `--save-exact` for critical deps
4. **Vet before installing** — check maintainer history, repo activity, download trends
5. **Enable Dependabot / Renovate** — automated dependency update PRs with changelogs
6. **Use npm provenance** — verify packages were built from the stated source
7. **Restrict install scripts** — `npm install --ignore-scripts` where possible
8. **Monitor for anomalies** — watch for unexpected outbound network calls at runtime

---

## Checklist

- [ ] `package-lock.json` or `yarn.lock` committed to version control
- [ ] `npm audit` or `yarn audit` runs in CI pipeline
- [ ] New packages vetted before installation (see [auditing-a-package.md](./auditing-a-package.md))
- [ ] `.npmrc` configured with `ignore-scripts=true` for CI environments
- [ ] Private package scope configured to prevent dependency confusion
- [ ] Dependabot or Renovate enabled on the repository
- [ ] No packages with `postinstall` scripts you haven't reviewed
- [ ] Supply chain audit run on existing dependencies (see prompts/)
