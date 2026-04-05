# Geonera Documentation Site

Production-ready Docusaurus v3 documentation for the Geonera AI-driven trading system.

## Requirements

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

## Development

```bash
npm run start
```

Opens the dev server at `http://localhost:3000/geonera-docs/`.

## Build

```bash
npm run build
```

Generates static output in `./build`.

## Serve Build Locally

```bash
npm run serve
```

## Deploy (GitHub Pages)

```bash
npm run deploy
```

Requires `GIT_USER` environment variable set to your GitHub username.

## Project Structure

```
docs-site/
├── docusaurus.config.js   # Site configuration
├── sidebars.js            # Sidebar navigation
├── package.json
├── babel.config.js
├── static/img/            # Static assets
├── src/
│   ├── css/custom.css     # Global styles
│   └── pages/index.js    # Homepage
└── docs/                  # All documentation pages
    ├── introduction/
    ├── architecture/
    ├── data-pipeline/
    ├── ai-and-modeling/
    ├── trading-engine/
    ├── microservices/
    ├── api-documentation/
    ├── devops-and-cicd/
    ├── qa-and-testing/
    ├── risk-management/
    ├── deployment/
    └── glossary.md
```
