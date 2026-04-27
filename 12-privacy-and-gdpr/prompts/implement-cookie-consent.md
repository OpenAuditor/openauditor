# Prompt: Implement Cookie Consent

## When to use this

Use this before launch if you set any non-essential cookies (analytics, marketing, tracking pixels), or when a privacy audit reveals you need proper consent mechanisms for UK/EU GDPR compliance.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a privacy engineer implementing GDPR-compliant cookie consent for a web application. Your goal: lawful consent collection that doesn't impede user experience more than necessary.

**Step 1: Audit current cookies**

Identify all cookies and tracking technologies in use:

```bash
# Check for common analytics/tracking scripts
grep -r "gtag\|ga4\|analytics\|pixel\|hotjar\|clarity\|mixpanel\|segment\|intercom\|crisp" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | \
  grep -v node_modules

# Check for cookie-setting code
grep -r "document.cookie\|setCookie\|res.cookie\|set-cookie" \
  --include="*.ts" --include="*.tsx" --include="*.js" . | \
  grep -v node_modules

# Check _app.tsx or layout.tsx for tracking scripts
cat app/layout.tsx 2>/dev/null || cat pages/_app.tsx 2>/dev/null
```

Classify each cookie/tracker:
- **Strictly necessary:** Authentication sessions, CSRF tokens, shopping cart — NO consent required
- **Functional:** Remembering preferences (language, theme) — consent recommended
- **Analytics:** Google Analytics, Hotjar, Plausible — consent required under UK GDPR
- **Marketing:** Facebook Pixel, Google Ads, Intercom — consent required

**Step 2: Implement consent storage**

Create a consent management system:

```typescript
// lib/consent.ts
export type ConsentCategories = {
  necessary: true; // Always true — cannot be declined
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_VERSION = '1'; // Increment when you add new cookie categories

export function getConsent(): ConsentCategories | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
      ?.split('=')[1];
    
    if (!value) return null;
    
    const parsed = JSON.parse(decodeURIComponent(value));
    
    // Version mismatch — need new consent
    if (parsed.version !== CONSENT_VERSION) return null;
    
    return parsed.categories;
  } catch {
    return null;
  }
}

export function setConsent(categories: Omit<ConsentCategories, 'necessary'>): void {
  const consent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  };
  
  const value = encodeURIComponent(JSON.stringify(consent));
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export function hasConsent(category: keyof ConsentCategories): boolean {
  const consent = getConsent();
  if (!consent) return category === 'necessary';
  return consent[category] ?? false;
}
```

**Step 3: Build the consent banner component**

```tsx
// components/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { getConsent, setConsent, hasConsent } from '@/lib/consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Show banner if no consent recorded yet
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    setConsent({ functional: true, analytics: true, marketing: true });
    setVisible(false);
    // Load scripts for all categories
    loadAnalytics();
    loadMarketing();
  };

  const rejectAll = () => {
    setConsent({ functional: false, analytics: false, marketing: false });
    setVisible(false);
  };

  const savePreferences = () => {
    setConsent(preferences);
    setVisible(false);
    if (preferences.analytics) loadAnalytics();
    if (preferences.marketing) loadMarketing();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-6"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Cookie settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          We use cookies to improve your experience. Some are essential for the site to work;
          others help us understand how you use it. You can choose which to allow.
          See our{' '}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>{' '}
          for details.
        </p>

        {!showDetails ? (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Accept all
            </button>
            <button
              onClick={rejectAll}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Reject non-essential
            </button>
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 text-blue-600 underline"
            >
              Manage preferences
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Strictly necessary</strong> — Required for login and security.
                  Cannot be disabled.
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={e => setPreferences(p => ({ ...p, functional: e.target.checked }))}
                />
                <span>
                  <strong>Functional</strong> — Remember your preferences (language, theme).
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={e => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                />
                <span>
                  <strong>Analytics</strong> — Help us understand how the site is used
                  (Google Analytics, Plausible).
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={e => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                />
                <span>
                  <strong>Marketing</strong> — Personalised ads and retargeting.
                </span>
              </label>
            </div>
            <button
              onClick={savePreferences}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Conditionally load tracking scripts**

Only load analytics/marketing scripts after consent:

```typescript
// lib/scripts.ts

export function loadAnalytics() {
  if (!hasConsent('analytics')) return;
  
  // Google Analytics 4
  if (!window.gtag) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`;
    script.async = true;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
      anonymize_ip: true,
    });
  }
}

export function loadMarketing() {
  if (!hasConsent('marketing')) return;
  
  // Load Facebook Pixel, etc.
}
```

```tsx
// app/layout.tsx — DO NOT use next/script for GA4 without consent check
// Instead, load conditionally from CookieBanner after consent is granted

// Only load scripts that are strictly necessary in layout:
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieBanner />
        {/* Do NOT put GA4 Script here — wait for consent */}
      </body>
    </html>
  );
}
```

**Step 5: Add "Manage cookies" link to footer**

Users must be able to change their consent at any time:

```tsx
// components/Footer.tsx
import { useState } from 'react';

export function Footer() {
  const [showBanner, setShowBanner] = useState(false);
  
  return (
    <footer>
      <button 
        onClick={() => setShowBanner(true)}
        className="text-sm underline"
      >
        Manage cookies
      </button>
      {showBanner && <CookieBanner forceShow onClose={() => setShowBanner(false)} />}
    </footer>
  );
}
```

**Step 6: Verify compliance**

Test the implementation:
- [ ] Banner appears on first visit for new users
- [ ] Banner does NOT appear if consent already given
- [ ] "Reject all" sets only necessary cookies
- [ ] "Accept all" loads all tracking scripts
- [ ] Analytics scripts are NOT loaded before consent is given (check Network tab)
- [ ] "Manage cookies" in footer allows changing preferences
- [ ] Changing preferences takes effect immediately
- [ ] Consent cookie lasts 12 months (not more — reconsent required annually)

---

## What to expect

A complete cookie consent implementation: consent banner component, consent storage utility, conditional script loading, footer "manage cookies" link, and verification tests.

## Learn more

[Cookie Consent Guide](../cookie-consent.md)
[UK GDPR for Founders](../uk-gdpr-for-founders.md)
[ICO Cookie Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/cookies/)
