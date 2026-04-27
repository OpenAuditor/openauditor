# LLM07: Insecure Plugin Design

**Rank #7 — OWASP LLM Top 10 2025 | Severity: High**

LLM plugins (tools, function calls, actions) are often designed without adequate authorisation, input validation, or rate limiting — making them a high-value attack target.

---

## 30-Second Summary

Plugins extend LLM capabilities by giving them access to external tools: databases, APIs, file systems, email. A poorly designed plugin is a privilege escalation vector. If an attacker can manipulate the LLM (via prompt injection) into calling the wrong plugin with malicious arguments, they've effectively executed arbitrary code or accessed arbitrary data.

---

## Common Plugin Security Mistakes

### 1. No Authentication on Plugin Endpoints

```python
# VULNERABLE — plugin endpoint has no auth check
@app.post("/plugins/send-email")
async def send_email_plugin(request: dict):
    # No authentication! Anyone who knows this URL can send emails
    await email_service.send(
        to=request['to'],
        subject=request['subject'],
        body=request['body'],
    )
    return {"success": True}

# SECURE — verify the caller is your LLM system
@app.post("/plugins/send-email")
async def send_email_plugin(
    request: dict,
    api_key: str = Header(None, alias="X-Plugin-API-Key")
):
    if api_key != settings.PLUGIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid plugin API key")
    
    # Also verify request comes from your LLM orchestration layer
    # Not from an external source
    ...
```

### 2. No Input Validation

```python
# VULNERABLE — plugin blindly uses LLM-provided arguments
@app.post("/plugins/query-database")
async def query_database_plugin(query: str):
    # The LLM provides the query — attacker can inject SQL via prompt
    result = await db.execute(query)  # SQL injection
    return result

# SECURE — validate and sanitise plugin inputs
from pydantic import BaseModel, validator
from enum import Enum

class AllowedTable(str, Enum):
    PRODUCTS = "products"
    ORDERS = "orders"
    FAQs = "faqs"

class DatabaseQueryInput(BaseModel):
    table: AllowedTable           # must be an approved table
    column: str                   # will be validated against schema
    search_term: str
    limit: int = 10
    
    @validator('column')
    def validate_column(cls, v, values):
        allowed_columns = {
            'products': ['name', 'description', 'price', 'category'],
            'orders': ['order_id', 'status', 'created_at'],
            'faqs': ['question', 'answer', 'category'],
        }
        table = values.get('table', '').value
        if v not in allowed_columns.get(table, []):
            raise ValueError(f"Column {v} not allowed for table {table}")
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if v > 50:
            return 50  # Cap at 50 results
        return v

@app.post("/plugins/query-database")
async def query_database_plugin(input: DatabaseQueryInput):
    # Safe: table and column from allowlists, value parameterised
    query = f"SELECT {input.column} FROM {input.table.value} WHERE {input.column} LIKE %s LIMIT %s"
    result = await db.execute(query, (f"%{input.search_term}%", input.limit))
    return {"results": result}
```

### 3. Overly Broad Permissions

```python
# VULNERABLE — email plugin can send to anyone, any subject
class EmailPlugin:
    async def send(self, to: str, subject: str, body: str):
        await smtp.send(to=to, subject=subject, body=body)
        # LLM (via prompt injection) could send emails to competitors,
        # spam users, exfiltrate data

# SECURE — scope the plugin to specific allowed operations
class ScopedEmailPlugin:
    # Only allowed to send to the current authenticated user
    def __init__(self, current_user_email: str):
        self.current_user_email = current_user_email
    
    async def send_summary_to_user(self, subject: str, body: str):
        # Can ONLY send to the logged-in user — not to arbitrary addresses
        if len(body) > 5000:
            raise ValueError("Email body too long")
        
        # Subject must match approved templates
        allowed_subjects = [
            "Your requested summary",
            "Task completed",
            "Analysis results",
        ]
        if subject not in allowed_subjects:
            raise ValueError("Invalid email subject")
        
        await smtp.send(
            to=self.current_user_email,  # Fixed — not from LLM input
            subject=subject,
            body=body,
        )
```

### 4. No Rate Limiting on Plugins

```python
# VULNERABLE — plugin can be called unlimited times
# LLM agent in a loop can trigger 1000 API calls

# SECURE — rate limit each plugin call
from ratelimit import limits, sleep_and_retry

class RateLimitedPlugin:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.call_count = 0
        self.MAX_CALLS_PER_SESSION = 20
    
    def check_rate_limit(self):
        self.call_count += 1
        if self.call_count > self.MAX_CALLS_PER_SESSION:
            raise PermissionError(
                f"Plugin call limit reached ({self.MAX_CALLS_PER_SESSION} per session)"
            )
    
    async def query_database(self, input: dict) -> dict:
        self.check_rate_limit()  # Always check before executing
        # ... execute query
```

### 5. Plugin Returns Too Much Data

```python
# VULNERABLE — plugin returns full database record
async def get_user_info_plugin(user_id: str) -> dict:
    user = await db.users.get(user_id)
    return user.to_dict()  # Returns: {id, email, phone, address, payment_methods, ...}
    # LLM may then relay this to the attacker via prompt injection

# SECURE — return only what the LLM needs for the task
async def get_user_info_plugin(user_id: str) -> dict:
    user = await db.users.get(user_id)
    return {
        'name': user.name,           # only what's needed
        'subscription_tier': user.tier,
        'account_status': user.status,
        # NOT: email, phone, payment methods, address, etc.
    }
```

---

## Plugin Design Checklist

For every plugin (tool/function call) in your LLM application:

```
Authentication:
  ✓ Plugin endpoints require authentication
  ✓ Caller is verified as your LLM orchestration layer (not external)
  ✓ User context is passed and validated

Input Validation:
  ✓ All inputs validated with strict schema (Pydantic, Zod)
  ✓ Enumerated types for table names, action types, categories
  ✓ String length limits enforced
  ✓ Parameterised queries for any database access

Permissions:
  ✓ Plugin scoped to minimum required access
  ✓ File system access limited to specific directories
  ✓ Email plugin can only send to current user
  ✓ Database plugin can only access allowed tables

Rate Limiting:
  ✓ Maximum calls per session enforced
  ✓ Maximum calls per minute enforced
  ✓ Expensive operations (external API, LLM calls) have stricter limits

Output:
  ✓ Plugin returns only what's needed (not full records)
  ✓ Sensitive fields excluded from plugin responses
  ✓ Response size limited
  
Audit Logging:
  ✓ Every plugin call logged with user ID and inputs
  ✓ Failed calls logged with reason
```

---

## OpenAI Function Calling Security

```python
# When defining functions for OpenAI function calling:
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search for products in the catalogue",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "maxLength": 200,  # Constrain the parameter
                        "description": "Search query (product name or category)"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["electronics", "clothing", "books", "home"],  # Allowlist
                        "description": "Product category to filter by"
                    },
                    "max_results": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,  # Hard limit
                        "default": 5
                    }
                },
                "required": ["query"],
                "additionalProperties": False,  # Reject unexpected fields
            }
        }
    }
]

# When handling the function call:
if response.tool_calls:
    for tool_call in response.tool_calls:
        # Validate the function name is one we actually support
        if tool_call.function.name not in ALLOWED_FUNCTIONS:
            logger.warning(f"LLM tried to call unknown function: {tool_call.function.name}")
            continue
        
        # Parse and validate arguments
        try:
            args = json.loads(tool_call.function.arguments)
            validated_args = FunctionArgSchema(**args)  # Pydantic validation
        except Exception:
            logger.warning(f"Invalid function arguments: {tool_call.function.arguments}")
            continue
        
        result = await execute_function(tool_call.function.name, validated_args)
```

---

## Learn More

- [LLM08: Excessive Agency](./LLM08-excessive-agency.md)
- [LLM01: Prompt Injection](./LLM01-prompt-injection.md)
- [Tool and Agent Security](../../08-ai-app-security/tool-and-agent-security.md)
- [Input Validation](../../06-secure-coding/input-validation.md)
