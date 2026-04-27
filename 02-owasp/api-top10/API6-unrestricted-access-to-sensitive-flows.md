# API6 — Unrestricted Access to Sensitive Business Flows

## 30-second summary

Some API flows are technically correct but dangerous when automated at scale. Attackers exploit the absence of bot detection, CAPTCHA, or flow-rate limits to abuse business logic — scalping limited inventory, farming referral bonuses, bypassing waiting lists, or systematically testing stolen payment cards.

> **Critical:** Business flow abuse does not trigger traditional security scanners. The requests are valid, authenticated, and well-formed. You need behavioural controls, not just input validation.

---

## Vulnerable code example

```typescript
// Express.js — VULNERABLE
// A limited-edition product checkout flow with no flow controls

app.post('/api/checkout', authenticate, async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await db.getProduct(productId);
  if (!product || product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  // No check: has this user already bought this limited item?
  // No check: is this user purchasing from a bot?
  // No check: how many times has this user hit checkout today?

  await db.decrementStock(productId, quantity);
  const order = await db.createOrder(req.user.id, productId, quantity);

  return res.json({ orderId: order.id });
});

// Referral bonus — no rate limiting or uniqueness check
app.post('/api/referrals/claim', authenticate, async (req, res) => {
  const { referralCode } = req.body;

  const referral = await db.getReferral(referralCode);
  if (!referral) return res.status(400).json({ error: 'Invalid code' });

  // Attacker creates 1000 accounts, each claims the same person's referral
  await db.creditUser(req.user.id, referral.bonusAmount);
  return res.json({ credited: referral.bonusAmount });
});
```

---

## Fixed code example

```typescript
// Express.js — FIXED

import { Redis } from 'ioredis';
const redis = new Redis();

async function flowRateLimit(
  key: string,
  maxPerWindow: number,
  windowSeconds: number
): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= maxPerWindow;
}

app.post('/api/checkout', authenticate, async (req, res) => {
  const { productId, quantity } = req.body;

  // 1. Per-user checkout rate limit for limited items
  const checkoutKey = `checkout:${req.user.id}:${productId}`;
  const allowed = await flowRateLimit(checkoutKey, 1, 3600); // 1 per hour per product
  if (!allowed) {
    return res.status(429).json({ error: 'Purchase limit reached for this item' });
  }

  // 2. One purchase per user per limited product (database constraint)
  const existing = await db.query(
    'SELECT id FROM orders WHERE user_id = $1 AND product_id = $2 AND status != $3',
    [req.user.id, productId, 'cancelled']
  );
  if (existing) {
    return res.status(400).json({ error: 'You have already purchased this item' });
  }

  // 3. CAPTCHA token validation for high-value purchases
  const product = await db.getProduct(productId);
  if (product.isLimited && req.body.captchaToken) {
    const captchaValid = await verifyCaptcha(req.body.captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
  }

  // 4. Stock check and decrement atomically
  const updated = await db.query(
    'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
    [quantity, productId]
  );
  if (!updated) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  const order = await db.createOrder(req.user.id, productId, quantity);
  return res.json({ orderId: order.id });
});

app.post('/api/referrals/claim', authenticate, async (req, res) => {
  const { referralCode } = req.body;

  const referral = await db.getReferral(referralCode);
  if (!referral) return res.status(400).json({ error: 'Invalid code' });

  // Prevent self-referral
  if (referral.ownerId === req.user.id) {
    return res.status(400).json({ error: 'Cannot use your own referral code' });
  }

  // Check user hasn't already claimed any referral bonus (one per account)
  const alreadyClaimed = await db.query(
    'SELECT id FROM referral_claims WHERE claimant_id = $1',
    [req.user.id]
  );
  if (alreadyClaimed) {
    return res.status(400).json({ error: 'Referral bonus already claimed' });
  }

  await db.transaction(async (trx) => {
    await trx.creditUser(req.user.id, referral.bonusAmount);
    await trx.creditUser(referral.ownerId, referral.referrerBonus);
    await trx.markReferralClaimed(referralCode, req.user.id);
  });

  return res.json({ credited: referral.bonusAmount });
});
```

---

## Real-world breach scenario

**Nike SNKRS / limited trainer drops (2019–present):** Botnet operators have repeatedly purchased entire allocations of limited-edition trainers within seconds of release. The bots authenticate as real users (using accounts created and aged in advance), pass through the checkout flow correctly, and complete purchases before human buyers can even load the page. Nike and other retailers have invested heavily in bot fingerprinting and device attestation to combat this, but the problem persists.

**Revolut referral fraud (reported 2023):** Multiple fintech platforms have experienced organised fraud rings that create thousands of accounts, refer each other, and collect sign-up bonuses. Each individual transaction is valid; the abuse is only visible through behavioural pattern analysis across accounts.

---

## Detection checklist

- [ ] Limited-availability flows (drops, flash sales, waiting lists) have per-user purchase limits enforced server-side.
- [ ] Referral and bonus flows have one-per-account limits with self-referral prevention.
- [ ] Sensitive flows include behavioural signals (velocity, device fingerprint, account age).
- [ ] CAPTCHA or proof-of-work is required for high-value automated flows.
- [ ] Stock decrements are atomic operations (compare-and-set or database transaction) to prevent race conditions.
- [ ] Abuse patterns (high velocity, multiple accounts per IP, similar device fingerprints) trigger alerts or manual review queues.
- [ ] Business logic rules are implemented server-side, not client-side.

---

## Testing strategy

**Race condition / concurrent checkout test:**
```python
import asyncio, aiohttp

async def checkout(session, product_id):
    async with session.post(
        'https://api.example.com/api/checkout',
        json={'productId': product_id, 'quantity': 1},
        headers={'Authorization': f'Bearer {TOKEN}'}
    ) as resp:
        return resp.status, await resp.json()

async def test_race():
    async with aiohttp.ClientSession() as session:
        # Fire 10 concurrent requests for a 1-stock item
        tasks = [checkout(session, 'limited-item-1') for _ in range(10)]
        results = await asyncio.gather(*tasks)
        successes = [r for r in results if r[0] == 200]
        print(f"Successful purchases: {len(successes)}")
        # Should be exactly 1; more than 1 = race condition vulnerability

asyncio.run(test_race())
```

**Referral multi-claim test:**
1. Create two test accounts.
2. Claim a referral code from one account.
3. Attempt to claim it again from the same account, and from a second account with the same device/IP.

---

## Why this matters

Business flow abuse is the hardest category to detect because the requests look completely legitimate. Every individual request is authenticated, well-formed, and compliant with the API schema. The vulnerability exists in the business logic, not the request structure.

The financial damage can far exceed traditional security incidents. A botnet buying out a product launch, farming thousands of referral bonuses, or repeatedly charging stolen payment cards can cause direct revenue loss, inventory problems, and regulatory exposure — all without a single malformed request.

Traditional security tooling (WAF, schema validation, input sanitisation) provides no protection against this category of attack.
