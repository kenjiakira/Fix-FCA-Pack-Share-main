import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/atoms/UserAvatar'
import RankIcon from '@/components/atoms/RankIcon'
import StatusBadge from '@/components/atoms/StatusBadge'

interface User {
  userId: string
  name: string
  exp: number
  level: number
  rank: string
  lastActive: number
  warnings: number
  isBanned: boolean
  status: string
  joinDate: number
  avatar?: string | null
}

interface UserTableRowProps {
  user: User
  onViewDetails: (userId: string) => void
  onWarnUser: (userId: string) => void
  onBanUser: (userId: string) => void
  onUnbanUser: (userId: string) => void
}

export default function UserTableRow({ 
  user, 
  onViewDetails, 
  onWarnUser, 
  onBanUser, 
  onUnbanUser 
}: UserTableRowProps) {
  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <TableCell>
        <div className="flex items-center space-x-3">
          <UserAvatar avatar={user.avatar} name={user.name} size="sm" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.userId}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">Level {user.level}</p>
          <p className="text-sm text-gray-500">{user.exp.toLocaleString()} exp</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <RankIcon rank={user.rank} />
          <span className="font-medium">{user.rank}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge isBanned={user.isBanned} warnings={user.warnings} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(user.userId)}
          >
            Chi tiết
          </Button>
          {!user.isBanned && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWarnUser(user.userId)}
              >
                Cảnh báo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBanUser(user.userId)}
              >
                Cấm
              </Button>
            </>
          )}
          {user.isBanned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnbanUser(user.userId)}
            >
              Bỏ cấm
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
