import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Users, Crown, MessageSquare, Calendar, Settings } from 'lucide-react'
import { Group } from '@/src/services/groupApi'

interface GroupTableRowProps {
  group: Group
  onViewDetails: (group: Group) => void
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
  onManageAdmins: (group: Group) => void
}

export function GroupTableRow({ group, onViewDetails, onEdit, onDelete, onManageAdmins }: GroupTableRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{group.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">{group.id}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={group.isActive ? 'default' : 'secondary'}>
          {group.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{group.memberCount.toLocaleString()}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <span className="font-medium">{group.messageCount.toLocaleString()}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {new Date(group.lastActivity).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onViewDetails(group))}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>Chi tiết</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction(() => onEdit(group))}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => onManageAdmins(group))}>
                <Crown className="h-4 w-4 mr-2" />
                Quản lý Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAction(() => onDelete(group))}
                className="text-red-600 dark:text-red-400"
              >
                <Settings className="h-4 w-4 mr-2" />
                Xóa nhóm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}
