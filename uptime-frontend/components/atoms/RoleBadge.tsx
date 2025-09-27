import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface RoleBadgeProps {
  role: string
  icon?: LucideIcon
  showIcon?: boolean
}

export default function RoleBadge({ role, icon: Icon, showIcon = false }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800',
          label: 'Quản trị viên'
        }
      case 'moderator':
        return {
          variant: 'default' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800',
          label: 'Điều hành viên'
        }
      case 'support':
        return {
          variant: 'secondary' as const,
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800',
          label: 'Hỗ trợ viên'
        }
      default:
        return {
          variant: 'outline' as const,
          className: '',
          label: role
        }
    }
  }

  const config = getRoleConfig(role)

  return (
    <div className="flex items-center space-x-2">
      {showIcon && Icon && <Icon className="h-4 w-4" />}
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    </div>
  )
}
