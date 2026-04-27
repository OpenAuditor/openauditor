# Testing Your Authentication

Authentication is the highest-value target in any app. Test it thoroughly before shipping.

---

## Test Cases: Login

```javascript
// Using a testing framework (Jest + Supertest)
describe('Login Security', () => {
  // Rate limiting
  it('blocks after 10 failed attempts', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });
    }
    const response = await request(app).post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrongpassword' });
    expect(response.status).toBe(429);
  });

  // Consistent error messages (no user enumeration)
  it('returns same error for invalid email and wrong password', async () => {
    const invalidEmail = await request(app).post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password' });
    const wrongPassword = await request(app).post('/api/auth/login')
      .send({ email: 'real@test.com', password: 'wrongpassword' });
    
    expect(invalidEmail.body.error).toBe(wrongPassword.body.error);
  });

  // Session created on login
  it('sets HttpOnly cookie on login', async () => {
    const response = await request(app).post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'correctpassword' });
    const cookie = response.headers['set-cookie']?.[0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
  });
});
```

---

## Test Cases: Session

```javascript
describe('Session Security', () => {
  // Session invalidated on logout
  it('invalidates session after logout', async () => {
    const loginRes = await login('user@test.com', 'password');
    const sessionCookie = loginRes.headers['set-cookie'][0];
    
    // Logout
    await request(app).post('/api/auth/logout').set('Cookie', sessionCookie);
    
    // Try to use old session
    const response = await request(app).get('/api/user/me').set('Cookie', sessionCookie);
    expect(response.status).toBe(401);
  });

  // Protected routes require auth
  it('returns 401 for unauthenticated requests', async () => {
    const response = await request(app).get('/api/user/me');
    expect(response.status).toBe(401);
  });
});
```

---

## Test Cases: Password Reset

```javascript
describe('Password Reset', () => {
  // No user enumeration
  it('returns same response for registered and unregistered email', async () => {
    const registered = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'real@test.com' });
    const unregistered = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'fake@test.com' });
    
    expect(registered.status).toBe(unregistered.status);
    expect(registered.body.message).toBe(unregistered.body.message);
  });

  // Token expires
  it('reset token expires after 15 minutes', async () => {
    const token = await requestResetToken('user@test.com');
    await advanceTime(16 * 60 * 1000); // advance 16 minutes
    
    const response = await request(app).post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewPassword123!' });
    expect(response.status).toBe(400);
  });

  // Token can't be reused
  it('reset token cannot be used twice', async () => {
    const token = await requestResetToken('user@test.com');
    await request(app).post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewPassword123!' });
    
    const response = await request(app).post('/api/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword456!' });
    expect(response.status).toBe(400);
  });
});
```

---

## Test Cases: Authorisation

```javascript
describe('Authorisation', () => {
  // IDOR — can user access other user's resource?
  it('cannot access another user\'s document', async () => {
    const userA = await loginAs('userA@test.com');
    const userB = await loginAs('userB@test.com');
    const docId = await createDocument(userA.cookie);
    
    const response = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Cookie', userB.cookie);
    
    expect(response.status).toBe(404); // not 403 — don't reveal existence
  });

  // Admin endpoint protection
  it('regular user cannot access admin endpoints', async () => {
    const user = await loginAs('user@test.com');
    const response = await request(app)
      .get('/api/admin/users')
      .set('Cookie', user.cookie);
    expect(response.status).toBe(403);
  });
});
```

---

## Manual Checks (Can't Easily Automate)

- [ ] Intercept login request with Burp/ZAP — can you replay it? (Should fail if CSRF-protected)
- [ ] Copy auth cookie from browser to curl — does it authenticate? (It should until logout)
- [ ] Use an expired JWT — does the server reject it?
- [ ] Decode the JWT (jwt.io) — does the payload contain sensitive data?
- [ ] Check cookie flags in browser DevTools — are HttpOnly and Secure set?

---

## Learn More

- [Auth Best Practices](../06-secure-coding/auth-best-practices.md)
- [OWASP A07: Auth Failures](../02-owasp/web-top10/A07-auth-failures.md)
