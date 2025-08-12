import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, AlertTriangle, Cpu, MemoryStick, HardDrive, Network, Clock, Server } from 'lucide-react'
import { systemService } from '@/src/services/api'
import { SystemInfoProps, DetailedSystemInfo } from '@/components/types/system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export function SystemInfoTemplate({ 
  memoryUsage, 
  cpuUsage, 
  startTime, 
  lastRestart 
}: SystemInfoProps) {
  const [detailedInfo, setDetailedInfo] = useState<DetailedSystemInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDetailedSystemInfo()
  }, [])

  const fetchDetailedSystemInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await systemService.getSystemInfo()
      setDetailedInfo(response.data)
    } catch (error) {
      console.error('Error fetching detailed system info:', error)
      setError('Không thể tải thông tin hệ thống chi tiết')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (usage: number) => {
    if (usage < 50) return 'text-green-500'
    if (usage < 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStatusBadge = (usage: number) => {
    if (usage < 50) return <Badge className="bg-green-100 text-green-700 border-green-200">Optimal</Badge>
    if (usage < 80) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>
    return <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">Online</span>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">Healthy</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {detailedInfo?.uptime || '--:--:--'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Node Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Server className="h-5 w-5 text-purple-500" />
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {detailedInfo?.nodeVersion || 'v18.x.x'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <span>CPU Usage</span>
              </div>
              {getStatusBadge(cpuUsage)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {cpuUsage}%
              </span>
              <span className={`text-sm font-medium ${getStatusColor(cpuUsage)}`}>
                {cpuUsage < 50 ? 'Optimal' : cpuUsage < 80 ? 'Moderate' : 'High'}
              </span>
            </div>
            <Progress value={cpuUsage} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Cores:</span>
                <span className="ml-2 font-medium">{detailedInfo?.cpuCount || '8'}</span>
              </div>
              <div>
                <span className="text-slate-500">Load:</span>
                <span className="ml-2 font-medium">{detailedInfo?.loadAverage?.[0]?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-5 w-5 text-green-500" />
                <span>Memory Usage</span>
              </div>
              {getStatusBadge(memoryUsage)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {memoryUsage}%
              </span>
              <span className={`text-sm font-medium ${getStatusColor(memoryUsage)}`}>
                {memoryUsage < 50 ? 'Optimal' : memoryUsage < 80 ? 'Moderate' : 'High'}
              </span>
            </div>
            <Progress value={memoryUsage} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Used:</span>
                <span className="ml-2 font-medium">
                  {detailedInfo?.usedMemory ? `${(detailedInfo.usedMemory / 1024).toFixed(1)} GB` : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total:</span>
                <span className="ml-2 font-medium">
                  {detailedInfo?.totalMemory ? `${(detailedInfo.totalMemory / 1024).toFixed(1)} GB` : '--'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-purple-500" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Platform:</span>
                <span className="text-sm font-medium">{detailedInfo?.platform || 'Linux'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Architecture:</span>
                <span className="text-sm font-medium">{detailedInfo?.arch || 'x64'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hostname:</span>
                <span className="text-sm font-medium">{detailedInfo?.hostname || 'server-01'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Start Time:</span>
                <span className="text-sm font-medium">{startTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Last Restart:</span>
                <span className="text-sm font-medium">{lastRestart}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Process ID:</span>
                <span className="text-sm font-medium">{process.pid || '--'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Network:</span>
                <Network className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                {detailedInfo?.networkInterfaces ? 
                  Object.entries(detailedInfo.networkInterfaces).slice(0, 2).map(([name, interfaces]) => (
                    <div key={name} className="flex justify-between">
                      <span>{name}:</span>
                      <span className="font-mono">
                        {(interfaces as any[])?.find((i: any) => !i.internal)?.address || '--'}
                      </span>
                    </div>
                  ))
                  : <span>No network data</span>
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
