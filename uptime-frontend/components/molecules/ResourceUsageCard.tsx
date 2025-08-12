import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceProgress } from '@/components/atoms/ResourceProgress'
import { Cpu, MemoryStick, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ResourceUsageCardProps {
  cpuUsage: number
  memoryUsage: number
}

export function ResourceUsageCard({ cpuUsage, memoryUsage }: ResourceUsageCardProps) {
  const getOverallStatus = () => {
    const maxUsage = Math.max(cpuUsage, memoryUsage)
    if (maxUsage < 50) return { status: 'Optimal', color: 'bg-green-100 text-green-700 border-green-200' }
    if (maxUsage < 80) return { status: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { status: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' }
  }

  const overallStatus = getOverallStatus()

  return (
    <Card className="border-0 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold">System Performance</span>
          </div>
          <Badge className={overallStatus.color}>
            {overallStatus.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResourceProgress
          icon={Cpu}
          label="CPU Usage"
          value={cpuUsage}
          iconColor="text-blue-500"
        />

        <ResourceProgress
          icon={MemoryStick}
          label="Memory Usage"
          value={memoryUsage}
          iconColor="text-green-500"
        />

        {/* Performance Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {cpuUsage}%
            </div>
            <div className="text-xs text-slate-500">CPU Load</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {memoryUsage}%
            </div>
            <div className="text-xs text-slate-500">Memory Load</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
