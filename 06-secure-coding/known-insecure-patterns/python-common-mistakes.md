# Python Common Security Mistakes

Common vulnerabilities in Python web apps (Django, FastAPI, Flask).

---

## 1. Shell Injection via subprocess

```python
# WRONG — string formatting in shell command
import subprocess
filename = request.args.get('file')
subprocess.run(f"convert {filename} output.pdf", shell=True)
# If filename = "'; rm -rf /; echo '" — server destroyed
```

```python
# RIGHT — list arguments, no shell=True
import subprocess
filename = secure_filename(request.args.get('file'))  # validate first
subprocess.run(['convert', filename, 'output.pdf'])  # no shell expansion
```

---

## 2. eval() on User Input

```python
# WRONG — eval() is remote code execution waiting to happen
def calculate(expression):
    return eval(expression)  # user sends: "__import__('os').system('rm -rf /')"
```

```python
# RIGHT — use safe expression parsers
import ast

def calculate(expression):
    try:
        tree = ast.parse(expression, mode='eval')
        # Whitelist allowed node types
        for node in ast.walk(tree):
            if not isinstance(node, (ast.Expression, ast.BinOp, ast.Num,
                                     ast.Add, ast.Sub, ast.Mult, ast.Div)):
                raise ValueError("Unsupported expression")
        return eval(compile(tree, '<string>', 'eval'))
    except Exception:
        raise ValueError("Invalid expression")
```

---

## 3. SQL Injection in Raw Queries

```python
# WRONG — string formatting in SQL
email = request.form['email']
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
# email = "' OR '1'='1" — returns all users
```

```python
# RIGHT — parameterised queries
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# Or use SQLAlchemy ORM
from sqlalchemy.orm import Session
user = session.query(User).filter(User.email == email).first()
```

---

## 4. Pickle Deserialization of Untrusted Data

```python
# WRONG — pickle can execute arbitrary code on deserialisation
import pickle
data = pickle.loads(user_supplied_bytes)  # RCE if malicious
```

```python
# RIGHT — use JSON or validated data formats
import json
data = json.loads(user_supplied_string)  # safe, no code execution
# Or use dataclasses/pydantic for structured data
from pydantic import BaseModel
class UserData(BaseModel):
    name: str
    email: str
data = UserData.model_validate_json(user_supplied_string)
```

---

## 5. Django DEBUG=True in Production

```python
# WRONG — DEBUG=True in production shows full stack traces in browser
DEBUG = True  # in settings.py, not overridden per environment
```

```python
# RIGHT — environment-based config
import os
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# Also configure ALLOWED_HOSTS
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
# Never: ALLOWED_HOSTS = ['*']
```

---

## 6. Hardcoded Secret Keys

```python
# WRONG — hardcoded Django secret key
SECRET_KEY = 'django-insecure-abc123'  # committed to git
```

```python
# RIGHT — from environment
import os
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']  # required, not optional
# Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 7. Insecure Direct Object Reference

```python
# WRONG — no ownership check
@app.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, user: User = Depends(get_current_user)):
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()
    # Any user can get any invoice!
```

```python
# RIGHT — always check ownership
@app.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, user: User = Depends(get_current_user)):
    invoice = (db.query(Invoice)
               .filter(Invoice.id == invoice_id, Invoice.user_id == user.id)
               .first())
    if not invoice:
        raise HTTPException(status_code=404, detail="Not found")
    return invoice
```

---

## Learn More

- [Input Validation](../input-validation.md)
- [Auth Best Practices](../auth-best-practices.md)
- [OWASP A01: Broken Access Control](../../02-owasp/web-top10/A01-broken-access-control.md)
