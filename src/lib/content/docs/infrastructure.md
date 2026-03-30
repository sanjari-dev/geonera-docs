# Infrastructure & Scalability

Geonera's infrastructure is designed for horizontal scalability, fault isolation, and operational efficiency. Each service is containerized, independently deployable, and observable. The platform is built to scale from a single-server development environment to a distributed production cluster without architectural changes.

---

## Table of Contents

- [Infrastructure Philosophy](#infrastructure-philosophy)
- [Containerization Strategy](#containerization-strategy)
- [Service Deployment Units](#service-deployment-units)
- [Network Topology](#network-topology)
- [Database Infrastructure](#database-infrastructure)
- [Message Broker Infrastructure](#message-broker-infrastructure)
- [Compute Resource Requirements](#compute-resource-requirements)
- [Scaling Strategy](#scaling-strategy)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Disaster Recovery](#disaster-recovery)
- [Trade-offs and Constraints](#trade-offs-and-constraints)

---

## Infrastructure Philosophy

- **Container-first:** Every service runs in a Docker container. No bare-metal deployments.
- **Immutable infrastructure:** Config changes produce new deployments, not in-place mutations.
- **Language-agnostic orchestration:** Kubernetes (or Docker Swarm for simpler deployments) manages all containers uniformly, regardless of language.
- **Fail-isolated services:** Services are sized and scheduled independently to prevent one component's resource usage from starving another.
- **Defense-in-depth:** Sensitive services (JForex engine, PostgreSQL) are not exposed beyond the internal network.

---

## Containerization Strategy

### Base Image Policy

| Language | Base Image | Rationale |
|---|---|---|
| Go | `golang:1.22-alpine` → multi-stage to `alpine:3.19` | Minimal runtime; Go produces static binary |
| Rust | `rust:1.76-slim` → multi-stage to `debian:bookworm-slim` | Static binary; no Rust runtime needed |
| Python | `python:3.11-slim` + CUDA base for GPU workers | ML dependencies require non-alpine for C extensions |
| C# | `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` | Official Microsoft image; production-optimized |
| Java | `eclipse-temurin:21-jre-alpine` | JRE only (no JDK in prod); OpenJ9 or Temurin |
| TypeScript/Bun | `oven/bun:1.1-alpine` | Official Bun image |

### Multi-Stage Build Pattern (Go example)
```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o ingestor ./cmd/ingestor

# Runtime stage
FROM alpine:3.19
RUN adduser -D -g '' appuser
COPY --from=builder /app/ingestor /usr/local/bin/ingestor
USER appuser
ENTRYPOINT ["ingestor"]
```

### Container Resource Limits
Every container must have explicit `limits` and `requests` set in Kubernetes manifests.

---

## Service Deployment Units

### Core Pipeline Services

| Service | Language | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas | GPU |
|---|---|---|---|---|---|---|---|
| Go Ingestor | Go | 0.5 | 2.0 | 256Mi | 512Mi | 1–3 per instrument partition | No |
| Rust Preprocessor | Rust | 2.0 | 8.0 | 1Gi | 4Gi | 1 (batch job) | No |
| Python TFT Trainer | Python | 4.0 | 16.0 | 8Gi | 32Gi | 1 | Yes (required) |
| Python TFT Inference | Python | 1.0 | 4.0 | 2Gi | 8Gi | 1–N | Yes (preferred) |
| Python Meta Model | Python | 0.5 | 2.0 | 512Mi | 2Gi | 1–5 | No |
| C# Signal Service | C# | 0.5 | 2.0 | 256Mi | 1Gi | 2–5 | No |
| C# Risk Service | C# | 0.5 | 2.0 | 256Mi | 1Gi | 2–5 | No |
| C# API Gateway | C# | 0.5 | 2.0 | 256Mi | 1Gi | 2–10 | No |
| Java JForex Engine | Java | 1.0 | 2.0 | 512Mi | 2Gi | 1 (active-standby) | No |
| Admin UI (Bun) | TypeScript | 0.25 | 1.0 | 128Mi | 512Mi | 1–3 | No |

### Data Infrastructure Services

| Service | CPU Request | Memory Request | Storage | Replicas |
|---|---|---|---|---|
| ClickHouse | 4.0 | 16Gi | SSD, ≥ 500GB per node | 3-node cluster (1 shard, 3 replicas) |
| PostgreSQL | 2.0 | 8Gi | SSD, ≥ 100GB | 1 primary + 1 read replica |
| RabbitMQ | 1.0 | 2Gi | SSD, ≥ 50GB | 3-node cluster |
| Redis (optional cache) | 0.5 | 1Gi | — | 1 (sentinel mode for HA) |

---

## Network Topology

```
Internet / Admin VPN
        │
        │ HTTPS (443)
        ▼
    [Nginx / Traefik Ingress]
        │
        │ HTTP (internal)
        ├─────────────────────────────┐
        ▼                             ▼
[Admin UI — Bun]           [C# API Gateway]
        │                             │
        │ Internal network            │
        ▼                             ▼
[RabbitMQ Cluster]         [PostgreSQL]
        │
        ├── Go Ingestor
        ├── Rust Preprocessor (event-driven)
        ├── Python TFT Inference Workers
        ├── Python Meta Model Workers
        ├── C# Signal Service
        ├── C# Risk Service
        └── Java JForex Engine
                │
                │ JForex API (TCP, external)
                ▼
        [Dukascopy LP]

[ClickHouse Cluster] ← accessed by all data-reading services
```

### Network Policies (Kubernetes)
- JForex Engine: egress to Dukascopy external IP only; no other external egress
- ClickHouse: ingress from internal services only; no public exposure
- PostgreSQL: ingress from C# services and Python services only
- RabbitMQ: ingress from all internal services; management UI on VPN-only port
- Admin UI: ingress from HTTPS only via ingress controller

---

## Database Infrastructure

### ClickHouse Cluster

```yaml
# ClickHouse cluster topology (config.xml)
remote_servers:
  geonera_cluster:
    shard:
      - replica:
          host: clickhouse-1
          port: 9000
      - replica:
          host: clickhouse-2
          port: 9000
      - replica:
          host: clickhouse-3
          port: 9000
```

- **Replication:** ZooKeeper (3 nodes) or ClickHouse Keeper (preferred; built-in)
- **Sharding:** Single shard initially; add second shard when storage exceeds 70% capacity
- **Storage:** NVMe SSD required for write throughput; ClickHouse is write-heavy during ingestion
- **Backup:** Native ClickHouse backup to S3-compatible storage; daily full, hourly incremental

### PostgreSQL

```
Primary (read-write): postgres-primary:5432
Replica (read-only):  postgres-replica:5432
```

- **Replication:** Streaming replication with hot standby
- **Connection pooling:** PgBouncer in transaction mode (pool_size=50 per service)
- **Backup:** pg_dump + WAL archiving to S3; PITR (point-in-time recovery) up to 7 days
- **Extensions:** `uuid-ossp`, `pg_stat_statements`, `pg_trgm`

### RabbitMQ Cluster

```
rabbitmq-1: 5672 (AMQP), 15672 (management)
rabbitmq-2: 5672
rabbitmq-3: 5672
```

- **Queue type:** Quorum queues for all critical queues (signal pipeline, execution)
- **Classic queues:** Low-priority notification queues only
- **Disk node:** All nodes are disk nodes (no RAM-only nodes in production)
- **TLS:** AMQP over TLS for all service connections
- **Management:** RabbitMQ Management Plugin; VPN-only access

---

## Compute Resource Requirements

### Minimum Production Environment
- **Application nodes:** 3× (8 vCPU, 32GB RAM, 100GB SSD NVMe) — runs all non-GPU services
- **GPU node:** 1× (8 vCPU, 32GB RAM, 500GB SSD, 1× RTX 3090 or A100) — runs TFT Training and Inference
- **ClickHouse nodes:** 3× (16 vCPU, 64GB RAM, 2TB NVMe SSD per node)
- **PostgreSQL nodes:** 2× (4 vCPU, 16GB RAM, 500GB NVMe SSD)
- **RabbitMQ nodes:** 3× (4 vCPU, 8GB RAM, 200GB SSD) — can co-locate with app nodes in dev

### Development Environment (single machine)
- 1× machine with 16 vCPU, 64GB RAM, 1TB NVMe, GPU optional
- All services run via `docker-compose` with resource limits relaxed
- ClickHouse runs as single node (`MergeTree` instead of `ReplicatedMergeTree`)
- RabbitMQ runs as single node

---

## Scaling Strategy

### Horizontal Scaling Dimensions

| Bottleneck | Horizontal Scale Action |
|---|---|
| Tick ingestion throughput | Add Go Ingestor replicas partitioned by instrument |
| TFT inference queue depth | Add Python Inference Worker pods; add GPU nodes |
| Meta model scoring lag | Add Python Meta Model Worker pods |
| C# API gateway throughput | Add gateway replicas behind load balancer |
| ClickHouse write throughput | Add shards; increase insert buffer |
| RabbitMQ throughput | Add broker nodes to cluster |

### Vertical Scaling Limits
- JForex Engine: cannot scale horizontally (one JForex session per account); scale vertically (more RAM/CPU for JVM)
- ClickHouse replica reads: can distribute read load across replicas without schema change

### Auto-Scaling (Kubernetes HPA)
```yaml
# Example: Python Meta Model Worker autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: meta-model-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: meta-model-worker
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: External
    external:
      metric:
        name: rabbitmq_queue_messages
        selector:
          matchLabels:
            queue: "meta-model.signals"
      target:
        type: AverageValue
        averageValue: "10"  # scale up when > 10 messages per pod
```

---

## Environment Configuration

### Configuration Sources (priority order, highest first)
1. Kubernetes Secrets (database passwords, API keys, JForex credentials)
2. Kubernetes ConfigMaps (non-sensitive config: timeouts, queue names, feature flags)
3. Environment variables (injected at pod startup)
4. Application defaults (fallback; must be safe defaults)

### Secret Management
- Kubernetes Secrets backed by an external secrets operator (e.g., External Secrets Operator with AWS Secrets Manager or HashiCorp Vault)
- JForex credentials: stored in Vault; never in source code or ConfigMaps
- ClickHouse/PostgreSQL passwords: per-service users with minimum required privileges (principle of least privilege)
- No secrets in Docker images or Git

### Key Environment Variables Per Service

```bash
# Go Ingestor
CLICKHOUSE_DSN=clickhouse://user:pass@clickhouse-1:9000/geonera
INGEST_PARALLELISM=20
DUKASCOPY_RATE_LIMIT_RPS=5

# Python TFT Inference
CLICKHOUSE_DSN=...
RABBITMQ_URL=amqps://user:pass@rabbitmq-1:5671/geonera
MODEL_ARTIFACT_PATH=/models
CUDA_VISIBLE_DEVICES=0

# C# Risk Service
ConnectionStrings__Postgres=Host=postgres-primary;...
RabbitMQ__Host=rabbitmq-1
RabbitMQ__VHost=geonera
Risk__MaxOpenPositions=5
```

---

## CI/CD Pipeline

### Per-Language Pipeline

Each service has its own CI pipeline (GitHub Actions / GitLab CI):

```
[Push to feature branch]
    → Lint + Format check
    → Unit tests
    → Build Docker image
    → Integration tests (against local ClickHouse + Postgres + RabbitMQ)
    → Push image to container registry

[Merge to main]
    → All above
    → Staging deployment (auto)
    → Smoke tests on staging
    → Manual approval gate
    → Production deployment (rolling update)
```

### Deployment Strategy
- **Rolling update:** Default for stateless services (C#, Go, Python); zero downtime
- **Blue-Green:** For JForex Engine (cannot drop connections mid-trade); deploy blue, verify, switch traffic, drain green
- **Canary:** For ML model promotions; route 10% of inference requests to new model before full rollout

---

## Disaster Recovery

| Scenario | RTO Target | RPO Target | Recovery Action |
|---|---|---|---|
| Single pod crash | < 30s | 0 | Kubernetes restarts pod automatically |
| Application node failure | < 5min | 0 | K8s reschedules pods to healthy nodes |
| GPU node failure | < 10min | 0 | Inference falls to CPU (degraded throughput); pages on-call |
| ClickHouse node failure | < 1min | < 10s | ClickHouse serves reads from remaining replicas |
| PostgreSQL primary failure | < 2min | < 30s | Automatic failover to replica via Patroni or managed DB HA |
| RabbitMQ node failure | < 1min | 0 (quorum queues) | Remaining cluster nodes serve all queues |
| Full datacenter loss | < 1 hour | < 24h | Restore from S3 backups to secondary region |
| Data corruption | < 4 hours | To last backup | PITR restoration from WAL archives (PostgreSQL) |

---

## Trade-offs and Constraints

- **Kubernetes vs Docker Compose:** K8s adds significant operational complexity but provides necessary autoscaling, self-healing, and secrets management for production. Docker Compose is supported for development only.
- **JForex single-account constraint:** The Java JForex Engine cannot run as multiple replicas because Dukascopy limits one live session per account. Active-standby HA (not active-active) is the only available option.
- **GPU procurement:** TFT training requires GPU. If GPU nodes are unavailable (cloud GPU scarcity), training must be deferred or run on CPU (10-50x slower). This is a capacity planning risk.
- **ClickHouse schema migration:** ClickHouse does not support transactional DDL. Schema changes must be coordinated carefully (e.g., adding a column with a default; never removing columns without migration plan).
- **Polyglot CI/CD overhead:** Maintaining separate CI pipelines per language (Go, Rust, Python, C#, Java, TypeScript) multiplies CI maintenance effort. Monorepo tooling (Nx, Turborepo, or custom Makefile) recommended to coordinate cross-service builds.
