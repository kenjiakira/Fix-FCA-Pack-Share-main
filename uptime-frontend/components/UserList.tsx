'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/src/services/api'
import UserListTemplate from '@/components/UserListTemplate'

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN')
  }

  return (
    <UserListTemplate
      loading={loading}
      users={users}
      totalUsers={totalUsers}
      currentPage={page}
      totalPages={totalPages}
      search={search}
      rank={rank}
      sortBy={sortBy}
      sortOrder={sortOrder}
      selectedUser={selectedUser}
      showUserDetails={showUserDetails}
      showWarnDialog={showWarnDialog}
      showBanDialog={showBanDialog}
      warnReason={warnReason}
      banReason={banReason}
      banDuration={banDuration}
      onSearchChange={setSearch}
      onRankChange={setRank}
      onSortByChange={setSortBy}
      onSortOrderChange={setSortOrder}
      onPageChange={setPage}
      onViewDetails={handleViewUserDetails}
      onWarnUser={handleWarnUser}
      onBanUser={handleBanUser}
      onUnbanUser={handleUnbanUser}
      onWarnReasonChange={setWarnReason}
      onBanReasonChange={setBanReason}
      onBanDurationChange={setBanDuration}
      onSubmitWarn={handleSubmitWarn}
      onSubmitBan={handleSubmitBan}
      onUserDetailsChange={setShowUserDetails}
      onWarnDialogChange={setShowWarnDialog}
      onBanDialogChange={setShowBanDialog}
      onRefresh={fetchUsers}
      formatDate={formatDate}
    />
  )
}
