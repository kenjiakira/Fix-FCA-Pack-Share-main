interface ProgressBarProps {
  value: number
  max?: number
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  unit?: string
}

export default function ProgressBar({ 
  value, 
  max = 100, 
  height = 'md', 
  showLabel = false,
  label,
  unit = '%'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const getColorClass = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500'
    if (percentage > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {value.toFixed(1)}{unit}
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full ${heightClasses[height]} dark:bg-slate-700`}>
        <div
          className={`${heightClasses[height]} rounded-full transition-all duration-500 ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
