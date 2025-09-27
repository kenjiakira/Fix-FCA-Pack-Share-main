'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommandManagementDialog } from './CommandManagementDialog'
import { Command } from '@/components/types/command'
import { commandService } from '@/src/services/api'
import { useToast } from '@/hooks/use-toast'
import { PermissionBadge } from '@/components/atoms/PermissionBadge'
import { Settings, Code, Users, Crown, RefreshCw } from 'lucide-react'

export function CommandManagementTest() {
  const { toast } = useToast()
  const [commands, setCommands] = useState<Command[]>([])
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)
  const [managementDialogOpen, setManagementDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCommands()
  }, [])

  const loadCommands = async () => {
    try {
      setLoading(true)
      const response = await commandService.getCommands()
      const data = response.data || response
      setCommands(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading commands:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManageCommand = (command: Command) => {
    setSelectedCommand(command)
    setManagementDialogOpen(true)
  }

  const handleCommandUpdated = () => {
    loadCommands() // Reload commands after update
    toast({
      title: "Thành công",
      description: "Danh sách lệnh đã được cập nhật",
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Test: Quản lý lệnh Bot
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Kiểm tra tính năng quản lý lệnh với dữ liệu thực từ server
          </p>
        </div>
        
        <Button
          onClick={loadCommands}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Đang tải lệnh...</span>
        </div>
      ) : commands.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-slate-500">Không có lệnh nào được tìm thấy</p>
            <Button onClick={loadCommands} className="mt-4">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commands.slice(0, 6).map((command) => (
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
                  {command.description || command.info || 'Không có mô tả'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Danh mục: {command.category || 'Khác'}</span>
                  <span>Cooldown: {command.cooldowns || command.cooldown || 0}s</span>
                </div>
                
                                 <div className="flex items-center justify-between text-xs text-slate-500">
                   <span>Sử dụng: {command.usageCount || 0} lần</span>
                   <span>Quyền: <PermissionBadge usedby={command.usedby} variant="outline" className="text-xs" /></span>
                 </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageCommand(command)}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Quản lý lệnh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          Hướng dẫn test:
        </h3>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Click "Quản lý lệnh" để mở popup quản lý</li>
          <li>• Thử chỉnh sửa thông tin lệnh trong tab "Chỉnh sửa"</li>
          <li>• Xem mã nguồn lệnh trong tab "Mã nguồn"</li>
          <li>• Thử kích hoạt/vô hiệu hóa lệnh trong tab "Cài đặt"</li>
          <li>• Xuất lệnh hoặc xóa lệnh trong tab "Hành động"</li>
          <li>• Lưu thay đổi và kiểm tra xem file lệnh có được cập nhật không</li>
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
