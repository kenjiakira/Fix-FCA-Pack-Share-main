import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users } from 'lucide-react'
import StatsOverview from '@/components/organisms/StatsOverview'
import RecentActivityCard from '@/components/organisms/RecentActivityCard'
import RankDistributionCard from '@/components/organisms/RankDistributionCard'
import LeaderboardTable from '@/components/organisms/LeaderboardTable'
import { formatDate } from '@/components/utils/rankUtils'

interface UserStatsTemplateProps {
  userStats: {
    totalUsers: number
    activeUsers: number
    averageExp: number
    averageLevel: number
    rankDistribution?: Array<{
      rank: string
      count: number
      percentage: number
    }>
    topUsers?: Array<{
      id: string
      name: string
      avatar?: string | null
      level: number
      exp: number
      rank: string
      lastActive: string
    }>
  }
}

export default function UserStatsTemplate({ userStats }: UserStatsTemplateProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Thống kê người dùng</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Bảng xếp hạng
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <StatsOverview
              totalUsers={userStats.totalUsers}
              activeUsers={userStats.activeUsers}
              averageLevel={userStats.averageLevel}
              averageExp={userStats.averageExp}
            />
            
            <div>
              <RecentActivityCard users={userStats.topUsers || []} />
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardTable users={userStats.topUsers || []} formatDate={formatDate} />
          </TabsContent>

          <TabsContent value="ranks" className="mt-6">
            <RankDistributionCard rankDistribution={userStats.rankDistribution || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
