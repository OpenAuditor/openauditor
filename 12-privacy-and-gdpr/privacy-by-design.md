# Privacy by Design

Building privacy in from the start is far cheaper and more effective than bolting it on later.

---

## The Principle

GDPR Article 25 requires privacy by design and by default:
- Privacy must be considered from the first design decision
- Default settings must be the most privacy-protective option
- Data collection must be minimised by default

---

## Privacy by Default

The most privacy-protective option should be the default.

```javascript
// WRONG — public profile by default, users must opt out
const newUser = {
  email,
  profileVisibility: 'public',    // default is maximum exposure
  shareDataWithPartners: true,    // opt-out required
  analyticsOptIn: true,           // auto-enrolled
};

// RIGHT — private by default, users opt in
const newUser = {
  email,
  profileVisibility: 'private',   // default is minimum exposure
  shareDataWithPartners: false,   // explicit opt-in required
  analyticsOptIn: false,          // user must choose
};
```

---

## Privacy in Architecture Decisions

Consider privacy at every architectural decision:

| Decision | Privacy-Invasive Choice | Privacy-Respecting Choice |
|---------|------------------------|--------------------------|
| Analytics | Google Analytics (cross-site tracking) | Plausible (no cookies) |
| Error monitoring | Full request/response logging | Sanitised error logging only |
| User IDs | Sequential integers | UUIDs (harder to enumerate) |
| Logs | Log full request with user data | Log minimal identifiers |
| Search | Log all search queries | Aggregate/anonymise search logs |

---

## Data Lifecycle Planning

Before building any feature, answer:
1. **What data does this feature collect?**
2. **Why do we need it?**
3. **How long do we keep it?**
4. **Who can see it?**
5. **What happens when a user deletes their account?**

Document answers before writing code, not after.

---

## Pseudonymisation

Replace identifying data with pseudonyms to reduce risk:

```javascript
// Instead of logging user emails, log anonymised IDs
const pseudoId = crypto
  .createHash('sha256')
  .update(user.email + process.env.PSEUDO_SALT)
  .digest('hex')
  .slice(0, 16);

console.log({ event: 'login', userId: pseudoId }); // not the real email
```

---

## Privacy Impact Assessment (PIA)

For high-risk processing (large-scale, sensitive data, new technology), conduct a PIA:

1. Describe the processing
2. Assess the necessity and proportionality
3. Identify and mitigate privacy risks
4. Document decisions

Required under GDPR Article 35 for high-risk processing. Recommended for any new sensitive feature.

---

## Checklist

- [ ] Privacy considered in feature design (not retrofitted)
- [ ] Most privacy-protective defaults used throughout
- [ ] Data lifecycle documented for every feature
- [ ] Retention periods enforced automatically
- [ ] Sensitive features have documented risk assessment
- [ ] Third-party services evaluated for privacy impact before adoption

---

## Learn More

- [Data Minimisation](./data-minimisation.md)
- [UK GDPR for Founders](./uk-gdpr-for-founders.md)
