import UserAvatar from '@/components/atoms/UserAvatar'
import RankBadge from '@/components/atoms/RankBadge'
import { LucideIcon } from 'lucide-react'

interface UserListItemProps {
  user: {
    id: string
    name: string
    avatar?: string | null
    level: number
    rank: string
  }
  rankIcon: LucideIcon
  rankColorClass: string
}

export default function UserListItem({ user, rankIcon, rankColorClass }: UserListItemProps) {
  return (
    <div className="flex items-center space-x-3">
      <UserAvatar src={user.avatar} name={user.name} />
      <div className="flex-1">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-gray-500">Level {user.level}</p>
      </div>
      <RankBadge rank={user.rank} icon={rankIcon} className={rankColorClass} />
    </div>
  )
}
