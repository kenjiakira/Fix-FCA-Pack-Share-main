import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoCard } from '@/components/atoms/InfoCard'
import { Monitor, Server } from 'lucide-react'

interface PlatformInfoCardProps {
  platform: string
  arch: string
}

export function PlatformInfoCard({ platform, arch }: PlatformInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Thông tin nền tảng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <InfoCard
            icon={Monitor}
            label="Platform"
            value={platform}
            bgColor="bg-blue-50"
            iconColor="text-blue-500"
            textColor="text-blue-600"
            valueColor="text-blue-700"
          />
          
          <InfoCard
            icon={Server}
            label="Architecture"
            value={arch}
            bgColor="bg-green-50"
            iconColor="text-green-500"
            textColor="text-green-600"
            valueColor="text-green-700"
          />
        </div>
      </CardContent>
    </Card>
  )
}
