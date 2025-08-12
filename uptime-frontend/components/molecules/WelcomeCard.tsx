interface WelcomeCardProps {
  isRunning: boolean
  uptime: number
  totalCommands: number
  loading?: boolean
}

export default function WelcomeCard({ 
  isRunning, 
  uptime, 
  totalCommands, 
  loading = false 
}: WelcomeCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Chào mừng trở lại!</h2>
          <p className="text-blue-100">
            {isRunning
              ? 'Hệ thống bot đang hoạt động ổn định. Dưới đây là tổng quan về hiệu suất.'
              : 'Hệ thống bot hiện đang tạm dừng. Vui lòng kiểm tra trạng thái.'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {loading ? '...' : Math.floor(uptime / 3600)}
            </div>
            <div className="text-sm text-blue-200">Giờ hoạt động</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {loading ? '...' : totalCommands.toLocaleString()}
            </div>
            <div className="text-sm text-blue-200">Lệnh đã xử lý</div>
          </div>
        </div>
      </div>
    </div>
  )
}
