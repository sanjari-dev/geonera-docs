// @ts-check
const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Geonera Documentation',
  tagline: 'AI-Driven Trading System Documentation',
  favicon: 'img/favicon.ico',

  url: 'https://sanjari-dev.github.io',
  baseUrl: '/',

  organizationName: 'sanjari-dev',
  projectName: 'geonera-docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/geonera-social-card.jpg',
      navbar: {
        title: 'Geonera',
        logo: {
          alt: 'Geonera Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/sanjari-dev/geonera-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              { label: 'Introduction', to: '/docs/introduction/overview' },
              { label: 'Architecture', to: '/docs/architecture/high-level-architecture' },
              { label: 'AI & Modeling', to: '/docs/ai-and-modeling/model-overview' },
              { label: 'Trading Engine', to: '/docs/trading-engine/signal-generation' },
            ],
          },
          {
            title: 'System',
            items: [
              { label: 'Data Pipeline', to: '/docs/data-pipeline/data-sources' },
              { label: 'Microservices', to: '/docs/microservices/service-overview' },
              { label: 'Risk Management', to: '/docs/risk-management/risk-rules' },
              { label: 'DevOps & CI/CD', to: '/docs/devops-and-cicd/docker' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'API Documentation', to: '/docs/api-documentation/authentication' },
              { label: 'Glossary', to: '/docs/glossary' },
              { label: 'GitHub', href: 'https://github.com/sanjari-dev/geonera-docs' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Geonera. Built with Docusaurus.`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ['csharp', 'rust', 'python', 'java', 'bash', 'json', 'yaml'],
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'forest' },
      },
    }),
};

module.exports = config;
