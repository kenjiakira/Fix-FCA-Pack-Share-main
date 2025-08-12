import { useState, useEffect } from 'react'
import { botStatusService } from '@/services/api'

interface BotStatus {
  isRunning: boolean
  uptime: number
  startTime: string
  lastRestart: string
  totalCommands: number
  activeUsers: number
  totalMessages: number
  memoryUsage: number
  cpuUsage: number
  responseTime: number
}

export const useBotStatus = (refreshInterval = 3000) => {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await botStatusService.getStatus()
      setStatus(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching bot status:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const restartBot = async () => {
    try {
      await botStatusService.restartBot()
      // Wait a bit before refreshing to allow restart to complete
      setTimeout(() => {
        fetchStatus()
      }, 2000)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Lỗi không xác định' }
    }
  }

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    restartBot,
  }
}
