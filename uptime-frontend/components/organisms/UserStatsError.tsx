import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserStatsErrorProps {
  error: string
  onRetry: () => void
}

export default function UserStatsError({ error, onRetry }: UserStatsErrorProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Thống kê người dùng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
