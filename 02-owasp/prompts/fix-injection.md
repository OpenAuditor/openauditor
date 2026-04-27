# Prompt: Fix Injection Vulnerabilities

## When to use this

Use this when SQL injection, command injection, or XSS is discovered (from a SAST scan, manual review, or bug report). Also useful proactively on any codebase with raw database queries or user-supplied values in dynamic contexts.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer fixing injection vulnerabilities. Identify and remediate all SQL injection, command injection, and XSS vulnerabilities in this codebase.

**Step 1: Find SQL injection vulnerabilities**

```bash
# Concatenated SQL strings (highest risk)
grep -rn 'query.*\+\|query.*`\${' \
  --include="*.ts" --include="*.js" --include="*.py" . | grep -v node_modules

# Template literals in queries
grep -rn '`SELECT\|`INSERT\|`UPDATE\|`DELETE\|`WHERE' \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Python string formatting in SQL
grep -rn '\.execute.*%\|\.execute.*\.format\|f"SELECT\|f"INSERT' \
  --include="*.py" . | grep -v __pycache__

# MongoDB injection patterns
grep -rn 'find({.*req\.\|findOne({.*req\.' \
  --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each finding, fix using parameterised queries:

```typescript
// VULNERABLE — string interpolation in query
const result = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// SECURE — parameterised query
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// SECURE — ORM (Prisma example)
const user = await prisma.users.findUnique({ where: { email } });

// SECURE — Supabase (always parameterised)
const { data } = await supabase.from('users').select().eq('email', email);
```

```python
# VULNERABLE
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# SECURE — parameterised
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# SECURE — SQLAlchemy ORM
user = session.query(User).filter(User.email == email).first()
```

**Step 2: Find command injection vulnerabilities**

```bash
# Node.js command execution with user input
grep -rn "exec(\|execSync(\|spawn(" \
  --include="*.ts" --include="*.js" . | grep -v node_modules

# Shell=True in Python (most dangerous)
grep -rn "shell=True\|os\.system(" --include="*.py" . | grep -v __pycache__

# User input in shell commands
grep -rn "exec(`\|exec(\`" --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each finding, eliminate shell execution or use safe alternatives:

```javascript
// VULNERABLE — user input in shell command
const { exec } = require('child_process');
exec(`convert ${userFilename} output.png`); // command injection

// SECURE — use execFile with argument array (no shell interpolation)
const { execFile } = require('child_process');
execFile('convert', [sanitizedFilename, 'output.png'], { timeout: 30000 });

// BETTER — use a library instead of shell commands
const sharp = require('sharp'); // image processing without shell
await sharp(inputPath).toFile(outputPath);
```

```python
# VULNERABLE
import subprocess
subprocess.run(f"convert {filename} output.png", shell=True)

# SECURE — argument array, shell=False
subprocess.run(["convert", filename, "output.png"], shell=False, timeout=30)

# BETTER — use Python libraries directly
from PIL import Image
img = Image.open(input_path)
img.save(output_path)
```

**Step 3: Find XSS vulnerabilities**

```bash
# innerHTML with user-controlled data
grep -rn "innerHTML\s*=" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v node_modules

# dangerouslySetInnerHTML in React
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" . | grep -v node_modules

# Template engines (EJS, Handlebars, Pug with unescaped output)
grep -rn "<%=.*req\.\|{{{.*req\.\|\!{.*req\." \
  --include="*.ejs" --include="*.hbs" . 

# document.write
grep -rn "document\.write(" --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each XSS finding:

```typescript
// VULNERABLE — rendering user content directly as HTML
element.innerHTML = userContent;
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// SECURE — use textContent for plain text
element.textContent = userContent;

// SECURE — sanitise if HTML is required
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userContent);

// SECURE — React renders text safely by default
<div>{userContent}</div>  // React escapes this automatically

// SECURE — if you need formatted content in Next.js
import sanitizeHtml from 'sanitize-html';
const clean = sanitizeHtml(userContent, {
  allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'li'],
  allowedAttributes: {},
});
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

**Step 4: Find template injection**

```bash
# Python template injection
grep -rn "render_template_string\|Template(" --include="*.py" . | grep -v __pycache__
grep -rn "Jinja2\|Environment\|jinja2.Template" --include="*.py" . | grep -v __pycache__

# JavaScript template literal injection
grep -rn "eval\(`\|Function\(`" --include="*.ts" --include="*.js" . | grep -v node_modules
```

```python
# VULNERABLE — user-controlled template string
from jinja2 import Template
template = Template(user_input)  # SSTI — can execute Python code
result = template.render()

# SECURE — use a sandboxed environment
from jinja2.sandbox import SandboxedEnvironment
env = SandboxedEnvironment()
template = env.from_string(user_input)
result = template.render(**safe_context)

# BETTER — don't allow user-controlled templates at all
# Use a fixed template with user-supplied data:
template = Template("Hello, {{ name }}!")
result = template.render(name=user_name)
```

**Step 5: Write security tests for each fix**

For every injection fix, write a test that confirms the vulnerability is gone:

```typescript
describe('Injection Prevention', () => {
  it('SQL injection in user search is prevented', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ q: "' OR '1'='1'; --" });
    
    expect(res.status).not.toBe(500); // No database error
    expect(res.body.users).toHaveLength(0); // No data returned
  });

  it('XSS in product name is escaped in response', async () => {
    const maliciousName = '<script>alert(1)</script>';
    const res = await request(app)
      .post('/api/products')
      .send({ name: maliciousName });
    
    const product = res.body;
    // The name should be stored and returned as plain text
    // not executed as HTML
    expect(product.name).toBe(maliciousName); // stored as-is
    // But when rendered, it should be escaped — test in browser
  });
});
```

**Step 6: Produce findings report**

| Type | File | Line | Vulnerable Code | Fix Applied |
|------|------|------|-----------------|-------------|
| SQLi | api/users.ts | 45 | `query(`...${email}`)` | Parameterised ✓ |
| XSS | components/Post.tsx | 23 | `innerHTML = post.title` | DOMPurify ✓ |

---

## What to expect

All injection vulnerabilities found and fixed, parameterised queries replacing string concatenation, DOMPurify applied to all innerHTML usage, security tests written for each fix.

## Learn more

[OWASP A03: Injection](../web-top10/A03-injection.md)
[Input Validation](../../06-secure-coding/input-validation.md)
[Database Security](../../06-secure-coding/database-security.md)
