# CI/CD Pipeline Architecture
## Author: Emmanuel Ubani - Cloud & DevOps Engineer

---

## Overview

This document describes the complete CI/CD pipeline architecture
built using GitHub Actions, Docker, and AWS services.

---

## Pipeline Flow
```
Developer Push
      │
      ▼
┌─────────────────┐
│  Code Quality   │
│  - ESLint       │
│  - Prettier     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Security Scan   │     │   Run Tests     │
│ - Trivy Scanner │     │ - Unit Tests    │
│ - SARIF Report  │     │ - Coverage      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    │
                    ▼
         ┌─────────────────┐
         │  Build Docker   │
         │  - Multi-stage  │
         │  - Layer cache  │
         │  - Push to ECR  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Deploy to ECS  │
         │  - Update task  │
         │  - Zero-downtime│
         │  - Health check │
         └─────────────────┘
```

---

## Pipeline Jobs

### Job 1 — Code Quality Check
Runs on every push and pull request.

What it does:
- Checks out the code
- Sets up Node.js 18 with npm caching
- Installs dependencies
- Runs ESLint for code quality
- Runs Prettier for code formatting

Why it matters:
- Catches bugs early before they reach production
- Enforces consistent code style across the team
- Fails fast so developers get immediate feedback

---

### Job 2 — Security Scan
Runs after code quality passes.

What it does:
- Scans the entire codebase for vulnerabilities
- Uses Trivy scanner for CRITICAL and HIGH severity
- Uploads results to GitHub Security tab as SARIF

Why it matters:
- Prevents vulnerable dependencies from reaching production
- Gives visibility into security issues early
- Creates an audit trail of security scans

---

### Job 3 — Run Tests
Runs in parallel with security scan.

What it does:
- Sets up Node.js with caching
- Installs dependencies
- Runs Jest unit tests with coverage
- Uploads coverage reports to Codecov

Why it matters:
- Ensures code works correctly before deployment
- Coverage reports show untested code
- Parallel execution saves pipeline time

---

### Job 4 — Build Docker Image
Runs after security scan and tests pass.

What it does:
- Sets up Docker Buildx for multi-platform builds
- Configures AWS credentials securely
- Logs into Amazon ECR
- Builds multi-stage Docker image
- Uses GitHub Actions cache for faster builds
- Pushes image to ECR with semantic tags

Why it matters:
- Multi-stage builds reduce image size significantly
- Layer caching reduces build time by up to 70%
- Semantic tags enable easy rollbacks

---

### Job 5 — Deploy to AWS
Runs only on main branch after build succeeds.

What it does:
- Configures AWS credentials
- Downloads current ECS task definition
- Updates task definition with new image
- Deploys to ECS with zero-downtime rolling update
- Waits for service stability confirmation

Why it matters:
- Zero-downtime deployments keep users happy
- Automatic rollback if health checks fail
- Full audit trail of every deployment

---

## Performance Optimizations

| Optimization | Time Saved |
|---|---|
| npm dependency caching | ~2 minutes |
| Docker layer caching | ~5 minutes |
| Parallel job execution | ~4 minutes |
| Multi-stage Docker build | ~3 minutes |
| **Total saved per run** | **~14 minutes** |

---

## Security Features

- AWS credentials stored as GitHub Secrets
- Non-root Docker user for container security
- Trivy vulnerability scanning on every push
- Helmet.js security headers on the application
- Rate limiting via Nginx reverse proxy
- Container health checks for automatic recovery

---

## How to Use This Pipeline

### 1. Fork or clone this repository
### 2. Add these GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 3. Update these variables in ci-cd.yml:
- `ECR_REPOSITORY` — your ECR repository name
- `ECS_SERVICE` — your ECS service name
- `ECS_CLUSTER` — your ECS cluster name

### 4. Push to main branch and watch it run!

---

## Author

**Emmanuel Ubani**
Cloud & DevOps Engineer
Lagos, Nigeria

- LinkedIn: [ubaniemmanuel](https://www.linkedin.com/in/ubaniemmanuel)
- GitHub: [Eaglewings966](https://github.com/Eaglewings966)
- Email: eaglewynx@gmail.com