'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Shield,
  AlertTriangle,
  Ban,
  UserCheck,
  UserX,
  History,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Settings,
  Activity,
  Clock,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { userService } from '@/src/services/api'

interface UserAction {
  id: string
  timestamp: number
  action: string
  userId: string
  details: any
  admin: string
}

interface BulkAction {
  type: 'ban' | 'warn' | 'unban'
  userIds: string[]
  reason?: string
  duration?: number
}

interface UserWarning {
  reason: string
  time: number
  threadID: string
}

export default function UserActions() {
  const [actions, setActions] = useState<UserAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction>({
    type: 'warn',
    userIds: [],
    reason: '',
    duration: undefined
  })
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [actionFilter, setActionFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('24h')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [selectedUserWarnings, setSelectedUserWarnings] = useState<UserWarning[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [stats, setStats] = useState({
    totalActions: 0,
    bans: 0,
    warnings: 0,
    unbans: 0
  })

  useEffect(() => {
    fetchActions()
    fetchStats()
  }, [actionFilter, timeFilter, pagination.page])

  const fetchStats = async () => {
    try {
      const response = await userService.getUserActions({
        page: 1,
        limit: 1000,
        actionType: 'all',
        timeFilter: timeFilter
      })
      
      if (response.data && response.data.success) {
        const actions = response.data.data.actions as UserAction[]
        setStats({
          totalActions: actions.length,
          bans: actions.filter((a: UserAction) => a.action === 'ban').length,
          warnings: actions.filter((a: UserAction) => a.action === 'warn').length,
          unbans: actions.filter((a: UserAction) => a.action === 'unban').length
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchActions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await userService.getUserActions({
        page: pagination.page,
        limit: pagination.limit,
        actionType: actionFilter,
        timeFilter: timeFilter
      })
      
      console.log('API Response:', response)
      
      if (response.data && response.data.success) {
        setActions(response.data.data.actions)
        setPagination(response.data.data.pagination)
      } else if (response.data && response.data.error) {
        setError(response.data.error)
      } else {
        setError('Failed to fetch actions')
      }
    } catch (error) {
      console.error('Error fetching actions:', error)
      setError('Failed to fetch actions')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async () => {
    try {
      if (!bulkAction.reason || bulkAction.userIds.length === 0) {
        setError('Please provide reason and select users')
        return
      }

      const response = await userService.performBulkAction({
        actionType: bulkAction.type,
        userIds: bulkAction.userIds,
        reason: bulkAction.reason,
        duration: bulkAction.duration
      })

      if (response.data && response.data.success) {
        setShowBulkActionDialog(false)
        setBulkAction({ type: 'warn', userIds: [], reason: '', duration: undefined })
        setSelectedUserIds([])
        fetchActions()
      } else {
        setError(response.data?.error || 'Failed to perform bulk action')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      setError('Failed to perform bulk action')
    }
  }

  const handleSingleAction = async (actionType: string, userId: string, reason: string, duration?: number) => {
    try {
      let response
      switch (actionType) {
        case 'ban':
          response = await userService.banUser(userId, { reason, duration })
          break
        case 'warn':
          response = await userService.warnUser(userId, { reason })
          break
        case 'unban':
          response = await userService.unbanUser(userId)
          break
        default:
          throw new Error(`Unknown action type: ${actionType}`)
      }

      if (response.data && response.data.success) {
        fetchActions()
      } else {
        setError(response.data?.error || `Failed to ${actionType} user`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing user:`, error)
      setError(`Failed to ${actionType} user`)
    }
  }

  const handleViewWarnings = async (userId: string) => {
    try {
      const response = await userService.getUserWarnings(userId)
      if (response.data && response.data.success) {
        setSelectedUserWarnings(response.data.data.warnings)
        setSelectedUserId(userId)
        setShowWarningDialog(true)
      } else {
        setError(response.data?.error || 'Failed to fetch user warnings')
      }
    } catch (error) {
      console.error('Error fetching user warnings:', error)
      setError('Failed to fetch user warnings')
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ban':
        return <Ban className="h-4 w-4 text-red-500" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unban':
        return <UserCheck className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ban':
        return <Badge variant="destructive">Ban</Badge>
      case 'warn':
        return <Badge variant="secondary">Warn</Badge>
      case 'unban':
        return <Badge variant="default">Unban</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN')
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Permanent'
    return `${duration} days`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Actions</h2>
          <p className="text-muted-foreground">
            Manage user warnings, bans, and action history
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkActionDialog(true)}
            disabled={selectedUserIds.length === 0}
          >
            <Shield className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedUserIds.length})
          </Button>
          <Button variant="outline" size="sm" onClick={fetchActions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng hành động</p>
                <p className="text-2xl font-bold">{stats.totalActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Ban className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Lệnh cấm</p>
                <p className="text-2xl font-bold">{stats.bans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cảnh báo</p>
                <p className="text-2xl font-bold">{stats.warnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Bỏ cấm</p>
                <p className="text-2xl font-bold">{stats.unbans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Action History</span>
            <div className="flex items-center space-x-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="ban">Bans</SelectItem>
                  <SelectItem value="warn">Warnings</SelectItem>
                  <SelectItem value="unban">Unbans</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(action.action)}
                      {getActionBadge(action.action)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{action.userId}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {action.details.reason && (
                        <div className="text-sm">
                          <span className="font-medium">Reason:</span> {action.details.reason}
                        </div>
                      )}
                      {action.details.duration && (
                        <div className="text-sm">
                          <span className="font-medium">Duration:</span> {formatDuration(action.details.duration)}
                        </div>
                      )}
                      {action.details.warnings && (
                        <div className="text-sm">
                          <span className="font-medium">Warnings:</span> {action.details.warnings}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{action.admin}</TableCell>
                  <TableCell>{formatTimestamp(action.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewWarnings(action.userId)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {actions.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No actions found</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="action-type">Action Type</Label>
              <Select value={bulkAction.type} onValueChange={(value: 'ban' | 'warn' | 'unban') => 
                setBulkAction(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                  <SelectItem value="unban">Unban</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="user-ids">User IDs (comma separated)</Label>
              <Input
                id="user-ids"
                placeholder="user1,user2,user3"
                value={bulkAction.userIds.join(',')}
                onChange={(e) => setBulkAction(prev => ({ 
                  ...prev, 
                  userIds: e.target.value.split(',').map(id => id.trim()).filter(id => id)
                }))}
              />
            </div>

            {bulkAction.type !== 'unban' && (
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for action"
                  value={bulkAction.reason}
                  onChange={(e) => setBulkAction(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            )}

            {bulkAction.type === 'ban' && (
              <div>
                <Label htmlFor="duration">Duration (days, leave empty for permanent)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="7"
                  value={bulkAction.duration || ''}
                  onChange={(e) => setBulkAction(prev => ({ 
                    ...prev, 
                    duration: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkActionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction}>
                Execute Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Warnings Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Warnings - {selectedUserId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUserWarnings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No warnings found for this user</p>
            ) : (
              <div className="space-y-2">
                {selectedUserWarnings.map((warning, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Warning #{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(warning.time)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{warning.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
