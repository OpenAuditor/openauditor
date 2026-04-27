# API7 — Server Side Request Forgery (SSRF)

## 30-second summary

SSRF occurs when an API accepts a URL as input and makes a server-side HTTP request to that URL without validating it. Attackers supply internal network addresses or cloud metadata endpoints, causing the server to fetch data it should never be able to access — including cloud provider credentials, internal service responses, and infrastructure metadata.

> **Critical:** Never allow user-supplied URLs to be fetched by your server without strict allowlisting. The server lives inside your network; you do not.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE
// A webhook or link preview feature that fetches user-supplied URLs

app.post('/api/webhooks/test', authenticate, async (req, res) => {
  const { url } = req.body;

  // Fetches whatever URL the user supplies — no validation
  const response = await fetch(url);
  const data = await response.text();

  return res.json({ status: response.status, preview: data.slice(0, 500) });
});

// Image proxy — also vulnerable
app.get('/api/proxy/image', async (req, res) => {
  const { src } = req.query;

  // Attacker sends: src=http://169.254.169.254/latest/meta-data/iam/security-credentials/
  const response = await fetch(src as string);
  response.body.pipe(res);
});
```

An attacker sends `url=http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name` and receives the AWS IAM credentials of the EC2 instance role.

---

## Fixed code example

```typescript
// Express.js — FIXED
import { URL } from 'url';
import dns from 'dns/promises';
import net from 'net';

// Define strict allowlist of permitted hosts
const ALLOWED_WEBHOOK_HOSTS = new Set([
  'hooks.slack.com',
  'api.github.com',
  'webhook.site',
]);

async function isPrivateIP(hostname: string): Promise<boolean> {
  let addresses: string[];
  try {
    const result = await dns.lookup(hostname, { all: true });
    addresses = result.map((r) => r.address);
  } catch {
    return true; // DNS failure — treat as unsafe
  }

  return addresses.some((addr) => {
    // Block private, loopback, link-local, and cloud metadata ranges
    return (
      net.isIPv4(addr) &&
      (addr.startsWith('10.') ||
        addr.startsWith('172.16.') ||
        addr.startsWith('192.168.') ||
        addr.startsWith('127.') ||
        addr.startsWith('169.254.') || // AWS/Azure/GCP metadata
        addr === '0.0.0.0')
    );
  });
}

async function validateWebhookUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only HTTPS allowed
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted');
  }

  // Allowlist check (optional: use instead of or in addition to IP check)
  if (!ALLOWED_WEBHOOK_HOSTS.has(parsed.hostname)) {
    throw new Error('Host not in allowlist');
  }

  // DNS rebinding protection — resolve and verify IP range
  if (await isPrivateIP(parsed.hostname)) {
    throw new Error('URL resolves to a private or restricted IP address');
  }

  return parsed;
}

app.post('/api/webhooks/test', authenticate, async (req, res) => {
  const { url } = req.body;

  let validatedUrl: URL;
  try {
    validatedUrl = await validateWebhookUrl(url);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  // Fetch with a short timeout and no redirect following to untrusted hosts
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(validatedUrl.toString(), {
      signal: controller.signal,
      redirect: 'error', // Do not follow redirects
    });
    const data = await response.text();
    return res.json({ status: response.status, preview: data.slice(0, 200) });
  } catch {
    return res.status(502).json({ error: 'Request to webhook URL failed' });
  } finally {
    clearTimeout(timeout);
  }
});
```

---

## Real-world breach scenario

**Capital One (2019):** A misconfigured AWS WAF allowed an attacker to exploit SSRF through a web application running on an EC2 instance. The attacker sent a crafted request that caused the server to make a request to the EC2 instance metadata endpoint (`169.254.169.254`). This returned temporary IAM credentials for the instance's service role. Using those credentials, the attacker accessed over 100 million customer records stored in S3. The breach resulted in a $80 million fine.

**GitLab SSRF (multiple CVEs):** GitLab's import-from-URL and webhook features have been exploited multiple times to access internal services, Redis, Elasticsearch, and other infrastructure components on GitLab's internal network that were not directly internet-accessible.

---

## Detection checklist

- [ ] All endpoints that accept URLs validate against an explicit allowlist of permitted hosts.
- [ ] HTTP (non-TLS) URLs are rejected.
- [ ] After DNS resolution, the resolved IP is checked against private/reserved ranges.
- [ ] Redirects are not followed to new hosts without re-validating the destination.
- [ ] Cloud metadata endpoints (`169.254.169.254`, `fd00:ec2::254`) are explicitly blocked.
- [ ] Outbound request timeouts are enforced to prevent slow SSRF probing.
- [ ] DNS rebinding attacks are mitigated by re-resolving and checking the IP immediately before the connection is made.
- [ ] Outbound HTTP connections from the API server are limited to necessary destinations by egress firewall rules.

---

## Testing strategy

**Cloud metadata probe:**
```bash
# Test if the API fetches the AWS metadata endpoint
curl -s -X POST https://api.example.com/api/webhooks/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# Also test common variants
# http://[::ffff:169.254.169.254]/  (IPv6 representation)
# http://169.254.169.254.nip.io/   (DNS rebinding via wildcard DNS)
# http://2852039166/               (decimal IP representation)
```

**Internal service probe:**
```bash
# Test for access to internal services
for target in \
  "http://localhost:6379"  \
  "http://127.0.0.1:9200"  \
  "http://10.0.0.1/"       \
  "file:///etc/passwd"; do

  RESP=$(curl -s -X POST https://api.example.com/api/proxy/image \
    -d "src=$target" \
    -H "Authorization: Bearer $TOKEN")
  echo "$target -> $RESP" | head -c 200
  echo
done
```

**Tools:**
- Burp Suite Collaborator — detect out-of-band SSRF where response is not returned.
- `interactsh` — open-source alternative to Burp Collaborator.
- `ssrfmap` — automated SSRF exploitation and detection tool.

---

## Why this matters

SSRF turns your API server into a proxy for attacking your own internal infrastructure. The server has network access that the attacker does not — it can reach internal databases, admin panels, cloud metadata services, and other microservices that are not exposed to the internet.

In cloud environments, the impact is particularly severe. The EC2/GCP/Azure metadata endpoint returns temporary credentials that grant access to every resource the instance role is permitted to access. This is the pattern that led to the Capital One breach: one SSRF vulnerability, one metadata request, one set of credentials, 100 million records.

Egress firewall rules provide a defence-in-depth layer, but they are not a substitute for input validation. The correct fix is to validate at the application layer first and restrict at the network layer second.
