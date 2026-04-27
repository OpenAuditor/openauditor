# Security Checklists

Production-ready checklists for application security at every stage of the software lifecycle. Each checklist is designed to be actionable, specific, and grounded in real-world breach scenarios.

## Available Checklists

### [pre-launch-checklist.md](./pre-launch-checklist.md)
**Comprehensive security review before production deployment**
- 50+ security items organized by category
- Must-do, should-do, and nice-to-do items
- Covers authentication, data protection, infrastructure, monitoring
- Estimated completion: 4-6 hours per team
- Best for: Final QA before going live

### [mvp-security-checklist.md](./mvp-security-checklist.md)
**Lean security checklist for MVP launches**
- 25 critical security items
- Focus on highest-impact vulnerabilities
- Estimated completion: 1-2 hours
- Best for: Rapid MVP releases, startup environments

### [production-hardening.md](./production-hardening.md)
**Post-launch hardening and ongoing security**
- Hardening strategies for production systems
- Monitoring and incident response setup
- Compliance considerations
- Best for: Weeks/months after launch, sustained operation

### [incident-response-runbook.md](./incident-response-runbook.md)
**Step-by-step incident response procedures**
- Immediate actions (0-30 minutes)
- Investigation and containment (30 minutes - 4 hours)
- Recovery and post-incident (4+ hours)
- Communication templates
- Best for: When security incidents occur

## How to Use These Checklists

### Before Launch
1. Start with **mvp-security-checklist.md** for basic coverage
2. Upgrade to **pre-launch-checklist.md** for comprehensive review
3. Document any exceptions and get stakeholder sign-off
4. Brief the team on findings before deployment

### During Operation
1. Use **production-hardening.md** for continuous improvement
2. Schedule monthly reviews to keep items fresh
3. Run **mvp-security-checklist.md** monthly as a quick health check

### During Incidents
1. Reference **incident-response-runbook.md** for structured response
2. Follow the timeline carefully (immediate → investigation → recovery)
3. Document decisions and actions taken
4. Conduct post-incident review

## Checklist Format

Each checklist uses a simple format:

```
[ ] Item description
    - Rationale or requirement
    - Example if needed
```

**Status legend:**
- `[ ]` Not done
- `[x]` Completed
- `[-]` Blocked/waived (with documented reason)
- `[?]` In progress / verification needed

## Real Breach Examples

These checklists reference lessons from real breaches:
- **Equifax (2017)**: Failure to patch known vulnerability → Always patch promptly
- **Capital One (2019)**: Misconfigured cloud storage → Always verify cloud permissions
- **Twitch (2021)**: Exposed OAuth tokens in logs → Never log credentials
- **Okta (2023)**: Compromised support system → Isolate admin systems, use separate credentials

## Integration with DevOps/CI-CD

### Automation Opportunities
- **Docker image scanning**: Pre-build container security checks
- **Dependency auditing**: `npm audit`, `pip audit`, `cargo audit` in CI
- **SAST/DAST**: Run static/dynamic analysis on every push
- **Secrets scanning**: Detect hardcoded credentials before commit
- **Infrastructure scanning**: Verify cloud permissions, firewall rules

### Version Control
Track checklist completion:
```bash
# Before deployment, document completion
echo "security_review_passed=true" >> deployment.log
echo "checklist_date=$(date)" >> deployment.log
```

## Compliance Mappings

These checklists align with common compliance frameworks:

| Item | OWASP Top 10 | NIST CSF | ISO 27001 | SOC 2 |
|------|--------------|----------|-----------|--------|
| Input validation | A1 | ID, DE | 14.2 | CC6.1 |
| Strong auth | A7 | PR | 9.2 | CC6.1 |
| Encryption in transit | A2 | PR | 10.1.1 | CC6.1 |
| Access control | A5 | PR | 9.4 | CC6.2 |
| Logging/monitoring | N/A | DE | 12.4 | CC7.2 |

## Maintenance

- **Review quarterly**: Update checklists as new vulnerabilities emerge
- **Track metrics**: Monitor time to remediate, acceptance rate
- **Gather feedback**: Ask teams what's missing or overly complex
- **Archive versions**: Keep historical versions for audit trails

## Quick Reference

### Most Common Failures (Fix These First)
1. **Missing HTTPS/TLS** → Implement site-wide HTTPS
2. **Weak or missing authentication** → Require strong passwords, 2FA
3. **Unencrypted sensitive data** → Encrypt DB, apply field-level encryption
4. **Exposed secrets in code/logs** → Scan repo history, remove all credentials
5. **Missing access control** → Verify permissions on all sensitive operations
6. **Unpatched dependencies** → Update all libraries, automate scanning
7. **Misconfigured cloud storage** → Block public access, verify IAM roles
8. **No monitoring/alerting** → Implement centralized logging and alerting
9. **Inadequate backups** → Test restore procedures regularly
10. **Missing disaster recovery plan** → Document RTO/RPO, test failover

## Resources

- [OWASP Top 10 2024](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [AWS Security Checklist](https://aws.amazon.com/security/security-checklists/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [SANS Security Awareness](https://www.sans.org/security-awareness-training/)

---

**Last updated**: 2026-04-25  
**Maintained by**: Security team  
**Review cycle**: Quarterly
