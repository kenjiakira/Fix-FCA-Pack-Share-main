'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  TrendingUp, 
  Award, 
  Activity,
  Crown,
  Star,
  Zap,
  Target,
  Search,
  Filter,
  Download,
  Ban,
  Shield,
  AlertTriangle,
  UserCheck,
  UserX,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { userService } from '@/src/services/api'
import UserStats from '@/components/UserStats'
import UserList from '@/components/UserList'
import UserActions from '@/components/UserActions'

interface User {
  userId: string
  name: string
  exp: number
  level: number
  rank: string
  lastActive: number
  warnings: number
  isBanned: boolean
  status: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  averageExp: number
  averageLevel: number
  warnings: number
}

export default function UsersTab() {
  const [activeTab, setActiveTab] = useState('overview')
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
            <p className="text-slate-600 dark:text-slate-400">Thống kê và phân tích người dùng</p>
          </div>
        </div>
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchUserStats} variant="outline">
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
          <p className="text-slate-600 dark:text-slate-400">Thống kê và phân tích người dùng</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <UserCheck className="h-4 w-4 mr-2" />
            Danh sách người dùng
          </TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Shield className="h-4 w-4 mr-2" />
            Hành động
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <UserStats />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserList />
        </TabsContent>



        <TabsContent value="actions" className="mt-6">
          <UserActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}
