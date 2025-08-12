import { Clock, Zap, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusCard from '@/components/StatusCard'
import UptimeChart from '@/components/UptimeChart'
import WelcomeCard from '@/components/molecules/WelcomeCard'
import ProgressBar from '@/components/atoms/ProgressBar'

interface OverviewTabProps {
  botStatus: any
  loading: boolean
}

export default function OverviewTab({ botStatus, loading }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeCard
        isRunning={botStatus?.isRunning || false}
        uptime={botStatus?.uptime || 0}
        totalCommands={botStatus?.totalCommands || 0}
        loading={loading}
      />

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <StatusCard
          title="Uptime"
          value={loading ? 0 : botStatus?.uptime || 0}
          unit="giây"
          icon={<Clock className="h-6 w-6" />}
          color="blue"
          trend="up"
        />
        <StatusCard
          title="Thời gian phản hồi"
          value={loading ? 0 : botStatus?.responseTime || 0}
          unit="ms"
          icon={<Zap className="h-6 w-6" />}
          color="orange"
          trend="down"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Biểu đồ Uptime</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UptimeChart />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Hiệu suất hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
