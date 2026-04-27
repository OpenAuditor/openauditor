# A03 — Injection

## Summary

Injection occurs when an application sends untrusted data to an interpreter — a database, shell, LDAP server, XML parser, or template engine — as part of a command or query. The interpreter executes the attacker's data as code. SQL injection is the most well-known variant, but the category also covers OS command injection, LDAP injection, NoSQL injection, and server-side template injection. Injection vulnerabilities are straightforward to exploit, often remotely, without authentication, and can result in full database compromise, authentication bypass, or arbitrary code execution on the server.

---

## What It Looks Like

### SQL injection via string concatenation

```javascript
// Node.js + raw SQL — VULNERABLE
// Attacker sends: username = "admin' OR '1'='1' --"
// The query becomes: SELECT * FROM users WHERE username = 'admin' OR '1'='1' --' AND password = '...'
// This returns the first user (admin) regardless of the password
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await db.query(query);
  if (user.rows.length > 0) {
    // Attacker is now logged in as admin
    req.session.user = user.rows[0];
    return res.redirect("/dashboard");
  }
  return res.status(401).send("Invalid credentials");
});
```

### SQL injection leading to data exfiltration

```python
# Flask + raw SQL — VULNERABLE
# Attacker sends: id = "1 UNION SELECT username, password, null FROM users --"
@app.route("/products")
def get_product():
    product_id = request.args.get("id")
    query = f"SELECT name, description, price FROM products WHERE id = {product_id}"
    result = db.execute(query).fetchall()
    return jsonify(result)
```

### OS command injection

```javascript
// VULNERABLE: user input passed directly to shell
const { exec } = require("child_process");

app.get("/ping", (req, res) => {
  const host = req.query.host;
  // Attacker sends: host = "google.com; cat /etc/passwd"
  exec(`ping -c 1 ${host}`, (err, stdout) => {
    res.send(stdout);
  });
});
```

### Server-side template injection

```python
# Jinja2 — VULNERABLE
# Attacker sends: name = "{{config.items()}}" or "{{''.__class__.__mro__[1].__subclasses__()}}"
@app.route("/greet")
def greet():
    name = request.args.get("name")
    template = f"Hello {name}!"
    return render_template_string(template)  # Never use render_template_string with user input
```

---

## The Fix

### Use parameterised queries (prepared statements)

```javascript
// Node.js + pg — FIXED
// User input is passed as a parameter, never interpolated into the query string
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await db.query(
    "SELECT * FROM users WHERE username = $1 AND password_hash = $2",
    [username, hashedPassword]  // Parameters are escaped by the driver
  );

  if (result.rows.length > 0) {
    req.session.user = result.rows[0];
    return res.redirect("/dashboard");
  }
  return res.status(401).json({ error: "Invalid credentials" });
});
```

```python
# Python + psycopg2 — FIXED
cursor.execute(
    "SELECT name, description, price FROM products WHERE id = %s",
    (product_id,)  # Note the trailing comma — this must be a tuple
)
result = cursor.fetchall()
```

### Use an ORM to avoid raw SQL

```javascript
// Prisma — FIXED: ORM handles parameterisation automatically
const user = await prisma.user.findFirst({
  where: {
    username: username,
    passwordHash: hashedPassword,
  },
});
```

```python
# SQLAlchemy — FIXED
user = db.session.query(User).filter(
    User.username == username,
    User.password_hash == hashed_password
).first()
```

### Safe OS command execution — use argument arrays, never shell strings

```javascript
// FIXED: execFile with argument array — no shell interpolation possible
const { execFile } = require("child_process");

app.get("/ping", (req, res) => {
  const host = req.query.host;

  // Validate against an allowlist first
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
    return res.status(400).json({ error: "Invalid host" });
  }

  execFile("ping", ["-c", "1", host], (err, stdout) => {
    if (err) return res.status(500).json({ error: "Ping failed" });
    res.send(stdout);
  });
});
```

### Template injection — never render user input as a template

```python
# FIXED: pass user data as template variables, not as template source
@app.route("/greet")
def greet():
    name = request.args.get("name", "")
    # Escape happens in the template engine, not via string formatting
    return render_template("greet.html", name=name)
```

> **Critical:** Parameterised queries and ORMs are the correct defence against SQL injection. Input sanitisation (escaping, filtering) is not a reliable primary defence — it can be bypassed. Never rely on it alone.

---

## Real-World Breach

**Heartland Payment Systems — 2008**
Heartland processed over 100 million payment card transactions per month. A SQL injection vulnerability in their web application allowed attacker Albert Gonzalez to install packet-sniffing malware on Heartland's internal network. The result was the theft of 130 million credit and debit card numbers. Heartland paid over $145 million in settlements, lost their PCI DSS certification, and their CEO called it "the worst possible thing that could happen to a payment processor." The initial entry point was a single SQL injection flaw in a login form.

---

## How to Test

### Manual SQL injection testing

```bash
# Send a single quote as a parameter — if the application errors, it may be vulnerable
curl "https://yourapp.com/products?id=1'"

# Try a simple boolean test
curl "https://yourapp.com/products?id=1 AND 1=1"  # Should return results
curl "https://yourapp.com/products?id=1 AND 1=2"  # Should return no results
```

### Automated — sqlmap

```bash
# Install: pip install sqlmap
# Run against a suspected endpoint
sqlmap -u "https://yourapp.com/products?id=1" --batch --level=2

# Test a POST endpoint
sqlmap -u "https://yourapp.com/login" --data="username=admin&password=test" --batch
```

### Static analysis — find raw string concatenation in SQL

```bash
# Search your codebase for dangerous SQL patterns
grep -rn "SELECT.*\${" src/
grep -rn "SELECT.*+.*req\." src/
grep -rn "f\"SELECT" .  # Python f-strings with SQL
```

---

## Checklist

- [ ] All database queries use parameterised statements or an ORM — no string concatenation
- [ ] No user input is passed to `exec()`, `execSync()`, `system()`, `subprocess.run(shell=True)`, or equivalents
- [ ] Template engines render user data as variables, not as template source
- [ ] LDAP queries (if used) use parameterised LDAP filters
- [ ] Input validation is applied as defence-in-depth (not as the primary injection defence)
- [ ] Database users follow least privilege — the app's DB user cannot DROP tables or access other schemas
- [ ] sqlmap or equivalent has been run against all endpoints that accept user-supplied IDs or query strings
- [ ] Error messages do not reveal database structure, table names, or query fragments to the user

---

## Why This Matters

SQL injection is one of the most exploited vulnerabilities in existence. It is fast to exploit, often scriptable, and frequently requires no authentication. A successful attack can dump an entire database in minutes, bypass authentication completely, and in some configurations execute arbitrary commands on the underlying operating system. The Heartland, TalkTalk (2015, 156,959 customer records, £400,000 ICO fine), and Yahoo! (2012, 450,000 credentials) breaches all had SQL injection as a component. Even a low-traffic application is targeted by automated scanners within hours of going live.

---

## Learn More

- [OWASP A03:2021 — Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- [OpenAuditor: Secure Coding — Database Security](../../06-secure-coding/)
- [OpenAuditor: Security Testing](../../10-security-testing/)
