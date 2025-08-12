import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu } from 'lucide-react'

interface CpuDetailsCardProps {
  cpuCount: number
  loadAverage: number[]
}

export function CpuDetailsCard({ cpuCount, loadAverage }: CpuDetailsCardProps) {
  const getLoadColor = (load: number) => {
    if (load < 1) return 'text-green-600'
    if (load < 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Thông tin CPU
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">CPU Cores</p>
            <p className="font-semibold text-gray-900">{cpuCount}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Load Average</p>
            <p className={`font-semibold ${getLoadColor(loadAverage[0])}`}>
              {loadAverage[0].toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
