# OAuth 2.0 Deep Dive

OAuth 2.0 lets users authorise your app to access their data on another service. Implemented incorrectly, it hands attackers a direct path into your users' accounts.

---

## The Right Flow: Authorisation Code + PKCE

Never use the Implicit Flow. Use the Authorisation Code flow with PKCE (Proof Key for Code Exchange) for all public clients (SPAs, mobile apps).

```
1. User clicks "Sign in with Google"
2. Your app generates a code_verifier (random string) and code_challenge (hash of verifier)
3. Redirect to auth provider with code_challenge
4. User authenticates at provider
5. Provider redirects back with an authorization_code
6. Your app exchanges code + code_verifier for tokens
7. You receive access_token and id_token
```

### Implementation with NextAuth.js (Recommended)

```javascript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.userId = token.sub;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

NextAuth handles PKCE, state parameter, and token storage automatically.

---

## The State Parameter (CSRF Protection)

> **Critical:** Always validate the `state` parameter. Without it, your OAuth flow is vulnerable to CSRF — attackers can force users to link their account to the attacker's identity.

```javascript
// 1. Generate state before redirect
const state = crypto.randomBytes(32).toString('hex');
req.session.oauthState = state;

// 2. Include in redirect URL
const authUrl = `https://accounts.google.com/o/oauth2/auth?
  client_id=${CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  response_type=code&
  scope=openid+email&
  state=${state}`;

// 3. Validate on callback
app.get('/callback', async (req, res) => {
  if (req.query.state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state — possible CSRF attack' });
  }
  // proceed with token exchange
});
```

---

## Token Storage

| Token | Store In | Don't Store In |
|-------|----------|----------------|
| Access token (short-lived) | Memory / HttpOnly cookie | localStorage |
| Refresh token | HttpOnly cookie / server DB | localStorage, sessionStorage |
| ID token | Memory for claims extraction | localStorage |

```javascript
// Set tokens as HttpOnly cookies (not in localStorage)
res.setHeader('Set-Cookie', [
  serialize('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  }),
  serialize('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/api/auth/refresh', // restrict to refresh endpoint only
  }),
]);
```

---

## Validating ID Tokens

```javascript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid token');
  
  // Verify email is verified
  if (!payload.email_verified) {
    throw new Error('Email not verified');
  }
  
  return {
    userId: payload.sub,
    email: payload.email!,
    name: payload.name,
  };
}
```

---

## Common OAuth Mistakes

```javascript
// WRONG — using implicit flow (tokens in URL fragment)
const authUrl = `...&response_type=token`; // token in URL = visible in logs

// RIGHT — authorisation code flow
const authUrl = `...&response_type=code`;

// WRONG — skipping state validation
app.get('/callback', async (req, res) => {
  const { code } = req.query; // no state check!
  ...
});

// WRONG — storing access token in localStorage
localStorage.setItem('access_token', token); // XSS steals this

// WRONG — not validating the audience in ID token
jwt.decode(idToken); // decode only, no signature verification!

// RIGHT — always verify
jwt.verify(idToken, PUBLIC_KEY, { audience: CLIENT_ID });
```

---

## Checklist

- [ ] Using Authorisation Code + PKCE flow (not Implicit)
- [ ] `state` parameter generated, stored, and validated
- [ ] Tokens stored in HttpOnly cookies, not localStorage
- [ ] ID tokens validated server-side with audience check
- [ ] Redirect URIs explicitly allowlisted in auth provider dashboard
- [ ] Token refresh handled server-side
- [ ] Logout revokes tokens at the provider

---

## Learn More

- [Auth Best Practices](./auth-best-practices.md)
- [OWASP A07: Auth Failures](../02-owasp/web-top10/A07-auth-failures.md)
