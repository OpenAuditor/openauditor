# LLM02: Insecure Output Handling

**Rank #2 — OWASP LLM Top 10 2025 | Severity: High**

LLM outputs are treated as trusted data and used downstream without sanitisation — in HTML, SQL, shell commands, or code execution contexts. This creates secondary injection vulnerabilities driven by model output.

---

## 30-Second Summary

If an LLM generates HTML that gets rendered in a browser without escaping, that's XSS. If it generates SQL that gets executed without parameterisation, that's SQL injection. If it generates shell commands that get executed, that's command injection. The LLM is just a new way for untrusted content to arrive.

**Real scenario:** A coding assistant generates code containing `os.system(user_input)`. A developer trusts the output without review. The generated code passes code review because it "came from AI". The vulnerability ships to production.

---

## XSS via LLM Output

```javascript
// VULNERABLE — rendering LLM output as HTML
async function generateProductDescription(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  
  const description = response.choices[0].message.content;
  
  // Rendered directly — attacker with prompt injection control can inject XSS
  document.getElementById('description').innerHTML = description;
  // Attacker injects: <script>document.cookie // stolen</script>
}

// SECURE — always sanitise LLM output before rendering as HTML
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
// Next.js — VULNERABLE
export default function Page({ aiContent }: { aiContent: string }) {
  return <div dangerouslySetInnerHTML={{ __html: aiContent }} />; // XSS
}

// Next.js — SECURE
import sanitizeHtml from 'sanitize-html';

export default function Page({ aiContent }: { aiContent: string }) {
  const clean = sanitizeHtml(aiContent, {
    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'li'],
    allowedAttributes: {},
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
  
  // Or better — render as text only:
  return <p>{aiContent}</p>; // React escapes by default
}
```

---

## SQL Injection via LLM Output

```python
# VULNERABLE — using LLM-generated SQL directly
def natural_language_query(user_input: str) -> list:
    # Ask the LLM to generate a SQL query
    sql = llm.chat(f"Write a SQL query to: {user_input}")
    
    # Execute the generated SQL directly
    cursor.execute(sql)  # SQL injection if attacker controls user_input or model
    return cursor.fetchall()

# Example of what could go wrong:
# LLM output: "SELECT * FROM users; DROP TABLE users; --"

# SECURE — constrain LLM to only generate the WHERE clause, parameterised
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
# VULNERABLE — executing LLM-generated shell commands
import subprocess

def run_user_task(description: str) -> str:
    command = llm.generate(f"Write a shell command to: {description}")
    result = subprocess.run(command, shell=True, capture_output=True)
    return result.stdout

# SECURE — avoid shell execution; use structured commands with explicit allow list
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
// VULNERABLE — executing AI-generated code
async function runUserCode(prompt) {
  const code = await llm.generate(`Write JavaScript code to: ${prompt}`);
  eval(code); // NEVER — code injection, XSS, data exfiltration
}

// ALSO VULNERABLE — using Function() constructor
const fn = new Function(llm.generate(prompt));
fn(); // same risk as eval

// SECURE — run generated code in a sandbox (Node.js vm module with restrictions)
import { VM } from 'vm2';

async function runSafeCode(prompt) {
  const code = await llm.generate(`Write JavaScript code to: ${prompt}`);
  
  const vm = new VM({
    timeout: 3000,
    sandbox: {
      console: { log: console.log }, // only allow console.log
      // No access to fs, http, process, etc.
    },
  });
  
  try {
    const result = vm.run(code);
    return result;
  } catch (err) {
    return { error: err.message };
  }
}

// Even better — use a dedicated execution service (e2b.dev, Pyodide, etc.)
```

---

## LLM Output in Email Templates

```python
# VULNERABLE — LLM output inserted directly into email HTML
def send_ai_email(user_id: str, topic: str):
    content = llm.generate(f"Write a marketing email about {topic}")
    
    send_email(
        to=get_user_email(user_id),
        html=f"<html><body>{content}</body></html>",  # XSS in email clients
    )

# SECURE — treat LLM output as text, not HTML
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
from pydantic import BaseModel, validator
import re

class LLMEmailDraft(BaseModel):
    subject: str
    body: str
    
    @validator('subject')
    def no_html_in_subject(cls, v):
        if re.search(r'<[^>]+>', v):
            raise ValueError('Subject cannot contain HTML')
        return v
    
    @validator('body')
    def body_max_length(cls, v):
        if len(v) > 5000:
            raise ValueError('Body too long')
        return v

# Parse LLM output with Pydantic — fails fast if model hallucinates structure
raw_output = llm.chat_structured(prompt, schema=LLMEmailDraft)
validated = LLMEmailDraft(**raw_output)  # validates and raises on bad data
```

---

## Audit Checklist

- [ ] LLM output rendered in HTML is escaped or sanitised with DOMPurify/sanitize-html
- [ ] `dangerouslySetInnerHTML` and `innerHTML` never used with unsanitised LLM output
- [ ] LLM-generated SQL is never executed directly (use structured extraction + parameterised queries)
- [ ] LLM-generated shell commands are never executed with `shell=True`
- [ ] `eval()` and `Function()` are never used with LLM output
- [ ] Generated code runs in a sandbox with no access to fs, network, or process
- [ ] Output validation (Pydantic, Zod) applied to structured LLM responses
- [ ] LLM output in emails is escaped before insertion into HTML templates
- [ ] Output length limits enforced (model can't generate 1MB of script tags)

---

## Learn More

- [LLM01: Prompt Injection](./LLM01-prompt-injection.md)
- [Input Validation Guide](../../06-secure-coding/input-validation.md)
- [CORS and CSP Headers](../../06-secure-coding/cors-csp-headers.md)
- [Prompt Injection Defence](../../08-ai-app-security/prompt-injection-defense.md)
