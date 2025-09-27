import { CheckCircle } from 'lucide-react'
import UserInfo from './UserInfo'

interface SearchUserItemProps {
  user: {
    userId: string
    name: string
    avatar?: string
  }
  isSelected: boolean
  onSelect: (userId: string) => void
}

export default function SearchUserItem({ user, isSelected, onSelect }: SearchUserItemProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200"
      onClick={() => onSelect(user.userId)}
    >
      <UserInfo 
        avatar={user.avatar} 
        name={user.name} 
        uid={user.userId} 
        size="sm"
      />
      {isSelected && (
        <CheckCircle className="h-5 w-5 text-green-500" />
      )}
    </div>
  )
}
