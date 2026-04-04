import { Icon } from '@/components/ui/Icon'
import { popularPages } from '@/data/content'

export function PopularPages() {
  return (
    <div>
      <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Icon name="trending_up" className="text-primary" />
        Halaman populer
      </h4>
      <div className="space-y-1">
        {popularPages.map((item) => (
          <a
            key={item.rank}
            href={item.href}
            className="flex items-center gap-4 p-4 bg-surface-container-lowest hover:bg-slate-50 group transition-colors border-l-4 border-transparent hover:border-primary block"
          >
            <span className="text-lg font-bold font-mono text-slate-200 group-hover:text-primary/20 shrink-0">
              {String(item.rank).padStart(2, '0')}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <span className="text-[11px] text-slate-400">{item.subtitle}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
