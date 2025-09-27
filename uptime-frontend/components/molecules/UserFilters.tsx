import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

interface UserFiltersProps {
  search: string
  rank: string
  sortBy: string
  sortOrder: string
  onSearchChange: (value: string) => void
  onRankChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: string) => void
}

export default function UserFilters({
  search,
  rank,
  sortBy,
  sortOrder,
  onSearchChange,
  onRankChange,
  onSortByChange,
  onSortOrderChange
}: UserFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={rank} onValueChange={onRankChange}>
        <SelectTrigger>
          <SelectValue placeholder="Rank" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="Bronze">Bronze</SelectItem>
          <SelectItem value="Silver">Silver</SelectItem>
          <SelectItem value="Gold">Gold</SelectItem>
          <SelectItem value="Platinum">Platinum</SelectItem>
          <SelectItem value="Diamond">Diamond</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger>
          <SelectValue placeholder="Sắp xếp theo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="exp">Exp</SelectItem>
          <SelectItem value="level">Level</SelectItem>
          <SelectItem value="name">Tên</SelectItem>
          <SelectItem value="lastActive">Hoạt động cuối</SelectItem>
          <SelectItem value="joinDate">Ngày tham gia</SelectItem>
          <SelectItem value="warnings">Cảnh báo</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger>
          <SelectValue placeholder="Thứ tự" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Giảm dần</SelectItem>
          <SelectItem value="asc">Tăng dần</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
