import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, MessageSquare, Calendar, TrendingUp, Activity, UserCheck, UserX } from 'lucide-react'  
import { GroupDetail } from '@/src/services/groupApi'
import UserInfo from './UserInfo'

interface GroupDetailDialogProps {
  group: GroupDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (group: GroupDetail) => void
  onManageAdmins: (group: GroupDetail) => void
}

export function GroupDetailDialog({ group, open, onOpenChange, onEdit, onManageAdmins }: GroupDetailDialogProps) {
  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Chi tiết nhóm: {group.name}</span>
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về nhóm và hoạt động của thành viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ID nhóm</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{group.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên nhóm</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{group.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</Label>
                  <div className="mt-1">
                    <Badge variant={group.isActive ? 'default' : 'secondary'}>
                      {group.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày tạo</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{group.memberCount}</span>
                  </div>
                  <p className="text-sm text-slate-600">Thành viên</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="text-2xl font-bold">{group.adminCount}</span>
                  </div>
                  <p className="text-sm text-slate-600">Admin</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{group.totalMessages}</span>
                  </div>
                  <p className="text-sm text-slate-600">Tin nhắn</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-2xl font-bold">{group.statistics.activityLevel}</span>
                  </div>
                  <p className="text-sm text-slate-600">Hoạt động</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Active Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Top thành viên hoạt động</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                             {group.statistics.topMembers.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {group.statistics.topMembers.map((member, index) => (
                     <div key={member.userId} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                       <div className="flex items-center space-x-3">
                         <Badge variant="outline" className="w-8 h-8 flex items-center justify-center text-xs font-bold">
                           {index + 1}
                         </Badge>
                         <UserInfo
                           uid={member.userId}
                           name={`Thành viên ${member.userId}`}
                           size="md"
                         />
                       </div>
                       <div className="flex items-center space-x-2">
                         <MessageSquare className="h-4 w-4 text-slate-400" />
                         <span className="text-sm font-semibold">{member.count} tin nhắn</span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                   <p className="text-slate-500">Chưa có dữ liệu hoạt động</p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Admin Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <span>Quản lý Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Số lượng Admin: {group.adminCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageAdmins(group)}
                    className="flex items-center space-x-2"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Quản lý Admin</span>
                  </Button>
                </div>
                                 {group.admins.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {group.admins.map((adminId) => (
                       <div key={adminId} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                         <UserInfo
                           uid={adminId}
                           name={`Admin ${adminId}`}
                           size="md"
                         />
                         <Badge variant="secondary" className="text-xs">Admin</Badge>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-6">
                     <Crown className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                     <p className="text-slate-500">Chưa có Admin nào</p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button onClick={() => onEdit(group)}>
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
