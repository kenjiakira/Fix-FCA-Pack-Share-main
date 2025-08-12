import { Monitor, Activity, Clock, Zap, Command, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SystemInfo from '@/components/SystemInfo'
import { StatCard } from '@/components/atoms/StatCard'
import ProgressBar from '@/components/atoms/ProgressBar'

interface SystemTabProps {
  botStatus: any
}

export default function SystemTab({ botStatus }: SystemTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thông tin hệ thống</h2>
          <p className="text-slate-600 dark:text-slate-400">Chi tiết về hệ thống và tài nguyên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span>Thông tin hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SystemInfo
              memoryUsage={botStatus?.memoryUsage || 0}
              cpuUsage={botStatus?.cpuUsage || 0}
              startTime={botStatus?.startTime || ''}
              lastRestart={botStatus?.lastRestart || ''}
            />
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Hiệu suất hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressBar
              value={botStatus?.cpuUsage || 0}
              showLabel={true}
              label="CPU Usage"
              unit="%"
            />
            <ProgressBar
              value={botStatus?.memoryUsage || 0}
              showLabel={true}
              label="Memory Usage"
              unit="%"
            />
            <ProgressBar
              value={Math.min((botStatus?.responseTime || 0) / 10, 100)}
              showLabel={true}
              label="Response Time"
              unit="ms"
              max={1000}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
