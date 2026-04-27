# Tool and Agent Security

AI agents with tool access can take actions in the real world. The principle of least privilege applies more critically here than anywhere else.

---

## The Risk

An agent with broad permissions that gets manipulated via prompt injection can:
- Delete files or database records
- Send emails or messages on your behalf
- Exfiltrate data to an attacker
- Make purchases or API calls
- Execute arbitrary code

The attack vector is prompt injection. The blast radius is determined by what tools you give the agent.

---

## Principle of Least Privilege for Tools

Only give the agent the tools it needs for the specific task.

```javascript
// WRONG — agent has access to everything
const tools = [
  { name: 'readFile', description: 'Read any file' },
  { name: 'writeFile', description: 'Write any file' },
  { name: 'executeCommand', description: 'Run shell command' },
  { name: 'sendEmail', description: 'Send email to anyone' },
  { name: 'queryDatabase', description: 'Query any table' },
];

// RIGHT — scoped tools for the task
// Task: "Help user search their own documents"
const tools = [
  { 
    name: 'searchDocuments', 
    description: 'Search user documents by keyword',
    // Implementation: scoped to req.user.id
  },
  {
    name: 'readDocument',
    description: 'Read a specific user document by ID',
    // Implementation: verifies document belongs to user
  },
];
// No write, no shell, no email, no other users' data
```

---

## Confirm Before High-Impact Actions

```javascript
// For irreversible or high-impact actions, require explicit confirmation
const tools = [
  {
    name: 'deleteDocument',
    description: 'Delete a document. REQUIRES user confirmation.',
    execute: async ({ documentId }, { requireConfirmation }) => {
      // Pause and ask user to confirm
      const confirmed = await requireConfirmation(
        `Are you sure you want to delete document ${documentId}? This cannot be undone.`
      );
      if (!confirmed) return { cancelled: true };
      
      return db.documents.delete({ where: { id: documentId, userId: req.user.id } });
    }
  }
];
```

---

## Scope Tool Implementations

Even when you name a tool generically, the implementation should be scoped:

```javascript
// Tool: "search_database"
// The implementation always enforces user context
async function searchDatabase({ query, table }) {
  // Never allow arbitrary table or unrestricted query
  const allowedTables = ['documents', 'notes', 'tasks'];
  if (!allowedTables.includes(table)) {
    throw new Error(`Table '${table}' is not accessible`);
  }
  
  return db[table].findMany({
    where: {
      userId: req.user.id, // always filter by user
      ...(parseQuery(query)), // parse structured query safely
    },
    take: 20, // cap results
  });
}
```

---

## Audit Agent Actions

Log everything an agent does:

```javascript
const auditLog = {
  event: 'agent_tool_call',
  userId: req.user.id,
  toolName: tool.name,
  parameters: tool.parameters,
  result: 'success' | 'failure',
  timestamp: new Date().toISOString(),
};
await db.auditLogs.create(auditLog);
```

---

## Sandboxed Code Execution

If the agent can write and run code:

```javascript
// NEVER let agent-generated code run directly on your server
// Use a sandboxed environment
import { Sandbox } from '@e2b/sdk';

async function executeAgentCode(code: string, userId: string): Promise<string> {
  const sandbox = await Sandbox.create({
    template: 'base',
    // No network access, no filesystem access to server files
  });
  
  try {
    const result = await sandbox.runCode(code, { timeout: 30000 }); // 30s timeout
    return result.stdout;
  } finally {
    await sandbox.kill(); // always clean up
  }
}
```

---

## Why This Matters

The 2023 demonstration of "prompt injection via email" showed that an attacker who can get malicious content into an agent's context (via an email, a web page, a document) can effectively control the agent's tool calls. If the agent can send emails, it sends the attacker's email. If it can read files, it reads and exfiltrates them.

Minimal tool scope dramatically limits the damage of any single compromise.

---

## Checklist

- [ ] Each agent task has only the tools needed for that task
- [ ] Tool implementations enforce user context (not just name-based scoping)
- [ ] High-impact actions require explicit user confirmation
- [ ] Agent actions are logged for audit trail
- [ ] Code execution happens in a sandbox
- [ ] Network access is restricted for code-execution tools
- [ ] Rate limiting on agent/AI endpoints to limit cost of compromise

---

## Learn More

- [OWASP LLM08: Excessive Agency](../02-owasp/llm-top10/LLM08-excessive-agency.md)
- [Prompt Injection Defense](./prompt-injection-defense.md)
- [Audit Agent Permissions prompt](./prompts/audit-agent-permissions.md)
