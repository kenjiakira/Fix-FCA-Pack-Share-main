interface Warning {
  id?: string
  reason: string
  date?: number
  time?: number
}

interface WarningHistoryProps {
  warnings: Warning[]
  formatDate: (timestamp: number) => string
}

export default function WarningHistory({ warnings, formatDate }: WarningHistoryProps) {
  if (!warnings || warnings.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Lịch sử cảnh báo</p>
        <p className="text-gray-500 text-sm">Không có cảnh báo nào</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Lịch sử cảnh báo</p>
      <div className="max-h-32 overflow-y-auto space-y-2">
        {warnings.map((warning, index) => (
          <div key={warning.id || index} className="p-2 bg-red-50 rounded text-sm">
            <p className="font-medium">{warning.reason}</p>
            <p className="text-gray-500">
              {formatDate(warning.date || warning.time || Date.now())}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
