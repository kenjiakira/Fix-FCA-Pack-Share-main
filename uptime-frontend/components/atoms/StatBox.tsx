interface StatBoxProps {
  value: string
  label: string
  valueColor: string
  className?: string
}

export function StatBox({ value, label, valueColor, className = "" }: StatBoxProps) {
  return (
    <div className={`text-center p-3 bg-gray-50 rounded-lg ${className}`}>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
