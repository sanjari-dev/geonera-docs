import { Icon } from '@/components/ui/Icon'
import { recentlyUpdated } from '@/data/content'

const domainChipStyles: Record<string, string> = {
  slate:  'bg-slate-100 text-slate-600',
  purple: 'bg-purple-50 text-purple-600',
  red:    'bg-red-50 text-red-600',
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-[#E1F5EE] text-[#085041]',
}

export function RecentlyUpdated() {
  return (
    <div>
      <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Icon name="history" className="text-primary" />
        Baru diperbarui
      </h4>
      <div className="space-y-1">
        {recentlyUpdated.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="flex items-center justify-between p-4 bg-surface-container-lowest hover:bg-slate-50 group transition-colors block"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${domainChipStyles[item.domainColor] ?? domainChipStyles.slate}`}
                >
                  {item.domain}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  oleh <span className="text-slate-600">{item.author}</span>
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-4">{item.updatedAt}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
