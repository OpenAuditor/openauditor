# Prompt: Audit Agent Permissions

## When to use this

Use this when building or reviewing an AI agent that can take actions — call tools, access the filesystem, send messages, query databases, or execute code. The more tools an agent has, the larger the attack surface.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit the permissions and tool access granted to AI agents in this application.

**Step 1: Inventory all agent tools**
List every tool available to every agent in the system:
- Tool name
- What it can do
- What systems it can access (filesystem, database, network, external APIs)
- Whether it enforces user context (can it access other users' data?)
- Whether actions are reversible

**Step 2: Classify each tool by risk**

| Risk Level | Description |
|-----------|-------------|
| Critical | Irreversible actions (delete, email to all users, execute shell) |
| High | Write operations (create, update, send single message) |
| Medium | Read operations from sensitive sources (other users' data, credentials) |
| Low | Read operations from own data, status checks |

**Step 3: Apply least privilege**
For each agent task, determine: what is the minimum set of tools needed?

Flag any tool that:
- Can access data belonging to other users without a per-request auth check
- Can execute shell commands or arbitrary code on the server
- Can send external communications (email, webhooks) without user confirmation
- Can delete data without explicit confirmation
- Has no audit logging

**Step 4: Implement access controls in tool implementations**

Every tool implementation must enforce user context independently of what the LLM requests:

```javascript
// WRONG — tool trusts LLM to pass correct userId
async function readDocument({ documentId, userId }) {
  return db.documents.findOne({ where: { id: documentId, userId } });
  // LLM could pass any userId!
}

// RIGHT — tool gets userId from authenticated request context
async function readDocument({ documentId }, { requestContext }) {
  return db.documents.findOne({ 
    where: { id: documentId, userId: requestContext.user.id } // from auth
  });
}
```

**Step 5: Add confirmation for high-impact actions**
For any Critical or High risk tool:
- Require explicit user confirmation before execution
- Show the user what will happen before it happens
- Give a cancel option

**Step 6: Add audit logging**
Every tool call should log:
```javascript
{ 
  event: 'agent_tool_call',
  tool: toolName,
  parameters: params,
  userId: context.user.id,
  result: 'success' | 'error',
  timestamp: new Date()
}
```

**Step 7: Produce a remediation list**
For each issue:
- Severity
- Tool name
- The risk
- The specific fix (code or configuration change)

---

## What to expect

A complete audit of agent tool permissions, risk classification of each tool, and specific code changes to enforce least privilege. Tools that shouldn't exist in the agent's toolkit will be flagged for removal. Tools that need scoping will have updated implementations shown.

## Learn more

[Tool and Agent Security](../tool-and-agent-security.md)
