# Prompt: Audit Existing Pre-Commit Hooks

## When to use this

Use this when inheriting a project that claims to have pre-commit hooks, but you want to verify they're actually working and covering security cases. "We have Husky" is not the same as "we have effective security hooks."

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer auditing the pre-commit hook configuration for this repository. Your goal: verify that hooks are installed, running, and catching real security issues.

**Step 1: Inventory the current hooks**

```bash
# Check for Husky
ls -la .husky/
cat .husky/pre-commit 2>/dev/null
cat .husky/pre-push 2>/dev/null

# Check for pre-commit (Python)
cat .pre-commit-config.yaml 2>/dev/null

# Check package.json for hook-related configuration
cat package.json | python3 -m json.tool | grep -A 20 '"husky"'
cat package.json | python3 -m json.tool | grep -A 20 '"lint-staged"'

# Check if Husky is actually installed (hooks only work if package is installed)
ls node_modules/.bin/husky 2>/dev/null && echo "Husky installed" || echo "Husky NOT installed"

# Check if hooks are executable
ls -la .husky/pre-commit
```

**Step 2: Assess what the hooks actually check**

Read each hook file and evaluate:

1. **Secret scanning:** Does any hook run gitleaks, detect-secrets, or equivalent?
2. **Code quality:** Does it run ESLint or similar? With security rules?
3. **Dependency check:** Does it run npm audit?
4. **.env protection:** Does it prevent .env files from being committed?
5. **Test coverage:** Does it run tests before committing?

For each hook, answer: What does it actually block? What does it miss?

**Step 3: Test the hooks with known bad inputs**

Test whether the hooks catch real security issues:

```bash
# Test 1: Secret detection
echo 'STRIPE_SECRET=sk_live_testkey123456789012345' >> test-file.js
git add test-file.js
git commit -m "test secret" 2>&1
# Expected: commit blocked with "secret detected"
# Actual result: [document]
git checkout -- test-file.js
git restore --staged test-file.js

# Test 2: .env file protection
echo 'DATABASE_URL=postgresql://localhost/prod' > .env.test
git add .env.test
git commit -m "test env" 2>&1
# Expected: commit blocked
# Actual result: [document]
git restore --staged .env.test
rm .env.test

# Test 3: ESLint security rule
echo 'eval(userInput)' >> test-eval.js
git add test-eval.js
git commit -m "test eval" 2>&1
# Expected: blocked if eslint-plugin-security is configured
# Actual result: [document]
git restore --staged test-eval.js
rm test-eval.js
```

**Step 4: Check for common problems**

Look for these failures:

1. **Hooks exist but aren't installed:**
   - Husky hooks in .husky/ but `npm run prepare` never runs in CI
   - Fix: add `"prepare": "husky"` to package.json scripts

2. **Hooks are bypassed in CI:**
   - CI uses `git commit --no-verify` 
   - Fix: run SAST independently in CI, don't rely on hooks

3. **Hooks only run linting, not security checks:**
   - ESLint runs but no security plugin is configured
   - Fix: add eslint-plugin-security to ESLint config

4. **Secret scanning is not configured:**
   - No gitleaks, detect-secrets, or equivalent
   - Fix: add gitleaks to pre-commit hook

5. **Hooks skip large file types:**
   - Images, PDFs, and binary files may slip through
   - Fix: add file size check to hook

**Step 5: Check .gitignore for security gaps**

```bash
cat .gitignore | grep -E '\.env|\.key|\.pem|secrets|credentials'
```

Missing entries to add:
```gitignore
.env
.env.local
.env.*.local
*.pem
*.key
*.p12
credentials.json
service-account.json
.aws/credentials
```

**Step 6: Produce the audit report**

For each finding:
- **Status:** PASS / FAIL / NOT CONFIGURED
- **Finding:** What's wrong or missing?
- **Risk:** What could slip through to the repository?
- **Fix:** Specific change to make

Then implement all fixes that can be done programmatically.

---

## What to expect

A complete pre-commit hook audit: what's installed vs. what's actually working, test results for real security inputs, missing controls identified, and fixes applied.

## Learn more

[Pre-Commit Hooks README](../README.md)
[Setup Pre-Commit prompt](./setup-pre-commit.md)
[Node.js Stack Guide](../by-stack/node-express.md)
