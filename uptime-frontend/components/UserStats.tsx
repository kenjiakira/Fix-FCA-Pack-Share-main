'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/src/services/api'
import UserStatsTemplate from '@/components/UserStatsTemplate'
import UserStatsLoading from '@/components/organisms/UserStatsLoading'
import UserStatsError from '@/components/organisms/UserStatsError'

interface UserStats {
  totalUsers: number
  activeUsers: number
  averageExp: number
  averageLevel: number
  rankDistribution?: any
  topUsers?: any
}

export default function UserStats() {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userService.getUserStats()
      setUserStats(response.data)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      setError('Không thể tải thống kê người dùng')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <UserStatsLoading />
  }

  if (error) {
    return <UserStatsError error={error} onRetry={fetchUserStats} />
  }

  if (!userStats) return null

  return <UserStatsTemplate userStats={userStats} />
}
