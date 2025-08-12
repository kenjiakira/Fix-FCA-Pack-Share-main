import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from 'lucide-react'

interface NetworkInfoCardProps {
  networkInterfaces: any
}

export function NetworkInfoCard({ networkInterfaces }: NetworkInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Thông tin mạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(networkInterfaces).map(([name, interfaces]: [string, any]) => (
            <div key={name} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-900 mb-1">{name}</p>
              {interfaces.map((iface: any, index: number) => (
                <div key={index} className="text-xs text-gray-600">
                  {iface.address} ({iface.family})
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
