export interface SystemInfoProps {
  memoryUsage: number
  cpuUsage: number
  startTime: string
  lastRestart: string
}

export interface DetailedSystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  uptime: number
  totalMemory: number
  freeMemory: number
  usedMemory: number
  memoryUsage: number
  cpuUsage: number
  cpuCount: number
  loadAverage: number[]
  hostname: string
  userInfo: any
  networkInterfaces: any
}
