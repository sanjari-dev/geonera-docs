import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { HomePage } from '@/pages/HomePage'

function App() {
  return (
    <div className="bg-surface font-sans text-on-surface antialiased">
      <Sidebar />
      <MobileHeader />
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <HomePage />
      </main>
    </div>
  )
}

export default App
