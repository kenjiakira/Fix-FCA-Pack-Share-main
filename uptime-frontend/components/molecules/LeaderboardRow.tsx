import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/atoms/UserAvatar'
import RankBadge from '@/components/atoms/RankBadge'
import { LucideIcon } from 'lucide-react'

interface LeaderboardRowProps {
  user: {
    id: string
    name: string
    avatar?: string | null
    level: number
    exp: number
    rank: string
    lastActive: string
  }
  index: number
  rankIcon: LucideIcon
  rankColorClass: string
  formatDate: (dateString: string) => string
}

export default function LeaderboardRow({ 
  user, 
  index, 
  rankIcon, 
  rankColorClass, 
  formatDate 
}: LeaderboardRowProps) {
  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <TableCell>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">#{index + 1}</span>
          {index < 3 && (
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-yellow-500' : 
              index === 1 ? 'bg-gray-400' : 'bg-orange-500'
            }`} />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <UserAvatar src={user.avatar} name={user.name} />
          <span className="font-medium">{user.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-medium">{user.level}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{user.exp.toLocaleString()}</span>
      </TableCell>
      <TableCell>
        <RankBadge rank={user.rank} icon={rankIcon} className={rankColorClass} />
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-500">{formatDate(user.lastActive)}</span>
      </TableCell>
    </TableRow>
  )
}
