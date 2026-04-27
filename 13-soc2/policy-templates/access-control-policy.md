# Access Control Policy

**Version:** 1.0  
**Effective Date:** [DATE]  
**Owner:** [Name/Role]  
**Review Schedule:** Annual

---

> **Instructions:** Replace all `[PLACEHOLDER]` text before finalising. This template covers SOC 2 Trust Service Criteria CC6.1 through CC6.7.

---

## 1. Purpose

This policy establishes requirements for controlling access to [COMPANY NAME]'s systems, networks, and data. It ensures that access to information assets is appropriately restricted to authorised users with a legitimate business need.

## 2. Scope

This policy applies to:
- All employees, contractors, and third-party service providers of [COMPANY NAME]
- All systems, applications, and data owned or operated by [COMPANY NAME]
- All environments: production, staging, and development

## 3. Principles

### 3.1 Least Privilege

Users are granted the minimum access required to perform their job functions. Privileged access (administrative, root, or superuser) is restricted to personnel with a specific operational need.

### 3.2 Need to Know

Access to sensitive data is granted only when there is a documented business requirement.

### 3.3 Separation of Duties

Critical functions are divided between multiple individuals where practicable to reduce the risk of error or fraud.

## 4. User Access Management

### 4.1 Provisioning (Joiners)

When a new employee or contractor joins:

1. Hiring manager submits access request via [TICKET SYSTEM / PROCESS] specifying:
   - Required systems and access levels
   - Business justification
   - Duration (for contractors)

2. Access is provisioned by [IT ADMIN / SECURITY TEAM] within [X] business days

3. Default access packages by role:
   - Engineers: GitHub, AWS Console (read-only), Datadog, Slack, Google Workspace
   - Customer Success: CRM, Support tools, Slack, Google Workspace
   - Finance: Accounting systems, Stripe dashboard (read-only), Google Workspace
   - All roles: Password manager, MFA-protected SSO

4. Access is documented in the Access Register maintained by [OWNER]

### 4.2 Changes (Movers)

When an employee changes role:

1. Manager notifies [IT ADMIN] of role change within [X] business days
2. Unnecessary access from previous role is revoked
3. New access appropriate to new role is provisioned
4. Changes are documented in the Access Register

### 4.3 Deprovisioning (Leavers)

When an employee or contractor leaves:

1. HR notifies [IT ADMIN] on the last day of employment (or earlier for involuntary terminations)
2. All access is revoked within [4 hours / same business day] of termination
3. Accounts are deactivated (not deleted) to preserve audit trail
4. Company devices are returned and wiped
5. Shared credentials the departing user had access to are rotated
6. Deprovisioning is documented in the Access Register

**For involuntary terminations:** Access is revoked before the employee is notified.

### 4.4 Access Reviews

- **Quarterly:** All active user accounts reviewed against current employee list; excess access removed
- **Annual:** Comprehensive review of all access permissions by system owners
- **Trigger-based:** Review whenever an employee changes role or leaves

Access review records are retained for [X] months.

## 5. Authentication Requirements

### 5.1 Multi-Factor Authentication (MFA)

MFA is required for:
- All production system access
- All cloud provider consoles (AWS, GCP, Azure)
- All company SaaS applications accessed via SSO
- VPN access (if applicable)
- Admin/privileged accounts: hardware security keys preferred

Accepted MFA methods (in order of preference):
1. Hardware security key (FIDO2/WebAuthn)
2. TOTP authenticator application (Google Authenticator, Authy)
3. SMS — discouraged, only for systems that do not support above

### 5.2 Password Requirements

- Minimum length: 16 characters (enforced via password manager)
- All employees must use the company-approved password manager: [PASSWORD MANAGER]
- Unique passwords for every account — no password reuse
- Passwords are never shared between individuals
- Service account passwords are rotated at least annually

### 5.3 Single Sign-On (SSO)

All company applications are configured to authenticate via [OKTA / GOOGLE / OTHER SSO PROVIDER] where technically possible. New SaaS tools must support SSO before procurement approval.

## 6. Privileged Access

### 6.1 Production Access

- Production access requires approval from [ROLE/TEAM]
- Production database access requires documented business justification
- Production access is logged and reviewed [monthly/quarterly]
- Direct database queries in production require a second engineer to review

### 6.2 Administrative Accounts

- Admin accounts are separate from day-to-day user accounts where possible
- Admin accounts use MFA (hardware key preferred)
- Admin credentials are stored in the company password manager
- Admin actions are logged via CloudTrail, audit logs, or equivalent

### 6.3 Service Accounts

- Service accounts have only the permissions required for their function
- Service account credentials are stored in [SECRET MANAGER: AWS Secrets Manager / HashiCorp Vault / etc.]
- Service accounts are reviewed and rotated annually
- Unused service accounts are deactivated

## 7. Remote Access

- Remote work is permitted for all roles using company-issued or approved devices
- Remote access to internal systems uses [VPN / Zero Trust solution]
- Employees must use secure, password-protected Wi-Fi networks
- Public Wi-Fi requires VPN usage

## 8. Third-Party and Vendor Access

- Vendor access is time-limited and scoped to specific systems required
- Third-party access is revoked immediately upon contract termination
- Vendors sign the [VENDOR ACCESS AGREEMENT] before receiving access
- Third-party access is logged and included in quarterly access reviews

## 9. Monitoring and Enforcement

- Access logs are retained for [12] months
- Failed login attempts trigger alerts after [5] consecutive failures
- Unusual access patterns are investigated within [24] hours
- Policy violations are reported to [SECURITY/PEOPLE OPS] for disciplinary action

## 10. Exceptions

Requests to deviate from this policy must be:
1. Submitted to [SECURITY TEAM] with documented business justification
2. Approved by [CISO / CTO]
3. Documented with an expiry date (maximum 90 days)
4. Reviewed monthly during the exception period

## 11. Responsibilities

| Role | Responsibility |
|------|---------------|
| All employees | Comply with this policy; report access violations |
| Managers | Promptly notify IT of team changes; approve access requests |
| IT/Security | Provision and deprovision access; maintain Access Register; conduct reviews |
| CISO/CTO | Policy ownership; approve exceptions; annual review |

## 12. Policy Review

This policy is reviewed annually by [OWNER] and updated to reflect changes in technology, organisational structure, or regulatory requirements.

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [DATE] | [NAME] | Initial version |
