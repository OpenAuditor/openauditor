# OWASP API Security Top 10 — 2023

## What this section covers

The OWASP API Security Top 10 (2023 edition) identifies the most critical security risks specific to APIs. Unlike the Web Top 10, this list focuses on how APIs are uniquely attacked — through object references, function-level access, excessive data exposure, and abuse of business logic.

APIs are the backbone of modern applications. A vulnerable API can expose millions of records, allow account takeovers, or let attackers trigger financial transactions without authorisation. The 2023 list was a significant update from 2019, reflecting real-world attack patterns collected from the security community.

## The 10 risks

| # | Risk | Short description |
|---|------|-------------------|
| API1 | [Broken Object Level Authorisation](./API1-broken-object-level-auth.md) | Accessing other users' objects via manipulated IDs |
| API2 | [Broken Authentication](./API2-broken-authentication.md) | Weak tokens, missing auth, credential stuffing |
| API3 | [Broken Object Property Level Authorisation](./API3-broken-object-property-level-auth.md) | Over-exposing or allowing writes to sensitive fields |
| API4 | [Unrestricted Resource Consumption](./API4-unrestricted-resource-consumption.md) | No rate limits, unbounded queries, cost abuse |
| API5 | [Broken Function Level Authorisation](./API5-broken-function-level-auth.md) | Admin-only endpoints reachable by regular users |
| API6 | [Unrestricted Access to Sensitive Business Flows](./API6-unrestricted-access-to-sensitive-flows.md) | Automated abuse of checkout, login, sign-up flows |
| API7 | [Server Side Request Forgery](./API7-server-side-request-forgery.md) | Attacker-controlled URLs fetched by the server |
| API8 | [Security Misconfiguration](./API8-security-misconfiguration.md) | Default configs, verbose errors, open CORS |
| API9 | [Improper Inventory Management](./API9-improper-inventory-management.md) | Undocumented, shadow, or deprecated API versions |
| API10 | [Unsafe Consumption of APIs](./API10-unsafe-consumption-of-apis.md) | Blindly trusting third-party API responses |

## How to use this section

- Read each file before auditing an API endpoint or service.
- Use the detection checklists during code review pull requests.
- Pair with the [audit prompt](../prompts/api-top10-audit.md) when running an automated agent review.
- Reference the testing strategies in penetration testing engagements.

## Source material

- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [OWASP API Security Top 10 2023 — GitHub](https://github.com/OWASP/API-Security/tree/master/editions/2023.0.1/en)
