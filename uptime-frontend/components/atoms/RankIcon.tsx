interface RankIconProps {
  rank: string
  size?: 'sm' | 'md' | 'lg'
}

export default function RankIcon({ rank, size = 'md' }: RankIconProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'diamond': 
        return <span className={`${sizeClasses[size]} text-purple-500`}>💎</span>
      case 'platinum': 
        return <span className={`${sizeClasses[size]} text-blue-500`}>⭐</span>
      case 'gold': 
        return <span className={`${sizeClasses[size]} text-yellow-500`}>🥇</span>
      case 'silver': 
        return <span className={`${sizeClasses[size]} text-gray-500`}>🥈</span>
      case 'bronze': 
        return <span className={`${sizeClasses[size]} text-orange-500`}>🥉</span>
      default: 
        return <span className={`${sizeClasses[size]} text-orange-500`}>🥉</span>
    }
  }

  return getRankIcon(rank)
}
