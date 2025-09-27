import { Users } from 'lucide-react'

interface UserAvatarProps {
  avatar?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ avatar, name, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  if (avatar) {
    return (
      <img 
        src={avatar} 
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-100 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 ${className}`}>
      <Users className={`${iconSizes[size]} text-gray-500`} />
    </div>
  )
}
