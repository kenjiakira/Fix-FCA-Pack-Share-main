import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Zap, Bot, Clock, ShieldCheck } from 'lucide-react'

interface AdminConfig {
  prefix: string
  botName: string
  ownerName: string
  facebookLink: string
  adminUIDs: string[]
  moderatorUIDs: string[]
  supportUIDs: string[]
  feedbackGroupID: string[]
  resend: boolean
  notilogs: boolean
  restart: boolean
  restartTime: number
  mtnMode: boolean
  customCommands: any
}

interface BotSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AdminConfig | null
  onConfigChange: (config: AdminConfig) => void
  onSave: () => void
}

export default function BotSettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onSave
}: BotSettingsDialogProps) {
  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Cài đặt Bot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin Cơ bản</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bot-prefix" className="text-sm font-medium text-gray-700">Prefix</Label>
                <Input
                  id="bot-prefix"
                  value={config.prefix}
                  onChange={(e) => onConfigChange({ ...config, prefix: e.target.value })}
                  className="mt-1 h-9 text-sm border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="bot-name" className="text-sm font-medium text-gray-700">Tên Bot</Label>
                <Input
                  id="bot-name"
                  value={config.botName}
                  onChange={(e) => onConfigChange({ ...config, botName: e.target.value })}
                  className="mt-1 h-9 text-sm border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="owner-name" className="text-sm font-medium text-gray-700">Tên Chủ sở hữu</Label>
                <Input
                  id="owner-name"
                  value={config.ownerName}
                  onChange={(e) => onConfigChange({ ...config, ownerName: e.target.value })}
                  className="mt-1 h-9 text-sm border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="restart-time" className="text-sm font-medium text-gray-700">Thời gian khởi động lại (phút)</Label>
                <Input
                  id="restart-time"
                  type="number"
                  value={config.restartTime}
                  onChange={(e) => onConfigChange({ ...config, restartTime: parseInt(e.target.value) })}
                  className="mt-1 h-9 text-sm border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="facebook-link" className="text-sm font-medium text-gray-700">Liên kết Facebook</Label>
              <Input
                id="facebook-link"
                value={config.facebookLink}
                onChange={(e) => onConfigChange({ ...config, facebookLink: e.target.value })}
                className="mt-1 h-9 text-sm border-gray-200 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cài đặt Hệ thống</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4 text-gray-600" />
                  <div>
                    <Label htmlFor="resend" className="text-sm font-medium text-gray-900">Chế độ Gửi lại</Label>
                    <p className="text-xs text-gray-500">Tự động gửi lại tin nhắn đã thu hồi</p>
                  </div>
                </div>
                <Switch
                  id="resend"
                  checked={config.resend}
                  onCheckedChange={(checked) => onConfigChange({ ...config, resend: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <div>
                    <Label htmlFor="notilogs" className="text-sm font-medium text-gray-900">Nhật ký Thông báo</Label>
                    <p className="text-xs text-gray-500">Ghi lại các thông báo hệ thống</p>
                  </div>
                </div>
                <Switch
                  id="notilogs"
                  checked={config.notilogs}
                  onCheckedChange={(checked) => onConfigChange({ ...config, notilogs: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <div>
                    <Label htmlFor="restart" className="text-sm font-medium text-gray-900">Tự động Khởi động lại</Label>
                    <p className="text-xs text-gray-500">Tự động khởi động lại bot theo lịch</p>
                  </div>
                </div>
                <Switch
                  id="restart"
                  checked={config.restart}
                  onCheckedChange={(checked) => onConfigChange({ ...config, restart: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="h-4 w-4 text-gray-600" />
                  <div>
                    <Label htmlFor="mtn-mode" className="text-sm font-medium text-gray-900">Chế độ Bảo trì</Label>
                    <p className="text-xs text-gray-500">Giới hạn quyền truy cập trong bảo trì</p>
                  </div>
                </div>
                <Switch
                  id="mtn-mode"
                  checked={config.mtnMode}
                  onCheckedChange={(checked) => onConfigChange({ ...config, mtnMode: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 hover:bg-gray-50 h-9 px-4"
            >
              Hủy bỏ
            </Button>
            <Button 
              size="sm"
              onClick={onSave} 
              className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
            >
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
