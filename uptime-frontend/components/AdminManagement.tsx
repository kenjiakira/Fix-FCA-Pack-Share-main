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
import { Switch } from '@/components/ui/switch'
import { 
  Shield,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Crown,
  UserCheck,
  Headphones,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { adminService, userService } from '@/src/services/api'

interface AdminUser {
  uid: string
  role: string
  type: string
  name: string
  avatar: string | null
}

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

interface AdminUsers {
  admins: AdminUser[]
  moderators: AdminUser[]
  support: AdminUser[]
  total: number
}

export default function AdminManagement() {
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [users, setUsers] = useState<AdminUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [newUser, setNewUser] = useState({ uid: '', role: 'admin' })
  const [editingConfig, setEditingConfig] = useState<AdminConfig | null>(null)
  const [selectedRole, setSelectedRole] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [configResponse, usersResponse] = await Promise.all([
        adminService.getConfig(),
        adminService.getUsers()
      ])
      
      if (configResponse.data && configResponse.data.success) {
        setConfig(configResponse.data.data)
        setEditingConfig(configResponse.data.data)
      }
      
      if (usersResponse.data && usersResponse.data.success) {
        setUsers(usersResponse.data.data)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      if (!newUser.uid.trim()) {
        setError('Please enter a valid UID')
        return
      }

      const response = await adminService.addUser(newUser)
      
      if (response.data && response.data.success) {
        setShowAddUserDialog(false)
        setNewUser({ uid: '', role: 'admin' })
        setSearchQuery('')
        setSearchResults([])
        fetchData()
      } else {
        setError(response.data?.error || 'Failed to add user')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      setError('Failed to add user')
    }
  }

  const handleRemoveUser = async (uid: string, role: string) => {
    try {
      const response = await adminService.removeUser({ uid, role })
      
      if (response.data && response.data.success) {
        fetchData()
      } else {
        setError(response.data?.error || 'Failed to remove user')
      }
    } catch (error) {
      console.error('Error removing user:', error)
      setError('Failed to remove user')
    }
  }

  const handleUpdateConfig = async () => {
    try {
      if (!editingConfig) return

      const response = await adminService.updateConfig(editingConfig)
      
      if (response.data && response.data.success) {
        setConfig(editingConfig)
        setShowConfigDialog(false)
      } else {
        setError(response.data?.error || 'Failed to update configuration')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      setError('Failed to update configuration')
    }
  }

  const handleSearchUsers = async () => {
    try {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      const response = await userService.searchUsers(searchQuery)
      
      if (response.data && response.data.success) {
        setSearchResults(response.data.data || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-red-500" />
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'support':
        return <Headphones className="h-4 w-4 text-green-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'moderator':
        return <Badge variant="default">Moderator</Badge>
      case 'support':
        return <Badge variant="secondary">Support</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getFilteredUsers = () => {
    if (!users) return []
    
    const allUsers = [
      ...users.admins,
      ...users.moderators,
      ...users.support
    ]
    
    if (selectedRole === 'all') return allUsers
    return allUsers.filter(user => user.role === selectedRole)
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
          <h2 className="text-2xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-muted-foreground">
            Manage bot administrators, moderators, and support staff
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Bot Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddUserDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{users?.admins.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Moderators</p>
                <p className="text-2xl font-bold">{users?.moderators.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Headphones className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Support</p>
                <p className="text-2xl font-bold">{users?.support.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{users?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Staff Members</span>
            <div className="flex items-center space-x-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="moderator">Moderators</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
                     <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>User</TableHead>
                 <TableHead>Role</TableHead>
                 <TableHead>Type</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {getFilteredUsers().map((user) => (
                 <TableRow key={`${user.uid}-${user.role}`}>
                   <TableCell>
                     <div className="flex items-center space-x-3">
                       {user.avatar ? (
                         <img 
                           src={user.avatar} 
                           alt={user.name}
                           className="h-8 w-8 rounded-full object-cover"
                         />
                       ) : (
                         <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                           <Users className="h-4 w-4 text-gray-500" />
                         </div>
                       )}
                       <div>
                         <p className="font-medium">{user.name}</p>
                         <p className="text-sm text-gray-500 font-mono">{user.uid}</p>
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center space-x-2">
                       {getRoleIcon(user.role)}
                       {getRoleBadge(user.role)}
                     </div>
                   </TableCell>
                   <TableCell className="capitalize">{user.type}</TableCell>
                   <TableCell>
                     <div className="flex items-center space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleRemoveUser(user.uid, user.role)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>

          {getFilteredUsers().length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

             {/* Add User Dialog */}
       <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
         <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle>Add Staff Member</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="search-query">Search Users</Label>
               <div className="flex space-x-2">
                 <Input
                   id="search-query"
                   placeholder="Search by name or UID"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                 />
                 <Button 
                   variant="outline" 
                   onClick={handleSearchUsers}
                   disabled={isSearching}
                 >
                   {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                 </Button>
               </div>
             </div>

             {searchResults.length > 0 && (
               <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                 <p className="text-sm font-medium mb-2">Search Results:</p>
                 {searchResults.map((user) => (
                   <div 
                     key={user.userId}
                     className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                     onClick={() => setNewUser(prev => ({ ...prev, uid: user.userId }))}
                   >
                     <div className="flex items-center space-x-2">
                       {user.avatar ? (
                         <img 
                           src={user.avatar} 
                           alt={user.name}
                           className="h-6 w-6 rounded-full object-cover"
                         />
                       ) : (
                         <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                           <Users className="h-3 w-3 text-gray-500" />
                         </div>
                       )}
                       <div>
                         <p className="text-sm font-medium">{user.name}</p>
                         <p className="text-xs text-gray-500 font-mono">{user.userId}</p>
                       </div>
                     </div>
                     {newUser.uid === user.userId && (
                       <CheckCircle className="h-4 w-4 text-green-500" />
                     )}
                   </div>
                 ))}
               </div>
             )}

             <div>
               <Label htmlFor="user-uid">Selected User ID</Label>
               <Input
                 id="user-uid"
                 placeholder="Enter Facebook UID or select from search results"
                 value={newUser.uid}
                 onChange={(e) => setNewUser(prev => ({ ...prev, uid: e.target.value }))}
               />
             </div>
             
             <div>
               <Label htmlFor="user-role">Role</Label>
               <Select 
                 value={newUser.role} 
                 onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="admin">Admin</SelectItem>
                   <SelectItem value="moderator">Moderator</SelectItem>
                   <SelectItem value="support">Support</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div className="flex justify-end space-x-2">
               <Button variant="outline" onClick={() => {
                 setShowAddUserDialog(false)
                 setSearchQuery('')
                 setSearchResults([])
               }}>
                 Cancel
               </Button>
               <Button onClick={handleAddUser}>
                 Add User
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

      {/* Bot Settings Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bot Configuration</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bot-prefix">Prefix</Label>
                  <Input
                    id="bot-prefix"
                    value={editingConfig.prefix}
                    onChange={(e) => setEditingConfig(prev => prev ? { ...prev, prefix: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <Input
                    id="bot-name"
                    value={editingConfig.botName}
                    onChange={(e) => setEditingConfig(prev => prev ? { ...prev, botName: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="owner-name">Owner Name</Label>
                  <Input
                    id="owner-name"
                    value={editingConfig.ownerName}
                    onChange={(e) => setEditingConfig(prev => prev ? { ...prev, ownerName: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="facebook-link">Facebook Link</Label>
                  <Input
                    id="facebook-link"
                    value={editingConfig.facebookLink}
                    onChange={(e) => setEditingConfig(prev => prev ? { ...prev, facebookLink: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="restart-time">Restart Time (minutes)</Label>
                  <Input
                    id="restart-time"
                    type="number"
                    value={editingConfig.restartTime}
                    onChange={(e) => setEditingConfig(prev => prev ? { ...prev, restartTime: parseInt(e.target.value) } : null)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resend">Resend Mode</Label>
                  <Switch
                    id="resend"
                    checked={editingConfig.resend}
                    onCheckedChange={(checked) => setEditingConfig(prev => prev ? { ...prev, resend: checked } : null)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notilogs">Notification Logs</Label>
                  <Switch
                    id="notilogs"
                    checked={editingConfig.notilogs}
                    onCheckedChange={(checked) => setEditingConfig(prev => prev ? { ...prev, notilogs: checked } : null)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="restart">Auto Restart</Label>
                  <Switch
                    id="restart"
                    checked={editingConfig.restart}
                    onCheckedChange={(checked) => setEditingConfig(prev => prev ? { ...prev, restart: checked } : null)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="mtn-mode">MTN Mode</Label>
                  <Switch
                    id="mtn-mode"
                    checked={editingConfig.mtnMode}
                    onCheckedChange={(checked) => setEditingConfig(prev => prev ? { ...prev, mtnMode: checked } : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateConfig}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
