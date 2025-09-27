import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'
import UserRow from '@/components/molecules/UserRow'

interface AdminUser {
  uid: string
  role: string
  type: string
  name: string
  avatar: string | null
}

interface UsersTableProps {
  users: AdminUser[]
  selectedRole: string
  onRoleChange: (role: string) => void
  onRemoveUser: (uid: string, role: string) => void
}

export default function UsersTable({ users, selectedRole, onRoleChange, onRemoveUser }: UsersTableProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="text-gray-900">Danh sách Nhân viên</span>
          <div className="flex items-center space-x-3">
            <Select value={selectedRole} onValueChange={onRoleChange}>
              <SelectTrigger className="w-40 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="moderator">Điều hành viên</SelectItem>
                <SelectItem value="support">Hỗ trợ viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100">
              <TableHead className="font-semibold text-gray-700">Người dùng</TableHead>
              <TableHead className="font-semibold text-gray-700">Vai trò</TableHead>
              <TableHead className="font-semibold text-gray-700">Loại</TableHead>
              <TableHead className="font-semibold text-gray-700">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow 
                key={`${user.uid}-${user.role}`} 
                user={user} 
                onRemove={onRemoveUser}
              />
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Không tìm thấy người dùng nào</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
