# Data Minimisation

Collect only the personal data you actually need. Every extra field is a GDPR liability and a security risk.

---

## The Principle

GDPR Article 5(1)(c): Personal data must be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed."

In plain English: if you don't need it, don't collect it.

---

## Why This Matters

- **Security:** Every field you collect is a field that can be breached
- **Compliance:** Unnecessary data is a GDPR violation
- **Trust:** Users appreciate restraint
- **Cost:** Storing less data costs less

---

## Common Over-Collection Patterns

```javascript
// WRONG — collecting date of birth when you only need age verification
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  dateOfBirth: z.string(), // full DOB stored — usually unnecessary
  phone: z.string(),       // only needed if you use SMS
  address: z.string(),     // only needed if you ship physical goods
  nationality: z.string(), // rarely needed for software products
});

// RIGHT — collect what you actually use
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  isOver18: z.boolean(), // if you just need age verification
});
```

---

## Data Inventory Audit

Before collecting any data field, ask:
1. **What do we use this for?**
2. **What breaks if we don't have it?**
3. **Could we achieve the same with less data?**

```
| Field | Purpose | Currently Used? | Can Remove? |
|-------|---------|----------------|-------------|
| Email | Auth, notifications | Yes | No |
| Phone | Was for SMS — disabled | No | Yes — delete existing |
| Company name | Analytics segment | Used in 1 report | Consider anon aggregate |
| Date of birth | Age check at signup | One-time check | Yes — don't store |
```

---

## Retention Periods

Don't keep data forever. Define and enforce retention periods:

```javascript
// Automated data cleanup job
// Run daily via cron or scheduled function

async function enforceRetentionPolicies() {
  const cutoffs = {
    auditLogs: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),     // 90 days
    anonymousSessionData: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
    deletedUserData: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days after deletion
  };
  
  await db.auditLogs.deleteMany({ where: { createdAt: { lt: cutoffs.auditLogs } } });
  await db.sessions.deleteMany({ 
    where: { userId: null, createdAt: { lt: cutoffs.anonymousSessionData } }
  });
}
```

---

## Checklist

- [ ] Data inventory exists (what you collect, why, how long)
- [ ] Every data field has a documented purpose
- [ ] Fields not actively used have been removed or anonymised
- [ ] Retention periods defined for every data type
- [ ] Automated retention enforcement in place
- [ ] No "collect now, might be useful later" data

---

## Learn More

- [UK GDPR for Founders](./uk-gdpr-for-founders.md)
- [Right to Erasure](./right-to-erasure.md)
