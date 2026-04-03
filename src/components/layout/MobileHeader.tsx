import { Icon } from '@/components/ui/Icon'

export function MobileHeader() {
  return (
    <header className="fixed top-0 w-full z-40 block lg:hidden bg-slate-50 border-b border-slate-200">
      <div className="flex justify-between items-center px-4 h-14">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Geonera Docs</h1>
        <button className="w-10 h-10 flex items-center justify-center text-slate-600 active:opacity-80">
          <Icon name="search" />
        </button>
      </div>
    </header>
  )
}
