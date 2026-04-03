import type { NavLink, DomainCard, DocEntry, PopularEntry, StatItem } from '@/types'

export const navLinks: NavLink[] = [
  { label: 'Dashboard',        icon: 'dashboard',               href: '#', active: true },
  { label: 'Core Architecture', icon: 'architecture',            href: '#' },
  { label: 'API Reference',    icon: 'api',                     href: '#' },
  { label: 'Data Models',      icon: 'database',                href: '#' },
  { label: 'Infrastructure',   icon: 'settings_input_component', href: '#' },
  { label: 'Security',         icon: 'security',                href: '#' },
  { label: 'DevOps',           icon: 'terminal',                href: '#' },
  { label: 'Frontend',         icon: 'web',                     href: '#' },
  { label: 'Mobile',           icon: 'smartphone',              href: '#' },
  { label: 'Testing',          icon: 'rule',                    href: '#' },
  { label: 'Analytics',        icon: 'analytics',               href: '#' },
  { label: 'ML Pipeline',      icon: 'psychology',              href: '#' },
  { label: 'Storage',          icon: 'storage',                 href: '#' },
  { label: 'Networking',       icon: 'lan',                     href: '#' },
  { label: 'Auth',             icon: 'fingerprint',             href: '#' },
]

export const bottomNavLinks: NavLink[] = [
  { label: 'Documentation Help', icon: 'help',    href: '#' },
  { label: 'System Status',      icon: 'sensors', href: '#' },
]

export const domains: DomainCard[] = [
  {
    id: 1,
    title: 'Architecture',
    description: 'Master schemas, deployment workflows, and system topological overview.',
    tag: 'Core',
    tagColor: 'blue',
    href: '#',
    pageCount: 42,
  },
  {
    id: 2,
    title: 'Storage & Flow',
    description: 'ETL pipelines, data lake configurations, and archival policies.',
    tag: 'Data Ingestion',
    tagColor: 'green',
    href: '#',
    pageCount: 14,
  },
  {
    id: 3,
    title: 'CI/CD Pipelines',
    description: 'GitHub Actions, Docker registry, and Kubernetes cluster management.',
    tag: 'DevOps',
    tagColor: 'slate',
    href: '#',
    pageCount: 28,
  },
  {
    id: 4,
    title: 'IAM & Auth',
    description: 'Identity management, role-based access control, and secret management.',
    tag: 'Security',
    tagColor: 'red',
    href: '#',
    pageCount: 19,
  },
  {
    id: 5,
    title: 'API Reference',
    description: 'Service definitions, endpoint specs, and response models.',
    tag: 'Backend',
    tagColor: 'purple',
    href: '#',
    pageCount: 112,
  },
  {
    id: 6,
    title: 'Networking',
    description: 'VPC peering, subnet layouts, and load balancer configurations.',
    tag: 'Cloud',
    tagColor: 'teal',
    href: '#',
    pageCount: 12,
  },
]

export const stats: StatItem[] = [
  { value: '1,284', label: 'Total Dokumentasi' },
  { value: '82',    label: 'Update Bulan Ini' },
  { value: '45',    label: 'Kontributor Aktif' },
]

export const recentlyUpdated: DocEntry[] = [
  {
    title: 'Setup Cluster Kubernetes v1.28',
    domain: 'Infrastructure',
    domainColor: 'slate',
    author: 'Aris Munandar',
    updatedAt: '2 jam lalu',
    href: '#',
  },
  {
    title: 'API Rate Limiting Policy',
    domain: 'Backend',
    domainColor: 'purple',
    author: 'Sarah Wijaya',
    updatedAt: '4 jam lalu',
    href: '#',
  },
  {
    title: 'Secret Management with Hashicorp',
    domain: 'Security',
    domainColor: 'red',
    author: 'Dimas Pratama',
    updatedAt: '6 jam lalu',
    href: '#',
  },
  {
    title: 'Mobile Push Notification Schema',
    domain: 'Mobile',
    domainColor: 'blue',
    author: 'Rizky Ramadhan',
    updatedAt: 'Kemarin',
    href: '#',
  },
  {
    title: 'Database Migration Workflow',
    domain: 'Data Ingestion',
    domainColor: 'green',
    author: 'Aris Munandar',
    updatedAt: 'Kemarin',
    href: '#',
  },
]

export const popularPages: PopularEntry[] = [
  {
    rank: 1,
    title: 'Getting Started Guide',
    subtitle: 'Onboarding dokumen untuk developer baru',
    href: '#',
  },
  {
    rank: 2,
    title: 'System Health Check Endpoints',
    subtitle: 'Monitor infrastruktur secara real-time',
    href: '#',
  },
  {
    rank: 3,
    title: 'VPN Access Setup',
    subtitle: 'Akses jaringan internal perusahaan',
    href: '#',
  },
  {
    rank: 4,
    title: 'Production Incident Protocol',
    subtitle: 'Langkah penanganan emergency',
    href: '#',
  },
  {
    rank: 5,
    title: 'Frontend Design System',
    subtitle: 'Katalog komponen UI Geonera',
    href: '#',
  },
]
