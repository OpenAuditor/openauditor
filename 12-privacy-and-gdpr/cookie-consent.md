# Cookie Consent

Not all cookies require consent. Knowing which do and which don't lets you avoid unnecessary friction while staying compliant.

---

## Cookies That Don't Require Consent

**Strictly necessary cookies** are exempt from consent requirements:
- Session authentication cookies (keeping users logged in)
- Security cookies (CSRF tokens)
- Load balancer cookies
- User preference cookies (saved language, dark mode) — debate exists here

These are "strictly necessary" for the service to function.

---

## Cookies That Require Consent

Any cookie that is not strictly necessary requires consent:
- Analytics cookies (Google Analytics, Mixpanel)
- Marketing/advertising cookies
- Social media tracking pixels (Facebook Pixel)
- Personalisation cookies

> **Note:** Even "anonymised" Google Analytics uses cookies and typically requires consent under strict GDPR interpretation (UK ICO guidance, 2023).

---

## The Easy Solution: Privacy-Friendly Analytics

Switch to an analytics tool that doesn't use cookies and requires no consent banner:

| Tool | Cookies? | Consent Required? | Cost |
|------|----------|-----------------|------|
| **Plausible** | No | No | €9/month |
| **Fathom** | No | No | $14/month |
| **Umami** | No | No | Free (self-hosted) |
| **PostHog** | Yes (session replay) | Yes for session replay | Free tier |
| **Google Analytics 4** | Yes | Yes | Free but complex |

Using Plausible or Fathom eliminates the need for a consent banner for analytics.

---

## Implementing a Consent Banner

If you use cookies that require consent:

### Simple Implementation with CookieYes or Cookiebot

```html
<!-- CookieYes - configure at cookieyes.com -->
<script id="cookieyes" type="text/javascript" 
  src="https://cdn-cookieyes.com/client_data/[your-id]/script.js">
</script>
```

### Roll Your Own (Basic)

```javascript
// Show banner if no consent decision exists
function shouldShowBanner(): boolean {
  return !localStorage.getItem('cookie-consent');
}

// Store consent decision
function setConsent(analytics: boolean, marketing: boolean): void {
  localStorage.setItem('cookie-consent', JSON.stringify({
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
  }));
  
  // Load analytics scripts only if consented
  if (analytics) loadAnalytics();
  if (marketing) loadMarketingPixels();
}

// Load scripts only after consent
function loadAnalytics(): void {
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
  document.head.appendChild(script);
}
```

### Banner Requirements

Your consent banner must:
- Be shown before setting non-essential cookies
- Have equally prominent Accept and Reject options
- Not use dark patterns (grey-out "reject", pre-check boxes)
- Record when and what the user consented to
- Allow users to withdraw consent later

```html
<!-- WRONG — dark pattern: accept is prominent, reject is hidden -->
<button class="primary-btn">Accept all cookies</button>
<small><a href="/preferences">Manage cookies</a></small>

<!-- RIGHT — both options equally prominent -->
<button onclick="setConsent(false, false)">Reject non-essential</button>
<button onclick="setConsent(true, false)">Accept analytics only</button>
<button onclick="setConsent(true, true)">Accept all</button>
```

---

## Checklist

- [ ] Audit every cookie your site sets (browser dev tools → Application → Cookies)
- [ ] Categorise each: strictly necessary vs analytics vs marketing
- [ ] If using analytics cookies: implement consent mechanism
- [ ] Consent is recorded with timestamp
- [ ] Users can withdraw consent (link in footer)
- [ ] Non-essential scripts only load after consent

---

## Learn More

- [UK GDPR for Founders](./uk-gdpr-for-founders.md)
- [Lawful Basis](./lawful-basis.md)
