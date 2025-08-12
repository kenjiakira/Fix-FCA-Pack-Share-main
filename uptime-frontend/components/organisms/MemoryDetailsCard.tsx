import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MemoryStick } from 'lucide-react'

interface MemoryDetailsCardProps {
  totalMemory: number
  usedMemory: number
  freeMemory: number
}

export function MemoryDetailsCard({ totalMemory, usedMemory, freeMemory }: MemoryDetailsCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MemoryStick className="h-5 w-5" />
          Thông tin bộ nhớ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Total RAM</p>
            <p className="font-semibold text-gray-900">{formatBytes(totalMemory)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Used RAM</p>
            <p className="font-semibold text-gray-900">{formatBytes(usedMemory)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Free RAM</p>
            <p className="font-semibold text-gray-900">{formatBytes(freeMemory)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
