import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TotalGroupsCard,
  ActiveGroupsCard,
  TotalMembersCard,
  TotalAdminsCard,
  TotalMessagesCard,
  AverageMembersCard
} from '@/components/atoms/GroupStatsCard'
import { GroupTableRow } from '@/components/molecules/GroupTableRow'
import { GroupDetailDialog } from '@/components/molecules/GroupDetailDialog'
import { AdminManagementDialog } from '@/components/molecules/AdminManagementDialog'
import { groupService, Group, GroupDetail, GroupStats, AdminAction } from '@/src/services/groupApi'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Download,
  Upload
} from 'lucide-react'

export function GroupManagementTab() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadGroups()
    loadGroupStats()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      console.log('Loading groups...')
      const response = await groupService.getGroups()
      console.log('Groups response:', response)
      console.log('Response data:', response.data)

      // Backend returns { success: true, data: groups, total: groups.length }
      const groups = response.data.data
      console.log('Groups:', groups)
      console.log('Groups type:', typeof groups)
      console.log('Is array:', Array.isArray(groups))

      setGroups(Array.isArray(groups) ? groups : [])
    } catch (error: any) {
      console.error('Error loading groups:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast({
        title: "Lỗi",
        description: `Không thể tải danh sách nhóm: ${error.response?.data?.error || error.message}`,
        variant: "destructive"
      })
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const loadGroupStats = async () => {
    try {
      console.log('Loading group stats...')
      const response = await groupService.getGroupStats()
      console.log('Group stats response:', response)
      setGroupStats(response.data.data)
    } catch (error: any) {
      console.error('Error loading group stats:', error)
      console.error('Error details:', error.response?.data || error.message)
    }
  }

  const handleViewDetails = async (group: Group) => {
    try {
      const response = await groupService.getGroupById(group.id)
      setSelectedGroup(response.data.data)
      setDetailDialogOpen(true)
    } catch (error) {
      console.error('Error loading group details:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin chi tiết nhóm",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (group: Group | GroupDetail) => {
    // TODO: Implement edit functionality
    toast({
      title: "Thông báo",
      description: "Tính năng chỉnh sửa nhóm sẽ được phát triển",
    })
  }

  const handleDelete = async (group: Group) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhóm "${group.name}"?`)) {
      return
    }

    try {
      await groupService.deleteGroup(group.id)
      toast({
        title: "Thành công",
        description: "Đã xóa nhóm thành công",
      })
      loadGroups()
      loadGroupStats()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhóm",
        variant: "destructive"
      })
    }
  }

  const handleManageAdmins = async (group: Group | GroupDetail) => {
    try {
      const response = await groupService.getGroupById(group.id)
      setSelectedGroup(response.data.data)
      setAdminDialogOpen(true)
    } catch (error) {
      console.error('Error loading group details:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin nhóm",
        variant: "destructive"
      })
    }
  }

  const handleAdminAction = async (threadId: string, action: AdminAction) => {
    try {
      await groupService.manageGroupAdmins(threadId, action)
      // Reload group details
      const response = await groupService.getGroupById(threadId)
      setSelectedGroup(response.data.data)
      // Reload groups list
      loadGroups()
      loadGroupStats()
    } catch (error) {
      console.error('Error managing admins:', error)
      throw error
    }
  }

  const filteredGroups = (Array.isArray(groups) ? groups : []).filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.id.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && group.isActive) ||
      (filterStatus === 'inactive' && !group.isActive)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {groupStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TotalGroupsCard value={groupStats.totalGroups} />
          <ActiveGroupsCard value={groupStats.activeGroups} />
          <TotalMembersCard value={groupStats.totalMembers} />
          <TotalAdminsCard value={groupStats.totalAdmins} />
          <TotalMessagesCard value={groupStats.totalMessages} />
          <AverageMembersCard value={groupStats.averageMembersPerGroup} />
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Quản lý nhóm</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadGroups}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Làm mới</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm nhóm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>

          {/* Groups Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Tin nhắn</TableHead>
                  <TableHead>Hoạt động cuối</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-slate-400" />
                        <p className="text-slate-500">Không tìm thấy nhóm nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => (
                    <GroupTableRow
                      key={group.id}
                      group={group}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onManageAdmins={handleManageAdmins}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Hiển thị {filteredGroups.length} trong tổng số {Array.isArray(groups) ? groups.length : 0} nhóm
            </span>
            <span>
              Tổng thành viên: {(Array.isArray(groups) ? groups : []).reduce((sum, group) => sum + group.memberCount, 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Group Detail Dialog */}
      <GroupDetailDialog
        group={selectedGroup}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEdit}
        onManageAdmins={handleManageAdmins}
      />

      {/* Admin Management Dialog */}
      <AdminManagementDialog
        group={selectedGroup}
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        onManageAdmins={handleAdminAction}
      />
    </div>
  )
}
