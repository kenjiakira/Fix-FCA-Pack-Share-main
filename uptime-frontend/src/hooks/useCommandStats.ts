import { useState, useEffect } from 'react'
import { commandService } from '@/services/api'

interface CommandData {
  name: string
  usage: number
  category: string
  lastUsed: string
}

export const useCommandStats = () => {
  const [commandStats, setCommandStats] = useState<CommandData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommandStats = async () => {
    try {
      const response = await commandService.getCommandStats()
      setCommandStats(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  const fetchTopCommands = async (limit = 10) => {
    try {
      const response = await commandService.getTopCommands(limit)
      return response.data
    } catch (err) {
      console.error('Error fetching top commands:', err)
      return []
    }
  }

  useEffect(() => {
    fetchCommandStats()
  }, [])

  return {
    commandStats,
    loading,
    error,
    refetch: fetchCommandStats,
    fetchTopCommands,
  }
}
