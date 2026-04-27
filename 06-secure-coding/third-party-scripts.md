# Third-Party Scripts and Integrations

Every external script you load is code you haven't audited running on your users' browsers with full access to their session, keystrokes, and DOM.

---

## The Risk

Third-party scripts can:
- Steal session cookies (if not HttpOnly)
- Keylog form inputs (including passwords and credit cards)
- Redirect users to phishing pages
- Exfiltrate data to attacker-controlled servers
- Load additional malicious scripts

The 2018 British Airways breach was caused by a compromised Modernizr library. Attackers injected 22 lines of JavaScript that skimmed 500,000 customers' credit card details in real time.

---

## Subresource Integrity (SRI)

SRI ensures loaded scripts haven't been tampered with.

```html
<!-- Generate hash: openssl dgst -sha384 -binary script.js | openssl base64 -A -->
<script
  src="https://cdn.example.com/library.min.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGAGq7v0uF55DUAMmFrKU"
  crossorigin="anonymous"
></script>
```

SRI doesn't work for dynamically loaded scripts or scripts loaded by other scripts. Use CSP to mitigate the rest.

---

## Minimal Permissions

```javascript
// Analytics — use privacy-friendly, minimal scripts
// Plausible and Fathom load no third-party code
<script defer data-domain="yourapp.com" src="https://plausible.io/js/script.js"></script>

// For Google Analytics 4 — use server-side tracking instead
// Send events from your server, not from the browser
fetch('https://www.google-analytics.com/mp/collect?...', {
  method: 'POST',
  body: JSON.stringify({ events: [...] }),
});
```

---

## Load Scripts Safely

```html
<!-- Load late in body, not in <head> -->
<!-- Use defer or async -->
<script defer src="https://trusted-cdn.com/widget.js"></script>

<!-- Never use document.write() for loading scripts -->
<!-- It can be exploited via XSS -->
```

---

## Vetting a Third-Party Script

Before adding any external script:

1. **Who owns it?** Company or individual? Reputable?
2. **When was it last updated?** Unmaintained scripts are risk
3. **What does it request?** Check network tab — what does it load or send?
4. **Is the CDN trustworthy?** Major CDNs (Cloudflare, jsDelivr) > unknown hosts
5. **Does it self-update?** Auto-updating scripts bypass SRI

---

## CSP as Backstop

```javascript
// Content Security Policy restricts what scripts can load and where they can send data
"Content-Security-Policy": 
  "script-src 'self' https://plausible.io https://js.stripe.com; " +
  "connect-src 'self' https://api.stripe.com https://plausible.io; " +
  "frame-src https://js.stripe.com"
```

---

## Checklist

- [ ] Every third-party script vetted before adding
- [ ] SRI hashes added to CDN-loaded scripts
- [ ] CSP restricts which domains can load scripts
- [ ] Minimal set of third-party scripts (remove what you don't use)
- [ ] Scripts loaded with `defer` or `async`
- [ ] No `document.write()` for loading scripts
- [ ] Regular audit of loaded scripts vs what's needed

---

## Learn More

- [CORS and Security Headers](./cors-csp-headers.md)
- [Supply Chain Security](../05-supply-chain-security/)
