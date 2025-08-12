import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatMetricProps {
  icon: LucideIcon
  label: string
  value: string | number
  iconColor: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

export default function StatMetric({
  icon: Icon,
  label,
  value,
  iconColor,
  bgColor,
  gradientFrom,
  gradientTo
}: StatMetricProps) {
  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`p-2 ${bgColor} rounded-lg`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
