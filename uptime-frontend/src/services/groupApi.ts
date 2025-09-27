import apiClient from './api'

export interface Group {
  id: string
  name: string
  memberCount: number
  adminCount: number
  messageCount: number
  createdAt: string
  lastActivity: string
  isActive: boolean
  settings: any
}

export interface GroupDetail extends Group {
  members: string[]
  admins: string[]
  totalMessages: number
  statistics: {
    topMembers: Array<{ userId: string; count: number }>
    activityLevel: string
    growthRate: string
  }
}

export interface GroupStats {
  totalGroups: number
  activeGroups: number
  totalMembers: number
  totalAdmins: number
  totalMessages: number
  averageMembersPerGroup: number
  topGroups: Array<{
    id: string
    name: string
    memberCount: number
    messageCount: number
  }>
}

export interface AdminAction {
  action: 'add_admin' | 'remove_admin'
  userId: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  total?: number
  message?: string
}

export const groupService = {
  // Lấy danh sách tất cả nhóm
  getGroups: () => apiClient.get<ApiResponse<Group[]>>('/groups'),

  // Lấy thống kê nhóm
  getGroupStats: () => apiClient.get<ApiResponse<GroupStats>>('/groups/stats'),

  // Lấy thông tin chi tiết một nhóm
  getGroupById: (threadId: string) => apiClient.get<ApiResponse<GroupDetail>>(`/groups/${threadId}`),

  // Cập nhật thông tin nhóm
  updateGroup: (threadId: string, updateData: Partial<Group>) => 
    apiClient.put(`/groups/${threadId}`, updateData),

  // Xóa nhóm
  deleteGroup: (threadId: string) => apiClient.delete(`/groups/${threadId}`),

  // Quản lý Admin nhóm
  manageGroupAdmins: (threadId: string, adminAction: AdminAction) =>
    apiClient.post(`/groups/${threadId}/admins`, adminAction)
}
