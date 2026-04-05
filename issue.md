# Geonera Docusaurus Documentation System

## Objective

Build a complete, production-ready Docusaurus documentation website for the Geonera AI-driven trading system. The documentation must be comprehensive, AI-agent-friendly, and structured for both human developers and AI consumers.

---

## Project Context

Geonera is an AI-driven trading system with the following characteristics:

- **Markets**: Forex & Gold (XAUUSD)
- **Timeframes**: Multi-timeframe analysis (M1 → D1)
- **AI**: TFT (Temporal Fusion Transformer), deep learning forecasting
- **Processing**: Real-time tick and candle processing
- **Architecture**: Microservices, event-driven
- **Backend**: C# (.NET 8+)
- **Messaging**: RabbitMQ
- **AI Pipeline**: Python + Google Vertex AI + BigQuery
- **Data Processing**: Rust (high-performance tick/candle engine)
- **Broker Integration**: Dukascopy JForex (Java)

---

## Documentation Structure

The documentation MUST follow this exact hierarchy. Each top-level item is a category in the sidebar. Each sub-item is a page.

### 1. Introduction
- **Overview** — What Geonera is, who it's for, how it works at a high level
- **Vision & Goals** — Long-term vision, design principles, project goals
- **Key Features** — Feature list with brief descriptions

### 2. Architecture
- **High-Level Architecture** — System-wide architecture diagram and description
- **Microservices Design** — How services are decomposed, boundaries, responsibilities
- **Event-Driven Architecture** — RabbitMQ messaging patterns, event schemas, pub/sub topology
- **Data Flow** — End-to-end data flow from tick ingestion to trade execution

### 3. Data Pipeline
- **Data Sources** — Dukascopy tick feed, historical data, external data sources
- **Tick Processing** — Real-time tick ingestion and normalization (Rust)
- **M1 Aggregation** — Tick-to-candle aggregation logic, OHLCV construction
- **Indicators** — Technical indicator computation (RSI, EMA, ATR, Bollinger Bands, etc.)

### 4. AI & Modeling
- **Model Overview** — TFT architecture, why TFT, model capabilities
- **Feature Engineering** — Input features, normalization, windowing, feature store
- **Training Pipeline** — Vertex AI training workflow, BigQuery data prep, hyperparameter tuning
- **Prediction Strategy** — How predictions are generated, confidence scoring, multi-horizon forecasting

### 5. Trading Engine
- **Signal Generation** — How AI predictions become trading signals
- **Entry & Exit Logic** — Entry conditions, exit conditions, stop-loss, take-profit rules
- **Execution Flow** — Order lifecycle from signal to fill via JForex

### 6. Microservices
- **Service Overview** — Catalog of all services with purpose and tech stack
- **Service Communication** — RabbitMQ exchanges, queues, routing keys, message contracts
- **Service List** — Detailed page per service: DataIngestion, CandleEngine, AIPredictor, TradeExecutor, RiskManager, etc.

### 7. API Documentation
- **Authentication** — Auth mechanism, API keys, token management
- **Endpoints** — REST API endpoint catalog with methods, paths, descriptions
- **Request & Response** — Example payloads, schemas, error codes

### 8. DevOps & CI/CD
- **Docker** — Dockerfiles, docker-compose, multi-stage builds, container registry
- **Pipeline** — CI/CD pipeline stages, build/test/deploy automation
- **Deployment Flow** — Deployment strategy, rollback procedures, environment promotion

### 9. QA & Testing
- **Testing Strategy** — Unit, integration, end-to-end testing approach per language
- **Backtesting** — Historical backtesting framework, metrics, validation methodology
- **Validation** — Model validation, prediction accuracy tracking, A/B testing

### 10. Risk Management
- **Risk Rules** — Risk rule definitions, configurable thresholds, hard limits
- **Position Sizing** — Position sizing algorithms, Kelly criterion, volatility-based sizing
- **Drawdown Control** — Max drawdown limits, circuit breakers, equity curve protection

### 11. Deployment
- **Infrastructure** — Cloud infrastructure, networking, secrets management
- **Scaling** — Horizontal/vertical scaling strategy, auto-scaling policies, load balancing

### 12. Glossary
- Single page with trading, AI, and system terminology definitions

---

## AI-Friendly Page Format

Every documentation page MUST use this template structure:

```markdown
---
title: Page Title
sidebar_label: Sidebar Label
description: One-line description for SEO and AI context
---

## Purpose
Why this component/concept exists and what problem it solves.

## Overview
High-level explanation of the component, 2-4 paragraphs.

## Inputs
What data, events, or requests this component receives.
Use a table:
| Input | Type | Source | Description |
|-------|------|--------|-------------|

## Outputs
What this component produces.
| Output | Type | Destination | Description |
|--------|------|-------------|-------------|

## Rules
- Bullet list of business rules, constraints, invariants
- Include edge cases and error handling behavior

## Flow
Step-by-step process flow, numbered list or Mermaid diagram.

## Example
Code example demonstrating usage or behavior.
```

---

## Required Content Detail

The following sections require substantive, non-placeholder content with realistic examples:

### System Architecture
- Mermaid diagram showing all services and their connections
- Description of each service boundary
- Communication patterns (sync vs async)

### Candle Data (M1 + Indicators)
- Tick-to-M1 aggregation algorithm with Rust code example
- Indicator calculation with C# code example
- Data schema for candle storage

### AI Prediction Flow
- Feature extraction pipeline with Python code example
- TFT model input/output schema
- Vertex AI training job configuration
- BigQuery query examples for feature store

### Trade Execution Flow (JForex)
- Signal-to-order mapping logic
- JForex API integration description
- Order state machine

### Risk Management
- Position sizing formula with C# code example
- Drawdown control algorithm
- Risk rule evaluation pipeline

---

## Code Examples

Include realistic, annotated code examples in:

### C# (.NET)
- Candle model and indicator computation
- Risk rule evaluation
- Service-to-service RabbitMQ messaging
- API endpoint handlers

### Python
- Feature engineering pipeline
- TFT model training script
- Vertex AI job submission
- BigQuery data extraction

### Rust
- Tick ingestion and parsing
- M1 candle aggregation engine
- High-performance indicator computation

---

## File Structure

Generate the complete Docusaurus project with this structure:

```
docs-site/
├── docusaurus.config.js
├── sidebars.js
├── package.json
├── babel.config.js
├── README.md
├── static/
│   └── img/
│       └── logo.svg
├── src/
│   ├── css/
│   │   └── custom.css
│   └── pages/
│       └── index.js
└── docs/
    ├── introduction/
    │   ├── overview.md
    │   ├── vision-and-goals.md
    │   └── key-features.md
    ├── architecture/
    │   ├── high-level-architecture.md
    │   ├── microservices-design.md
    │   ├── event-driven-architecture.md
    │   └── data-flow.md
    ├── data-pipeline/
    │   ├── data-sources.md
    │   ├── tick-processing.md
    │   ├── m1-aggregation.md
    │   └── indicators.md
    ├── ai-and-modeling/
    │   ├── model-overview.md
    │   ├── feature-engineering.md
    │   ├── training-pipeline.md
    │   └── prediction-strategy.md
    ├── trading-engine/
    │   ├── signal-generation.md
    │   ├── entry-and-exit-logic.md
    │   └── execution-flow.md
    ├── microservices/
    │   ├── service-overview.md
    │   ├── service-communication.md
    │   └── service-list.md
    ├── api-documentation/
    │   ├── authentication.md
    │   ├── endpoints.md
    │   └── request-and-response.md
    ├── devops-and-cicd/
    │   ├── docker.md
    │   ├── pipeline.md
    │   └── deployment-flow.md
    ├── qa-and-testing/
    │   ├── testing-strategy.md
    │   ├── backtesting.md
    │   └── validation.md
    ├── risk-management/
    │   ├── risk-rules.md
    │   ├── position-sizing.md
    │   └── drawdown-control.md
    ├── deployment/
    │   ├── infrastructure.md
    │   └── scaling.md
    └── glossary.md
```

### sidebars.js

Generate a complete `sidebars.js` that matches the hierarchy above, with:
- Category labels matching section titles
- Correct document IDs matching file paths
- Collapsible categories enabled

### docusaurus.config.js

Configure with:
- Title: "Geonera Documentation"
- Tagline: "AI-Driven Trading System Documentation"
- Theme: `@docusaurus/preset-classic`
- Navbar with links to each top-level section
- Footer with project links
- Mermaid diagram support via `@docusaurus/theme-mermaid`
- Search enabled

---

## Acceptance Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run start` launches the dev server successfully
- [ ] Sidebar navigation matches the specified hierarchy exactly
- [ ] All 35+ documentation pages are accessible and render correctly
- [ ] Every page follows the AI-friendly template (Purpose, Overview, Inputs, Outputs, Rules, Flow, Example)
- [ ] Code examples are present in C#, Python, and Rust
- [ ] Mermaid diagrams render correctly
- [ ] Mobile-responsive layout works
- [ ] No broken internal links

---

## Deliverables

1. **Complete Docusaurus project** — All files listed in the file structure above
2. **Configuration files** — `docusaurus.config.js`, `sidebars.js`, `package.json`, `babel.config.js`
3. **Documentation pages** — All 35+ pages with substantive content following the AI-friendly template
4. **Landing page** — Custom homepage (`src/pages/index.js`) with project overview and navigation
5. **README.md** — Setup instructions, development workflow, deployment guide

---

## Constraints

- No placeholder or "TODO" content — every page must have real, substantive content
- No missing sections from the specified hierarchy
- No ambiguous instructions — every requirement is explicit and testable
- Production-ready quality — the site should be deployable as-is
- Use Docusaurus v3 (latest stable)
- Use Node.js 18+ compatibility

---

## Labels

`documentation`, `docusaurus`, `ai-agent-task`, `priority:high`
