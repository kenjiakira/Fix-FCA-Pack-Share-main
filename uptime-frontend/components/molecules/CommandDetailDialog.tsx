import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommandBadge } from '@/components/atoms/CommandBadge'
import { PermissionBadge } from '@/components/atoms/PermissionBadge'
import { Code, Edit, Copy, Download, Eye, Clock, TrendingUp, AlertTriangle, CheckCircle, Wrench } from 'lucide-react'
import { CommandManagementDialog } from './CommandManagementDialog'

import { Command } from '@/components/types/command'

interface CommandDetailDialogProps {
  command: Command | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (command: Command) => void
  onCopy?: (command: Command) => void
  onCommandUpdated?: () => void
}

export function CommandDetailDialog({ 
  command, 
  open, 
  onOpenChange, 
  onEdit, 
  onCopy,
  onCommandUpdated
}: CommandDetailDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const handleCopy = async () => {
    if (!command) return
    try {
      await navigator.clipboard.writeText(command.name)
      onCopy?.(command)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const [managementDialogOpen, setManagementDialogOpen] = useState(false)

  if (!command) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Chi tiết lệnh: {command.name}
              </span>
              <div className="flex items-center space-x-2 mt-1">
                {command.isActive !== false ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Đang hoạt động</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Đã tạm dừng</span>
                  </div>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Thông tin chi tiết về lệnh và cách sử dụng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên lệnh</Label>
                <p className="text-lg font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                  /{command.name}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Danh mục</Label>
                <div className="mt-1">
                  <CommandBadge type="category" value={command.category} />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  {command.description}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số lần sử dụng</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {(command.usageCount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cooldown</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {command.cooldown || 0}s
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quyền hạn</Label>
                <div className="mt-1">
                  <PermissionBadge usedby={command.usedby} />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aliases</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {(command.aliases || []).length > 0 ? (
                    command.aliases.map(alias => (
                      <Badge key={alias} variant="outline" className="font-mono">
                        {alias}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">Không có</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thống kê</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{command.successRate || 0}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{command.errorRate || 0}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{((command.size || 0) / 1024).toFixed(1)}KB</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">File Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{command.lineCount || 0}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Lines of Code</div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lần chỉnh sửa cuối</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                {formatDate(command.lastModified)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Developer</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                {command.developer || 'Không có thông tin'}
              </p>
            </div>
          </div>

          {/* Usage Information */}
          {command.usage && (
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cách sử dụng</Label>
              <div className="mt-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                  {command.usage}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Sao chép tên</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Xuất file</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setManagementDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <Wrench className="h-4 w-4" />
              <span>Quản lý</span>
            </Button>
            
            {onEdit && (
              <Button
                onClick={() => onEdit(command)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <CommandManagementDialog
      command={command}
      open={managementDialogOpen}
      onOpenChange={setManagementDialogOpen}
      onCommandUpdated={onCommandUpdated}
    />
    </>
  )
}
