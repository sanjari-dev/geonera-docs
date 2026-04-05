/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      collapsible: true,
      collapsed: false,
      items: [
        'introduction/overview',
        'introduction/vision-and-goals',
        'introduction/key-features',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsible: true,
      collapsed: true,
      items: [
        'architecture/high-level-architecture',
        'architecture/microservices-design',
        'architecture/event-driven-architecture',
        'architecture/data-flow',
      ],
    },
    {
      type: 'category',
      label: 'Data Pipeline',
      collapsible: true,
      collapsed: true,
      items: [
        'data-pipeline/data-sources',
        'data-pipeline/tick-processing',
        'data-pipeline/m1-aggregation',
        'data-pipeline/indicators',
      ],
    },
    {
      type: 'category',
      label: 'AI & Modeling',
      collapsible: true,
      collapsed: true,
      items: [
        'ai-and-modeling/model-overview',
        'ai-and-modeling/feature-engineering',
        'ai-and-modeling/training-pipeline',
        'ai-and-modeling/prediction-strategy',
      ],
    },
    {
      type: 'category',
      label: 'Trading Engine',
      collapsible: true,
      collapsed: true,
      items: [
        'trading-engine/signal-generation',
        'trading-engine/entry-and-exit-logic',
        'trading-engine/execution-flow',
      ],
    },
    {
      type: 'category',
      label: 'Microservices',
      collapsible: true,
      collapsed: true,
      items: [
        'microservices/service-overview',
        'microservices/service-communication',
        'microservices/service-list',
      ],
    },
    {
      type: 'category',
      label: 'API Documentation',
      collapsible: true,
      collapsed: true,
      items: [
        'api-documentation/authentication',
        'api-documentation/endpoints',
        'api-documentation/request-and-response',
      ],
    },
    {
      type: 'category',
      label: 'DevOps & CI/CD',
      collapsible: true,
      collapsed: true,
      items: [
        'devops-and-cicd/docker',
        'devops-and-cicd/pipeline',
        'devops-and-cicd/deployment-flow',
      ],
    },
    {
      type: 'category',
      label: 'QA & Testing',
      collapsible: true,
      collapsed: true,
      items: [
        'qa-and-testing/testing-strategy',
        'qa-and-testing/backtesting',
        'qa-and-testing/validation',
      ],
    },
    {
      type: 'category',
      label: 'Risk Management',
      collapsible: true,
      collapsed: true,
      items: [
        'risk-management/risk-rules',
        'risk-management/position-sizing',
        'risk-management/drawdown-control',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      collapsible: true,
      collapsed: true,
      items: [
        'deployment/infrastructure',
        'deployment/scaling',
      ],
    },
    'glossary',
  ],
};

module.exports = sidebars;
