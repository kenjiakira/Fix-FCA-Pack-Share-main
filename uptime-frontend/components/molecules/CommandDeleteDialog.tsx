import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, X, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Command } from '@/components/types/command'

interface CommandDeleteDialogProps {
  command: Command | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (command: Command) => Promise<void>
}

export function CommandDeleteDialog({ 
  command, 
  open, 
  onOpenChange, 
  onDelete 
}: CommandDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!command) return

    if (confirmText !== command.name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập chính xác tên lệnh để xác nhận xóa",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await onDelete(command)
      
      toast({
        title: "Thành công",
        description: "Đã xóa lệnh thành công",
      })
      
      onOpenChange(false)
      setConfirmText('')
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa lệnh. Vui lòng thử lại",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onOpenChange(false)
  }

  if (!command) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Xác nhận xóa lệnh
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Hành động này không thể hoàn tác. Lệnh sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Command Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Tên lệnh:</span>
                <span className="font-mono text-blue-600">/{command.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Danh mục:</span>
                <span className="text-slate-600 dark:text-slate-400">{command.category}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Số lần sử dụng:</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {(command.usageCount || 0).toLocaleString()}
                </span>
              </div>
              
              {command.description && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-white">Mô tả:</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {command.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Cảnh báo quan trọng
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• Lệnh sẽ bị xóa vĩnh viễn khỏi hệ thống</li>
                  <li>• Tất cả dữ liệu liên quan sẽ bị mất</li>
                  <li>• Người dùng sẽ không thể sử dụng lệnh này nữa</li>
                  <li>• Hành động này không thể hoàn tác</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Để xác nhận xóa, vui lòng nhập: <span className="font-mono text-red-600">{command.name}</span>
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Nhập "${command.name}" để xác nhận`}
              className="font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Hủy bỏ</span>
            </Button>
            
            <Button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== command.name}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isLoading ? 'Đang xóa...' : 'Xóa lệnh'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

