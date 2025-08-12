import { 
  Home, 
  Command, 
  Users, 
  Monitor, 
  BarChart3, 
  Settings,
  Crown,
  X,
  ChevronRight,
  DollarSign,
  Shield
} from 'lucide-react'
import SidebarItem from '@/components/molecules/SidebarItem'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  badge?: string
}

interface SidebarProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: <Home className="h-5 w-5" />,
    description: 'Dashboard chính'
  },
  {
    id: 'commands',
    label: 'Quản lý lệnh',
    icon: <Command className="h-5 w-5" />,
    description: 'Thống kê và quản lý lệnh',
  },
  {
    id: 'users',
    label: 'Người dùng',
    icon: <Users className="h-5 w-5" />,
    description: 'Quản lý người dùng'
  },
  {
    id: 'admin',
    label: 'Admin Management',
    icon: <Shield className="h-5 w-5" />,
    description: 'Quản lý admin và moderator'
  },
  {
    id: 'vip',
    label: 'Quản lý VIP',
    icon: <Crown className="h-5 w-5" />,
    description: 'Quản lý người dùng VIP',
  },
  {
    id: 'currencies',
    label: 'Quản lý Tiền tệ',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Quản lý hệ thống tiền tệ',
  },
  {
    id: 'system',
    label: 'Hệ thống',
    icon: <Monitor className="h-5 w-5" />,
    description: 'Thông tin hệ thống'
  },

  {
    id: 'settings',
    label: 'Cài đặt',
    icon: <Settings className="h-5 w-5" />,
    description: 'Cấu hình hệ thống'
  }
]

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  isMobileOpen = false,
  onMobileClose 
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out",
        "w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700",
        "shadow-lg lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                description={item.description}
                badge={item.badge}
                isActive={activeTab === item.id}
                onClick={onTabChange}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Premium Dashboard
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phiên bản nâng cao
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
