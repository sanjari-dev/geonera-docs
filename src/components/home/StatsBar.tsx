import { stats } from '@/data/content'

export function StatsBar() {
  return (
    <div className="flex flex-wrap justify-between items-center py-6 px-8 bg-surface-container-high rounded-lg mb-16 gap-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
              {stat.label}
            </span>
            <span className="text-2xl font-bold font-mono text-primary">{stat.value}</span>
          </div>
          {i < stats.length - 1 && (
            <div className="h-10 w-[1px] bg-slate-300 hidden md:block ml-4" />
          )}
        </div>
      ))}
      <button className="px-6 py-2 bg-primary text-white font-bold text-xs rounded uppercase tracking-widest hover:opacity-90 transition-opacity">
        Statistik Lengkap
      </button>
    </div>
  )
}
