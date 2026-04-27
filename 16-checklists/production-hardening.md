# Production Hardening Checklist

**Post-launch hardening and ongoing security strategy**

Use this checklist weeks/months after launch to harden systems and establish continuous security practices. This is not a one-time exercise—these items should be on your roadmap for the next 3-6 months.

---

## Phase 1: Days 1-7 After Launch

### Monitoring & Incident Response
- [ ] Set up centralized logging (ELK, DataDog, Splunk, New Relic, CloudWatch)
- [ ] Configure real-time alerts for:
  - Spike in failed login attempts (>10 in 5 minutes)
  - Database connection errors
  - Unhandled exceptions (5xx errors)
  - Spike in API errors (>2% error rate)
  - Unusual payment/transaction patterns
- [ ] Document incident response procedures and ensure team is trained
- [ ] Set up on-call rotation for security/ops team
- [ ] Verify backup restoration works (test restore to separate database)

### Security Baseline
- [ ] Run vulnerability scan on infrastructure (AWS Security Hub, GCP Security Command Center)
- [ ] Verify all endpoints require authentication (no public endpoints except login/signup)
- [ ] Check HTTPS certificates are valid and will auto-renew
- [ ] Verify rate limiting is working (make test requests to trigger limits)
- [ ] Verify WAF rules are in place and blocking basic attacks

---

## Phase 2: Week 2-4 After Launch

### Enhanced Monitoring
- [ ] Implement security event monitoring:
  - Permission changes (user roles, API access)
  - Admin account activity
  - Data export requests
  - Configuration changes
  - SSH access logs (if applicable)
- [ ] Set up automated reports (daily/weekly security summary)
- [ ] Create dashboard for security metrics:
  - Failed login attempts by IP
  - API error rates by endpoint
  - Deployment frequency
  - Incident count and resolution time
- [ ] Configure log retention (minimum 90 days)
- [ ] Test log integrity (verify logs can't be modified after write)

**Example security dashboard metrics:**
| Metric | Threshold | Alert |
|--------|-----------|-------|
| Failed auth attempts/hour | >50 | Yes |
| API error rate | >1% | Yes |
| New vulnerabilities found | >0 | Yes |
| Incident resolution time | >4 hours | Review |
| Backup success rate | <95% | Yes |

### Access Control Hardening
- [ ] Review all user accounts and permissions
  - Remove inactive accounts (no login in 30+ days)
  - Verify least privilege (users have minimum necessary permissions)
  - Review admin accounts (should be rare, 1-2 per team)
- [ ] Enable MFA for all admin accounts
- [ ] Enforce strong password policy for existing users
- [ ] Implement conditional access (restrict admin access by IP/geolocation)
- [ ] Set up SSH key rotation if applicable (30-90 day rotation)

### Secrets & Credential Rotation
- [ ] Rotate all production secrets and credentials
- [ ] Verify no secrets in logs/error messages
- [ ] Implement automated secret rotation schedule (every 90 days)
- [ ] Remove old API keys and tokens (audit trail)
- [ ] Test secret rotation doesn't break application

---

## Phase 3: Month 1-3 After Launch

### Comprehensive Security Assessment
- [ ] Conduct internal security review (code, infrastructure, processes)
- [ ] Schedule professional penetration test
  - Scope: all public APIs and web interfaces
  - Budget: $5,000-$15,000 USD depending on application size
  - Timeline: 2-4 weeks
- [ ] Perform infrastructure security audit:
  - Cloud IAM roles (AWS/GCP/Azure)
  - Network ACLs and security groups
  - Load balancer configuration
  - CDN settings (caching headers, DDoS)
  - Storage bucket permissions

**Penetration testing checklist:**
- [ ] Scope and rules of engagement documented
- [ ] Test account credentials provided
- [ ] Out-of-band communication channel established
- [ ] Insurance/liability coverage confirmed
- [ ] Post-test debrief scheduled

### Incident Response Drills
- [ ] Conduct tabletop exercise (1-2 hours):
  - Scenario: Data breach discovered
  - Participants: Security, Ops, Legal, Product
  - Focus: Communication, escalation, decision-making
- [ ] Test backup restoration procedure:
  - Restore to new environment
  - Verify data integrity
  - Measure RTO (recovery time)
- [ ] Test incident communication plan:
  - Who gets notified when
  - What gets communicated
  - External communication (customers, regulators)

### Dependency & Vulnerability Management
- [ ] Review all dependencies for security issues
  - Automate with: Dependabot, Renovate, Snyk
  - Set up automated PRs for security patches
  - Approve and merge within 48 hours
- [ ] Implement SBOM (Software Bill of Materials)
  - List of all components, versions, licenses
  - Tools: SPDX, CycloneDX
- [ ] Schedule quarterly security audits of dependencies
- [ ] Establish policy: patch all critical vulns within 24 hours

---

## Phase 4: Month 3-6 After Launch (Sustain)

### Continuous Security Integration

#### Build Security Scanning
- [ ] Implement container scanning in CI/CD
  - Scan Docker images before deployment
  - Tools: Trivy, Grype, Anchore
- [ ] Add SAST scanning to pipeline
  - Tools: SonarQube, Semgrep, CodeQL
  - Fail build on high-severity issues
- [ ] Add dependency scanning to pipeline
  - Tools: Snyk, WhiteSource, Nexus
  - Block merge with unpatched critical vulns
- [ ] Add secrets scanning to pipeline
  - Tools: TruffleHog, detect-secrets, GitGuardian
  - Prevent commits with API keys or passwords

#### Runtime Security Monitoring
- [ ] Implement intrusion detection (if applicable)
  - Network-based: IDS (Suricata, Snort)
  - Host-based: File integrity monitoring (Osquery, Auditd)
- [ ] Set up behavioral analysis
  - Anomalous user activity (unusual access patterns)
  - Anomalous process activity (unusual system calls)
  - Tools: Falco, Wazuh
- [ ] Implement WAF rules
  - OWASP Top 10 protection
  - Rate limiting rules
  - Geo-blocking rules (if applicable)
  - Bot detection

### Compliance & Regulatory

#### Document Security Controls
- [ ] Create control matrix mapping controls to requirements:
  - OWASP Top 10
  - CIS Benchmarks
  - NIST Cybersecurity Framework
  - SOC 2 trust service criteria
- [ ] Document control ownership (who implements, who verifies)
- [ ] Schedule quarterly control reviews

#### Assess Against Compliance Standards
- [ ] If handling payment data: Plan for PCI-DSS compliance
  - Annual assessment or SAQ (Self-Assessment Questionnaire)
  - Cost: $1,000-$50,000+ depending on scope
- [ ] If EU users: Verify GDPR compliance
  - Data Processing Addendum (DPA) signed with users/customers
  - Privacy policy reviewed by legal
  - Data deletion/export functionality tested
- [ ] If US health data: Verify HIPAA compliance
  - Business Associate Agreements (BAAs) signed
  - Encryption and access controls documented
  - Breach notification plan documented
- [ ] If California users: Verify CCPA compliance
  - Privacy policy includes required disclosures
  - Data access/deletion requests can be processed
  - Opt-out mechanism for data sales (if applicable)

### Team & Knowledge Management

#### Security Training
- [ ] Conduct security training for development team
  - Topics: OWASP Top 10, secure coding, threat modeling
  - Schedule: Quarterly
  - Tools: SANS Security Awareness, Pluralsight, LinkedIn Learning
- [ ] Document security best practices
  - Coding guidelines (secure development)
  - Operations guidelines (secure deployment)
  - Incident response procedures
  - Vulnerability disclosure policy
- [ ] Create security playbooks for common scenarios:
  - [ ] Compromised credentials
  - [ ] DDoS attack
  - [ ] Data breach
  - [ ] Service outage
  - [ ] Malware/ransomware

#### Process Improvements
- [ ] Establish security review in code review process
  - Checklist for PRs touching auth, crypto, data access
  - Security team reviews sensitive changes
- [ ] Implement threat modeling for major features
  - STRIDE or similar methodology
  - Identify risks, rank by severity, define mitigations
- [ ] Schedule monthly security meetings
  - Discuss incidents, vulnerabilities, process improvements
  - Share security news and lessons learned
- [ ] Create security roadmap (12-month plan)
  - Planned security improvements
  - Budget allocation
  - Owner assignments

---

## Ongoing Maintenance (Quarterly & Annual)

### Monthly
- [ ] Review security logs and incidents
- [ ] Verify backups are completing successfully
- [ ] Check for new vulnerabilities in dependencies
- [ ] Review access control (remove inactive accounts)

### Quarterly
- [ ] Security team review and retrospective
- [ ] Penetration test or vulnerability assessment
- [ ] Dependency update review and patching
- [ ] Secrets rotation
- [ ] Compliance control review
- [ ] Update threat model with new features

### Annual
- [ ] Full security assessment
  - Infrastructure audit
  - Code security review
  - Compliance audit
  - Incident retrospective
- [ ] Penetration test (professional)
- [ ] SOC 2 Type II audit (if required)
- [ ] Security training refresh
- [ ] Update security policies and procedures
- [ ] Budget planning for next year's security initiatives

---

## Security Tools & Services to Consider

### Monitoring & Logging
- **Centralized Logging**: ELK Stack (free), Splunk ($$$), DataDog ($$), New Relic ($$), CloudWatch (free tier)
- **APM (Application Performance Monitoring)**: Datadog, New Relic, Dynatrace
- **Incident Management**: PagerDuty, Opsgenie, Incidentio

### Vulnerability Management
- **SAST**: SonarQube (free community), Semgrep (free tier), CodeQL (free for public repos), Snyk (free tier)
- **Dependency Scanning**: Snyk, WhiteSource, Dependabot, Renovate
- **DAST**: OWASP ZAP (free), Burp Suite (free/paid), Acunetix, Qualys
- **Container Scanning**: Trivy (free), Grype (free), Anchore (paid)

### Secrets Management
- **Cloud-Native**: AWS Secrets Manager, Google Secret Manager, Azure Key Vault
- **Self-Hosted**: HashiCorp Vault, Sealed Secrets (Kubernetes)
- **Git Secrets Scanning**: GitGuardian (paid), TruffleHog (free)

### Infrastructure Security
- **Firewall/WAF**: AWS WAF, Cloudflare, ModSecurity
- **IDS/IPS**: Suricata (free), Snort (free), Zeek (free)
- **Cloud Security**: AWS Security Hub, GCP Security Command Center, Azure Security Center
- **Infrastructure Scanning**: Prowler (AWS), ScoutSuite (multi-cloud), Terraform Compliance

### Compliance & Risk
- **Compliance Management**: Drata, Vanta, AuditBoard
- **Risk Assessment**: Archer, Rsam, LogicGate
- **Vulnerability Scanning**: Qualys, Rapid7 InsightVM, Tenable

---

## Hardening Checklist Quick Reference

**Must-Do Immediately (Days 1-7)**
- [ ] Centralized logging
- [ ] Real-time alerting
- [ ] Incident response team assigned
- [ ] Backup tested

**Should-Do Soon (Week 2-4)**
- [ ] Enhanced monitoring dashboard
- [ ] Access control review
- [ ] Secrets rotation
- [ ] MFA for admins

**Plan Within 90 Days**
- [ ] Professional penetration test
- [ ] Incident response drills
- [ ] Dependency audit
- [ ] Security training

**Sustain Ongoing (3-6 months+)**
- [ ] Automated security scanning in CI/CD
- [ ] Runtime security monitoring
- [ ] Compliance assessments
- [ ] Quarterly security reviews

---

## Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| Mean Time to Detect (MTTD) | <1 hour | Weekly |
| Mean Time to Respond (MTTR) | <4 hours | Weekly |
| Vulnerability patch time | <24h critical | Daily |
| Backup success rate | >99% | Daily |
| Critical alerts false positive rate | <5% | Weekly |
| Incident count | Trending down | Monthly |
| Compliance control pass rate | >95% | Quarterly |
| Penetration test findings fixed | 100% | Per test |

---

## Budget Guidance (Rough Annual Estimates)

| Category | Investment | Notes |
|----------|-----------|-------|
| Monitoring & Logging | $5,000-$25,000 | Depends on data volume |
| Vulnerability Management | $2,000-$10,000 | Tools + professional services |
| Incident Response | $2,000-$5,000 | Training, on-call costs |
| Compliance & Audit | $5,000-$50,000 | Depends on standards |
| Penetration Testing | $5,000-$25,000 | Annual professional test |
| Security Training | $1,000-$5,000 | Per-person licensing |
| **Total (Typical)** | **$20,000-$120,000+** | Scales with company size |

---

**Hardening plan version**: 1.0  
**Last updated**: 2026-04-25  
**Review cycle**: Monthly progress check, quarterly comprehensive review
