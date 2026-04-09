<div align="center">

# GitHub Actions CI/CD Pipeline

### Production-grade automated delivery — from `git push` to running container on AWS ECS Fargate

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=githubactions&logoColor=white)](https://github.com/Eaglewings966/github-actions-cicd-pipeline/actions)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://hub.docker.com/u/eaglewings6)
[![AWS ECS](https://img.shields.io/badge/AWS-ECS%20%2B%20ECR-FF9900?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ecs/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20Alpine-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Security](https://img.shields.io/badge/Security-Trivy%20Scanned-green?style=flat)](https://github.com/aquasecurity/trivy)
[![Tests](https://img.shields.io/badge/Tests-Jest%2080%25%20Coverage-brightgreen?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

**By Emmanuel Ubani · Cloud & DevOps Engineer · [Tech with Emma](https://emmanuelubani.hashnode.dev)**

</div>

---

## What This Project Is

This is **Project 2** of my public DevOps portfolio series — a fully automated CI/CD pipeline that eliminates manual deployments entirely.

Every push to `main` passes through five automated quality gates and lands in a running container on AWS ECS Fargate. No SSH access. No manual steps. No single engineer whose availability determines whether code ships.

The pipeline was built in response to a real problem: a Lagos-based fintech startup lost 62 hours of deployments because one engineer had the only SSH key to production and was unreachable on a trip. The fix sat merged in GitHub while enterprise clients threatened to leave. The actual deployment, when the engineer returned, took four minutes.

This infrastructure makes that scenario impossible.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer pushes to main                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  GitHub Actions  │
                    │    Triggered     │
                    └────────┬─────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
           ▼                                   ▼
┌──────────────────┐                ┌──────────────────┐
│   Job 1: Lint    │                │  Job 2: Security │
│  ESLint+Prettier │                │   Scan (Trivy)   │
│  ← runs first   │                │ ← runs parallel  │
└────────┬─────────┘                └────────┬─────────┘
         │                                   │
         └─────────────────┬─────────────────┘
                           │  both must pass
                           ▼
                ┌──────────────────┐
                │   Job 3: Test    │
                │  Jest + 80% cov  │
                │  needs: [1, 2]   │
                └────────┬─────────┘
                         │  must pass
                         ▼
                ┌──────────────────┐
                │  Job 4: Build    │
                │  Docker → ECR    │
                │  SHA image tag   │
                │  needs: [3]      │
                └────────┬─────────┘
                         │  must succeed
                         ▼
                ┌──────────────────┐
                │  Job 5: Deploy   │
                │  ECS Fargate     │
                │  Rolling update  │
                │  main only       │
                └──────────────────┘
```

**Why does the structure matter in real money?**

Lint and Security Scan run in parallel — both are independent quality gates and there is no reason to run them sequentially. Test waits for both. Build waits for Test. Deploy waits for Build.

Without this chain, a failing lint check would still trigger a full Docker build, an ECR push, and an ECS deployment — burning 5–8 minutes of CI time and cloud storage on work you are discarding. With this chain, the same failure costs ten seconds.

**Fail fast. Fail cheap.**

---

## Repository Structure

```
github-actions-cicd-pipeline/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml            ← five-job automated pipeline
│
├── app/
│   ├── index.js                 ← Express app with /health endpoint
│   └── package.json
│
├── __tests__/
│   └── app.test.js              ← Jest test suite (80% coverage enforced)
│
├── docker/
│   ├── Dockerfile               ← multi-stage, non-root, alpine build
│   └── docker-compose.yml       ← full local stack: Node + Nginx + Redis
│
├── scripts/
│   ├── deploy.sh                ← manual deploy helper
│   └── nginx.conf               ← reverse proxy config
│
├── docs/
│   └── pipeline-architecture.md ← extended architecture documentation
│
├── .prettierignore
├── package-lock.json
└── README.md
```

---

## The Five Pipeline Stages

### Job 1 — Code Quality (ESLint + Prettier)

Runs immediately on every push. ESLint enforces code standards with `--max-warnings 0` — zero warnings allowed, not just zero errors. Prettier checks formatting. Both must pass before anything else starts.

### Job 2 — Security Scan (Trivy)

Runs in parallel with Job 1. Builds the Docker image and scans it against the National Vulnerability Database. Fails the pipeline on CRITICAL and HIGH severity findings. `ignore-unfixed: true` means only vulnerabilities with available patches are blocked — you cannot fix what has no fix available.

ECR also runs its own independent scan on every push (`scanOnPush=true`). Two engines. Two chances to catch what one might miss.

### Job 3 — Test Suite (Jest)

Starts only when both Job 1 and Job 2 pass. Runs the full Jest test suite with `--coverage` and enforces an 80% line coverage threshold. A build that drops below coverage fails here and never reaches production.

### Job 4 — Build and Push (Docker → ECR)

Starts only when tests pass. Multi-stage Docker build on `node:18-alpine` — 110MB final image versus 900MB for the full Node image. The image is tagged with the **exact Git commit SHA**, not `latest`. Every running ECS task can be traced back to a specific line of code.

Docker layer caching via GitHub Actions cache (`--cache-from type=gha`) means unchanged layers are not rebuilt on every run.

### Job 5 — Deploy (ECS Fargate)

Runs only on the `main` branch. Downloads the current ECS task definition, injects the new image URI (with SHA tag), registers the updated task definition, and calls the ECS service update. The `wait-for-service-stability: true` flag holds the pipeline open until the deployment is confirmed healthy or marks the run as failed if tasks do not pass health checks.

Zero-downtime is configured at the ECS service level: `minimumHealthyPercent=100` + `maximumPercent=200`. New tasks start and pass ALB health checks before old tasks are drained.

---

## Security Architecture

| Control | What It Protects Against |
|---|---|
| **Trivy Container Scan** | Known CVEs reaching ECR |
| **ECR Scan on Push** | Second-engine coverage for missed vulnerabilities |
| **Dedicated IAM User (min permissions)** | Credential compromise blast radius |
| **Non-Root Container User (`nodejs`, UID 1001)** | Container escape root escalation |
| **Helmet.js HTTP Security Headers** | Clickjacking, MIME sniffing, missing HTTPS |
| **SHA Image Tags** | Loss of deployment traceability |

The GitHub Actions IAM user (`github-actions-deployer`) has exactly two capabilities: pushing to ECR and updating ECS services. If compromised, the attacker cannot delete resources, access S3, modify IAM, or touch any other AWS service.

---

## Local Development

**Prerequisites:** Docker, Node.js 18, AWS CLI

**1. Clone the repository**

```bash
git clone https://github.com/Eaglewings966/github-actions-cicd-pipeline.git
cd github-actions-cicd-pipeline
```

**2. Run the full local stack**

```bash
copy .env.example .env
cd docker
docker compose up --build
```

Creating `.env` is optional for this project right now, but it gives you a place to override `NODE_ENV`, `PORT`, and `APP_VERSION` locally.

This brings up three services: the Node.js app on port 3000, Nginx on port 80, and Redis for caching.

**3. Verify the health endpoint**

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "author": "Emmanuel Ubani",
  "environment": "development"
}
```

**4. Run the test suite locally**

```bash
npm ci
npm test -- --coverage
```

---

## AWS Setup

**Create the ECR repository**

```bash
aws ecr create-repository \
  --repository-name devops-demo-app \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

**Create the ECS cluster**

```bash
aws ecs create-cluster \
  --cluster-name devops-demo-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region us-east-1
```

**Create the ECS service**

```bash
aws ecs create-service \
  --cluster devops-demo-cluster \
  --service-name devops-demo-service \
  --task-definition devops-demo-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=devops-demo-app,containerPort=3000" \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200"
```

---

## GitHub Secrets Required

Navigate to **Settings → Secrets and variables → Actions** and create:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | GitHub Actions IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions IAM user secret key |
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY` | ECR repository name |
| `ECS_SERVICE` | ECS service name |
| `ECS_CLUSTER` | ECS cluster name |

---

## Performance Optimisations

| Optimisation | Saving Per Run |
|---|---|
| npm dependency caching | ~2 minutes |
| Docker layer caching (GitHub Actions cache) | ~5 minutes |
| Parallel Lint + Security Scan | ~2 minutes |
| Multi-stage Docker build (dev deps excluded) | ~3 minutes |
| **Total saved** | **~12 minutes per run** |

---

## Cleanup

When you are done, remove resources in this order to avoid ongoing charges:

```bash
# Scale service to zero, then delete
aws ecs update-service --cluster devops-demo-cluster --service devops-demo-service --desired-count 0
aws ecs delete-service --cluster devops-demo-cluster --service devops-demo-service

# Delete cluster
aws ecs delete-cluster --cluster devops-demo-cluster

# Delete ECR repository and all images
aws ecr delete-repository --repository-name devops-demo-app --force --region us-east-1
```

Delete the ALB and VPC resources from the AWS console. Verify in AWS Billing after cleanup.

---

## Part of the DevOps Portfolio Series

| Project | Description | Repo |
|---|---|---|
| **Project 1** | AWS IAM Multi-Account Setup with Terraform | [aws-iam-multi-account-setup](https://github.com/Eaglewings966/aws-iam-multi-account-setup) |
| **Project 2 ← You are here** | GitHub Actions CI/CD Pipeline | This repo |
| **Project 3** | Kubernetes EKS Deployment with Terraform + Fargate | [eks-kubernetes-deployment](https://github.com/Eaglewings966/eks-kubernetes-deployment) |
| **Project 4** | GitOps Platform with Argo CD (App of Apps) | [argocd-gitops-platform](https://github.com/Eaglewings966/argocd-gitops-platform) |

---

## Read the Full Walkthrough

Every architecture decision, the complete reasoning behind the job dependency chain, the three-hour debugging story, and the zero-downtime deployment configuration explained in full:

**[Hashnode](https://emmanuelubani.hashnode.dev) · [Medium](https://medium.com/@emmaubani966)**

---

## Connect

**Emmanuel Ubani — Cloud & DevOps Engineer, Lagos Nigeria**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-ubaniemmanuel-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/ubaniemmanuel)
[![GitHub](https://img.shields.io/badge/GitHub-Eaglewings966-181717?style=flat&logo=github&logoColor=white)](https://github.com/Eaglewings966)
[![Hashnode](https://img.shields.io/badge/Hashnode-emmanuelubani-2962FF?style=flat&logo=hashnode&logoColor=white)](https://emmanuelubani.hashnode.dev)
[![Email](https://img.shields.io/badge/Email-eaglewynx@gmail.com-D14836?style=flat&logo=gmail&logoColor=white)](mailto:eaglewynx@gmail.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-ops--run.lovable.app-black?style=flat)](https://ops-run.lovable.app)

---

*"Automate everything. Ship faster. Break nothing." — Tech with Emma*
