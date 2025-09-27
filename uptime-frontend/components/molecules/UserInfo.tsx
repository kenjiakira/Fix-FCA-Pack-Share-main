import UserAvatar from '@/components/atoms/UserAvatar'

interface UserInfoProps {
  avatar?: string | null
  name: string
  uid: string
  size?: 'sm' | 'md' | 'lg'
}

export default function UserInfo({ avatar, name, uid, size = 'md' }: UserInfoProps) {
  return (
    <div className="flex items-center space-x-3">
      <UserAvatar avatar={avatar} name={name} size={size} />
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-500 font-mono">{uid}</p>
      </div>
    </div>
  )
}
