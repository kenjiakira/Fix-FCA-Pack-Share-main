import StatMetric from '@/components/atoms/StatMetric'
import { Users, Activity, TrendingUp, Zap } from 'lucide-react'

interface StatsOverviewProps {
  totalUsers: number
  activeUsers: number
  averageLevel: number
  averageExp: number
}

export default function StatsOverview({
  totalUsers,
  activeUsers,
  averageLevel,
  averageExp
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatMetric
        icon={Users}
        label="Tổng người dùng"
        value={totalUsers}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-800/50"
        gradientFrom="from-blue-50"
        gradientTo="to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
      />
      
      <StatMetric
        icon={TrendingUp}
        label="Level trung bình"
        value={averageLevel.toFixed(1)}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-800/50"
        gradientFrom="from-purple-50"
        gradientTo="to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
      />
      
      <StatMetric
        icon={Zap}
        label="Exp trung bình"
        value={averageExp}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-800/50"
        gradientFrom="from-orange-50"
        gradientTo="to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
      />
    </div>
  )
}
