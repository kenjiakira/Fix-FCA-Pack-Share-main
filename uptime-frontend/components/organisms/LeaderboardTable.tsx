import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Crown } from 'lucide-react'
import LeaderboardRow from '@/components/molecules/LeaderboardRow'
import { getRankIcon, getRankColor } from '@/components/utils/rankUtils'

interface LeaderboardTableProps {
  users: Array<{
    id: string
    name: string
    avatar?: string | null
    level: number
    exp: number
    rank: string
    lastActive: string
  }>
  formatDate: (dateString: string) => string
}

export default function LeaderboardTable({ users, formatDate }: LeaderboardTableProps) {

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span>Bảng xếp hạng người dùng</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-white/50 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Người dùng</TableHead>
                <TableHead className="font-semibold">Level</TableHead>
                <TableHead className="font-semibold">Exp</TableHead>
                <TableHead className="font-semibold">Rank</TableHead>
                <TableHead className="font-semibold">Hoạt động cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    user={user}
                    index={index}
                    rankIcon={getRankIcon(user.rank)}
                    rankColorClass={getRankColor(user.rank)}
                    formatDate={formatDate}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Không có dữ liệu bảng xếp hạng
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
