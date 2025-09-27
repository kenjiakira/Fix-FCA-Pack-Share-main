import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  isBanned: boolean
  warnings: number
  variant?: 'default' | 'secondary' | 'destructive'
}

export default function StatusBadge({ isBanned, warnings, variant }: StatusBadgeProps) {
  if (isBanned) {
    return <Badge variant="destructive">Bị cấm</Badge>
  }
  
  if (warnings > 0) {
    return <Badge variant="secondary">Cảnh báo ({warnings})</Badge>
  }
  
  return <Badge variant="default">Hoạt động</Badge>
}
