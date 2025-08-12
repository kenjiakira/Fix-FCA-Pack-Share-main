import { Power, RefreshCw, Bell, Search, Menu, Activity, Zap } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import StatusIndicator from '@/components/atoms/StatusIndicator'
import ActionButton from '@/components/molecules/ActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  isRunning: boolean
  onRefresh: () => void
  onRestart: () => void
  onToggleSidebar?: () => void
}

export default function DashboardHeader({ 
  isRunning, 
  onRefresh, 
  onRestart,
  onToggleSidebar
}: DashboardHeaderProps) {
  return (
    <header className="border-b bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 sticky top-0 z-50 shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl ">
              <img 
                src="/assets/images/logo.png" 
                alt="Bot Logo" 
                className="h-8 w-8 object-contain drop-shadow-sm"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Bot Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Quản lý hệ thống bot
              </p>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm lệnh, người dùng..."
              className="pl-10 bg-slate-50/80 border-slate-200 focus:bg-white dark:bg-slate-800/80 dark:border-slate-600 dark:focus:bg-slate-700 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Bot Status */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200",
              isRunning 
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            )}>
              <StatusIndicator isRunning={isRunning} showLabel={false} />
              <span className={cn(
                "text-sm font-semibold",
                isRunning 
                  ? "text-green-700 dark:text-green-300" 
                  : "text-red-700 dark:text-red-300"
              )}>
                {isRunning ? 'Đang hoạt động' : 'Đã dừng'}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ActionButton
              icon={Zap}
              text="Khởi động lại"
              onClick={onRestart}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border-2 border-slate-200 dark:border-slate-600 shadow-md">
              <AvatarImage src="/api/placeholder/36/36" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Quản trị viên
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

