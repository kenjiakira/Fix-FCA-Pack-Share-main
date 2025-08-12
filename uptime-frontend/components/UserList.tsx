'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { userService } from '@/src/services/api'

interface User {
  userId: string
  name: string
  exp: number
  level: number
  rank: string
  lastActive: number
  warnings: number
  isBanned: boolean
  status: string
  joinDate: number
  avatar?: string | null
}

interface UserDetails {
  userId: string
  name: string
  exp: number
  level: number
  rank: string
  lastActive: number
  warnings: any[]
  transactions: any[]
  avatar?: string | null
  stats: {
    totalWarnings: number
    totalTransactions: number
    totalSpent: number
    daysSinceJoin: number
    daysSinceLastActive: number
  }
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rank, setRank] = useState('all')
  const [sortBy, setSortBy] = useState('exp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showWarnDialog, setShowWarnDialog] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [warnReason, setWarnReason] = useState('')
  const [banDuration, setBanDuration] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, search, rank, sortBy, sortOrder])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userService.getUsers({
        page,
        limit: 20,
        search,
        rank,
        sortBy,
        sortOrder
      })
      setUsers(response.data.users)
      setTotalPages(response.data.pagination.totalPages)
      setTotalUsers(response.data.pagination.totalUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await userService.getUserDetails(userId)
      setSelectedUser(response.data)
      setShowUserDetails(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const handleViewUserDetails = async (userId: string) => {
    try {
      const response = await userService.getUserById(userId)
      if (response.data) {
        setSelectedUser(response.data)
        setShowUserDetails(true)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      setError('Không thể tải thông tin người dùng')
    }
  }

  const handleWarnUser = (userId: string) => {
    setSelectedUser({ userId } as any)
    setShowWarnDialog(true)
  }

  const handleBanUser = (userId: string) => {
    setSelectedUser({ userId } as any)
    setShowBanDialog(true)
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      await userService.unbanUser(userId)
      fetchUsers()
    } catch (error) {
      console.error('Error unbanning user:', error)
      setError('Không thể bỏ cấm người dùng')
    }
  }

  const handleSubmitWarn = async () => {
    if (!warnReason.trim()) return
    
    try {
      await userService.warnUser(selectedUser?.userId || '', { reason: warnReason })
      setShowWarnDialog(false)
      setWarnReason('')
      fetchUsers()
    } catch (error) {
      console.error('Error warning user:', error)
      setError('Không thể cảnh báo người dùng')
    }
  }

  const handleSubmitBan = async () => {
    if (!banReason.trim()) return
    
    try {
      await userService.banUser(selectedUser?.userId || '', { 
        reason: banReason, 
        duration: banDuration ? parseInt(banDuration) : undefined 
      })
      setShowBanDialog(false)
      setBanReason('')
      setBanDuration('')
      fetchUsers()
    } catch (error) {
      console.error('Error banning user:', error)
      setError('Không thể cấm người dùng')
    }
  }

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'diamond': return <span className="text-purple-500">💎</span>
      case 'platinum': return <span className="text-blue-500">⭐</span>
      case 'gold': return <span className="text-yellow-500">🥇</span>
      case 'silver': return <span className="text-gray-500">🥈</span>
      default: return <span className="text-orange-500">🥉</span>
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">Bị cấm</Badge>
    }
    if (user.warnings > 0) {
      return <Badge variant="secondary">Cảnh báo ({user.warnings})</Badge>
    }
    return <Badge variant="default">Hoạt động</Badge>
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN')
  }

  if (loading && users.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <span>Bộ lọc và tìm kiếm</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            


            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger>
                <SelectValue placeholder="Rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exp">Exp</SelectItem>
                <SelectItem value="level">Level</SelectItem>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="lastActive">Hoạt động cuối</SelectItem>
                <SelectItem value="joinDate">Ngày tham gia</SelectItem>
                <SelectItem value="warnings">Cảnh báo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách người dùng ({totalUsers})</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => fetchUsers()}>
                Làm mới
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-semibold">Người dùng</TableHead>
                  <TableHead className="font-semibold">Level/Exp</TableHead>
                  <TableHead className="font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">Level {user.level}</p>
                        <p className="text-sm text-gray-500">{user.exp.toLocaleString()} exp</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRankIcon(user.rank)}
                        <span className="font-medium">{user.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.isBanned ? (
                          <Badge variant="destructive">Bị cấm</Badge>
                        ) : (
                          <Badge variant={user.warnings > 0 ? "secondary" : "default"}>
                            {user.warnings > 0 ? `${user.warnings} cảnh báo` : "Bình thường"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUserDetails(user.userId)}
                        >
                          Chi tiết
                        </Button>
                        {!user.isBanned && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWarnUser(user.userId)}
                            >
                              Cảnh báo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBanUser(user.userId)}
                            >
                              Cấm
                            </Button>
                          </>
                        )}
                        {user.isBanned && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user.userId)}
                          >
                            Bỏ cấm
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Hiển thị {((page - 1) * 20) + 1} - {Math.min(page * 20, totalUsers)} trong tổng số {totalUsers} người dùng
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback>{selectedUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.userId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID người dùng</Label>
                  <p className="text-sm">{selectedUser.userId}</p>
                </div>
                <div>
                  <Label>Tên</Label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Level</Label>
                  <p className="text-sm">{selectedUser.level}</p>
                </div>
                <div>
                  <Label>Exp</Label>
                  <p className="text-sm">{selectedUser.exp?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <Label>Rank</Label>
                  <p className="text-sm">{selectedUser.rank}</p>
                </div>
                <div>
                  <Label>Số cảnh báo</Label>
                  <p className="text-sm">{selectedUser.stats?.totalWarnings || selectedUser.warnings || 0}</p>
                </div>
              </div>
              
              <div>
                <Label>Lịch sử cảnh báo</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedUser.warnings && selectedUser.warnings.length > 0 ? (
                    selectedUser.warnings.map((warning: any) => (
                      <div key={warning.id || warning.time} className="p-2 bg-red-50 rounded text-sm">
                        <p className="font-medium">{warning.reason}</p>
                        <p className="text-gray-500">{formatDate(warning.date || warning.time)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Không có cảnh báo nào</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Warn User Dialog */}
      <Dialog open={showWarnDialog} onOpenChange={setShowWarnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cảnh báo người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="warn-reason">Lý do cảnh báo</Label>
              <Textarea
                id="warn-reason"
                placeholder="Nhập lý do cảnh báo..."
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowWarnDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitWarn} disabled={!warnReason.trim()}>
                Cảnh báo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cấm người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-reason">Lý do cấm</Label>
              <Textarea
                id="ban-reason"
                placeholder="Nhập lý do cấm..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ban-duration">Thời hạn (ngày, để trống = vĩnh viễn)</Label>
              <Input
                id="ban-duration"
                type="number"
                placeholder="7"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitBan} disabled={!banReason.trim()}>
                Cấm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
