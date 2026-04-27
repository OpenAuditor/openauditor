# Load Production Readiness Audit in Other AI Coding Tools

Instructions for tools not covered in the dedicated guides (Cursor, Claude Code, GitHub Copilot).

---

## Gemini CLI

```bash
# Install Gemini CLI (requires Google account)
# https://github.com/google-gemini/gemini-cli

# Run the audit from the command line
gemini -p "$(cat /path/to/openauditor/skills/production-readiness-audit/SKILL.md)"

# Or paste the prompt directly into an interactive session
gemini
> [paste the audit prompt]
```

**Note:** Gemini CLI has filesystem access when run inside your project directory. Specify `--yolo` flag with caution — always review suggested changes before applying.

---

## OpenAI Codex / ChatGPT (Web or API)

**Web:**
1. Go to chat.openai.com (ChatGPT 4o or o1)
2. Use a Project to maintain context across conversations
3. Paste the full production readiness audit prompt
4. Upload relevant source files when asked

**API:**
```typescript
import OpenAI from 'openai';
import { readFileSync } from 'fs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const auditPrompt = readFileSync('./skills/production-readiness-audit/SKILL.md', 'utf-8');

const response = await client.chat.completions.create({
  model: 'o1',
  messages: [
    {
      role: 'user',
      content: `${auditPrompt}\n\nPlease begin the audit on this project.`,
    },
  ],
});
```

---

## Windsurf (Codeium)

1. Open Windsurf IDE
2. Press `Cmd/Ctrl + L` to open Cascade chat
3. Paste the full audit prompt
4. Cascade has access to your entire codebase — use `@codebase` if it needs broader context

**Tip:** Windsurf's Cascade is particularly good at multi-file refactoring. After audit findings, ask it to "implement all High severity fixes" and review the diff before accepting.

---

## Cline (VS Code Extension)

1. Install Cline from VS Code Marketplace
2. Configure with your preferred API (Anthropic, OpenAI, Gemini, etc.)
3. Open the Cline panel and create a new task
4. Paste the audit prompt as the task description
5. Approve each file change as Cline proposes it

**Cline works well with Claude claude-sonnet-4-6 or claude-opus-4-7 as the backend model.**

---

## Aider (CLI)

```bash
# Install Aider
pip install aider-chat

# Run audit against your codebase
aider --model claude-opus-4-7 \
  --message "$(cat /path/to/openauditor/skills/production-readiness-audit/SKILL.md)"

# Or in watch mode (Aider monitors file changes)
aider --model gpt-4o
> /read /path/to/openauditor/skills/production-readiness-audit/SKILL.md
> Please run this audit on the current codebase
```

---

## Lovable (lovable.dev)

1. Open your project in Lovable
2. Click the chat/assistant icon
3. Paste the audit prompt into the chat
4. Lovable will analyse your project structure and suggest fixes
5. Accept changes through Lovable's diff view

**Note:** Lovable is a full-stack AI builder. It may suggest larger refactors than intended — paste the prompt with "audit only, don't change any code yet" to get findings first.

---

## Base44

1. Open Base44 and navigate to your project
2. Use the AI chat panel
3. Paste the audit prompt
4. Review findings in the chat before asking Base44 to apply fixes

---

## Emergent

1. Open your project in Emergent
2. Open the AI assistant panel
3. Paste the audit prompt
4. Emergent will use its codebase understanding to audit and suggest fixes

---

## Replit Agent

1. Open your Repl
2. Click the Agent tab (if available) or use the AI assistant
3. Paste the audit prompt
4. Replit Agent has access to your entire project and can run commands

**Security note for Replit:** Replit runs in a shared cloud environment. Be careful with secrets — never paste real API keys into the chat. Use Replit Secrets for sensitive configuration.

---

## General Tips for All Tools

1. **Give version context:** Start with "I'm using Next.js 15, Supabase v2, Node.js 22" so the tool uses current patterns
2. **Reference official docs:** Ask the tool to "verify against current [library] documentation" for security-sensitive patterns  
3. **Audit before fixing:** Ask for the full findings list before asking the tool to apply any changes
4. **Review every change:** No AI tool should apply security changes without your review — especially to auth, database access, and secrets handling
5. **Re-audit after fixes:** Run the relevant section of the audit again after fixes are applied

## Learn More

[Load in Cursor](./load-skill-cursor.md)
[Load in Claude Code](./load-skill-claude.md)
[Load in GitHub Copilot](./load-skill-copilot.md)
[Skills README](../../README.md)
