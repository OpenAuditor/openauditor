# PCI DSS Basics for Developers

PCI DSS (Payment Card Industry Data Security Standard) applies to anyone who stores, processes, or transmits payment card data. The good news: if you use Stripe, most of the hard work is done for you.

---

## What PCI DSS Covers

PCI DSS has 12 requirements across areas including: network security, cardholder data protection, vulnerability management, access control, monitoring, and security policies.

Non-compliance can result in:
- Fines from card brands ($5,000–$100,000/month)
- Loss of ability to process card payments
- Mandatory forensic audits after a breach

---

## The Stripe Shortcut

If you use Stripe with Stripe.js (or Stripe Elements) and never let card data touch your servers:

1. Card data goes directly from user's browser to Stripe (not through your server)
2. Stripe is PCI DSS Level 1 certified — the highest level
3. You qualify for **SAQ A** — the simplest self-assessment questionnaire

**SAQ A requires:**
- Your payment page must be served over HTTPS
- You don't store, process, or transmit cardholder data on your systems
- You have basic security policies in place

This is achievable by any indie hacker in a day.

---

## What You Must NEVER Do

```javascript
// WRONG — accepting raw card data on your server
app.post('/checkout', (req, res) => {
  const { cardNumber, expiry, cvv } = req.body; // NEVER accept this
  // You're now in scope for full PCI DSS compliance
});

// RIGHT — Stripe handles card data, you handle the token
app.post('/checkout', async (req, res) => {
  const { paymentMethodId } = req.body; // just a token — safe
  const charge = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'gbp',
    payment_method: paymentMethodId,
    confirm: true,
  });
});
```

---

## Logging Rules

Under PCI DSS, you must never log:
- Full card numbers (truncation allowed: show last 4 only)
- CVV/CVC codes
- PINs
- Expiry dates (per some card brands)

```javascript
// WRONG — logs full card details in error messages
console.error('Payment failed:', req.body); // if body contains card data

// RIGHT — log only what's safe
console.error('Payment failed:', { userId, amount, currency, errorCode: error.code });
```

---

## SAQ Levels

| SAQ | Who It's For | Complexity |
|-----|-------------|-----------|
| SAQ A | E-commerce using hosted or redirect payment (Stripe Elements, PayPal) | Simple |
| SAQ A-EP | E-commerce with JavaScript on payment page | Moderate |
| SAQ B | Physical card terminals, no electronic storage | Moderate |
| SAQ C | Merchants with payment apps connecting to internet | Complex |
| SAQ D | Everyone else | Hardest |

If you use Stripe.js/Elements correctly: you want **SAQ A**.

---

## Checklist

- [ ] Card data never touches your servers (use Stripe.js/Elements)
- [ ] Payment pages served over HTTPS
- [ ] No card numbers in logs
- [ ] Using Stripe — review your SAQ A questionnaire yearly
- [ ] Stripe webhook signing secret validated on every webhook

---

> **Note:** This is simplified guidance. Consult a QSA (Qualified Security Assessor) for anything beyond basic SAQ A compliance.

---

## Learn More

- [Which Compliance Applies to You](./which-compliance-applies-to-you.md)
- [Secure Coding: API Security](../06-secure-coding/api-security.md)
