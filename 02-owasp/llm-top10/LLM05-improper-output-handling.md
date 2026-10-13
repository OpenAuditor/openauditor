# LLM05: Improper Output Handling

**LLM05:2025 · Rank #5 in the OWASP Top 10 for LLM Applications 2025 (was "Insecure Output Handling", #2 in 2023) · Severity: High**

Model output is used downstream without validation or encoding: rendered as HTML, run as SQL or shell, evaluated as code, fetched as a URL or used as a file path. Whoever can influence the model (any user, or any document it reads) can then attack those systems.

---

## 30-Second Summary

If an LLM generates HTML that gets rendered in a browser without escaping, that's XSS. If it generates SQL that gets executed without parameterisation, that's SQL injection. If it generates shell commands that get executed, that's command injection. Treat model output exactly like user input, because thanks to [prompt injection](./LLM01-prompt-injection.md) it effectively is.

**Real vulnerability:** CVE-2023-29374 in LangChain. Its `LLMMathChain` passed model output to Python's `exec()` to "do the maths". A prompt like "what is the result of `__import__('os').system('...')`" made the model write that code, and LangChain ran it: remote code execution through a chat box. The same pattern (model writes code, app runs it unsandboxed) has since produced RCEs in several text-to-SQL and text-to-chart libraries.

(AI-generated code that a developer ships without review is a different risk: see [LLM09: Misinformation](./LLM09-misinformation.md).)

---

## XSS via LLM Output

```javascript
// VULNERABLE: rendering LLM output as HTML
async function generateProductDescription(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  
  const description = response.choices[0].message.content;
  
  // Rendered directly: attacker with prompt injection control can inject XSS
  document.getElementById('description').innerHTML = description;
  // Attacker injects: <script>document.cookie // stolen</script>
}

// SECURE: always sanitise LLM output before rendering as HTML
import DOMPurify from 'dompurify';
import { marked } from 'marked';

async function generateProductDescription(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  
  const description = response.choices[0].message.content;
  
  // Option 1: Render as text (safest)
  document.getElementById('description').textContent = description;
  
  // Option 2: Parse as Markdown then sanitise (if you need formatting)
  const html = DOMPurify.sanitize(marked(description), {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3'],
    ALLOWED_ATTR: [],
  });
  document.getElementById('description').innerHTML = html;
}
```

### Server-Side Rendering

```typescript
// Next.js: VULNERABLE
export default function Page({ aiContent }: { aiContent: string }) {
  return <div dangerouslySetInnerHTML={{ __html: aiContent }} />; // XSS
}

// Next.js: SECURE
import sanitizeHtml from 'sanitize-html';

export default function Page({ aiContent }: { aiContent: string }) {
  const clean = sanitizeHtml(aiContent, {
    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'li'],
    allowedAttributes: {},
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
  
  // Or better: render as text only:
  return <p>{aiContent}</p>; // React escapes by default
}
```

---

## SQL Injection via LLM Output

```python
# VULNERABLE: using LLM-generated SQL directly
def natural_language_query(user_input: str) -> list:
    # Ask the LLM to generate a SQL query
    sql = llm.chat(f"Write a SQL query to: {user_input}")
    
    # Execute the generated SQL directly
    cursor.execute(sql)  # SQL injection if attacker controls user_input or model
    return cursor.fetchall()

# Example of what could go wrong:
# LLM output: "SELECT * FROM users; DROP TABLE users; --"

# SECURE: constrain LLM to only generate the WHERE clause, parameterised
def natural_language_query_safe(user_input: str, allowed_columns: list) -> list:
    # Ask LLM to extract search parameters as structured data
    params = llm.chat_structured(
        prompt=f"Extract the search parameters from: {user_input}",
        schema={
            "column": {"type": "string", "enum": allowed_columns},
            "value": {"type": "string"},
            "operator": {"type": "string", "enum": ["equals", "contains", "starts_with"]},
        }
    )
    
    # Build parameterised query using the structured output
    operator_map = {
        "equals": "= %s",
        "contains": "LIKE %s",
        "starts_with": "LIKE %s",
    }
    
    value = params['value']
    if params['operator'] == 'contains':
        value = f'%{value}%'
    elif params['operator'] == 'starts_with':
        value = f'{value}%'
    
    # Safe: column is from allowlist, value is parameterised
    query = f"SELECT * FROM products WHERE {params['column']} {operator_map[params['operator']]}"
    cursor.execute(query, (value,))
    return cursor.fetchall()
```

---

## Command Injection via LLM Output

```python
# VULNERABLE: executing LLM-generated shell commands
import subprocess

def run_user_task(description: str) -> str:
    command = llm.generate(f"Write a shell command to: {description}")
    result = subprocess.run(command, shell=True, capture_output=True)
    return result.stdout

# SECURE: avoid shell execution; use structured commands with explicit allow list
import shlex

ALLOWED_COMMANDS = {
    'list_files': ['ls', '-la'],
    'show_disk': ['df', '-h'],
    'show_memory': ['free', '-h'],
}

def run_safe_task(task_name: str) -> str:
    if task_name not in ALLOWED_COMMANDS:
        raise ValueError(f"Unknown task: {task_name}")
    
    command = ALLOWED_COMMANDS[task_name]
    result = subprocess.run(command, capture_output=True, text=True, shell=False)
    return result.stdout
```

---

## Code Generation Security

```javascript
// VULNERABLE: executing AI-generated code
async function runUserCode(prompt) {
  const code = await llm.generate(`Write JavaScript code to: ${prompt}`);
  eval(code); // NEVER: code injection, XSS, data exfiltration
}

// ALSO VULNERABLE: using Function() constructor
const fn = new Function(llm.generate(prompt));
fn(); // same risk as eval

// ALSO VULNERABLE: Node's `vm` module and the `vm2` package
// `vm` is explicitly not a security boundary, and vm2 was discontinued in 2023
// after repeated sandbox escapes. Neither is safe for model-written code.

// SECURE: run generated code in an isolated microVM with no secrets,
// no network (or an allowlist) and hard time and memory limits.
// Options include Vercel Sandbox, E2B, or Firecracker/gVisor you run yourself.
async function runGeneratedCode(code: string) {
  const sandbox = await createSandbox({   // your provider's SDK
    timeoutMs: 10_000,
    network: 'deny',
    env: {},                              // never pass your env vars in
  });
  try {
    return await sandbox.run(code);
  } finally {
    await sandbox.stop();
  }
}

// Best of all: don't execute model-written code. Have the model choose from
// operations you've implemented (structured output), as in the SQL example above.
```

---

## URLs and File Paths From Model Output

```typescript
// VULNERABLE: fetching whatever URL the model produced (SSRF)
const res = await fetch(modelOutput.url);   // http://169.254.169.254/... or internal services

// VULNERABLE: writing to a model-chosen path (path traversal)
await fs.writeFile(path.join(UPLOAD_DIR, modelOutput.filename), data); // "../../.env"
```

```typescript
// SECURE: allowlist hosts, and constrain names to a safe pattern
const ALLOWED_HOSTS = new Set(['api.partner.com', 'docs.yourapp.com']);

function safeFetchUrl(raw: string): URL {
  const u = new URL(raw);
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname)) {
    throw new Error('URL not allowed');
  }
  return u;
}

const safeName = z.string().regex(/^[a-z0-9-]{1,64}\.(txt|md|csv)$/).parse(modelOutput.filename);
await fs.writeFile(path.join(UPLOAD_DIR, safeName), data);
```

Rendering model output as markdown has its own exfiltration risk (remote images that carry data in the URL); see [Blocking the Exfiltration Channel](./LLM01-prompt-injection.md#blocking-the-exfiltration-channel).

---

## LLM Output in Email Templates

```python
# VULNERABLE: LLM output inserted directly into email HTML
def send_ai_email(user_id: str, topic: str):
    content = llm.generate(f"Write a marketing email about {topic}")
    
    send_email(
        to=get_user_email(user_id),
        html=f"<html><body>{content}</body></html>",  # XSS in email clients
    )

# SECURE: treat LLM output as text, not HTML
import html

def send_ai_email_safe(user_id: str, topic: str):
    content = llm.generate(f"Write a marketing email about {topic}")
    
    # Escape HTML entities in the LLM output
    safe_content = html.escape(content).replace('\n', '<br>')
    
    send_email(
        to=get_user_email(user_id),
        html=f"<html><body><p>{safe_content}</p></body></html>",
    )
```

---

## Output Validation Layer

```python
from pydantic import BaseModel, Field, field_validator  # Pydantic v2
import re

class LLMEmailDraft(BaseModel):
    subject: str = Field(max_length=150)
    body: str = Field(max_length=5000)

    @field_validator("subject")
    @classmethod
    def no_html_in_subject(cls, v: str) -> str:
        if re.search(r"<[^>]+>", v):
            raise ValueError("Subject cannot contain HTML")
        return v

# Validate model output: fails fast if the model returns the wrong shape
validated = LLMEmailDraft.model_validate_json(raw_model_output)
```

---

## Audit Checklist

- [ ] LLM output rendered in HTML is escaped or sanitised with DOMPurify/sanitize-html
- [ ] `dangerouslySetInnerHTML` and `innerHTML` never used with unsanitised LLM output
- [ ] LLM-generated SQL is never executed directly (use structured extraction + parameterised queries)
- [ ] LLM-generated shell commands are never executed with `shell=True`
- [ ] `eval()` and `Function()` are never used with LLM output
- [ ] Model-written code never runs in-process, in `vm` or in `vm2`; if it must run, it runs in an isolated microVM with no secrets
- [ ] URLs from model output are allowlisted before fetching; file names and paths are pattern-validated
- [ ] Markdown rendering of model output blocks remote images and non-allowlisted links
- [ ] Output validation (Pydantic, Zod) applied to structured LLM responses
- [ ] LLM output in emails is escaped before insertion into HTML templates
- [ ] Output length limits enforced (model can't generate 1MB of script tags)

---

## Learn More

- [OWASP LLM05:2025 Improper Output Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/)
- [LLM01: Prompt Injection](./LLM01-prompt-injection.md)
- [A10: Server-Side Request Forgery](../web-top10/A10-ssrf.md)
- [Input Validation Guide](../../06-secure-coding/input-validation.md)
- [CORS and CSP Headers](../../06-secure-coding/cors-csp-headers.md)
- [Prompt Injection Defence](../../08-ai-app-security/prompt-injection-defense.md)
