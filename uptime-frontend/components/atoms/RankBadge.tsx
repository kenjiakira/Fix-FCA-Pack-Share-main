import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RankBadgeProps {
  rank: string
  icon: LucideIcon
  className?: string
}

export default function RankBadge({ rank, icon: Icon, className = '' }: RankBadgeProps) {
  return (
    <Badge className={className}>
      <Icon className="h-4 w-4" />
      <span className="ml-1">{rank}</span>
    </Badge>
  )
}
