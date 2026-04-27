# Fuzzing Inputs

Fuzzing (fuzz testing) sends malformed, unexpected, or random data to your application and watches for crashes, errors, or unexpected behaviour. It finds bugs that no human would think to test.

---

## 30-Second Summary

Fuzzing is automated negative testing. Instead of testing what your app should do, you test what happens when it receives garbage. Crashes = potential vulnerabilities. Unexpected errors = potential information disclosure. Edge cases caught in a fuzzer don't make it to production.

**Real impact:** Google's OSS-Fuzz project has found over 10,000 vulnerabilities in open source software using automated fuzzing, including critical bugs in image parsers, compression libraries, and network stacks.

---

## What Fuzzing Finds

- Buffer overflows (in native modules, image parsers, binary parsers)
- ReDoS — Regular Expression Denial of Service (catastrophic backtracking)
- Parser edge cases (XML, JSON, YAML with unusual inputs)
- Business logic failures (negative quantities, astronomical values, empty strings)
- Error message information disclosure (stack traces on malformed input)
- Integer overflows (prices, quantities, IDs)
- Type confusion bugs

---

## Types of Fuzzing

### 1. Input Fuzzing (Most Practical)

Send unexpected values to API endpoints and form inputs:

```javascript
// Jest-based fuzzer for your API endpoints
const { faker } = require('@faker-js/faker');

describe('Input Fuzzing — Registration Endpoint', () => {
  const endpoint = '/api/auth/register';
  
  // Boundary values
  const FUZZ_INPUTS = {
    emptyString: '',
    null: null,
    undefined: undefined,
    veryLong: 'A'.repeat(100000),
    sqlInjection: "' OR '1'='1'; --",
    xss: '<script>alert(1)</script>',
    pathTraversal: '../../../etc/passwd',
    nullByte: 'test\x00.php',
    unicodeOverflow: '\uFFFE'.repeat(10000),
    negative: -1,
    float: 3.14159,
    bigNumber: Number.MAX_SAFE_INTEGER,
    booleanTrue: true,
    array: ['a', 'b', 'c'],
    object: { key: 'value' },
    regex: '[a-zA-Z]{1,}',
    templateInjection: '${7*7}',
    ssrfAttempt: 'http://169.254.169.254/latest/meta-data',
    formatString: '%s%s%s%s%n',
  };
  
  Object.entries(FUZZ_INPUTS).forEach(([inputType, value]) => {
    it(`handles ${inputType} in email field without crashing`, async () => {
      const response = await request(app)
        .post(endpoint)
        .send({ email: value, password: 'ValidPass123!' });
      
      // Should return 4xx, never 5xx
      expect(response.status).toBeLessThan(500);
      
      // Should not return a stack trace
      const body = JSON.stringify(response.body);
      expect(body).not.toContain('at Object.');
      expect(body).not.toContain('at Function.');
      expect(body).not.toContain('node_modules');
    });
    
    it(`handles ${inputType} in password field without crashing`, async () => {
      const response = await request(app)
        .post(endpoint)
        .send({ email: 'test@example.com', password: value });
      
      expect(response.status).toBeLessThan(500);
    });
  });
  
  // Boundary integers
  [0, 1, -1, 2147483647, -2147483648, 9007199254740991].forEach(num => {
    it(`handles integer ${num} in price field`, async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ productId: 'prod_1', quantity: num });
      
      expect(response.status).toBeLessThan(500);
    });
  });
});
```

### 2. ReDoS Detection

```javascript
// Test your regex patterns for catastrophic backtracking
function testReDoS(pattern, maliciousInput, timeout = 1000) {
  const regex = new RegExp(pattern);
  const start = Date.now();
  
  // Run in a separate thread with a timeout
  try {
    regex.test(maliciousInput);
    const elapsed = Date.now() - start;
    if (elapsed > timeout) {
      console.error(`REDOS DETECTED: pattern /${pattern}/ took ${elapsed}ms`);
      return false;
    }
    return true;
  } catch {
    return true; // regex threw — acceptable
  }
}

// Common vulnerable patterns and their evil inputs:
const REDOS_TESTS = [
  // Email validation — common culprit
  {
    pattern: '^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$',
    evil: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!',
  },
  // ZIP code
  {
    pattern: '^([0-9]+)+$',
    evil: '1'.repeat(100) + 'a',
  },
];

REDOS_TESTS.forEach(({ pattern, evil }) => {
  const safe = testReDoS(pattern, evil);
  if (!safe) {
    console.error(`Vulnerable regex: /${pattern}/`);
  }
});

// Use safe-regex to check your patterns programmatically
const safeRegex = require('safe-regex');
const patterns = [
  /^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*@.+$/,
];
patterns.forEach(p => {
  if (!safeRegex(p)) {
    console.warn(`Potentially vulnerable regex: ${p}`);
  }
});
```

### 3. File Upload Fuzzing

```python
import requests
import os

BASE_URL = "http://localhost:3000"
AUTH_COOKIE = "session=test-session-token"

# Generate malicious file payloads
def create_fuzz_files():
    files = {}
    
    # Empty file
    files['empty'] = ('test.jpg', b'', 'image/jpeg')
    
    # Wrong extension, right MIME
    files['wrong_ext'] = ('malware.exe', b'\x89PNG\r\n', 'image/jpeg')
    
    # EICAR test file (safe antivirus test)
    eicar = b'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
    files['eicar'] = ('test.jpg', eicar, 'image/jpeg')
    
    # Very large file
    files['huge'] = ('huge.jpg', b'A' * (100 * 1024 * 1024), 'image/jpeg')
    
    # Zip bomb
    files['zipbomb'] = ('bomb.zip', create_zip_bomb(), 'application/zip')
    
    # PHP web shell with .jpg extension
    files['webshell'] = ('shell.jpg', b'<?php system($_GET["cmd"]); ?>', 'image/jpeg')
    
    # Path traversal in filename
    files['traversal'] = ('../../etc/passwd', b'not real', 'image/jpeg')
    
    return files

def fuzz_upload_endpoint(endpoint):
    for name, (filename, content, mime) in create_fuzz_files().items():
        try:
            response = requests.post(
                f"{BASE_URL}{endpoint}",
                files={'file': (filename, content, mime)},
                headers={'Cookie': AUTH_COOKIE},
                timeout=10,
            )
            
            print(f"[{name}] Status: {response.status_code}")
            
            if response.status_code >= 500:
                print(f"  ⚠ SERVER ERROR on input: {name}")
            
            if 'stack' in response.text.lower() or 'traceback' in response.text.lower():
                print(f"  ⚠ STACK TRACE LEAKED for: {name}")
                
        except requests.Timeout:
            print(f"  ⚠ TIMEOUT (possible DoS) for: {name}")

fuzz_upload_endpoint('/api/upload')
```

### 4. Property-Based Testing (Hypothesis for Python)

```python
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
import pytest

# Hypothesis automatically finds edge cases that break your functions
@given(
    email=st.text(min_size=0, max_size=500),
    password=st.text(min_size=0, max_size=1000),
)
@settings(max_examples=1000, suppress_health_check=[HealthCheck.too_slow])
def test_register_never_crashes(email, password):
    """Register endpoint should never return 5xx for any input."""
    response = client.post('/api/auth/register', json={
        'email': email,
        'password': password,
    })
    assert response.status_code < 500, f"Server error for email={email!r}, password={password!r}"

@given(
    quantity=st.integers(min_value=-10**18, max_value=10**18),
    price=st.decimals(min_value=-10**10, max_value=10**10, allow_nan=False, allow_infinity=False),
)
def test_order_never_crashes(quantity, price):
    """Order creation should handle any numeric input safely."""
    response = client.post('/api/orders', json={
        'quantity': int(quantity),
        'unit_price': float(price),
    })
    assert response.status_code < 500
```

---

## Fast-Check (JavaScript Property-Based Testing)

```javascript
import * as fc from 'fast-check';

// Property: registration should never return 5xx
it('register endpoint handles arbitrary inputs', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),           // arbitrary email
      fc.string(),           // arbitrary password
      fc.dictionary(fc.string(), fc.anything()), // arbitrary extra fields
      async (email, password, extra) => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ email, password, ...extra });
        
        // Property: never a server error
        return response.status < 500;
      }
    ),
    { numRuns: 500 }
  );
});

// Property: price calculations are always non-negative
it('order total is always non-negative', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.float({ min: 0, max: 10000 }),  // price
      fc.integer({ min: 1, max: 1000 }), // quantity
      async (price, quantity) => {
        const response = await request(app)
          .post('/api/orders/calculate')
          .send({ price, quantity });
        
        return response.body.total >= 0;
      }
    )
  );
});
```

---

## API Fuzzing with Restler

```bash
# Microsoft's REST API fuzzer
docker pull mcr.microsoft.com/restler/restler

# Compile your OpenAPI spec
docker run --rm \
  -v $(pwd):/work \
  mcr.microsoft.com/restler/restler \
  dotnet /RESTler/restler/Restler.dll compile \
  --api_spec /work/openapi.yaml \
  --dest_dir /work/restler-output

# Fuzz the API
docker run --rm \
  -v $(pwd):/work \
  mcr.microsoft.com/restler/restler \
  dotnet /RESTler/restler/Restler.dll fuzz \
  --grammar_file /work/restler-output/grammar.py \
  --dictionary_file /work/restler-output/dict.json \
  --target_ip staging.yourapp.com \
  --target_port 443 \
  --time_budget 2
```

---

## CI/CD Integration

```yaml
# .github/workflows/fuzzing.yml
name: Fuzz Tests

on:
  schedule:
    - cron: '0 3 * * 2'  # Weekly Tuesday 3am
  workflow_dispatch:

jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - name: Start test server
        run: npm run start:test &
        
      - name: Run fuzz tests
        run: npm run test:fuzz
        timeout-minutes: 30
        
      - name: Upload fuzz report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: fuzz-results
          path: fuzz-results/
```

---

## Audit Checklist

- [ ] Boundary value tests for all numeric inputs (0, -1, MAX_INT, floats)
- [ ] String inputs tested with empty, very long, and special characters
- [ ] SQL injection patterns tested in all user inputs
- [ ] XSS patterns tested in all user inputs
- [ ] File upload fuzzing (wrong type, empty, oversized, malicious content)
- [ ] ReDoS check on all custom regex patterns (`safe-regex`)
- [ ] API endpoints return 4xx (not 5xx) for malformed inputs
- [ ] Error responses don't contain stack traces

---

## Learn More

- [Manual Testing Guide](./manual-testing-guide.md)
- [SAST Overview](./sast-overview.md)
- [Input Validation](../06-secure-coding/input-validation.md)
- [OWASP A03: Injection](../02-owasp/web-top10/A03-injection.md)
