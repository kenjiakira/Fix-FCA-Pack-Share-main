import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  id: string
  label: string
  icon: ReactNode
  description: string
  isActive: boolean
  onClick: (id: string) => void
  badge?: string
}

export default function SidebarItem({
  id,
  label,
  icon,
  description,
  isActive,
  onClick,
  badge
}: SidebarItemProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {/* Icon container */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200",
        isActive 
          ? "bg-white/20 text-white" 
          : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
      )}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-medium">{label}</div>
          {badge && (
            <Badge 
              variant={isActive ? "secondary" : "default"}
              className={cn(
                "text-xs px-2 py-0.5",
                isActive 
                  ? "bg-white/20 text-white border-white/30" 
                  : "bg-blue-600 text-white"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className={cn(
          "text-xs transition-colors duration-200",
          isActive 
            ? "text-blue-100" 
            : "text-slate-500 dark:text-slate-400"
        )}>
          {description}
        </div>
      </div>
    </button>
  )
}
