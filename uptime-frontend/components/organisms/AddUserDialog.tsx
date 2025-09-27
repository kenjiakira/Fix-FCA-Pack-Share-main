import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import SearchUserItem from '@/components/molecules/SearchUserItem'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResults: any[]
  isSearching: boolean
  onSearch: () => void
  newUser: { uid: string; role: string }
  onNewUserChange: (user: { uid: string; role: string }) => void
  onAddUser: () => void
  onCancel: () => void
}

export default function AddUserDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  onSearch,
  newUser,
  onNewUserChange,
  onAddUser,
  onCancel
}: AddUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Thêm Nhân viên</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="search-query" className="text-sm font-medium text-gray-700">Tìm kiếm người dùng</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="search-query"
                placeholder="Tìm theo tên hoặc UID"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                className="border-gray-200 focus:border-blue-500"
              />
              <Button 
                variant="outline" 
                onClick={onSearch}
                disabled={isSearching}
                className="border-gray-200 hover:bg-gray-50"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Tìm kiếm'}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium mb-3 text-gray-700">Kết quả tìm kiếm:</p>
              {searchResults.map((user) => (
                <SearchUserItem
                  key={user.userId}
                  user={user}
                  isSelected={newUser.uid === user.userId}
                  onSelect={(userId) => onNewUserChange({ ...newUser, uid: userId })}
                />
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="user-uid" className="text-sm font-medium text-gray-700">ID người dùng đã chọn</Label>
            <Input
              id="user-uid"
              placeholder="Nhập Facebook UID hoặc chọn từ kết quả tìm kiếm"
              value={newUser.uid}
              onChange={(e) => onNewUserChange({ ...newUser, uid: e.target.value })}
              className="mt-2 border-gray-200 focus:border-blue-500"
            />
          </div>
          
          <div>
            <Label htmlFor="user-role" className="text-sm font-medium text-gray-700">Vai trò</Label>
            <Select 
              value={newUser.role} 
              onValueChange={(value) => onNewUserChange({ ...newUser, role: value })}
            >
              <SelectTrigger className="mt-2 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="moderator">Điều hành viên</SelectItem>
                <SelectItem value="support">Hỗ trợ viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-200 hover:bg-gray-50"
            >
              Hủy bỏ
            </Button>
            <Button onClick={onAddUser} className="bg-blue-600 hover:bg-blue-700">
              Thêm người dùng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
