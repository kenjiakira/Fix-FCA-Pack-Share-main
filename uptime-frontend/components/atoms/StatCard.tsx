import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  gradientFrom: string
  gradientTo: string
  iconBgColor: string
  iconColor: string
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  iconBgColor, 
  iconColor 
}: StatCardProps) {
  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`p-2 ${iconBgColor} rounded-lg`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
