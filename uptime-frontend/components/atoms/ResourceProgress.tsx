import { Progress } from '@/components/ui/progress'
import { LucideIcon, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResourceProgressProps {
  icon: LucideIcon
  label: string
  value: number
  iconColor: string
  className?: string
  showIcon?: boolean
}

export function ResourceProgress({ 
  icon: Icon, 
  label, 
  value, 
  iconColor, 
  className = "",
  showIcon = true
}: ResourceProgressProps) {
  const getStatusColor = (usage: number) => {
    if (usage < 50) return 'text-green-600'
    if (usage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (usage: number) => {
    if (usage < 50) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (usage < 80) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getProgressColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500'
    if (usage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showIcon && <Icon className={cn("h-4 w-4", iconColor)} />}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", getStatusColor(value))}>
            {value}%
          </span>
          {getStatusIcon(value)}
        </div>
      </div>
      <div className="relative">
        <Progress 
          value={value} 
          className="h-2 bg-slate-200 dark:bg-slate-700" 
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-2 rounded-full transition-all duration-300",
            getProgressColor(value)
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
