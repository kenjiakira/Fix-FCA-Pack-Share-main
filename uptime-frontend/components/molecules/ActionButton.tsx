import { LucideIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  icon: LucideIcon
  text: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  loading?: boolean
}

export default function ActionButton({
  icon: Icon,
  text,
  onClick,
  variant = 'outline',
  size = 'sm',
  className = '',
  loading = false
}: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        "flex items-center space-x-2 transition-all duration-200",
        className
      )}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span>{text}</span>
    </Button>
  )
}
