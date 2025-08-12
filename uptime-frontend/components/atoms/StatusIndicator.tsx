import { Wifi, WifiOff, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  isRunning: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusIndicator({ 
  isRunning, 
  showLabel = true, 
  size = 'md' 
}: StatusIndicatorProps) {
  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
  }

  const getStatusIcon = (isRunning: boolean) => {
    return isRunning ? <Activity className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />
  }

  const getStatusText = (isRunning: boolean) => {
    return isRunning ? 'Online' : 'Offline'
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "rounded-full shadow-sm",
        getStatusColor(isRunning),
        sizeClasses[size]
      )} />
      
      {showLabel && (
        <Badge 
          variant={isRunning ? "default" : "destructive"} 
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium"
        >
          {getStatusIcon(isRunning)}
          <span className="text-xs">{getStatusText(isRunning)}</span>
        </Badge>
      )}
    </div>
  )
}
