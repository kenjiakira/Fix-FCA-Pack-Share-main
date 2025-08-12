import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { isValidAvatarUrl } from '@/lib/avatarUtils'

interface UserAvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export default function UserAvatar({ src, name, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={isValidAvatarUrl(src) ? src : undefined} />
      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
