'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Code, 
  FileText, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Eye, 
  Edit3,
  Play,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { commandService } from '@/src/services/api'
import { Command } from '@/components/types/command'
import { useToast } from '@/hooks/use-toast'

interface CommandManagementDialogProps {
  command: Command | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommandUpdated?: () => void
}

export function CommandManagementDialog({
  command,
  open,
  onOpenChange,
  onCommandUpdated
}: CommandManagementDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('edit')
  const [loading, setLoading] = useState(false)
  const [commandCode, setCommandCode] = useState('')
  const [commandData, setCommandData] = useState<Partial<Command>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [commandStatus, setCommandStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    if (command) {
      setCommandData({
        name: command.name || '',
        info: command.info || '',
        category: command.category || '',
        usages: command.usages || '',
        cooldowns: command.cooldowns || 0,
        onPrefix: command.onPrefix || false,
        usedby: command.usedby || 0
      })
      setCommandStatus(command.isActive ? 'active' : 'inactive')
      loadCommandCode()
    }
  }, [command])

  const loadCommandCode = async () => {
    if (!command?.name) return
    
    try {
      setLoading(true)
      const response = await commandService.getCommandCode(command.name)
      // API trả về trực tiếp code hoặc trong response.data
      const code = response.data?.code || response.data || response
      setCommandCode(code || '')
    } catch (error) {
      console.error('Error loading command code:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải mã nguồn lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommand = async () => {
    if (!command?.name) return

    try {
      setLoading(true)
      
      // Chuẩn bị dữ liệu để gửi lên server
      const updateData: any = {}
      
      if (commandData.info) updateData.description = commandData.info
      if (commandData.category) updateData.category = commandData.category
      if (commandData.usages) updateData.usage = commandData.usages
      if (commandData.cooldowns !== undefined) updateData.cooldown = commandData.cooldowns
      if (commandData.usedby !== undefined) {
        // Cập nhật usedby trực tiếp (không cần chuyển đổi permissions)
        updateData.usedby = commandData.usedby
      }
      if (commandData.onPrefix !== undefined) {
        // Cập nhật onPrefix trực tiếp
        updateData.onPrefix = commandData.onPrefix
      }
      if (commandData.dev) updateData.developer = commandData.dev
      
      // Cập nhật thông tin lệnh
      if (Object.keys(updateData).length > 0) {
        await commandService.updateCommand(command.name, updateData)
      }
      
      // Cập nhật mã nguồn nếu đang chỉnh sửa
      if (isEditing && commandCode) {
        await commandService.updateCommandCode(command.name, commandCode)
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật lệnh thành công",
      })

      onCommandUpdated?.()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving command:', error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!command?.name) return

    try {
      setLoading(true)
      const newStatus = commandStatus === 'active' ? false : true
      await commandService.toggleCommandStatus(command.name, newStatus)
      setCommandStatus(newStatus ? 'active' : 'inactive')
      
      toast({
        title: "Thành công",
        description: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} lệnh`,
      })

      onCommandUpdated?.()
    } catch (error) {
      console.error('Error toggling command status:', error)
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCommand = async () => {
    if (!command?.name) return

    if (!confirm(`Bạn có chắc chắn muốn xóa lệnh "${command.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      await commandService.deleteCommand(command.name)
      
      toast({
        title: "Thành công",
        description: "Đã xóa lệnh thành công",
      })

      onOpenChange(false)
      onCommandUpdated?.()
    } catch (error) {
      console.error('Error deleting command:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportCommand = async () => {
    if (!command?.name) return

    try {
      setLoading(true)
      const response = await commandService.exportCommands('json')
      
      // Lấy dữ liệu từ response
      const data = response.data || response
      
      // Tạo file download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${command.name}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Thành công",
        description: "Đã xuất lệnh thành công",
      })
    } catch (error) {
      console.error('Error exporting command:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xuất lệnh",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(commandCode)
    toast({
      title: "Thành công",
      description: "Đã sao chép mã nguồn",
    })
  }

  if (!command) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quản lý lệnh: {command.name}</span>
            <Badge variant={commandStatus === 'active' ? 'default' : 'secondary'}>
              {commandStatus === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
            <TabsTrigger value="code">Mã nguồn</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            <TabsTrigger value="actions">Hành động</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit3 className="h-4 w-4" />
                  <span>Thông tin lệnh</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên lệnh</Label>
                    <Input
                      id="name"
                      value={commandData.name}
                      onChange={(e) => setCommandData({ ...commandData, name: e.target.value })}
                      placeholder="Tên lệnh"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Input
                      id="category"
                      value={commandData.category}
                      onChange={(e) => setCommandData({ ...commandData, category: e.target.value })}
                      placeholder="Danh mục"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="info">Mô tả</Label>
                  <Textarea
                    id="info"
                    value={commandData.info}
                    onChange={(e) => setCommandData({ ...commandData, info: e.target.value })}
                    placeholder="Mô tả lệnh"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usages">Cách sử dụng</Label>
                  <Textarea
                    id="usages"
                    value={commandData.usages}
                    onChange={(e) => setCommandData({ ...commandData, usages: e.target.value })}
                    placeholder="Hướng dẫn sử dụng"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cooldowns">Cooldown (giây)</Label>
                    <Input
                      id="cooldowns"
                      type="number"
                      value={commandData.cooldowns}
                      onChange={(e) => setCommandData({ ...commandData, cooldowns: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="usedby">Quyền sử dụng</Label>
                     <Select
                       value={commandData.usedby?.toString()}
                       onValueChange={(value) => setCommandData({ ...commandData, usedby: parseInt(value) })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Chọn quyền" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="0">Tất cả</SelectItem>
                         <SelectItem value="1">Thành viên</SelectItem>
                         <SelectItem value="2">Admin bot</SelectItem>
                         <SelectItem value="3">Moderator</SelectItem>
                         <SelectItem value="4">Điều hành viên & Admin</SelectItem>
                         <SelectItem value="5">Admin nhóm</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Yêu cầu prefix</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="prefix"
                        checked={commandData.onPrefix}
                        onCheckedChange={(checked) => setCommandData({ ...commandData, onPrefix: checked })}
                      />
                      <span className="text-sm">{commandData.onPrefix ? 'Có' : 'Không'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Mã nguồn</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Square className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      {isEditing ? 'Dừng chỉnh sửa' : 'Chỉnh sửa'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Textarea
                    value={commandCode}
                    onChange={(e) => setCommandCode(e.target.value)}
                    placeholder="Mã nguồn lệnh..."
                    rows={20}
                    className="font-mono text-sm"
                    readOnly={!isEditing}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Cài đặt nâng cao</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trạng thái lệnh</Label>
                    <p className="text-sm text-gray-500">
                      {commandStatus === 'active' ? 'Lệnh đang hoạt động' : 'Lệnh đã bị vô hiệu hóa'}
                    </p>
                  </div>
                  <Button
                    variant={commandStatus === 'active' ? 'destructive' : 'default'}
                    onClick={handleToggleStatus}
                    disabled={loading}
                  >
                    {commandStatus === 'active' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {commandStatus === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Thống kê sử dụng</Label>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold">Lượt sử dụng</div>
                      <div className="text-gray-600">{command.usageCount || 0}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold">Lần cuối sử dụng</div>
                      <div className="text-gray-600">
                        {command.lastUsed ? new Date(command.lastUsed).toLocaleDateString('vi-VN') : 'Chưa sử dụng'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold">Kích thước file</div>
                      <div className="text-gray-600">{command.fileSize || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Hành động</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportCommand}
                    disabled={loading}
                    className="h-20 flex flex-col space-y-2"
                  >
                    <Download className="h-5 w-5" />
                    <span>Xuất lệnh</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={loadCommandCode}
                    disabled={loading}
                    className="h-20 flex flex-col space-y-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Tải lại mã nguồn</span>
                  </Button>
                </div>

                <Separator />

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Các hành động sau đây không thể hoàn tác. Hãy cẩn thận khi thực hiện.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  onClick={handleDeleteCommand}
                  disabled={loading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa lệnh
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveCommand} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
