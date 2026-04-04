import { useLocation, Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { navLinks } from '@/data/content'

export function NoContentPage() {
  const { pathname } = useLocation()

  const matched = navLinks.find((l) => l.href === pathname)
  const sectionName = matched?.label ?? pathname.replace('/', '')

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
        <Icon
          name={matched?.icon ?? 'folder_open'}
          className="text-3xl text-on-surface-variant"
        />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        No Content Yet
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-1">
        The <span className="font-semibold text-slate-700">{sectionName}</span> section
        is currently being prepared.
      </p>
      <p className="text-xs text-slate-400 mb-8">
        Check back soon or contribute to the documentation.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        <Icon name="arrow_back" className="text-base" />
        Back to Dashboard
      </Link>
    </div>
  )
}
