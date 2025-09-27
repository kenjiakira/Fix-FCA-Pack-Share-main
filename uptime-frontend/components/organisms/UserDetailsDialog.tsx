import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/atoms/UserAvatar'
import WarningHistory from '@/components/molecules/WarningHistory'

interface UserDetails {
  userId: string
  name: string
  exp: number
  level: number
  rank: string
  lastActive: number
  warnings: any[]
  transactions: any[]
  avatar?: string | null
  stats: {
    totalWarnings: number
    totalTransactions: number
    totalSpent: number
    daysSinceJoin: number
    daysSinceLastActive: number
  }
}

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserDetails | null
  formatDate: (timestamp: number) => string
}

export default function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  formatDate
}: UserDetailsDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <UserAvatar avatar={user.avatar} name={user.name} size="lg" />
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.userId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ID người dùng</Label>
              <p className="text-sm">{user.userId}</p>
            </div>
            <div>
              <Label>Tên</Label>
              <p className="text-sm">{user.name}</p>
            </div>
            <div>
              <Label>Level</Label>
              <p className="text-sm">{user.level}</p>
            </div>
            <div>
              <Label>Exp</Label>
              <p className="text-sm">{user.exp?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <Label>Rank</Label>
              <p className="text-sm">{user.rank}</p>
            </div>
            <div>
              <Label>Số cảnh báo</Label>
              <p className="text-sm">{user.stats?.totalWarnings || user.warnings?.length || 0}</p>
            </div>
          </div>
          
          <WarningHistory warnings={user.warnings || []} formatDate={formatDate} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
