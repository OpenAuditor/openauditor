# Load Production Readiness Audit Skill in GitHub Copilot

## Using Copilot Chat

1. Open GitHub Copilot Chat in VS Code (`Ctrl/Cmd + Shift + I`)
2. Type `@workspace` to give Copilot access to your codebase
3. Paste the audit prompt below

```
@workspace Run a production readiness security audit on this codebase.

Check each area systematically:

1. **Secrets**: Any hardcoded passwords, API keys, or tokens in source files (not env vars)
2. **Password hashing**: Is bcrypt with cost≥12 or Argon2id used? Any MD5/SHA for passwords?
3. **Injection**: Template literals in SQL queries, innerHTML with user data, shell exec with user input
4. **Access control**: Endpoints accepting resource IDs — do they verify ownership against the authenticated user?
5. **Security headers**: HSTS, X-Content-Type-Options, X-Frame-Options, CORS restricted to specific origins
6. **Dependencies**: Check package.json for known vulnerable packages (based on your training data)
7. **TLS**: Any rejectUnauthorized:false, http:// in non-localhost contexts
8. **Error handling**: Any err.stack or internal details returned in API responses
9. **Logging**: Any passwords, tokens, or secrets being logged
10. **GitHub Actions**: Actions using floating tags (v1, v2) instead of pinned commit SHAs

For each area, report status (PASS/FAIL/WARN) and the specific finding.
Then show the fix for each FAIL.
```

## Using Copilot in VS Code with a Custom Snippet

Add to your VS Code snippets (`Cmd/Ctrl + Shift + P` → "Snippets: Configure User Snippets" → `plaintext.json`):

```json
{
  "Security Audit Prompt": {
    "prefix": "secaudit",
    "body": [
      "@workspace Run a production readiness security audit.",
      "",
      "Check: hardcoded secrets, password hashing (bcrypt≥12 or Argon2id), SQL/XSS injection, IDOR in API endpoints, security headers, TLS configuration, stack traces in error responses, sensitive data in logs, unpinned GitHub Actions.",
      "",
      "Report as a table then fix all Critical and High findings."
    ],
    "description": "Production security audit prompt for Copilot"
  }
}
```

## Using Copilot in GitHub PR Reviews

Add this to your pull request description to trigger a Copilot security review:

```markdown
## Security Review Request

@github-copilot Please review this PR for security issues. Specifically check:
- [ ] Any hardcoded secrets or credentials
- [ ] SQL injection via template literals
- [ ] XSS via innerHTML or dangerouslySetInnerHTML
- [ ] Missing authentication checks on new endpoints
- [ ] Insecure password hashing (MD5/SHA instead of bcrypt/Argon2)
- [ ] Unpinned GitHub Actions (using @v1 instead of @sha)
```

## Using GitHub Copilot Workspace (Preview)

If you have access to Copilot Workspace:

1. Create a new task: "Production security audit"
2. Describe the task: "Review the codebase for OWASP Top 10 vulnerabilities and security misconfigurations. Produce a findings report and implement fixes for Critical and High severity issues."
3. Copilot Workspace will create a plan and implement changes

## Limitations

Copilot Chat:
- Does not execute code or run grep commands — you need to share relevant file contents
- Works best with `@workspace` in VS Code where it has file access
- May miss vulnerabilities in files not currently open

For more thorough audits, use the Claude Code prompt (`load-skill-claude.md`) which can explore the codebase programmatically.

## Learn More

[Skills README](../../README.md)
[Load in Cursor](./load-skill-cursor.md)
[Load in Claude Code](./load-skill-claude.md)
[OWASP Web Top 10 Audit](../../../02-owasp/prompts/web-top10-audit.md)
