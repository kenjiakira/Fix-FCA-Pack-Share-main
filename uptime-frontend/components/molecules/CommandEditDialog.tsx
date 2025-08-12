import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommandBadge } from '@/components/atoms/CommandBadge'
import { Code, Save, X, Plus, Trash2, AlertTriangle, CheckCircle, FileCode, Settings, Eye, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Command } from '@/components/types/command'
import { commandService } from '@/src/services/api'

interface CommandEditDialogProps {
  command: Command | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (command: Command) => Promise<void>
}

export function CommandEditDialog({ 
  command, 
  open, 
  onOpenChange, 
  onSave 
}: CommandEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Command>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [newAlias, setNewAlias] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [isCodeLoading, setIsCodeLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [codeCache, setCodeCache] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (command) {
      setFormData({
        name: command.name,
        description: command.description,
        category: command.category,
        permissions: command.permissions,
        cooldown: command.cooldown,
        isActive: command.isActive,
        aliases: command.aliases || [],
        usage: command.usage,
        developer: command.developer
      })
      
      // Load source code if not cached
      if (!codeCache.has(command.name)) {
        loadSourceCode(command.name)
      } else {
        setSourceCode(codeCache.get(command.name) || '')
      }
    }
  }, [command, codeCache])

  const loadSourceCode = async (commandName: string) => {
    if (!commandName) return
    
    // Check cache first
    if (codeCache.has(commandName)) {
      setSourceCode(codeCache.get(commandName) || '')
      return
    }
    
    setIsCodeLoading(true)
    try {
      const response = await commandService.getCommandCode(commandName)
      const code = response.code || ''
      setSourceCode(code)
      
      // Cache the code
      setCodeCache(prev => new Map(prev).set(commandName, code))
    } catch (error) {
      console.error('Error loading source code:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải mã nguồn của lệnh",
        variant: "destructive"
      })
    } finally {
      setIsCodeLoading(false)
    }
  }

  const handleSave = async () => {
    if (!command || !formData.name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ...command,
        ...formData
      })
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật lệnh thành công",
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật lệnh. Vui lòng thử lại",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCode = async () => {
    if (!command) return

    setIsLoading(true)
    try {
      await commandService.updateCommandCode(command.name, sourceCode)
      
      // Update cache
      setCodeCache(prev => new Map(prev).set(command.name, sourceCode))
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật mã nguồn thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật mã nguồn. Vui lòng thử lại",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAlias = () => {
    if (newAlias && !formData.aliases?.includes(newAlias)) {
      setFormData(prev => ({
        ...prev,
        aliases: [...(prev.aliases || []), newAlias]
      }))
      setNewAlias('')
    }
  }

  const handleRemoveAlias = (aliasToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases?.filter(alias => alias !== aliasToRemove) || []
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAlias()
    }
  }

  if (!command) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Code className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Chỉnh sửa lệnh: {command.name}
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1 text-blue-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Chế độ chỉnh sửa</span>
                </div>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Chỉnh sửa thông tin và cấu hình của lệnh
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              <span>Cài đặt</span>
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
            >
              <FileCode className="h-4 w-4" />
              <span>Mã nguồn</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tên lệnh <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên lệnh"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Danh mục
                  </Label>
                  <Select 
                    value={formData.category || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin Commands">Admin Commands</SelectItem>
                      <SelectItem value="Game">Game</SelectItem>
                      <SelectItem value="Utility">Utility</SelectItem>
                      <SelectItem value="Fun">Fun</SelectItem>
                      <SelectItem value="Economy">Economy</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mô tả (info)
                  </Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chức năng của lệnh"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Quyền hạn (usedby)
                  </Label>
                  <Select 
                    value={formData.permissions || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, permissions: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn quyền hạn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tất cả người dùng">Tất cả người dùng (0)</SelectItem>
                      <SelectItem value="Quản trị viên nhóm">Quản trị viên nhóm (1)</SelectItem>
                      <SelectItem value="Admin bot">Admin bot (2)</SelectItem>
                      <SelectItem value="Điều hành viên Bot">Điều hành viên Bot (3)</SelectItem>
                      <SelectItem value="Admin & Điều hành viên">Admin & Điều hành viên (4)</SelectItem>
                      <SelectItem value="Admin, Quản trị viên & Điều hành viên">Admin, Quản trị viên & Điều hành viên (5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Cooldown (cooldowns)
                  </Label>
                  <Input
                    type="number"
                    value={formData.cooldown || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, cooldown: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Developer (dev)
                  </Label>
                  <Input
                    value={formData.developer || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer: e.target.value }))}
                    placeholder="Tên developer"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Kích hoạt lệnh (hide: false)
                  </Label>
                </div>
              </div>
            </div>

            {/* Aliases */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Aliases (nickName)
              </Label>
              <div className="mt-2 space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Thêm alias mới"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddAlias}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm</span>
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.aliases?.map((alias, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{alias}</span>
                      <button
                        onClick={() => handleRemoveAlias(alias)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Usage */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cách sử dụng (usages)
              </Label>
              <Textarea
                value={formData.usage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, usage: e.target.value }))}
                placeholder="Hướng dẫn sử dụng lệnh"
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Xem trước</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-blue-600">/{formData.name || command.name}</span>
                  {formData.isActive !== false ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Hoạt động</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Tạm dừng</span>
                    </div>
                  )}
                </div>
                
                {formData.category && (
                  <div>
                    <CommandBadge type="category" value={formData.category} />
                  </div>
                )}
                
                {formData.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mã nguồn lệnh
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSourceCode(command.name)}
                    disabled={isCodeLoading}
                    className="flex items-center space-x-1"
                  >
                    {isCodeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span>{isCodeLoading ? 'Đang tải...' : 'Làm mới'}</span>
                  </Button>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">JavaScript</span>
                  <span className="text-sm text-slate-400">
                    {sourceCode.split('\n').length} dòng
                  </span>
                </div>
                <Textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder={isCodeLoading ? "Đang tải mã nguồn..." : "Mã nguồn lệnh"}
                  className="font-mono text-sm bg-transparent border-none text-slate-300 resize-none min-h-[400px]"
                  disabled={isCodeLoading}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Cảnh báo khi chỉnh sửa mã nguồn
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Đảm bảo cú pháp JavaScript đúng</li>
                      <li>• Kiểm tra kỹ trước khi lưu</li>
                      <li>• Backup file gốc nếu cần thiết</li>
                      <li>• Lệnh có thể bị lỗi nếu code không đúng</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          
          {activeTab === 'code' && (
            <Button
              onClick={handleSaveCode}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileCode className="h-4 w-4" />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu mã nguồn'}</span>
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
