# Input Validation

All user input is untrusted. Validate on the server, every time, regardless of frontend validation.

---

## The Core Rule

Frontend validation is UX. Server-side validation is security. An attacker can bypass your frontend entirely with curl.

```bash
# Any attacker can do this — bypasses your React form validation entirely
curl -X POST https://yourapp.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "email": "attacker@evil.com"}'
```

---

## Schema Validation: Zod (TypeScript/Node.js)

```bash
npm install zod
```

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
  role: z.enum(['user', 'moderator']), // never accept 'admin' from user input
});

// In your API route
export async function POST(req: Request) {
  const body = await req.json();
  
  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }
  
  const { email, password, name, role } = result.data;
  // Now it's safe to use
}
```

### Common Zod Validations

```typescript
// Strings
z.string().min(1).max(255).trim()
z.string().email()
z.string().url()
z.string().uuid()
z.string().regex(/^[a-zA-Z0-9_-]+$/) // alphanumeric only

// Numbers
z.number().int().min(1).max(1000000)
z.number().positive()

// Enums (safe dropdown values)
z.enum(['active', 'inactive', 'pending'])

// Arrays
z.array(z.string()).max(10) // prevent large array attacks

// Dates
z.string().datetime()
z.date().min(new Date('2020-01-01'))

// Optional with default
z.string().optional().default('user')
```

---

## Schema Validation: Pydantic (Python/FastAPI)

```python
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum

class UserRole(str, Enum):
    user = "user"
    moderator = "moderator"

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)
    role: UserRole = UserRole.user  # default to safest option

    @validator('name')
    def name_must_not_contain_scripts(cls, v):
        if '<' in v or '>' in v:
            raise ValueError('Name contains invalid characters')
        return v.strip()

# FastAPI auto-validates
@app.post("/users")
async def create_user(request: CreateUserRequest):
    # request is validated — safe to use
    ...
```

---

## What to Validate

### Always Validate

- **Type:** Is this a string, number, array?
- **Length/Size:** Is it within expected bounds?
- **Format:** Is it a valid email, URL, UUID?
- **Range:** Is a number within expected min/max?
- **Allowed values:** Is this one of the expected options?

### Never Trust

- URL parameters: `GET /api/users?id=../../../etc/passwd`
- Request headers: `X-User-Role: admin`
- JSON body fields: `{"role": "admin"}`
- Uploaded file names: `../../config/database.yml.php`
- Referer header for auth decisions

### File Upload Validation

```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }
  // Also check magic bytes, not just MIME type
}
```

---

## Allow-List vs Deny-List

Always use allow-lists (whitelist), never deny-lists (blacklist).

```javascript
// WRONG — deny-list approach, attackers find gaps
const blockedChars = ['<', '>', '"', "'", ';'];
const isSafe = !blockedChars.some(c => input.includes(c)); // easy to bypass

// RIGHT — allow-list approach
const isValid = /^[a-zA-Z0-9 ._-]+$/.test(input); // only allow what you know is safe
```

---

## Sanitisation vs Validation

- **Validation:** Check if input meets requirements (reject if not)
- **Sanitisation:** Clean input (use with care — don't use as your primary defence)

```javascript
// Validate first, sanitise if necessary for display
import DOMPurify from 'dompurify'; // for HTML content only

// For rich text editors allowing HTML
const cleanHtml = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

Never rely on sanitisation alone. Validate first, then sanitise if you need to render the content.

---

## Why This Matters

The Equifax 2017 breach started with CVE-2017-5638 — unvalidated user input in Apache Struts allowed remote code execution. The Content-Type header was passed to a template engine without validation. 147 million records were exposed.

---

## Checklist

- [ ] All user input validated on the server
- [ ] Schema validation library in use (Zod, Pydantic, Joi, etc.)
- [ ] Allow-list approach for restricted values
- [ ] Length limits on all string inputs
- [ ] File uploads validate type and size
- [ ] No direct use of user input in system commands, SQL, or template rendering
- [ ] Validation errors return 400 (not 500) with useful but safe error messages

---

## Learn More

- [OWASP A03: Injection](../02-owasp/web-top10/A03-injection.md)
- [File Upload Security](./file-upload-security.md)
- [Add Input Validation prompt](./prompts/add-input-validation.md)
