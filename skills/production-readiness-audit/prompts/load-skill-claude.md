# Load Production Readiness Audit Skill in Claude Code

## Usage (no setup required)

In any Claude Code session, paste this directly into the conversation:

```
Run a production readiness security audit on this codebase. Check: environment and secrets management, password hashing algorithm and strength, injection vulnerabilities (SQL, XSS, command), access control and IDOR risks, security headers, dependency vulnerabilities, TLS configuration, error handling (no stack traces to clients), sensitive data in logs, and GitHub Actions security (pinned actions, minimal permissions). Produce a findings table with Critical/High/Medium counts per area, then implement fixes for all Critical and High findings.
```

## One-Line Shortcut

For quick audits, use:

```
/project:audit
```

(Requires adding the skill to your CLAUDE.md — see below)

## Adding to CLAUDE.md

Add this to your project's `CLAUDE.md` to make `/project:audit` available:

````markdown
## /project:audit — Production Readiness Security Audit

When user types `/project:audit`, run:

1. **Secrets check**: grep for hardcoded passwords/keys, verify .env is gitignored
2. **Auth check**: bcrypt cost≥12 or Argon2id, rate limiting on login, JWT algorithm specified  
3. **Injection**: template literals in SQL, innerHTML with user data, exec() with user input
4. **Access control**: params.id endpoints have ownership checks
5. **Headers**: HSTS, X-Content-Type-Options, X-Frame-Options, CORS origin restriction
6. **Dependencies**: npm audit for High/Critical CVEs
7. **TLS**: rejectUnauthorized:false anywhere, http:// in production URLs
8. **Error handling**: stack traces not returned in production
9. **Logging**: no passwords/tokens logged
10. **CI/CD**: GitHub Actions pinned to SHA, minimal permissions

Report format: table with status per area, then implement fixes for Critical and High.
````

## Using in Claude.ai

1. Go to claude.ai/code or start a new conversation
2. Paste the full audit prompt above
3. Attach your codebase context or let Claude explore the directory

## Using with the Anthropic API

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const client = new Anthropic();

// Collect relevant files for the audit
function collectSourceFiles(dir: string, extensions = ['.ts', '.js', '.tsx']): string {
  const content: string[] = [];
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        const source = readFileSync(fullPath, 'utf-8');
        content.push(`\n\n--- ${fullPath} ---\n${source}`);
      }
    }
  }
  
  walk(dir);
  return content.join('');
}

const sourceCode = collectSourceFiles(process.cwd());

const message = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 8192,
  messages: [
    {
      role: 'user',
      content: `You are a security engineer. Run a production readiness audit on this codebase.

Check each area and produce a findings table, then implement fixes for Critical and High findings.

Areas to check:
1. Hardcoded secrets or credentials
2. Password hashing (bcrypt cost≥12 or Argon2id)
3. SQL/XSS/command injection
4. Access control (IDOR, missing auth checks)
5. Security headers (HSTS, CSP, X-Frame-Options)
6. npm audit for High/Critical CVEs (if package.json visible)
7. TLS configuration (rejectUnauthorized)
8. Error responses (no stack traces)
9. Sensitive data in logs
10. GitHub Actions security

<codebase>
${sourceCode}
</codebase>`,
    },
  ],
});

console.log(message.content[0].text);
```

## Learn More

[Skills README](../../README.md)
[Load in Cursor](./load-skill-cursor.md)
[Load in GitHub Copilot](./load-skill-copilot.md)
[OWASP Web Top 10 Audit](../../../02-owasp/prompts/web-top10-audit.md)
