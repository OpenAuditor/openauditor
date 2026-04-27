# Vulnerable Sample Applications for Practice

> **30-second summary:** The best way to learn to find and fix vulnerabilities is to exploit them in a safe, legal environment. These applications are intentionally vulnerable — they are designed for practice only and should never be deployed publicly.

## Why Practice Matters

Reading about SQL injection is not the same as exploiting it. Deliberately vulnerable applications let you:
- Understand exactly how an attack works before you defend against it
- Practise with real tools (Burp Suite, SQLMap, ZAP) in a legal context
- Build intuition for spotting vulnerable patterns in production code

## Web Application Targets

### OWASP WebGoat

**Best for:** Learning OWASP Top 10 concepts with guided lessons  
**Stack:** Java (Spring)  
**Coverage:** Injection, broken auth, XSS, CSRF, XXE, insecure deserialisation

```bash
# Run with Docker
docker run -d \
  -p 8080:8080 \
  -p 9090:9090 \
  -e TZ=Europe/London \
  --name webgoat \
  webgoat/goat-and-wolf

# Access at: http://localhost:8080/WebGoat
# Default creds: admin/admin (create your own account recommended)
```

**Recommended exercise order:**
1. Introduction → understand the lesson format
2. (A1) Injection → SQL injection hands-on
3. (A2) Broken Auth → session fixation
4. (A7) Cross-Site Scripting → reflected, stored, DOM-based
5. (A8) Insecure Deserialisation

### DVWA (Damn Vulnerable Web Application)

**Best for:** Testing tools (Burp Suite, SQLMap) against real vulnerability classes  
**Stack:** PHP + MySQL  
**Coverage:** Brute force, command injection, CSRF, file inclusion, SQL injection, XSS

```bash
# Run with Docker
docker run -d \
  -p 80:80 \
  --name dvwa \
  vulnerables/web-dvwa

# Access at: http://localhost/
# Setup page: http://localhost/setup.php (click "Create / Reset Database")
# Default login: admin / password
```

**Security levels:** Low → Medium → High — start at Low, work your way up.

```bash
# Example: Automated SQL injection with SQLMap against DVWA
# (After logging in and copying your session cookie from browser)

sqlmap -u "http://localhost/vulnerabilities/sqli/?id=1&Submit=Submit" \
  --cookie="PHPSESSID=abc123; security=low" \
  --dbs \
  --batch
```

### Juice Shop (OWASP)

**Best for:** Modern web app vulnerabilities (React/Node.js stack, APIs, JWT)  
**Stack:** Node.js + Express + Angular  
**Coverage:** 100+ challenges across all OWASP categories

```bash
# Run with Docker
docker run -d \
  -p 3000:3000 \
  --name juice-shop \
  bkimminich/juice-shop

# Access at: http://localhost:3000
# No registration required — start hacking immediately
# Solutions: https://pwning.owasp-juice.shop
```

**Notable challenges for API/JWT practice:**
- Admin registration (broken access control)
- Login as admin without knowing password (SQL injection)
- Access another user's basket (IDOR)
- Forge an admin token (JWT manipulation)
- Upload a malicious file (insecure file upload)

### HackTheBox Starting Point

**Best for:** More realistic scenarios (closer to actual CTF/pentest work)  
**URL:** https://www.hackthebox.com/  
**Starting Point:** Free tier machines with guided walkthroughs

Notable beginner-friendly web machines:
- **Appointment** — SQL injection login bypass
- **Archetype** — SMB + SQL Server (Windows perspective)
- **Markup** — XXE injection

### PortSwigger Web Security Academy

**Best for:** The most comprehensive, structured web security education available  
**URL:** https://portswigger.net/web-security  
**Cost:** Free  
**Labs:** 250+ hands-on labs with their hosted practice targets

Every OWASP category has multiple labs — no local setup required. The accompanying material is production-quality security education.

**Recommended learning path:**
1. SQL Injection (16 labs)
2. Authentication (14 labs)
3. Path traversal (6 labs)
4. Command injection (5 labs)
5. Business logic vulnerabilities (12 labs)
6. Information disclosure (5 labs)
7. Access control (13 labs)
8. SSRF (7 labs)
9. XSS (30 labs)
10. CSRF (8 labs)

## API-Specific Practice

### crAPI (Completely Ridiculous API)

**Best for:** OWASP API Top 10 practice in a realistic car API scenario  
**Stack:** Node.js + Python + Docker Compose

```bash
git clone https://github.com/OWASP/crAPI
cd crAPI
docker-compose up -d

# Access at: http://localhost:8888
# Mail server (for email verification): http://localhost:8025
```

**Covers all OWASP API Top 10:**
- API1: IDOR (access another user's vehicle)
- API2: Broken Auth (weak password reset)
- API3: Excessive data exposure (user endpoint returns full profile)
- API4: Lack of resource limiting (no rate limit on OTP endpoint)
- API5: Function-level authorisation (admin API accessible to users)

### VAmPI

**Best for:** Simple REST API with 5 classic vulnerabilities  
**Stack:** Python (Flask)

```bash
docker run -d \
  -p 5000:5000 \
  --name vampi \
  erev0s/vampi:latest

# Access the API at: http://localhost:5000
# Docs at: http://localhost:5000/docs
```

## Setting Up a Local Hacking Lab

```bash
# Full lab with multiple vulnerable apps
# docker-compose.yml

version: '3.8'
services:
  juiceshop:
    image: bkimminich/juice-shop
    ports:
      - "3000:3000"
  
  dvwa:
    image: vulnerables/web-dvwa
    ports:
      - "8080:80"
  
  webgoat:
    image: webgoat/goat-and-wolf
    ports:
      - "8090:8080"
  
  # Burp Suite community listens on 8888 as a proxy
  # Configure your browser to use 127.0.0.1:8888 as HTTP proxy
```

## Essential Tools to Practice With

| Tool | Purpose | Install |
|------|---------|---------|
| Burp Suite Community | HTTP proxy, interceptor, scanner | https://portswigger.net/burp/communitydownload |
| OWASP ZAP | Free automated scanner | `docker pull ghcr.io/zaproxy/zaproxy:stable` |
| SQLMap | Automated SQL injection | `pip install sqlmap` |
| ffuf | Directory and parameter fuzzing | `go install github.com/ffuf/ffuf/v2@latest` |
| Nuclei | Template-based vulnerability scanner | `go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest` |
| curl + jq | Manual API testing | Built-in on most systems |

## CTF Platforms for Advanced Practice

| Platform | Focus | Notes |
|----------|-------|-------|
| HackTheBox | Realistic machines + CTF | Free tier available |
| TryHackMe | Guided learning paths | Very beginner-friendly |
| PicoCTF | CTF challenges | Great for younger learners |
| CTFtime.org | Live CTF competition tracker | Lists competitions worldwide |
| VulnHub | Downloadable VMs | Offline practice |

## Legal Reminder

Only use these tools against:
- Systems you own
- Systems you have explicit written permission to test
- Intentionally vulnerable applications (listed here)
- CTF challenges

Never test tools against production systems, systems you don't own, or any system without explicit authorisation. Unauthorised testing is a criminal offence under the Computer Misuse Act (UK), CFAA (US), and equivalent laws worldwide.

## Learn More

- [DAST Overview](./dast-overview.md)
- [Fuzzing Inputs](./fuzzing-inputs.md)
- [Community Resources](../17-resources/community.md)
- [OWASP Web Top 10](../02-owasp/web-top10/README.md)
