import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import DashboardHeader from '@/components/organisms/DashboardHeader'
import Sidebar from '@/components/organisms/Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  isRunning: boolean
  onRefresh: () => void
  onRestart: () => void
  activeTab: string
  onTabChange: (tabId: string) => void
  error?: string
}

export default function DashboardLayout({
  children,
  isRunning,
  onRefresh,
  onRestart,
  activeTab,
  onTabChange,
  error
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleToggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handleCloseSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardHeader
        isRunning={isRunning}
        onRefresh={onRefresh}
        onRestart={onRestart}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleCloseSidebar}
        />

        <main className="flex-1 p-4 lg:p-6 lg:ml-72 transition-all duration-300">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}
