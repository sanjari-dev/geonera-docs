export function Footer() {
  return (
    <footer className="w-full py-12 mt-12 border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          © 2024 GEONERA ENGINEERING. ALL RIGHTS RESERVED.
        </span>
        <div className="flex gap-8">
          <a
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:underline"
            href="#"
          >
            Internal GitHub
          </a>
          <a
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:underline"
            href="#"
          >
            Compliance Docs
          </a>
          <a
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:underline"
            href="#"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
