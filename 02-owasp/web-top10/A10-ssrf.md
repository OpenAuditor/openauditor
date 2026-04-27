# A10: Server-Side Request Forgery (SSRF)

**New entry — OWASP Web Top 10 2021**

SSRF lets attackers make the server fetch URLs on their behalf — accessing internal services, cloud metadata APIs, and internal network resources that are otherwise unreachable from the internet.

---

## 30-Second Summary

SSRF occurs when your server fetches a URL provided (or influenced) by the user without validating the destination. The attacker's goal: reach `http://169.254.169.254` (AWS metadata), `http://localhost:9200` (Elasticsearch), internal databases, or other services on your private network.

**Real breach:** The 2019 Capital One breach ($80M fine, 100M records) used SSRF to reach the AWS EC2 metadata service at `169.254.169.254`, steal IAM credentials, then pivot to S3 buckets. SSRF + cloud = catastrophic.

---

## Attack Scenarios

### 1. Basic SSRF

```javascript
// VULNERABLE — user controls the URL completely
app.get('/preview', async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url); // attacker sends: http://169.254.169.254/latest/meta-data/
  const content = await response.text();
  res.send(content);
});

// Attacker payloads:
// http://169.254.169.254/latest/meta-data/iam/security-credentials/
// http://localhost:5432  (PostgreSQL)
// http://10.0.0.1:9200  (internal Elasticsearch)
// http://169.254.169.254/latest/user-data  (cloud-init scripts)
// file:///etc/passwd    (local file read)
```

### 2. Blind SSRF

```javascript
// VULNERABLE — server makes request, result not shown to user
// But attacker can use an external server to detect which internal hosts respond
app.post('/webhook-test', async (req, res) => {
  const { url } = req.body;
  try {
    await fetch(url, { method: 'POST', body: JSON.stringify({ test: true }) });
    res.json({ success: true }); // attacker can infer if request succeeded
  } catch {
    res.json({ success: false }); // vs failed — reveals internal topology
  }
});
```

### 3. PDF/Image Generation Services

```javascript
// VULNERABLE — Puppeteer/wkhtmltopdf rendering user-controlled HTML
app.post('/generate-pdf', async (req, res) => {
  const html = req.body.html;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html); // <img src="http://169.254.169.254/..."> — SSRF
  // or <iframe src="file:///etc/passwd">
  const pdf = await page.pdf();
  res.send(pdf);
});

// VULNERABLE — image proxy without validation
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  const image = await fetch(imageUrl); // SSRF
  res.pipe(image.body);
});
```

---

## Defences

### 1. Allowlist External Domains

```javascript
// SECURE — only allow explicitly approved domains
const ALLOWED_DOMAINS = new Set([
  'api.github.com',
  'api.stripe.com',
  'api.sendgrid.com',
]);

async function safeFetch(url) {
  const parsed = new URL(url);
  
  if (!ALLOWED_DOMAINS.has(parsed.hostname)) {
    throw new Error(`Domain not allowed: ${parsed.hostname}`);
  }
  
  // Also enforce HTTPS only
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted');
  }
  
  return fetch(url);
}
```

### 2. Block Private IP Ranges

```javascript
import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

const PRIVATE_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^127\./,
  /^169\.254\./,    // AWS/GCP/Azure metadata
  /^::1$/,          // IPv6 loopback
  /^fc00:/,         // IPv6 private
  /^fe80:/,         // IPv6 link-local
];

async function isPrivateHost(hostname) {
  // Prevent DNS rebinding — resolve THEN check
  const addresses = await resolve4(hostname).catch(() => []);
  return addresses.some(addr => PRIVATE_RANGES.some(range => range.test(addr)));
}

async function safeFetch(url) {
  const parsed = new URL(url);
  
  if (parsed.protocol !== 'https:') {
    throw new Error('HTTPS only');
  }
  
  // Resolve the hostname and check if it's private
  if (await isPrivateHost(parsed.hostname)) {
    throw new Error('Requests to private IP ranges are not allowed');
  }
  
  // Important: connect to the resolved IP, not the hostname
  // (prevents DNS rebinding between check and connection)
  const addresses = await resolve4(parsed.hostname);
  const response = await fetch(url, {
    // Some libraries allow specifying the IP directly
  });
  
  return response;
}
```

### 3. Disable Redirects or Validate Redirect Destinations

```javascript
// VULNERABLE — follows redirects to private IPs
const response = await fetch(url, { redirect: 'follow' });

// SECURE — either disable redirects or validate each hop
const response = await fetch(url, { redirect: 'manual' });
if (response.status >= 300 && response.status < 400) {
  const location = response.headers.get('location');
  // Validate the redirect target before following
  await safeFetch(location);
}
```

### 4. For PDF/Screenshot Generation

```javascript
// SECURE — Puppeteer with strict CSP and no local file access
const browser = await puppeteer.launch({
  args: [
    '--disable-web-security=false',
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
});

const page = await browser.newPage();

// Block all navigation except the known origin
await page.setRequestInterception(true);
page.on('request', (req) => {
  const reqUrl = new URL(req.url());
  
  // Block non-HTTPS, private IPs, and unexpected origins
  if (
    reqUrl.protocol === 'file:' ||
    reqUrl.hostname === 'localhost' ||
    await isPrivateHost(reqUrl.hostname)
  ) {
    req.abort();
  } else {
    req.continue();
  }
});

// Set a strict CSP for the rendered page
await page.setExtraHTTPHeaders({
  'Content-Security-Policy': "default-src 'self'; img-src https:; script-src 'none'",
});
```

### 5. Cloud Metadata Protection

If you're on AWS, block IMDS access at the network level:

```bash
# Block access to EC2 metadata service from application containers
# In your Docker network or security group rules:
iptables -A OUTPUT -d 169.254.169.254 -j DROP

# Or use IMDSv2 which requires a session token (harder to exploit)
# In EC2 instance metadata options:
aws ec2 modify-instance-metadata-options \
  --instance-id i-xxxx \
  --http-tokens required \
  --http-endpoint enabled
```

---

## URL Validation Library

```javascript
// Use a dedicated library for SSRF prevention
import { SSRF } from 'ssrf-req-filter';

const ssrf = new SSRF();

app.post('/webhook-test', async (req, res) => {
  const { url } = req.body;
  
  try {
    await ssrf.request(url); // throws if SSRF detected
    const response = await fetch(url);
    res.json({ status: response.status });
  } catch (err) {
    if (err.message.includes('SSRF')) {
      return res.status(400).json({ error: 'Invalid URL: private addresses not allowed' });
    }
    res.status(500).json({ error: 'Request failed' });
  }
});
```

---

## Security Tests

```javascript
describe('SSRF Prevention', () => {
  const ssrfPayloads = [
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:5432',
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://192.168.1.1',
    'file:///etc/passwd',
  ];

  ssrfPayloads.forEach(payload => {
    it(`blocks SSRF payload: ${payload}`, async () => {
      const res = await request(app)
        .get('/preview')
        .query({ url: payload });
      expect(res.status).toBe(400);
    });
  });

  it('allows legitimate external URLs', async () => {
    const res = await request(app)
      .get('/preview')
      .query({ url: 'https://example.com' });
    expect(res.status).not.toBe(400);
  });
});
```

---

## Audit Checklist

- [ ] All user-supplied URLs are validated before fetching
- [ ] Domain allowlist used for webhook/integration URLs
- [ ] Private IP ranges blocked (10.x, 192.168.x, 169.254.x, 127.x)
- [ ] `file://` protocol blocked
- [ ] Redirects either disabled or validated before following
- [ ] PDF/screenshot generators use request interception to block private resources
- [ ] Cloud metadata endpoint (169.254.169.254) blocked at network level
- [ ] DNS rebinding mitigated (resolve then check, then connect to resolved IP)
- [ ] SSRF-related errors don't reveal internal topology

---

## Learn More

- [Input Validation](../../06-secure-coding/input-validation.md)
- [OWASP A01: Broken Access Control](./A01-broken-access-control.md)
- [Deployment Security](../../09-deployment-security/README.md)
