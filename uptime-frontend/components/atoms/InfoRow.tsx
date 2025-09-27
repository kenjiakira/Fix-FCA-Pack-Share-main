import { cn } from '@/lib/utils'

interface InfoRowProps {
  label: string
  value: string | number
  className?: string
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn("flex justify-between items-center py-1", className)}>
      <dt className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white text-right">
        {value}
      </dd>
    </div>
  )
}
