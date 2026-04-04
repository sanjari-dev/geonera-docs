import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { HomePage } from '@/pages/HomePage'
import { NoContentPage } from '@/pages/NoContentPage'
import { ArchitecturePage } from '@/pages/sections/ArchitecturePage'
import { ApiReferencePage } from '@/pages/sections/ApiReferencePage'
import { DataModelsPage } from '@/pages/sections/DataModelsPage'
import { InfrastructurePage } from '@/pages/sections/InfrastructurePage'
import { SecurityPage } from '@/pages/sections/SecurityPage'
import { DevOpsPage } from '@/pages/sections/DevOpsPage'
import { FrontendPage } from '@/pages/sections/FrontendPage'
import { MobilePage } from '@/pages/sections/MobilePage'
import { TestingPage } from '@/pages/sections/TestingPage'
import { AnalyticsPage } from '@/pages/sections/AnalyticsPage'
import { MlPipelinePage } from '@/pages/sections/MlPipelinePage'
import { StoragePage } from '@/pages/sections/StoragePage'
import { NetworkingPage } from '@/pages/sections/NetworkingPage'
import { AuthPage } from '@/pages/sections/AuthPage'

function App() {
  return (
    <BrowserRouter>
      <div className="bg-surface font-sans text-on-surface antialiased">
        <Sidebar />
        <MobileHeader />
        <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
          <Routes>
            <Route path="/"               element={<HomePage />} />
            <Route path="/architecture"   element={<ArchitecturePage />} />
            <Route path="/api"            element={<ApiReferencePage />} />
            <Route path="/data-models"    element={<DataModelsPage />} />
            <Route path="/infrastructure" element={<InfrastructurePage />} />
            <Route path="/security"       element={<SecurityPage />} />
            <Route path="/devops"         element={<DevOpsPage />} />
            <Route path="/frontend"       element={<FrontendPage />} />
            <Route path="/mobile"         element={<MobilePage />} />
            <Route path="/testing"        element={<TestingPage />} />
            <Route path="/analytics"      element={<AnalyticsPage />} />
            <Route path="/ml-pipeline"    element={<MlPipelinePage />} />
            <Route path="/storage"        element={<StoragePage />} />
            <Route path="/networking"     element={<NetworkingPage />} />
            <Route path="/auth"           element={<AuthPage />} />
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
