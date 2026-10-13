# Load Production Readiness Audit Skill in Claude Code

## Usage (no setup required)

In any Claude Code session, paste this directly into the conversation:

```
Run a production readiness security audit on this codebase. Check: environment and secrets management, password hashing algorithm and strength, injection vulnerabilities (SQL, XSS, command), access control and IDOR risks, security headers, dependency vulnerabilities, TLS configuration, error handling (no stack traces to clients), sensitive data in logs, and GitHub Actions security (pinned actions, minimal permissions). Produce a findings table with Critical/High/Medium counts per area, then implement fixes for all Critical and High findings.
```

## Install as a Claude Code skill (recommended)

`SKILL.md` has standard skill frontmatter, so Claude Code can load the whole folder as a skill, including the question bank, scoring rubric and report template.

**For one project** (commit it so your team gets it too):

```bash
mkdir -p .claude/skills
git clone --depth 1 https://github.com/OpenAuditor/openauditor /tmp/openauditor
cp -r /tmp/openauditor/skills/production-readiness-audit .claude/skills/
```

**For every project on your machine:**

```bash
mkdir -p ~/.claude/skills
cp -r /tmp/openauditor/skills/production-readiness-audit ~/.claude/skills/
```

Then run it with:

```
/production-readiness-audit
```

Claude will also load it automatically when you ask for a security audit or production readiness review.

## Using in Claude.ai

1. Zip the `production-readiness-audit` folder and upload it as a skill in claude.ai (Settings, Capabilities, Skills), or paste the audit prompt above into a conversation
2. Attach your code (or connect the GitHub repo) so Claude can review it

## Using with the Claude API

The API returns a report only; it cannot edit your files. For large codebases, use Claude Code instead of sending everything in one request.

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
  model: 'claude-sonnet-5-5', // check docs.claude.com for current model IDs
  max_tokens: 8192,
  messages: [
    {
      role: 'user',
      content: `You are a security engineer. Run a production readiness audit on this codebase.

Check each area and produce a findings table. For every Critical and High finding, give the file, the risk and the exact code change to make.

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

for (const block of message.content) {
  if (block.type === 'text') console.log(block.text);
}
```

## Learn More

[Skills README](../../README.md)
[Load in Cursor](./load-skill-cursor.md)
[Load in GitHub Copilot](./load-skill-copilot.md)
[OWASP Web Top 10 Audit](../../../02-owasp/prompts/web-top10-audit.md)
