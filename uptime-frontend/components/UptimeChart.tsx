'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Clock, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Activity } from 'lucide-react'
import { botStatusService } from '@/src/services/api'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
)

interface UptimeData {
  timestamp: string
  uptime: number
  responseTime: number
  status: 'online' | 'degraded' | 'offline'
  incidents: number
}

export default function UptimeChart() {
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const chartRef = useRef<ChartJS<'line'>>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUptimeData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await botStatusService.getUptimeHistory(selectedPeriod)
      setUptimeData(response.data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching uptime data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchUptimeData()
  }, [fetchUptimeData])

  // Auto-refresh every minute
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchUptimeData()
      }, 60000) // 60 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, fetchUptimeData])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (selectedPeriod === '24h') {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    return date.toLocaleDateString('vi-VN', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'degraded': return '#F59E0B'
      case 'offline': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return '#10B981'
    if (uptime >= 95) return '#F59E0B'
    return '#EF4444'
  }

  const calculateStats = () => {
    if (uptimeData.length === 0) return null

    const totalUptime = uptimeData.reduce((sum, data) => sum + (data.uptime || 0), 0)
    const avgUptime = totalUptime / uptimeData.length
    const totalIncidents = uptimeData.reduce((sum, data) => sum + (data.incidents || 0), 0)
    const avgResponseTime = uptimeData.reduce((sum, data) => sum + (data.responseTime || 0), 0) / uptimeData.length

    const onlineHours = uptimeData.filter(data => data.status === 'online').length
    const degradedHours = uptimeData.filter(data => data.status === 'degraded').length
    const offlineHours = uptimeData.filter(data => data.status === 'offline').length

    return {
      avgUptime: Math.round(avgUptime * 10) / 10,
      totalIncidents,
      avgResponseTime: Math.round(avgResponseTime),
      onlineHours,
      degradedHours,
      offlineHours
    }
  }

  const stats = calculateStats()

  const chartData = {
    labels: uptimeData.map(data => formatTime(data.timestamp)),
    datasets: [
      {
        label: 'Uptime (%)',
        data: uptimeData.map(data => data.uptime || 0),
        borderColor: '#3B82F6',
        backgroundColor: (context: any) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return null
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)')
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)')
          return gradient
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: uptimeData.map(data => getUptimeColor(data.uptime || 0)),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: uptimeData.map(data => (data.incidents || 0) > 0 ? 6 : 4),
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3
      },
      {
        label: 'Response Time (ms)',
        data: uptimeData.map(data => data.responseTime || 0),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#fff',
        pointBorderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: true,
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
        callbacks: {
          title: (context: any) => {
            if (!context || !context[0] || context[0].dataIndex === undefined) {
              return 'No data'
            }
            const dataIndex = context[0].dataIndex
            const data = uptimeData[dataIndex]
            if (!data) return 'No data'
            return formatTime(data.timestamp)
          },
          label: (context: any) => {
            if (!context || !context[0] || context[0].dataIndex === undefined) {
              return 'No data'
            }
            const dataIndex = context[0].dataIndex
            const data = uptimeData[dataIndex]
            if (!data) return 'No data'
            
            if (context.dataset.label === 'Uptime (%)') {
              return [
                `Uptime: ${data.uptime}%`,
                `Status: ${data.status}`,
                `Incidents: ${data.incidents}`
              ]
            } else {
              return `Response Time: ${data.responseTime}ms`
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Uptime (%)',
          font: {
            size: 14
          }
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          callback: (value: any) => `${value}%`,
          font: {
            size: 12
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Response Time (ms)',
          font: {
            size: 14
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value: any) => `${value}ms`,
          font: {
            size: 12
          }
        }
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (uptimeData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-gray-600 mb-4">No uptime data available</div>
          <button
            onClick={fetchUptimeData}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Auto-refresh */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-600">
              Auto-refresh
            </label>
          </div>
          <button
            onClick={fetchUptimeData}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      {/* Status Summary */}
      {stats && (
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center bg-green-100 px-3 py-2 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="font-medium text-green-700">Online: {stats.onlineHours}h</span>
          </div>
          <div className="flex items-center bg-yellow-100 px-3 py-2 rounded-full">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="font-medium text-yellow-700">Degraded: {stats.degradedHours}h</span>
          </div>
          <div className="flex items-center bg-red-100 px-3 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="font-medium text-red-700">Offline: {stats.offlineHours}h</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="h-80">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
