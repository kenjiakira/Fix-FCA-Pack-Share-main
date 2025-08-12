import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Server } from 'lucide-react'

interface SystemDetailsCardProps {
  hostname: string
  nodeVersion: string
}

export function SystemDetailsCard({ hostname, nodeVersion }: SystemDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Thông tin hệ thống
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Hostname</p>
            <p className="font-semibold text-gray-900">{hostname}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Node Version</p>
            <p className="font-semibold text-gray-900">{nodeVersion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
