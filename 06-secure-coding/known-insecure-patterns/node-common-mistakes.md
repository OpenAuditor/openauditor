# Node.js Common Security Mistakes

Real patterns that appear in Node.js apps that create vulnerabilities.

---

## 1. Command Injection via Child Process

```javascript
// WRONG — user input directly in shell command
const { exec } = require('child_process');
app.get('/convert', (req, res) => {
  exec(`ffmpeg -i ${req.query.file} output.mp4`, callback);
  // If file = "; rm -rf /; echo " — server is destroyed
});
```

```javascript
// RIGHT — use execFile with argument array (no shell interpolation)
const { execFile } = require('child_process');
app.get('/convert', (req, res) => {
  const filename = sanitizeFilename(req.query.file); // validate first
  execFile('ffmpeg', ['-i', filename, 'output.mp4'], callback);
  // Arguments are passed as array — no shell expansion
});
```

---

## 2. Path Traversal via User-Supplied Filenames

```javascript
// WRONG — user controls the path
app.get('/files/:name', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', req.params.name));
  // Request: GET /files/../../etc/passwd
});
```

```javascript
// RIGHT — resolve and verify the path stays within uploads dir
app.get('/files/:name', (req, res) => {
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const requestedPath = path.resolve(uploadsDir, req.params.name);
  
  // Ensure the path is still within uploads
  if (!requestedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.sendFile(requestedPath);
});
```

---

## 3. Prototype Pollution

```javascript
// WRONG — merging user input can pollute Object prototype
function merge(target, source) {
  for (let key in source) {
    target[key] = source[key]; // if source has __proto__ key, game over
  }
}

// Attacker sends: {"__proto__": {"isAdmin": true}}
merge({}, JSON.parse(req.body));
// Now ({}).isAdmin === true for ALL objects
```

```javascript
// RIGHT — use safe merge or JSON schema validation
import { cloneDeep } from 'lodash'; // lodash merge is safe against this
// Or use Object.assign with null prototype:
const safe = Object.create(null);
Object.assign(safe, validatedData); // validated with Zod first
```

---

## 4. Unvalidated Redirects

```javascript
// WRONG — redirects to user-controlled URL
app.get('/redirect', (req, res) => {
  res.redirect(req.query.next); // attacker redirects to phishing site
});
```

```javascript
// RIGHT — validate redirect URL is on your own domain
app.get('/redirect', (req, res) => {
  const next = req.query.next;
  const url = new URL(next, 'https://yourapp.com');
  
  if (url.host !== 'yourapp.com') {
    return res.redirect('/'); // fall back to home
  }
  
  res.redirect(url.pathname + url.search);
});
```

---

## 5. Trusting `req.body` Without Validation

```javascript
// WRONG — directly uses user input
app.post('/users', async (req, res) => {
  await db.users.create({ ...req.body }); // user could set role: 'admin'
});
```

```javascript
// RIGHT — pick only known fields
app.post('/users', async (req, res) => {
  const { email, name, password } = req.body; // destructure specific fields
  
  // Validate with schema
  const result = CreateUserSchema.safeParse({ email, name, password });
  if (!result.success) return res.status(400).json({ error: result.error });
  
  await db.users.create({
    email: result.data.email,
    name: result.data.name,
    passwordHash: await bcrypt.hash(result.data.password, 12),
    role: 'user', // never from user input
  });
});
```

---

## 6. CORS Misconfiguration

```javascript
// WRONG — allows any origin
app.use(cors());
// or
res.setHeader('Access-Control-Allow-Origin', '*');
```

```javascript
// RIGHT — allowlist specific origins
app.use(cors({
  origin: ['https://yourapp.com', 'https://www.yourapp.com'],
  credentials: true,
}));
```

---

## 7. No Helmet.js

```javascript
// WRONG — default Express exposes version info and lacks security headers
app.use(express.json());

// RIGHT — add Helmet for security headers
import helmet from 'helmet';
app.use(helmet()); // adds X-Frame-Options, CSP, HSTS, and more
```

---

## Learn More

- [Input Validation](../input-validation.md)
- [CORS and CSP Headers](../cors-csp-headers.md)
- [API Security](../api-security.md)
