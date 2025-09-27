'use client'

import { useState, useEffect } from 'react'
import { adminService, userService } from '@/src/services/api'
import AdminManagementTemplate from '@/components/AdminManagementTemplate'

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

  const handleCancelAddUser = () => {
    setShowAddUserDialog(false)
    setSearchQuery('')
    setSearchResults([])
    setNewUser({ uid: '', role: 'admin' })
  }

  return (
    <AdminManagementTemplate
      loading={loading}
      error={error}
      config={config}
      users={users}
      selectedRole={selectedRole}
      showAddUserDialog={showAddUserDialog}
      showConfigDialog={showConfigDialog}
      searchQuery={searchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      newUser={newUser}
      editingConfig={editingConfig}
      onRoleChange={setSelectedRole}
      onAddUserDialogChange={setShowAddUserDialog}
      onConfigDialogChange={setShowConfigDialog}
      onSearchQueryChange={setSearchQuery}
      onSearch={handleSearchUsers}
      onNewUserChange={setNewUser}
      onConfigChange={setEditingConfig}
      onAddUser={handleAddUser}
      onRemoveUser={handleRemoveUser}
      onUpdateConfig={handleUpdateConfig}
      onRefresh={fetchData}
      onCancelAddUser={handleCancelAddUser}
    />
  )
}
