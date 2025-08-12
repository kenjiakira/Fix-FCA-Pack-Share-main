'use client'

import { useEffect, useRef, useState } from 'react'
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
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { currencyApi, CurrencyStats } from '@/src/services/currencyApi'
import { formatNumber } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

interface CurrencyChartProps {
  stats: CurrencyStats
}

export default function CurrencyChart({ stats }: CurrencyChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    generateChartData()
  }, [stats, selectedPeriod])

  const generateChartData = () => {
    // Tạo dữ liệu mẫu cho biểu đồ
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
    const labels = []
    const walletData = []
    const bankData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }))
      
      // Tạo dữ liệu mẫu với xu hướng tăng
      const baseWallet = stats.totalBalance * 0.8
      const baseBank = stats.totalBankBalance * 0.8
      
      walletData.push(baseWallet + Math.random() * baseWallet * 0.4)
      bankData.push(baseBank + Math.random() * baseBank * 0.4)
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Ví',
          data: walletData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Ngân hàng',
          data: bankData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },

      ]
    })
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
          label: (context: any) => {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Thời gian',
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
        display: true,
        title: {
          display: true,
          text: 'Số tiền',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          callback: (value: any) => formatNumber(value),
          font: {
            size: 12
          }
        }
      }
    }
  }

  const doughnutData = {
    labels: ['Ví', 'Ngân hàng'],
    datasets: [
      {
        data: [
          stats.currencyDistribution.wallet,
          stats.currencyDistribution.bank
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          '#10B981',
          '#3B82F6'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)'
        ]
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${formatNumber(context.parsed)} (${percentage}%)`
          }
        }
      }
    }
  }

  if (!chartData) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Biểu đồ thống kê tiền tệ</h3>
          <p className="text-sm text-muted-foreground">
            Theo dõi xu hướng tiền tệ theo thời gian
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedPeriod(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 ngày</SelectItem>
            <SelectItem value="30d">30 ngày</SelectItem>
            <SelectItem value="90d">90 ngày</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng tiền tệ</CardTitle>
            <CardDescription>
              Biểu đồ đường thể hiện sự thay đổi số tiền theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố tiền tệ</CardTitle>
            <CardDescription>
              Biểu đồ tròn thể hiện tỷ lệ phân bố các loại tiền tệ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
