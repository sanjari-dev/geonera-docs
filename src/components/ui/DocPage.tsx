import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

interface DocPageProps {
  icon: string
  title: string
  subtitle: string
  badge?: string
  badgeColor?: 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'slate' | 'orange'
  children: ReactNode
}

const badgeStyles: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-[#E1F5EE] text-[#085041]',
  red:    'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  teal:   'bg-teal-50 text-teal-700',
  slate:  'bg-slate-100 text-slate-700',
  orange: 'bg-orange-50 text-orange-700',
}

export function DocPage({ icon, title, subtitle, badge, badgeColor = 'blue', children }: DocPageProps) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-surface-container-low px-6 py-10 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
              <Icon name={icon} className="text-2xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {badge && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeStyles[badgeColor]}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-10">
        {children}
      </div>
    </div>
  )
}

/* ── Reusable sub-components ─────────────────────────────── */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      {children}
    </section>
  )
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

export function Card({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} className="text-primary text-lg" />
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="text-sm text-slate-500 leading-relaxed">{children}</div>
    </div>
  )
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-high">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="bg-surface-container-lowest hover:bg-slate-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InfoBox({ type, children }: { type: 'info' | 'warning' | 'tip'; children: ReactNode }) {
  const styles = {
    info:    { icon: 'info',    bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800' },
    warning: { icon: 'warning', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800' },
    tip:     { icon: 'tips_and_updates', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  }
  const s = styles[type]
  return (
    <div className={`flex gap-3 rounded-lg p-4 border ${s.bg} ${s.border}`}>
      <Icon name={s.icon} className={`text-lg shrink-0 mt-0.5 ${s.text}`} />
      <p className={`text-sm leading-relaxed ${s.text}`}>{children}</p>
    </div>
  )
}

export function CodeBlock({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{lang}</span>
      </div>
      <pre className="bg-slate-900 px-4 py-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

export function TagList({ tags }: { tags: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t.label} className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${t.color}`}>
          {t.label}
        </span>
      ))}
    </div>
  )
}
