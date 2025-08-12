import { Progress } from '@/components/ui/progress'
import { LucideIcon } from 'lucide-react'

interface RankProgressItemProps {
  rank: string
  count: number
  percentage: number
  icon: LucideIcon
}

export default function RankProgressItem({ rank, count, percentage, icon: Icon }: RankProgressItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{rank}</span>
        </div>
        <span className="text-sm text-gray-500">{count} người</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
