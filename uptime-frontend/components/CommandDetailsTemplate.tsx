import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { commandService } from '@/src/services/api'
import { Code, RefreshCw } from 'lucide-react'
import { CommandListTab } from '@/components/organisms/CommandListTab'
import { CommandSettingsTab } from '@/components/organisms/CommandSettingsTab'
import { CommandDetailDialog } from '@/components/molecules/CommandDetailDialog'
import { CommandManagementTest } from '@/components/molecules/CommandManagementTest'

import { Command } from '@/components/types/command'

export function CommandDetailsTemplate() {
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)

  useEffect(() => {
    fetchCommands()
  }, [])

  const fetchCommands = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await commandService.getCommands()
      setCommands(response.data)
    } catch (error) {
      console.error('Error fetching commands:', error)
      setError('Không thể tải danh sách lệnh')
    } finally {
      setLoading(false)
    }
  }

  const refreshCache = async () => {
    try {
      await commandService.refreshCache()
      await fetchCommands()
    } catch (error) {
      console.error('Error refreshing cache:', error)
    }
  }

  const handleViewDetails = (command: Command) => {
    setSelectedCommand(command)
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Chi tiết lệnh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchCommands} className="bg-blue-600 hover:bg-blue-700">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-blue-600" />
            <span>Quản lý lệnh</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Cài đặt
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Test Quản lý
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-6 w-full">
            <CommandListTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <CommandSettingsTab />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <CommandManagementTest />
          </TabsContent>
        </Tabs>

        <CommandDetailDialog
          command={selectedCommand}
          open={!!selectedCommand}
          onOpenChange={(open) => !open && setSelectedCommand(null)}
        />
      </CardContent>
    </Card>
  )
}
