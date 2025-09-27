import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CommandTableRow } from '@/components/molecules/CommandTableRow'
import { CommandDetailDialog } from '@/components/molecules/CommandDetailDialog'
import { CommandEditDialog } from '@/components/molecules/CommandEditDialog'
import { CommandDeleteDialog } from '@/components/molecules/CommandDeleteDialog'
import { CommandManagementDialog } from '@/components/molecules/CommandManagementDialog'
import { CommandManagementTest } from '@/components/molecules/CommandManagementTest'
import { Plus, Download, RefreshCw, Search, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { commandService } from '@/src/services/api'
import { Command } from '@/components/types/command'

export function CommandListTab() {
  const [commands, setCommands] = useState<Command[]>([])
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPermission, setSelectedPermission] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Dialog states
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [managementDialogOpen, setManagementDialogOpen] = useState(false)

  useEffect(() => {
    loadCommands()
  }, [])

  useEffect(() => {
    filterAndSortCommands()
  }, [commands, searchTerm, selectedCategory, selectedPermission, sortBy, sortOrder])

  const loadCommands = async () => {
    setIsLoading(true)
    try {
      const response = await commandService.getCommands()
      setCommands(response.data || response)
    } catch (error) {
      console.error('Error loading commands:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lệnh",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortCommands = () => {
    let filtered = [...commands]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cmd => 
        cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cmd.description && cmd.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cmd => cmd.category === selectedCategory)
    }

    // Filter by permission
    if (selectedPermission !== 'all') {
      filtered = filtered.filter(cmd => cmd.permissions === selectedPermission)
    }

    // Sort commands
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'cooldown':
          aValue = a.cooldown || 0
          bValue = b.cooldown || 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCommands(filtered)
  }

  const handleViewDetails = (command: Command) => {
    setSelectedCommand(command)
    setDetailDialogOpen(true)
  }

  const handleEdit = (command: Command) => {
    setSelectedCommand(command)
    setEditDialogOpen(true)
  }

  const handleDelete = (command: Command) => {
    setSelectedCommand(command)
    setDeleteDialogOpen(true)
  }

  const handleManage = (command: Command) => {
    setSelectedCommand(command)
    setManagementDialogOpen(true)
  }

  const handleToggleStatus = async (command: Command) => {
    try {
      await commandService.toggleCommandStatus(command.name, !command.isActive)
      toast({
        title: "Thành công",
        description: `Đã ${command.isActive ? 'tạm dừng' : 'kích hoạt'} lệnh ${command.name}`,
      })
      loadCommands() // Reload to get updated data
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái lệnh",
        variant: "destructive"
      })
    }
  }

  const handleCopy = async (command: Command) => {
    try {
      await navigator.clipboard.writeText(command.name)
      toast({
        title: "Thành công",
        description: `Đã sao chép tên lệnh: ${command.name}`,
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép tên lệnh",
        variant: "destructive"
      })
    }
  }

  const handleSaveEdit = async (updatedCommand: Command) => {
    try {
      await commandService.updateCommand(updatedCommand.name, {
        description: updatedCommand.description,
        category: updatedCommand.category,
        permissions: updatedCommand.permissions,
        cooldown: updatedCommand.cooldown,
        developer: updatedCommand.developer,
        usage: updatedCommand.usage,
        aliases: updatedCommand.aliases,
        isActive: updatedCommand.isActive
      })
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật lệnh thành công",
      })
      
      setEditDialogOpen(false)
      loadCommands() // Reload to get updated data
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật lệnh",
        variant: "destructive"
      })
    }
  }

  const handleConfirmDelete = async (command: Command) => {
    try {
      await commandService.deleteCommand(command.name)
      toast({
        title: "Thành công",
        description: "Đã xóa lệnh thành công",
      })
      
      setDeleteDialogOpen(false)
      loadCommands() // Reload to get updated data
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa lệnh",
        variant: "destructive"
      })
    }
  }

  const handleExportCommands = async () => {
    try {
      const response = await commandService.exportCommands()
      const dataStr = JSON.stringify(response, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `commands-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      toast({
        title: "Thành công",
        description: "Đã xuất danh sách lệnh",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xuất danh sách lệnh",
        variant: "destructive"
      })
    }
  }

  const categories = Array.from(new Set(commands.map(cmd => cmd.category))).filter(Boolean)
  const permissions = Array.from(new Set(commands.map(cmd => cmd.permissions))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Danh sách lệnh
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Quản lý và chỉnh sửa các lệnh của bot
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExportCommands}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Xuất</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={loadCommands}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Thêm lệnh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm lệnh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedPermission} onValueChange={setSelectedPermission}>
          <SelectTrigger>
            <SelectValue placeholder="Tất cả quyền hạn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả quyền hạn</SelectItem>
            {permissions.map(permission => (
              <SelectItem key={permission} value={permission}>
                {permission}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Tên lệnh</SelectItem>
            <SelectItem value="category">Danh mục</SelectItem>
            <SelectItem value="cooldown">Cooldown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Hiển thị {filteredCommands.length} lệnh
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
        </Button>
      </div>

      {/* Commands Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên lệnh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quyền hạn
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cooldown
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Đang tải lệnh...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCommands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy lệnh nào
                  </td>
                </tr>
              ) : (
                filteredCommands.map((command) => (
                  <CommandTableRow
                    key={command.name}
                    command={command}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onCopy={handleCopy}
                    onManage={handleManage}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <CommandDetailDialog
        command={selectedCommand}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onCommandUpdated={loadCommands}
      />
      
      <CommandEditDialog
        command={selectedCommand}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
      
      <CommandDeleteDialog
        command={selectedCommand}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleConfirmDelete}
      />
      
      <CommandManagementDialog
        command={selectedCommand}
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        onCommandUpdated={loadCommands}
      />
    </div>
  )
}
