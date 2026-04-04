import { Icon } from '@/components/ui/Icon'
import type { DomainCard as DomainCardType } from '@/types'

const tagStyles: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-[#E1F5EE] text-[#085041]',
  slate:  'bg-slate-100 text-slate-700',
  red:    'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  teal:   'bg-teal-50 text-teal-700',
}

export function DomainCard({ id, title, description, tag, tagColor, href, pageCount }: DomainCardType) {
  return (
    <a
      href={href}
      className="group bg-surface-container-lowest p-6 rounded-lg transition-all border-b-2 border-transparent hover:border-primary/40 hover:translate-y-[-2px] block"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="font-mono text-sm font-bold text-slate-300">
          {String(id).padStart(2, '0')}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${tagStyles[tagColor] ?? tagStyles.slate}`}
        >
          {tag}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{description}</p>
      <div className="flex items-center text-[11px] font-mono font-bold text-slate-400">
        <Icon name="description" className="text-sm mr-1" />
        {pageCount} pages
      </div>
    </a>
  )
}
