import { Icon } from '@/components/ui/Icon'
import { navLinks, bottomNavLinks } from '@/data/content'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 z-50 hidden lg:flex flex-col bg-slate-50 border-r border-slate-200">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
            <Icon name="architecture" className="text-sm" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              Geonera Docs
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Engineering Infrastructure
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={
              link.active
                ? 'flex items-center gap-3 px-3 py-2 bg-white text-blue-700 shadow-sm rounded font-medium text-[13px] transition-all duration-150'
                : 'flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 rounded font-medium text-[13px] transition-all duration-150'
            }
          >
            <Icon name={link.icon} className="text-lg" />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 space-y-1 border-t border-slate-200 bg-slate-100/50">
        {bottomNavLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:underline text-[11px] font-medium uppercase tracking-wider"
          >
            <Icon name={link.icon} className="text-base" />
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}
