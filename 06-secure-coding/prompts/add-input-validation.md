# Prompt: Add Input Validation

## When to use this

Use this when building API endpoints, after adding new features, or when auditing an existing app that relies on frontend validation only. Server-side validation is required for every endpoint.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit and implement server-side input validation across this application.

**Step 1: Map all input surfaces**
Find every place where user input enters the application:
- API route request bodies
- URL path parameters (/:id, /:slug)
- Query string parameters (?page=1&sort=name)
- File uploads
- WebSocket messages
- Form submissions

**Step 2: Check for missing server-side validation**
For each input surface, verify:
- Is validation done on the server? (Frontend-only validation is not security)
- Is an explicit schema used? (Zod, Yup, Joi, Pydantic, etc.)
- Are types, lengths, formats, and ranges validated?
- Is input sanitised before use in templates, commands, or database queries?

Flag any route that:
- Directly uses `req.body` without schema validation
- Passes user input to SQL queries (even parameterised strings)
- Passes user input to shell commands or file paths
- Renders user content as HTML without sanitisation

**Step 3: Implement validation with the appropriate library**

For TypeScript/Node.js — use Zod:
```typescript
import { z } from 'zod';
const Schema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(254),
  age: z.number().int().min(0).max(150),
});
const result = Schema.safeParse(req.body);
if (!result.success) return res.status(400).json({ errors: result.error.flatten() });
```

For Python — use Pydantic:
```python
from pydantic import BaseModel, EmailStr, Field
class UserInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
```

**Step 4: Add validation to every unvalidated endpoint**
Show the before (no validation) and after (validated) for each endpoint.

**Step 5: Add validation error responses**
Validation failures must:
- Return 400 Bad Request
- Include which fields failed and why
- NOT include stack traces or internal details
- NOT silently pass with bad data

**Step 6: Prevent mass assignment**
Ensure user input can't set sensitive fields:
- `role: 'admin'`
- `isVerified: true`
- `userId` (should always come from auth, not request body)
- `createdAt`, `updatedAt`

List any fields that must be stripped from user input.

---

## What to expect

Schema validation added to every API endpoint using the appropriate library for your stack. Each route now validates types, lengths, and allowed values. Sensitive fields are protected from mass assignment. Errors return 400 with safe, useful messages.

## Learn more

[Input Validation](../input-validation.md)
