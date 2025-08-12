import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatBox } from '@/components/atoms/StatBox'
import { TimeInfo } from '@/components/atoms/TimeInfo'
import { HardDrive, Clock, Activity } from 'lucide-react'

interface TimeInfoCardProps {
  startTime: string
  lastRestart: string
  uptime?: number
}

export function TimeInfoCard({ startTime, lastRestart, uptime }: TimeInfoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Thông tin thời gian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimeInfo
            icon={Clock}
            label="Thời gian khởi động"
            value={formatDate(startTime)}
          />

          <TimeInfo
            icon={Activity}
            label="Lần khởi động lại cuối"
            value={formatDate(lastRestart)}
          />
        </div>

        {uptime && (
          <TimeInfo
            icon={Clock}
            label="System Uptime"
            value={formatUptime(uptime)}
          />
        )}

        <Separator />

        {/* System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            value="99.9%"
            label="Uptime"
            valueColor="text-primary-600"
          />
          <StatBox
            value="24/7"
            label="Monitoring"
            valueColor="text-green-600"
          />
          <StatBox
            value="5ms"
            label="Latency"
            valueColor="text-blue-600"
          />
          <StatBox
            value="1TB"
            label="Storage"
            valueColor="text-purple-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}
