import type { NavLink, DomainCard, DocEntry, PopularEntry, StatItem } from '@/types'

export const navLinks: NavLink[] = [
  { label: 'Dashboard',              icon: 'dashboard',                href: '/' },
  { label: 'Core Architecture',      icon: 'architecture',             href: '/architecture' },
  { label: 'Data Ingestion',         icon: 'download',                 href: '/data-ingestion' },
  { label: 'Signal Generation',      icon: 'bolt',                     href: '/signal-generation' },
  { label: 'ML Pipeline',            icon: 'psychology',               href: '/ml-pipeline' },
  { label: 'Model Interpretability', icon: 'insights',                 href: '/interpretability' },
  { label: 'API Reference',          icon: 'api',                      href: '/api' },
  { label: 'Data Models',            icon: 'database',                 href: '/data-models' },
  { label: 'Storage',                icon: 'storage',                  href: '/storage' },
  { label: 'Infrastructure',         icon: 'settings_input_component', href: '/infrastructure' },
  { label: 'Networking',             icon: 'lan',                      href: '/networking' },
  { label: 'Security',               icon: 'security',                 href: '/security' },
  { label: 'Auth',                   icon: 'fingerprint',              href: '/auth' },
  { label: 'DevOps',                 icon: 'terminal',                 href: '/devops' },
  { label: 'Analytics',              icon: 'analytics',                href: '/analytics' },
  { label: 'Frontend',               icon: 'web',                      href: '/frontend' },
  { label: 'Mobile',                 icon: 'smartphone',               href: '/mobile' },
  { label: 'Testing',                icon: 'rule',                     href: '/testing' },
  { label: 'SaaS & Marketplace',     icon: 'store',                    href: '/saas' },
  { label: 'Glossary',               icon: 'menu_book',                href: '/glossary' },
]

export const bottomNavLinks: NavLink[] = [
  { label: 'Getting Started', icon: 'rocket_launch', href: '/help' },
  { label: 'System Status',   icon: 'sensors',        href: '/status' },
]

export const domains: DomainCard[] = [
  {
    id: 1,
    title: 'Core Architecture',
    description: 'Polyglot microservices: Go, Rust, Python, C#, Java, TypeScript — masing-masing dipilih untuk keunggulan domainnya.',
    tag: 'Core',
    tagColor: 'blue',
    href: '/architecture',
    pageCount: 8,
  },
  {
    id: 2,
    title: 'ML Pipeline',
    description: 'Pipeline 4-stage: bi5 ingest → feature engineering → TFT forecasting 7200-step → meta-model XGBoost/LightGBM.',
    tag: 'AI/ML',
    tagColor: 'purple',
    href: '/ml-pipeline',
    pageCount: 12,
  },
  {
    id: 3,
    title: 'Signal Generation',
    description: 'Alur end-to-end dari prediksi harga TFT ke kandidat sinyal trading dengan parameter RR ratio, target, dan horizon.',
    tag: 'Trading',
    tagColor: 'green',
    href: '/signal-generation',
    pageCount: 6,
  },
  {
    id: 4,
    title: 'Storage',
    description: 'ClickHouse untuk time-series tick data skala besar dan PostgreSQL untuk data relasional sinyal dan strategi.',
    tag: 'Data',
    tagColor: 'teal',
    href: '/storage',
    pageCount: 7,
  },
  {
    id: 5,
    title: 'API Reference',
    description: 'REST API C# ASP.NET Core: sinyal, prediksi, model, risk management, dan strategi trading.',
    tag: 'Backend',
    tagColor: 'purple',
    href: '/api',
    pageCount: 23,
  },
  {
    id: 6,
    title: 'SaaS & Marketplace',
    description: 'Visi platform: berlangganan sinyal, marketplace provider, multi-tenant SaaS untuk ekosistem trading terintegrasi.',
    tag: 'Product',
    tagColor: 'orange',
    href: '/saas',
    pageCount: 5,
  },
]

export const stats: StatItem[] = [
  { value: '19',    label: 'Modul Dokumentasi' },
  { value: '6',     label: 'Bahasa Pemrograman' },
  { value: '7.200', label: 'Step Prediksi (M1)' },
]

export const recentlyUpdated: DocEntry[] = [
  {
    title: 'TFT Model: Temporal Fusion Transformer untuk 7200-step Forecasting',
    domain: 'AI/ML',
    domainColor: 'purple',
    author: 'ML Team',
    updatedAt: 'Terbaru',
    href: '/ml-pipeline',
  },
  {
    title: 'Signal Generation: Alur End-to-End dari Prediksi ke Eksekusi',
    domain: 'Trading',
    domainColor: 'green',
    author: 'Core Team',
    updatedAt: 'Terbaru',
    href: '/signal-generation',
  },
  {
    title: 'Drawdown Control & Risk Management System',
    domain: 'Security',
    domainColor: 'red',
    author: 'Risk Team',
    updatedAt: 'Terbaru',
    href: '/security',
  },
  {
    title: 'RabbitMQ Topology & JForex Broker Integration',
    domain: 'Networking',
    domainColor: 'teal',
    author: 'Infra Team',
    updatedAt: 'Terbaru',
    href: '/networking',
  },
  {
    title: 'Model Interpretability: SHAP Values & XAI Dashboard',
    domain: 'AI/ML',
    domainColor: 'purple',
    author: 'ML Team',
    updatedAt: 'Terbaru',
    href: '/interpretability',
  },
]

export const popularPages: PopularEntry[] = [
  {
    rank: 1,
    title: 'Core Architecture Overview',
    subtitle: 'Polyglot microservices & data flow Geonera',
    href: '/architecture',
  },
  {
    rank: 2,
    title: 'ML Pipeline: bi5 → TFT → Signal',
    subtitle: 'Pipeline 4-stage dari ingest hingga klasifikasi sinyal',
    href: '/ml-pipeline',
  },
  {
    rank: 3,
    title: 'Signal Generation Flow',
    subtitle: 'Cara Geonera menghasilkan kandidat sinyal trading',
    href: '/signal-generation',
  },
  {
    rank: 4,
    title: 'API Reference',
    subtitle: '23 endpoint REST untuk sinyal, model, dan risk',
    href: '/api',
  },
  {
    rank: 5,
    title: 'Security & Risk Management',
    subtitle: 'Drawdown control, position sizing, RBAC',
    href: '/security',
  },
]
