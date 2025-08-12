import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award } from 'lucide-react'
import RankProgressItem from '@/components/molecules/RankProgressItem'
import { getRankIcon } from '@/components/utils/rankUtils'

interface RankDistributionCardProps {
  rankDistribution: Array<{
    rank: string
    count: number
    percentage: number
  }>
}

export default function RankDistributionCard({ rankDistribution }: RankDistributionCardProps) {

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-purple-600" />
          <span>Phân bố rank</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankDistribution.length > 0 ? (
            rankDistribution.map((rank) => (
              <RankProgressItem
                key={rank.rank}
                rank={rank.rank}
                count={rank.count}
                percentage={rank.percentage}
                icon={getRankIcon(rank.rank)}
              />
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              Không có dữ liệu phân bố rank
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
