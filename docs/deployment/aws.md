# AWS Deployment Guide

This guide covers deploying Lenzro on AWS. The web app is deployed to **Vercel** (see [vercel.md](./vercel.md)); this guide focuses on the **NestJS API** and supporting infrastructure.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Components](#infrastructure-components)
- [ECR — Container Registry](#ecr--container-registry)
- [ECS Fargate — API Service](#ecs-fargate--api-service)
- [ElastiCache Redis](#elasticache-redis)
- [S3 — File Storage](#s3--file-storage)
- [CloudFront — CDN](#cloudfront--cdn)
- [ALB — Load Balancer](#alb--load-balancer)
- [Secrets Manager](#secrets-manager)
- [Environment Variables](#environment-variables)
- [CI/CD Integration](#cicd-integration)
- [Health Checks and Monitoring](#health-checks-and-monitoring)

---

## Architecture Overview

```
Internet
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│  AWS                                                     │
│                                                          │
│  Route 53 ──► CloudFront ──► S3 (static assets/uploads) │
│                                                          │
│  Route 53 ──► ALB ──► ECS Fargate (API containers)      │
│                │                                         │
│                │         ┌──────────────────┐            │
│                └────────►│  ElastiCache     │            │
│                           │  (Redis)         │            │
│                           └──────────────────┘            │
│                                                          │
│  Secrets Manager (env vars, API keys)                    │
│  ECR (Docker images)                                     │
│  CloudWatch (logs + metrics)                             │
└──────────────────────────────────────────────────────────┘
         │
         ▼ (Prisma via DATABASE_URL / DIRECT_URL)
   Neon PostgreSQL (external)
```

---

## Prerequisites

- AWS CLI v2 installed and configured (`aws configure`)
- Docker installed locally
- An AWS account with appropriate IAM permissions
- A Neon PostgreSQL project (see [database.md](../architecture/database.md))
- Domain name managed in Route 53 (optional but recommended)

---

## Infrastructure Components

| Component          | AWS Service         | Purpose                              |
|-------------------|---------------------|--------------------------------------|
| Container registry | ECR                 | Store Docker images for the API      |
| Container runtime  | ECS Fargate         | Run API containers (serverless)      |
| Cache / PubSub     | ElastiCache Redis   | Token store, Socket.IO adapter       |
| File storage       | S3                  | User uploads (images, attachments)   |
| CDN                | CloudFront          | Serve S3 assets at the edge          |
| Load balancer      | ALB                 | TLS termination, routing to ECS      |
| Secrets            | Secrets Manager     | Inject secrets into ECS tasks        |
| Logs               | CloudWatch          | Container logs and metrics           |
| DNS                | Route 53            | api.lenzro.com → ALB                 |

---

## ECR — Container Registry

Create a repository for the API image:

```bash
aws ecr create-repository \
  --repository-name lenzro/api \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1
```

Build and push:

```bash
# Authenticate
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t lenzro-api ./apps/api

# Tag
docker tag lenzro-api:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/lenzro/api:latest

# Push
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/lenzro/api:latest
```

---

## ECS Fargate — API Service

### Task Definition (key settings)

```json
{
  "family": "lenzro-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/lenzro/api:latest",
      "portMappings": [{ "containerPort": 4000 }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT",     "value": "4000" }
      ],
      "secrets": [
        { "name": "DATABASE_URL",          "valueFrom": "arn:aws:secretsmanager:...:DATABASE_URL" },
        { "name": "DIRECT_URL",            "valueFrom": "arn:aws:secretsmanager:...:DIRECT_URL" },
        { "name": "ACCESS_TOKEN_SECRET",   "valueFrom": "arn:aws:secretsmanager:...:ACCESS_TOKEN_SECRET" },
        { "name": "REFRESH_TOKEN_SECRET",  "valueFrom": "arn:aws:secretsmanager:...:REFRESH_TOKEN_SECRET" },
        { "name": "REDIS_URL",             "valueFrom": "arn:aws:secretsmanager:...:REDIS_URL" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group":  "/ecs/lenzro-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Service (Auto Scaling)

```bash
aws ecs create-service \
  --cluster lenzro \
  --service-name api \
  --task-definition lenzro-api:latest \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxx,subnet-yyy],
    securityGroups=[sg-zzz],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:...,containerName=api,containerPort=4000"
```

Configure auto-scaling to target **60% CPU** with min=2, max=10 tasks.

---

## ElastiCache Redis

Create a Redis cluster (Serverless or t4g.micro for low traffic):

```bash
aws elasticache create-replication-group \
  --replication-group-id lenzro-redis \
  --description "Lenzro cache and pub/sub" \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 1 \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token "<strong-password>"
```

The resulting endpoint goes into `REDIS_URL` in Secrets Manager:

```
rediss://:<auth-token>@<cluster>.cache.amazonaws.com:6380
```

> Use `rediss://` (with TLS) in production.

---

## S3 — File Storage

```bash
aws s3api create-bucket \
  --bucket lenzro-uploads-prod \
  --region us-east-1

# Block all public access (files served through CloudFront)
aws s3api put-public-access-block \
  --bucket lenzro-uploads-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# CORS for direct browser uploads (presigned URLs)
aws s3api put-bucket-cors --bucket lenzro-uploads-prod --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["https://app.lenzro.com"],
    "AllowedMethods": ["GET","PUT","POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

---

## CloudFront — CDN

Create a CloudFront distribution pointing to the S3 bucket with an Origin Access Control (OAC) policy. The distribution URL (`https://cdn.lenzro.com`) is set as `CDN_URL` in the API environment.

Files are served with immutable cache headers for hashed assets and short TTL for user uploads.

---

## ALB — Load Balancer

1. Create an Application Load Balancer in your VPC (internet-facing, two AZs).
2. Add an HTTPS listener on port 443 with an ACM certificate for `api.lenzro.com`.
3. Create a target group pointing to ECS tasks on port 4000.
4. Register the ECS service with the target group.

Health check path: `GET /health` → expected 200.

---

## Secrets Manager

Store all secrets as individual values (not JSON objects) so ECS can inject them directly:

```bash
aws secretsmanager create-secret --name DATABASE_URL          --secret-string "postgresql://..."
aws secretsmanager create-secret --name DIRECT_URL            --secret-string "postgresql://..."
aws secretsmanager create-secret --name ACCESS_TOKEN_SECRET   --secret-string "<random-256-bit>"
aws secretsmanager create-secret --name REFRESH_TOKEN_SECRET  --secret-string "<random-256-bit>"
aws secretsmanager create-secret --name REDIS_URL             --secret-string "rediss://..."
aws secretsmanager create-secret --name S3_BUCKET             --secret-string "lenzro-uploads-prod"
aws secretsmanager create-secret --name CDN_URL               --secret-string "https://cdn.lenzro.com"
```

---

## Environment Variables

| Variable               | Description                                |
|-----------------------|--------------------------------------------|
| `NODE_ENV`            | `production`                               |
| `PORT`                | `4000`                                     |
| `DATABASE_URL`        | Neon pooled connection string              |
| `DIRECT_URL`          | Neon direct connection string              |
| `ACCESS_TOKEN_SECRET` | JWT access token signing key               |
| `REFRESH_TOKEN_SECRET`| JWT refresh token signing key              |
| `REDIS_URL`           | ElastiCache Redis connection URL           |
| `S3_BUCKET`           | S3 bucket name for uploads                 |
| `S3_REGION`           | AWS region for S3                          |
| `CDN_URL`             | CloudFront distribution URL                |
| `CORS_ORIGIN`         | Allowed origin (`https://app.lenzro.com`) |
| `EMAIL_FROM`          | From address for transactional emails      |

---

## CI/CD Integration

The `.github/workflows/deploy-api.yml` workflow handles automated deployments:

1. Build Docker image and push to ECR.
2. Register a new ECS task definition revision.
3. Update the ECS service to the new task definition (rolling deploy).
4. Wait for deployment stability (`aws ecs wait services-stable`).
5. Run smoke tests against the production endpoint.

Required GitHub secrets:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REGISTRY
ECS_CLUSTER
ECS_SERVICE
```

---

## Health Checks and Monitoring

- `GET /health` — returns `{ status: "ok", db: "ok", redis: "ok" }`
- CloudWatch Alarms: CPU > 80%, memory > 85%, 5xx error rate > 1%
- Set up a CloudWatch dashboard with: request count, P50/P95/P99 latency, error rate, active WebSocket connections
