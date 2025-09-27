import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Plus, X, UserCheck, UserX } from 'lucide-react'
import { GroupDetail, AdminAction } from '@/src/services/groupApi'
import { useToast } from '@/hooks/use-toast'
import UserInfo from './UserInfo'

interface AdminManagementDialogProps {
  group: GroupDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onManageAdmins: (threadId: string, action: AdminAction) => Promise<void>
}

export function AdminManagementDialog({ group, open, onOpenChange, onManageAdmins }: AdminManagementDialogProps) {
  const { toast } = useToast()
  const [newAdminId, setNewAdminId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!group) return null

  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ID Admin",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await onManageAdmins(group.id, {
        action: 'add_admin',
        userId: newAdminId.trim()
      })
      setNewAdminId('')
      toast({
        title: "Thành công",
        description: "Đã thêm Admin thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm Admin",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Admin ${adminId}?`)) {
      return
    }

    setIsLoading(true)
    try {
      await onManageAdmins(group.id, {
        action: 'remove_admin',
        userId: adminId
      })
      toast({
        title: "Thành công",
        description: "Đã xóa Admin thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa Admin",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span>Quản lý Admin - {group.name}</span>
          </DialogTitle>
          <DialogDescription>
            Thêm hoặc xóa Admin cho nhóm này
          </DialogDescription>
        </DialogHeader>

                 <div className="space-y-6">
           {/* Add Admin */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center space-x-2">
                 <Plus className="h-5 w-5 text-green-600" />
                 <span>Thêm Admin mới</span>
               </CardTitle>
               <p className="text-sm text-slate-600 dark:text-slate-400">
                 Nhập ID của người dùng để thêm làm Admin cho nhóm này
               </p>
             </CardHeader>
                         <CardContent>
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                   <Label htmlFor="newAdminId" className="text-sm font-medium">ID Admin</Label>
                   <Input
                     id="newAdminId"
                     placeholder="Nhập ID Admin (ví dụ: 61573427362389)..."
                     value={newAdminId}
                     onChange={(e) => setNewAdminId(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
                     className="mt-1"
                   />
                 </div>
                 <Button
                   onClick={handleAddAdmin}
                   disabled={isLoading || !newAdminId.trim()}
                   className="mt-6 sm:mt-0"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Thêm Admin
                 </Button>
               </div>
             </CardContent>
          </Card>

                     {/* Current Admins */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center space-x-2">
                 <Crown className="h-5 w-5 text-yellow-600" />
                 <span>Danh sách Admin ({group.admins.length})</span>
               </CardTitle>
               <p className="text-sm text-slate-600 dark:text-slate-400">
                 Quản lý danh sách Admin hiện tại của nhóm
               </p>
             </CardHeader>
             <CardContent>
               {group.admins.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {group.admins.map((adminId) => (
                     <div key={adminId} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                       <UserInfo
                         uid={adminId}
                         name={`Admin ${adminId}`}
                         size="md"
                       />
                       <div className="flex items-center space-x-2">
                         <Badge variant="secondary" className="text-xs">Admin</Badge>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleRemoveAdmin(adminId)}
                           disabled={isLoading}
                           className="text-red-600 hover:text-red-700"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <Crown className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                   <p className="text-slate-500">Chưa có Admin nào</p>
                 </div>
               )}
             </CardContent>
           </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
