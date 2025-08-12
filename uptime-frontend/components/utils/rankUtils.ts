import { Crown, Star, Award, Target, Users } from 'lucide-react'

export const getRankIcon = (rank: string) => {
  switch (rank.toLowerCase()) {
    case 'diamond': return Crown
    case 'platinum': return Star
    case 'gold': return Award
    case 'silver': return Target
    default: return Users
  }
}

export const getRankColor = (rank: string) => {
  switch (rank.toLowerCase()) {
    case 'diamond': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'platinum': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN')
}
