import { LucideIcon } from 'lucide-react'

interface TimeInfoProps {
  icon: LucideIcon
  label: string
  value: string
  className?: string
}

export function TimeInfo({ icon: Icon, label, value, className = "" }: TimeInfoProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
