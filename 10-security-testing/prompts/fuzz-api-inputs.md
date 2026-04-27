# Prompt: Fuzz API Inputs

## When to use this

Use this before a release, after adding new API endpoints, or when you want to find edge cases your manual tests miss. Fuzzing is most valuable on endpoints that handle user-supplied data, file uploads, financial calculations, or complex parsing.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer performing fuzz testing on API endpoints. Your goal is to find inputs that cause server errors, information disclosure, or unexpected behaviour.

**Step 1: Identify the attack surface**

Find all API endpoints that accept user input:
```bash
# Next.js App Router
find app/api -name "route.ts" -o -name "route.js" | head -30

# Next.js Pages Router
find pages/api -name "*.ts" -o -name "*.js" | head -30

# Express/Fastify routes
grep -r "app\.(get\|post\|put\|delete\|patch)" --include="*.ts" --include="*.js" . | head -30

# FastAPI
grep -r "@app\.\|@router\." --include="*.py" . | head -30
```

For each endpoint, identify:
- HTTP method (GET, POST, PUT, DELETE)
- What fields does it accept in the request body?
- What URL parameters does it use?
- What query parameters does it accept?

**Step 2: Generate fuzz test cases**

For each endpoint with user input, write tests covering:

**Boundary values:**
- Empty string: `""`
- String of maximum expected length + 1
- Very long string: `"A".repeat(100000)`
- Null: `null`
- Zero: `0`
- Negative numbers: `-1`, `-2147483648`
- Maximum integer: `2147483647`, `Number.MAX_SAFE_INTEGER`
- Float where integer expected: `3.14`
- Boolean where string expected: `true`
- Array where string expected: `["a", "b"]`
- Object where string expected: `{ "key": "value" }`

**Injection payloads:**
- SQL: `' OR '1'='1'; --`
- XSS: `<script>alert(1)</script>`
- Template injection: `{{7*7}}`, `${7*7}`, `<%= 7*7 %>`
- Path traversal: `../../etc/passwd`, `..%2F..%2Fetc%2Fpasswd`
- SSRF: `http://169.254.169.254/latest/meta-data/`
- Null byte: `test\x00.php`
- CRLF injection: `test\r\nX-Injected: header`

**Unicode and encoding:**
- Emoji: `"😀".repeat(100)`
- Right-to-left override: `\u202E`
- Zero-width characters: `\u200B`
- Overlong UTF-8: `\xC0\x80` (null byte)
- Surrogate pairs

**Step 3: Write the fuzz tests**

Using the project's existing testing framework (Jest, pytest, etc.), write a fuzz test suite:

```javascript
// Example for a registration endpoint
describe('Fuzz: POST /api/auth/register', () => {
  const FUZZ_STRINGS = [
    '', null, true, false, 0, -1, 2147483647,
    'A'.repeat(10000),
    "' OR '1'='1'; --",
    '<script>alert(1)</script>',
    '../../etc/passwd',
    '${7*7}',
    'http://169.254.169.254/latest/meta-data/',
    '\x00',
    '😀'.repeat(100),
  ];
  
  FUZZ_STRINGS.forEach((value) => {
    it(`handles ${JSON.stringify(String(value).slice(0, 30))} in email field`, async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: value, password: 'ValidPass123!' });
      
      // Must not crash
      expect(res.status).toBeLessThan(500);
      
      // Must not leak stack traces
      expect(JSON.stringify(res.body)).not.toMatch(/at Object\.|at Function\.|node_modules/);
    });
  });
});
```

Create similar tests for every identified endpoint.

**Step 4: Run the tests and identify failures**

```bash
npm test -- --testPathPattern="fuzz"
# or
pytest tests/fuzz/ -v
```

For every 5xx response or stack trace found, document:
- Which endpoint and field caused the error
- Which input triggered it
- What the error response contains (does it leak anything?)

**Step 5: Check for ReDoS in regex patterns**

Find all regex patterns in the codebase:
```bash
grep -rn "new RegExp\|/.*/" --include="*.ts" --include="*.js" . | grep -v "node_modules" | head -50
```

For each regex that validates user input:
1. Check it with the `safe-regex` package:
   ```bash
   npx safe-regex '/^([a-zA-Z0-9])([-.])?([a-zA-Z0-9]+)*@.+$/'
   ```
2. If unsafe: suggest a simpler replacement or add a timeout

**Step 6: Check file upload endpoints (if applicable)**

For any file upload endpoint:
- Test with an empty file (0 bytes)
- Test with a file that has a mismatched MIME type
- Test with an extremely large file (should be rejected by size limit)
- Test with a file containing null bytes in the name
- Test with path traversal characters in the filename (`../../etc/passwd.jpg`)

**Step 7: Produce a findings report**

For each finding:
- **Endpoint:** Which endpoint?
- **Field:** Which input field?
- **Input:** What input caused the issue?
- **Response:** What was the response (status, any leaked data)?
- **Severity:** Server crash = High, stack trace = Medium, unexpected 2xx = review

For each finding, fix the issue:
- Add input validation to reject the problematic input
- Catch the error and return a proper 400 response
- Remove stack traces from error responses

---

## What to expect

A fuzz test suite integrated into the test framework, a list of all findings with severity ratings, fixes applied for issues found, and confirmation that all API endpoints return 4xx (never 5xx) for any input.

## Learn more

[Fuzzing Inputs guide](../fuzzing-inputs.md)
[Input Validation](../../06-secure-coding/input-validation.md)
[Manual Testing Guide](../manual-testing-guide.md)
