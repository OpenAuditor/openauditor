# API9:2023 — Improper Inventory Management

> **30-second summary:** APIs that organisations have forgotten about — old API versions, shadow APIs created by third parties, staging endpoints exposed publicly, or undocumented internal APIs. Attackers find these with automated discovery tools; defenders often have no idea they exist.

## Severity

**Medium** — Forgotten APIs often lack authentication, rate limiting, and monitoring. They are the path of least resistance into an organisation's data.

## Real-World Breach: Optus (2022)

Optus, Australia's second-largest telco, exposed 11 million customer records through an API endpoint that had been inadvertently left accessible on the public internet during a cloud migration. The API (`/api/v1/customers`) required no authentication and returned full customer records — name, date of birth, phone number, email, driver's licence, and passport numbers. The endpoint had been used for testing and was never removed. No authentication had been added because it was "only supposed to be internal."

## How It Happens

### 1. Forgotten API Versions

```bash
# Your current API
https://api.example.com/v3/users

# V1 and V2 still running:
https://api.example.com/v1/users      # No auth, returns all fields
https://api.example.com/v2/users      # Rate limiting removed during debugging
https://api.example.com/api/users     # Undocumented alias
```

### 2. Exposed Non-Production Environments

```
https://staging.api.example.com       # Same database as production
https://dev-api.example.com           # Debug mode enabled, verbose errors
https://api.example.com/test          # Test endpoint, no auth
https://api-old.example.com           # Deprecated but still running
```

### 3. Shadow APIs from Third-Party Integrations

```javascript
// Your payment processor SDK creates an endpoint you didn't know about
// Your analytics vendor adds an API route
// Your CDN vendor installs a management endpoint
// None of these are in your inventory
```

### 4. Undocumented Internal Endpoints

```javascript
// Added by a developer for debugging, never removed
app.get('/internal/users/dump', async (req, res) => {
  // "Temporary" endpoint from 2 years ago
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});
```

## Discovery Techniques (What Attackers Use)

```bash
# Subdomain enumeration
amass enum -d example.com | grep api
subfinder -d example.com | grep api

# Directory brute-force
ffuf -u https://api.example.com/FUZZ \
  -w /usr/share/wordlists/api-endpoints.txt \
  -mc 200,201,301,302

# API version fuzzing
for v in v1 v2 v3 v4 beta alpha legacy old; do
  curl -s -o /dev/null -w "%{http_code} $v\n" \
    "https://api.example.com/$v/users"
done

# Google dorking
site:api.example.com
site:example.com inurl:api
"api.example.com" filetype:json

# Wayback Machine — finds old API endpoints
curl "http://web.archive.org/cdx/search/cdx?url=api.example.com/*&output=text&limit=100"
```

## Prevention

### 1. Maintain an API Inventory

```yaml
# api-inventory.yml — maintain this as part of your codebase
apis:
  - name: "User API v3"
    base_url: "https://api.example.com/v3"
    status: "active"
    authentication: "Bearer JWT"
    owner: "platform-team"
    last_reviewed: "2024-11-01"
    documentation: "https://docs.example.com/api/v3"
    environments:
      - name: production
        url: "https://api.example.com/v3"
        authenticated: true
      - name: staging
        url: "https://staging-api.example.com/v3"
        authenticated: true
        access_restricted: true  # IP allowlist only

  - name: "Legacy User API v1"
    base_url: "https://api.example.com/v1"
    status: "deprecated"
    deprecation_date: "2023-06-01"
    removal_date: "2024-03-01"  # PAST — should have been removed
    authentication: "API Key (deprecated)"
    owner: "platform-team"
```

### 2. Automate Inventory Discovery

```bash
#!/bin/bash
# scripts/discover-api-endpoints.sh
# Run weekly in CI to catch undocumented endpoints

echo "=== API Endpoint Discovery ==="
echo "Checking registered routes..."

# Node.js — print all registered routes
node -e "
const app = require('./src/app');
const routes = [];
app._router.stack.forEach((r) => {
  if (r.route) {
    routes.push({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    });
  }
});
console.log(JSON.stringify(routes, null, 2));
" > discovered-routes.json

# Compare against inventory
echo "Routes not in inventory:"
node -e "
const discovered = require('./discovered-routes.json');
const inventory = require('./api-inventory.json');
const inventoryPaths = inventory.endpoints.map(e => e.path);

discovered.forEach(route => {
  if (!inventoryPaths.includes(route.path)) {
    console.log('UNKNOWN:', route.method, route.path);
  }
});
"
```

### 3. Version Deprecation Process

```typescript
// src/middleware/deprecation.ts

const DEPRECATED_VERSIONS = new Map([
  ['v1', { deprecatedAt: '2023-01-01', removedAt: '2024-01-01', successor: 'v3' }],
  ['v2', { deprecatedAt: '2023-06-01', removedAt: '2024-06-01', successor: 'v3' }],
]);

export function versionGuard(req: Request, res: Response, next: NextFunction) {
  const versionMatch = req.path.match(/^\/(v\d+)\//);
  
  if (!versionMatch) return next();
  
  const version = versionMatch[1];
  const deprecation = DEPRECATED_VERSIONS.get(version);
  
  if (!deprecation) return next();
  
  const removedDate = new Date(deprecation.removedAt);
  
  if (new Date() > removedDate) {
    // Version is past its removal date — return 410 Gone
    return res.status(410).json({
      error: 'API version no longer available',
      version,
      removedAt: deprecation.removedAt,
      migrate_to: deprecation.successor,
      documentation: `https://docs.example.com/api/${deprecation.successor}`,
    });
  }
  
  // Warn about upcoming removal
  res.setHeader(
    'Deprecation',
    `date="${deprecation.deprecatedAt}"`
  );
  res.setHeader(
    'Sunset',
    new Date(deprecation.removedAt).toUTCString()
  );
  res.setHeader(
    'Link',
    `<https://docs.example.com/api/${deprecation.successor}>; rel="successor-version"`
  );
  
  next();
}
```

### 4. Restrict Non-Production Environments

```typescript
// Staging/dev environments should require authentication too
// middleware/environment-guard.ts

export function requireEnvironmentAuth(req: Request, res: Response, next: NextFunction) {
  const env = process.env.NODE_ENV;
  
  if (env === 'staging' || env === 'development') {
    const token = req.headers['x-staging-token'];
    
    if (token !== process.env.STAGING_ACCESS_TOKEN) {
      return res.status(401).json({
        error: 'Staging environment access requires authentication',
        hint: 'Set X-Staging-Token header with your staging access token',
      });
    }
  }
  
  next();
}
```

For Vercel: use Deployment Protection (Password or Vercel Auth) on all non-production deployments.

### 5. Security Headers to Prevent Enumeration

```nginx
# Nginx: Don't reveal server version
server_tokens off;

# Return 404 (not 405) for non-existent endpoints
# This prevents endpoint enumeration
error_page 405 =404 /404.json;
```

### 6. Continuous Monitoring for Shadow APIs

```yaml
# .github/workflows/api-inventory-check.yml
name: API Inventory Audit
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9am
  push:
    paths:
      - 'src/routes/**'
      - 'src/app.ts'

jobs:
  inventory:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - name: Check for undocumented endpoints
        run: node scripts/discover-api-endpoints.js

      - name: Subdomain scan for shadow APIs
        run: |
          # Check for API subdomains not in inventory
          dig +short api.example.com
          dig +short staging-api.example.com
          dig +short dev-api.example.com

      - name: Verify deprecated versions return 410
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/v1/users)
          if [ "$STATUS" != "410" ]; then
            echo "ERROR: v1 API should return 410 Gone, got $STATUS"
            exit 1
          fi
```

## API Deprecation Communication

```typescript
// Communicate deprecations in API responses from day one of deprecation
// Headers follow RFC 8594 (Sunset) and draft-ietf-httpapi-deprecation-header

{
  "data": { ... },
  "_meta": {
    "deprecation": {
      "message": "This API version (v2) is deprecated. Migrate to v3 by 2024-06-01.",
      "documentation": "https://docs.example.com/migrate-v2-to-v3",
      "sunset_date": "2024-06-01"
    }
  }
}
```

## Audit Checklist

```markdown
## API Inventory Audit

### Discovery
- [ ] All route files reviewed for undocumented endpoints
- [ ] Framework route list generated and compared to inventory
- [ ] Subdomain enumeration run (find shadow API domains)
- [ ] Wayback Machine checked for historical endpoints
- [ ] Third-party SDK endpoints audited

### Version Management
- [ ] All deprecated API versions return 410 Gone or 301 Redirect
- [ ] All active versions require the same authentication
- [ ] Version sunset dates are documented and enforced in code

### Environment Isolation
- [ ] Staging/preview environments require authentication
- [ ] Staging does NOT connect to production database
- [ ] Internal/test endpoints removed or authenticated

### Documentation
- [ ] API inventory file (api-inventory.yml) up to date
- [ ] Every active endpoint has an owner and last-reviewed date
- [ ] Deprecation notices added to response headers
```

## Learn More

- [API Top 10 README](./README.md)
- [API10: Unsafe Consumption of APIs](./API10-unsafe-consumption-of-apis.md)
- [Deployment Security](../../09-deployment-security/)
- [OWASP API9 Detail](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/)
