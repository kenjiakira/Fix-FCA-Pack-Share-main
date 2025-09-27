import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { XCircle } from 'lucide-react'
import { Settings, Plus, RefreshCw } from 'lucide-react'
import AdminStatsGrid from '@/components/organisms/AdminStatsGrid'
import UsersTable from '@/components/organisms/UsersTable'
import AddUserDialog from '@/components/organisms/AddUserDialog'
import BotSettingsDialog from '@/components/organisms/BotSettingsDialog'

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

interface AdminManagementTemplateProps {
  loading: boolean
  error: string | null
  config: AdminConfig | null
  users: AdminUsers | null
  selectedRole: string
  showAddUserDialog: boolean
  showConfigDialog: boolean
  searchQuery: string
  searchResults: any[]
  isSearching: boolean
  newUser: { uid: string; role: string }
  editingConfig: AdminConfig | null
  onRoleChange: (role: string) => void
  onAddUserDialogChange: (open: boolean) => void
  onConfigDialogChange: (open: boolean) => void
  onSearchQueryChange: (query: string) => void
  onSearch: () => void
  onNewUserChange: (user: { uid: string; role: string }) => void
  onConfigChange: (config: AdminConfig) => void
  onAddUser: () => void
  onRemoveUser: (uid: string, role: string) => void
  onUpdateConfig: () => void
  onRefresh: () => void
  onCancelAddUser: () => void
}

export default function AdminManagementTemplate({
  loading,
  error,
  config,
  users,
  selectedRole,
  showAddUserDialog,
  showConfigDialog,
  searchQuery,
  searchResults,
  isSearching,
  newUser,
  editingConfig,
  onRoleChange,
  onAddUserDialogChange,
  onConfigDialogChange,
  onSearchQueryChange,
  onSearch,
  onNewUserChange,
  onConfigChange,
  onAddUser,
  onRemoveUser,
  onUpdateConfig,
  onRefresh,
  onCancelAddUser
}: AdminManagementTemplateProps) {
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
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Quản lý Hệ thống
          </h2>
          <p className="text-gray-600 text-lg">
            Quản lý quản trị viên, điều hành viên và nhân viên hỗ trợ bot
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigDialogChange(true)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt Bot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddUserDialogChange(true)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Người dùng
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800">Lỗi</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {users && (
        <AdminStatsGrid
          stats={{
            admins: users.admins.length,
            moderators: users.moderators.length,
            support: users.support.length,
            total: users.total
          }}
        />
      )}

      {users && (
        <UsersTable
          users={getFilteredUsers()}
          selectedRole={selectedRole}
          onRoleChange={onRoleChange}
          onRemoveUser={onRemoveUser}
        />
      )}

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={onAddUserDialogChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={onSearch}
        newUser={newUser}
        onNewUserChange={onNewUserChange}
        onAddUser={onAddUser}
        onCancel={onCancelAddUser}
      />

      <BotSettingsDialog
        open={showConfigDialog}
        onOpenChange={onConfigDialogChange}
        config={editingConfig}
        onConfigChange={onConfigChange}
        onSave={onUpdateConfig}
      />
    </div>
  )
}
