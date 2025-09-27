import { Crown, Shield, Headphones, Users } from 'lucide-react'
import AdminStatsCard from '@/components/atoms/AdminStatsCard'

interface AdminStatsGridProps {
  stats: {
    admins: number
    moderators: number
    support: number
    total: number
  }
}

export default function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Quản trị viên"
        value={stats.admins}
        icon={Crown}
        iconColor="text-red-500"
      />
      <AdminStatsCard
        title="Điều hành viên"
        value={stats.moderators}
        icon={Shield}
        iconColor="text-blue-500"
      />
      <AdminStatsCard
        title="Hỗ trợ viên"
        value={stats.support}
        icon={Headphones}
        iconColor="text-green-500"
      />
      <AdminStatsCard
        title="Tổng nhân viên"
        value={stats.total}
        icon={Users}
        iconColor="text-gray-600"
      />
    </div>
  )
}
