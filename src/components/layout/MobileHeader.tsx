import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { navLinks, bottomNavLinks } from '@/data/content'

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 w-full z-40 block lg:hidden bg-slate-50 border-b border-slate-200">
        <div className="flex justify-between items-center px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-slate-600 active:opacity-80"
              aria-label="Open navigation menu"
            >
              <Icon name="menu" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Geonera Docs</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center text-slate-600 active:opacity-80">
            <Icon name="search" />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-slate-50 border-r border-slate-200 shadow-xl lg:hidden
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
              <Icon name="architecture" className="text-sm" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 leading-none">Geonera Docs</p>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                Engineering Infrastructure
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded active:opacity-70"
            aria-label="Close navigation menu"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-3 py-2.5 bg-white text-blue-700 shadow-sm rounded font-medium text-[13px] transition-all duration-150'
                  : 'flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 rounded font-medium text-[13px] transition-all duration-150'
              }
            >
              <Icon name={link.icon} className="text-lg shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="p-3 space-y-0.5 border-t border-slate-200 bg-slate-100/50">
          {bottomNavLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:underline text-[11px] font-medium uppercase tracking-wider"
            >
              <Icon name={link.icon} className="text-base shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}
