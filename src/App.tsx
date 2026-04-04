import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { HomePage } from '@/pages/HomePage'
import { NoContentPage } from '@/pages/NoContentPage'

function App() {
  return (
    <BrowserRouter>
      <div className="bg-surface font-sans text-on-surface antialiased">
        <Sidebar />
        <MobileHeader />
        <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/architecture"   element={<NoContentPage />} />
            <Route path="/api"            element={<NoContentPage />} />
            <Route path="/data-models"    element={<NoContentPage />} />
            <Route path="/infrastructure" element={<NoContentPage />} />
            <Route path="/security"       element={<NoContentPage />} />
            <Route path="/devops"         element={<NoContentPage />} />
            <Route path="/frontend"       element={<NoContentPage />} />
            <Route path="/mobile"         element={<NoContentPage />} />
            <Route path="/testing"        element={<NoContentPage />} />
            <Route path="/analytics"      element={<NoContentPage />} />
            <Route path="/ml-pipeline"    element={<NoContentPage />} />
            <Route path="/storage"        element={<NoContentPage />} />
            <Route path="/networking"     element={<NoContentPage />} />
            <Route path="/auth"           element={<NoContentPage />} />
            <Route path="/help"           element={<NoContentPage />} />
            <Route path="/status"         element={<NoContentPage />} />
            <Route path="*"              element={<NoContentPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
