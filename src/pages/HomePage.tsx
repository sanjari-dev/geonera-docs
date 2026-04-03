import { HeroSearch } from '@/components/home/HeroSearch'
import { DomainGrid } from '@/components/home/DomainGrid'
import { StatsBar } from '@/components/home/StatsBar'
import { RecentlyUpdated } from '@/components/home/RecentlyUpdated'
import { PopularPages } from '@/components/home/PopularPages'
import { Footer } from '@/components/ui/Footer'

export function HomePage() {
  return (
    <>
      <HeroSearch />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <DomainGrid />
        <StatsBar />

        {/* Double List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <RecentlyUpdated />
          <PopularPages />
        </div>
      </div>

      <Footer />
    </>
  )
}
