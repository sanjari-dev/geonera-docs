export interface NavLink {
  label: string
  icon: string
  href: string
}

export interface DomainCard {
  id: number
  title: string
  description: string
  tag: string
  tagColor: string
  href: string
  pageCount: number
}

export interface DocEntry {
  title: string
  domain: string
  domainColor: string
  author: string
  updatedAt: string
  href: string
}

export interface PopularEntry {
  rank: number
  title: string
  subtitle: string
  href: string
}

export interface StatItem {
  value: string
  label: string
}
