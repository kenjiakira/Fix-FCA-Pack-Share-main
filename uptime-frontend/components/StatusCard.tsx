import { LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatusCardProps {
  title: string
  value: number
  unit?: string
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'danger' | 'blue' | 'green' | 'purple' | 'orange'
  trend?: 'up' | 'down' | 'stable'
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    icon: 'text-primary-500',
    badge: 'bg-primary-100 text-primary-800'
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    icon: 'text-success-500',
    badge: 'bg-success-100 text-success-800'
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    icon: 'text-warning-500',
    badge: 'bg-warning-100 text-warning-800'
  },
  danger: {
    bg: 'bg-danger-50',
    text: 'text-danger-600',
    icon: 'text-danger-500',
    badge: 'bg-danger-100 text-danger-800'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-800'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-800'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-800'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-800'
  }
}

export default function StatusCard({ title, value, unit, icon, color, trend }: StatusCardProps) {
  const colors = colorClasses[color]
  const [currentValue, setCurrentValue] = useState(value)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  
  // Update current value when prop changes (from server)
  useEffect(() => {
    setCurrentValue(value)
    setLastUpdateTime(Date.now())
  }, [value])
  
  // Real-time update for uptime
  useEffect(() => {
    if (title === 'Uptime') {
      const interval = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - lastUpdateTime) / 1000)
        setCurrentValue(value + elapsed)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [title, value, lastUpdateTime])
  
  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    return val.toString()
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const displayValue = title === 'Uptime' ? formatUptime(currentValue) : formatValue(currentValue)

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${colors.bg}`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
              {unit && (
                <Badge variant="secondary" className={colors.badge}>
                  {unit}
                </Badge>
              )}
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {displayValue}
            </p>
            {trend && (
              <div className="flex items-center mt-1">
                <div className={`text-xs ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} 
                  {trend === 'up' ? 'Tăng' : trend === 'down' ? 'Giảm' : 'Ổn định'}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
