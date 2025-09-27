'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommandManagementDialog } from './CommandManagementDialog'
import { QuickCommandManagementButton } from './QuickCommandManagementButton'
import { Command } from '@/components/types/command'
import { Settings, Code, Users, Crown } from 'lucide-react'

// Dữ liệu demo
const demoCommands: Command[] = [
  {
    name: 'help',
    description: 'Hiển thị danh sách lệnh và hướng dẫn sử dụng',
    category: 'Tiện ích',
    info: 'Lệnh trợ giúp chính của bot',
    usages: 'help [tên lệnh/số trang]',
    cooldowns: 5,
    onPrefix: true,
    usedby: 0,
    isActive: true,
    usageCount: 1250,
    lastUsed: '2024-01-15T10:30:00Z',
    fileSize: '2.5 KB'
  },
  {
    name: 'admin',
    description: 'Quản lý quyền admin và moderator',
    category: 'Admin',
    info: 'Hệ thống quản lý admin',
    usages: 'admin [add/remove/list] [userID]',
    cooldowns: 10,
    onPrefix: true,
    usedby: 5,
    isActive: true,
    usageCount: 45,
    lastUsed: '2024-01-14T15:20:00Z',
    fileSize: '8.1 KB'
  },
  {
    name: 'game',
    description: 'Các mini game giải trí',
    category: 'Game',
    info: 'Hệ thống game mini',
    usages: 'game [tên game] [tham số]',
    cooldowns: 3,
    onPrefix: true,
    usedby: 1,
    isActive: true,
    usageCount: 890,
    lastUsed: '2024-01-15T09:15:00Z',
    fileSize: '15.2 KB'
  }
]

export function CommandManagementDemo() {
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)
  const [managementDialogOpen, setManagementDialogOpen] = useState(false)

  const handleManageCommand = (command: Command) => {
    setSelectedCommand(command)
    setManagementDialogOpen(true)
  }

  const handleCommandUpdated = () => {
    // Có thể thêm logic refresh data ở đây
    console.log('Command updated, refreshing data...')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Admin':
        return <Crown className="h-4 w-4" />
      case 'Game':
        return <Code className="h-4 w-4" />
      case 'Tiện ích':
        return <Settings className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Demo: Quản lý lệnh Bot
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Click vào nút "Quản lý" để mở popup quản lý lệnh nâng cao
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoCommands.map((command) => (
          <Card key={command.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(command.category || '')}
                  <span className="font-mono text-sm">/{command.name}</span>
                </div>
                <Badge variant={command.isActive ? 'default' : 'secondary'}>
                  {command.isActive ? 'Hoạt động' : 'Tạm dừng'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {command.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Danh mục: {command.category}</span>
                <span>Cooldown: {command.cooldowns}s</span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sử dụng: {command.usageCount} lần</span>
                <span>Quyền: {command.usedby === 0 ? 'Tất cả' : `Level ${command.usedby}`}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <QuickCommandManagementButton
                  command={command}
                  variant="outline"
                  size="sm"
                  onCommandUpdated={handleCommandUpdated}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManageCommand(command)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Mở popup
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Tính năng của popup quản lý lệnh:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Chỉnh sửa:</strong> Thay đổi thông tin lệnh (tên, mô tả, cooldown, quyền hạn)</li>
          <li>• <strong>Mã nguồn:</strong> Xem và chỉnh sửa mã nguồn lệnh trực tiếp</li>
          <li>• <strong>Cài đặt:</strong> Kích hoạt/vô hiệu hóa lệnh, xem thống kê sử dụng</li>
          <li>• <strong>Hành động:</strong> Xuất lệnh, tải lại mã nguồn, xóa lệnh</li>
          <li>• <strong>Quản lý nâng cao:</strong> Sao chép mã nguồn, backup, restore</li>
        </ul>
      </div>

      <CommandManagementDialog
        command={selectedCommand}
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        onCommandUpdated={handleCommandUpdated}
      />
    </div>
  )
}

