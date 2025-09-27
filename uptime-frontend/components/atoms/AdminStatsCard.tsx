import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface AdminStatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  iconColor?: string
}

export default function AdminStatsCard({ title, value, icon: Icon, iconColor = "text-gray-600" }: AdminStatsCardProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
