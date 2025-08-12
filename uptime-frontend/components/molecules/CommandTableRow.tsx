import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CommandBadge } from '@/components/atoms/CommandBadge'
import { MoreHorizontal, Eye, Edit, Copy, Play, Pause, Settings } from 'lucide-react'
import { Command } from '@/components/types/command'

interface CommandTableRowProps {
  command: Command
  onViewDetails: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (command: Command) => void
  onToggleStatus: (command: Command) => void
  onCopy: (command: Command) => void
}

export function CommandTableRow({ 
  command, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onCopy 
}: CommandTableRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleStatus = async () => {
    setIsLoading(true)
    try {
      await onToggleStatus(command)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    onCopy(command)
  }

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
              /{command.name}
            </span>
            {command.isActive !== false && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm text-slate-900 dark:text-white truncate">
            {command.description || 'Không có mô tả'}
          </p>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <CommandBadge type="category" value={command.category || 'Khác'} />
      </td>
      
      <td className="px-4 py-3">
        <Badge 
          variant={command.permissions === 'Tất cả người dùng' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {command.permissions || 'Tất cả người dùng'}
        </Badge>
      </td>
      
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {command.cooldown || 0}s
        </span>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(command)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            {command.isActive !== false ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg" sideOffset={5}>
              <DropdownMenuItem 
                onClick={() => onEdit(command)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleCopy}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Sao chép tên</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDelete(command)}
                className="flex items-center space-x-2 hover:text-red-700"
              >
                <Settings className="h-4 w-4" />
                <span>Xóa lệnh</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}
