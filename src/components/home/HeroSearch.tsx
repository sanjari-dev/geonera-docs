import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'

export function HeroSearch() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <section className="bg-surface-container-low px-6 py-12 lg:py-20 flex flex-col items-center border-b border-slate-200/40">
      <h2 className="text-[2.75rem] font-bold tracking-tighter text-slate-900 mb-8 text-center leading-tight">
        Precision Infrastructure Docs
      </h2>

      <div className="w-full max-w-[680px] relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <Icon name="search" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Cari dokumentasi Geonera..."
          className="w-full h-14 pl-14 pr-6 bg-surface-container-lowest border-none rounded-xl text-lg shadow-[0px_10px_30px_rgba(26,28,27,0.06)] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 font-medium transition-all"
        />

        <div className="absolute right-4 inset-y-0 flex items-center">
          <span className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-400 rounded-md text-[10px] font-mono border border-slate-200">
            CMD + K
          </span>
        </div>
      </div>
    </section>
  )
}
