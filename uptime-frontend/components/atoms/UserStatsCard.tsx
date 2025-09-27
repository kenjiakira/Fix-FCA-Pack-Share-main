import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface UserStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  subtitle?: string
}

export default function UserStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-gray-600",
  subtitle 
}: UserStatsCardProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
