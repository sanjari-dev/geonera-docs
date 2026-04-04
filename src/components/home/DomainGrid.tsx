import { Icon } from '@/components/ui/Icon'
import { DomainCard } from '@/components/home/DomainCard'
import { domains } from '@/data/content'

function SeeAllCard() {
  return (
    <div className="hidden xl:flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 text-slate-400 cursor-pointer hover:border-primary hover:text-primary transition-colors">
      <Icon name="add_circle" className="mb-2 text-2xl" />
      <span className="text-xs font-bold uppercase tracking-widest">See all 14 Domains</span>
    </div>
  )
}

export function DomainGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
      {domains.map((domain) => (
        <DomainCard key={domain.id} {...domain} />
      ))}
      <SeeAllCard />
    </div>
  )
}
