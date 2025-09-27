import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, Crown, Shield, Headphones } from 'lucide-react'
import UserInfo from './UserInfo'
import RoleBadge from '@/components/atoms/RoleBadge'

interface UserRowProps {
  user: {
    uid: string
    role: string
    type: string
    name: string
    avatar: string | null
  }
  onRemove: (uid: string, role: string) => void
}

export default function UserRow({ user, onRemove }: UserRowProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown
      case 'moderator':
        return Shield
      case 'support':
        return Headphones
      default:
        return null
    }
  }

  const RoleIcon = getRoleIcon(user.role)

  return (
    <TableRow className="border-gray-50 hover:bg-gray-50/50">
      <TableCell>
        <UserInfo 
          avatar={user.avatar} 
          name={user.name} 
          uid={user.uid} 
        />
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} icon={RoleIcon} showIcon={true} />
      </TableCell>
      <TableCell className="capitalize text-gray-600">{user.type}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(user.uid, user.role)}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
