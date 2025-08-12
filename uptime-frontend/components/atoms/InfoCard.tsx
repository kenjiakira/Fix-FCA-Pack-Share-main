import { LucideIcon } from 'lucide-react'

interface InfoCardProps {
  icon: LucideIcon
  label: string
  value: string
  bgColor: string
  iconColor: string
  textColor: string
  valueColor: string
  className?: string
}

export function InfoCard({ 
  icon: Icon, 
  label, 
  value, 
  bgColor, 
  iconColor, 
  textColor, 
  valueColor, 
  className = "" 
}: InfoCardProps) {
  return (
    <div className={`flex items-center p-3 ${bgColor} rounded-lg ${className}`}>
      <Icon className={`h-5 w-5 ${iconColor} mr-3`} />
      <div>
        <p className={`text-sm ${textColor}`}>{label}</p>
        <p className={`font-semibold ${valueColor}`}>{value}</p>
      </div>
    </div>
  )
}
