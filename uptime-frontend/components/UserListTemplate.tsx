import { Skeleton } from '@/components/ui/skeleton'
import UserFiltersCard from '@/components/organisms/UserFiltersCard'
import UsersTableCard from '@/components/organisms/UsersTableCard'
import UserDetailsDialog from '@/components/organisms/UserDetailsDialog'
import WarnUserDialog from '@/components/organisms/WarnUserDialog'
import BanUserDialog from '@/components/organisms/BanUserDialog'

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

interface UserListTemplateProps {
  loading: boolean
  users: User[]
  totalUsers: number
  currentPage: number
  totalPages: number
  search: string
  rank: string
  sortBy: string
  sortOrder: string
  selectedUser: UserDetails | null
  showUserDetails: boolean
  showWarnDialog: boolean
  showBanDialog: boolean
  warnReason: string
  banReason: string
  banDuration: string
  onSearchChange: (value: string) => void
  onRankChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: string) => void
  onPageChange: (page: number) => void
  onViewDetails: (userId: string) => void
  onWarnUser: (userId: string) => void
  onBanUser: (userId: string) => void
  onUnbanUser: (userId: string) => void
  onWarnReasonChange: (reason: string) => void
  onBanReasonChange: (reason: string) => void
  onBanDurationChange: (duration: string) => void
  onSubmitWarn: () => void
  onSubmitBan: () => void
  onUserDetailsChange: (open: boolean) => void
  onWarnDialogChange: (open: boolean) => void
  onBanDialogChange: (open: boolean) => void
  onRefresh: () => void
  formatDate: (timestamp: number) => string
}

export default function UserListTemplate({
  loading,
  users,
  totalUsers,
  currentPage,
  totalPages,
  search,
  rank,
  sortBy,
  sortOrder,
  selectedUser,
  showUserDetails,
  showWarnDialog,
  showBanDialog,
  warnReason,
  banReason,
  banDuration,
  onSearchChange,
  onRankChange,
  onSortByChange,
  onSortOrderChange,
  onPageChange,
  onViewDetails,
  onWarnUser,
  onBanUser,
  onUnbanUser,
  onWarnReasonChange,
  onBanReasonChange,
  onBanDurationChange,
  onSubmitWarn,
  onSubmitBan,
  onUserDetailsChange,
  onWarnDialogChange,
  onBanDialogChange,
  onRefresh,
  formatDate
}: UserListTemplateProps) {
  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UserFiltersCard
        search={search}
        rank={rank}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={onSearchChange}
        onRankChange={onRankChange}
        onSortByChange={onSortByChange}
        onSortOrderChange={onSortOrderChange}
      />

      <UsersTableCard
        users={users}
        totalUsers={totalUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onViewDetails={onViewDetails}
        onWarnUser={onWarnUser}
        onBanUser={onBanUser}
        onUnbanUser={onUnbanUser}
        onPageChange={onPageChange}
        onRefresh={onRefresh}
      />

      <UserDetailsDialog
        open={showUserDetails}
        onOpenChange={onUserDetailsChange}
        user={selectedUser}
        formatDate={formatDate}
      />

      <WarnUserDialog
        open={showWarnDialog}
        onOpenChange={onWarnDialogChange}
        warnReason={warnReason}
        onWarnReasonChange={onWarnReasonChange}
        onSubmit={onSubmitWarn}
      />

      <BanUserDialog
        open={showBanDialog}
        onOpenChange={onBanDialogChange}
        banReason={banReason}
        banDuration={banDuration}
        onBanReasonChange={onBanReasonChange}
        onBanDurationChange={onBanDurationChange}
        onSubmit={onSubmitBan}
      />
    </div>
  )
}
