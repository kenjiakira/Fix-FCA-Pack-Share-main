import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import UserListItem from '@/components/molecules/UserListItem'
import { getRankIcon, getRankColor } from '@/components/utils/rankUtils'

interface RecentActivityCardProps {
  users: Array<{
    id: string
    name: string
    avatar?: string | null
    level: number
    rank: string
  }>
}

export default function RecentActivityCard({ users }: RecentActivityCardProps) {

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-600" />
          <span>Hoạt động gần đây</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length > 0 ? (
            users.slice(0, 5).map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                rankIcon={getRankIcon(user.rank)}
                rankColorClass={getRankColor(user.rank)}
              />
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              Không có dữ liệu người dùng
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
