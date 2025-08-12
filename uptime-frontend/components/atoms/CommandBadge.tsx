import { Badge } from '@/components/ui/badge'

interface CommandBadgeProps {
  type: 'category' | 'permission'
  value: string
  className?: string
}

export function CommandBadge({ type, value, className = '' }: CommandBadgeProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'utility': 
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
      case 'game': 
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      case 'admin': 
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800'
      case 'media': 
        return 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800'
      case 'fun': 
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'economy': 
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default: 
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission.toLowerCase()) {
      case 'admin': 
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800'
      case 'mod': 
      case 'moderator': 
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'user': 
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      default: 
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
    }
  }

  const colorClass = type === 'category' ? getCategoryColor(value) : getPermissionColor(value)

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} ${className} font-medium text-xs px-2.5 py-1 rounded-full`}
    >
      {value}
    </Badge>
  )
}
