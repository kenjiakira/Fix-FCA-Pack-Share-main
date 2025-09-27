import { Badge } from '@/components/ui/badge'

interface PermissionBadgeProps {
  usedby: number
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function PermissionBadge({ usedby, variant = 'secondary', className = '' }: PermissionBadgeProps) {
  const getPermissionText = (level: number) => {
    switch (level) {
      case 0: return 'Tất cả'
      case 1: return 'Thành viên'
      case 2: return 'Admin bot'
      case 3: return 'Moderator'
      case 4: return 'Điều hành viên & Admin'
      case 5: return 'Admin nhóm'
      default: return `Level ${level}`
    }
  }

  const getVariant = (level: number) => {
    if (level === 0) return 'default'
    return variant
  }

  return (
    <Badge variant={getVariant(usedby)} className={className}>
      {getPermissionText(usedby)}
    </Badge>
  )
}

