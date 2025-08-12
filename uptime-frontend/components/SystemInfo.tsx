import { SystemInfoTemplate } from '@/components/templates/SystemInfoTemplate'

export default function SystemInfo({ 
  memoryUsage, 
  cpuUsage, 
  startTime, 
  lastRestart 
}: {
  memoryUsage: number
  cpuUsage: number
  startTime: string
  lastRestart: string
}) {
  return (
    <SystemInfoTemplate
      memoryUsage={memoryUsage}
      cpuUsage={cpuUsage}
      startTime={startTime}
      lastRestart={lastRestart}
    />
  )
}
