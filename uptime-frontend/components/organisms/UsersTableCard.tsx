import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import UserTableRow from '@/components/molecules/UserTableRow'
import Pagination from '@/components/atoms/Pagination'

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

interface UsersTableCardProps {
  users: User[]
  totalUsers: number
  currentPage: number
  totalPages: number
  onViewDetails: (userId: string) => void
  onWarnUser: (userId: string) => void
  onBanUser: (userId: string) => void
  onUnbanUser: (userId: string) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export default function UsersTableCard({
  users,
  totalUsers,
  currentPage,
  totalPages,
  onViewDetails,
  onWarnUser,
  onBanUser,
  onUnbanUser,
  onPageChange,
  onRefresh
}: UsersTableCardProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Danh sách người dùng ({totalUsers})</span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
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
                <UserTableRow
                  key={user.userId}
                  user={user}
                  onViewDetails={onViewDetails}
                  onWarnUser={onWarnUser}
                  onBanUser={onBanUser}
                  onUnbanUser={onUnbanUser}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={20}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  )
}
