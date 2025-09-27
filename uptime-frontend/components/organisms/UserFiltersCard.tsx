import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter } from 'lucide-react'
import UserFilters from '@/components/molecules/UserFilters'

interface UserFiltersCardProps {
  search: string
  rank: string
  sortBy: string
  sortOrder: string
  onSearchChange: (value: string) => void
  onRankChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: string) => void
}

export default function UserFiltersCard({
  search,
  rank,
  sortBy,
  sortOrder,
  onSearchChange,
  onRankChange,
  onSortByChange,
  onSortOrderChange
}: UserFiltersCardProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <span>Bộ lọc và tìm kiếm</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UserFilters
          search={search}
          rank={rank}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={onSearchChange}
          onRankChange={onRankChange}
          onSortByChange={onSortByChange}
          onSortOrderChange={onSortOrderChange}
        />
      </CardContent>
    </Card>
  )
}
