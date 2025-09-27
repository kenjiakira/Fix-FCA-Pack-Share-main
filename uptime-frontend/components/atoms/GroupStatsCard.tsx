import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, Crown, TrendingUp } from 'lucide-react'

interface GroupStatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function GroupStatsCard({ title, value, icon, description, trend }: GroupStatsCardProps) {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-slate-600 dark:text-slate-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={`h-3 w-3 mr-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <span 
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Predefined stat cards
export function TotalGroupsCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="Tổng số nhóm"
      value={value}
      icon={<Users className="h-4 w-4" />}
      description="Tất cả nhóm trong hệ thống"
    />
  )
}

export function ActiveGroupsCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="Nhóm hoạt động"
      value={value}
      icon={<MessageSquare className="h-4 w-4" />}
      description="Nhóm đang hoạt động"
    />
  )
}

export function TotalMembersCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="Tổng thành viên"
      value={value}
      icon={<Users className="h-4 w-4" />}
      description="Tất cả thành viên"
    />
  )
}

export function TotalAdminsCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="Tổng Admin"
      value={value}
      icon={<Crown className="h-4 w-4" />}
      description="Tất cả admin nhóm"
    />
  )
}

export function TotalMessagesCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="Tổng tin nhắn"
      value={value}
      icon={<MessageSquare className="h-4 w-4" />}
      description="Tất cả tin nhắn"
    />
  )
}

export function AverageMembersCard({ value }: { value: number }) {
  return (
    <GroupStatsCard
      title="TB thành viên/nhóm"
      value={value}
      icon={<Users className="h-4 w-4" />}
      description="Trung bình thành viên mỗi nhóm"
    />
  )
}
