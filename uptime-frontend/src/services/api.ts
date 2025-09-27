import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const botStatusService = {
  getStatus: () => apiClient.get('/bot/status'),
  getUptimeHistory: (period = '24h') => apiClient.get(`/bot/uptime-history?period=${period}`),
  getLogs: () => apiClient.get('/bot/logs'),
  restartBot: () => apiClient.post('/bot/restart'),
  updateStats: (data: any) => apiClient.post('/bot/update-stats', data),
  healthCheck: () => apiClient.get('/health'),
}



export const commandService = {
  getCommands: () => apiClient.get('/commands'),
  getCommandStats: () => apiClient.get('/commands/stats'),
  getTopCommands: (limit = 10) => apiClient.get(`/commands/top?limit=${limit}`),
  getCommandsByCategory: (category: string) => apiClient.get(`/commands/category/${category}`),
  getCommandsByPermission: (permission: string) => apiClient.get(`/commands/permission/${permission}`),
  getCommandsWithErrors: (threshold = 5) => apiClient.get(`/commands/errors?threshold=${threshold}`),
  getRecentCommands: (limit = 5) => apiClient.get(`/commands/recent?limit=${limit}`),
  refreshCache: () => apiClient.post('/commands/refresh'),
  updateCommand: (commandName: string, data: any) => apiClient.put(`/commands/${commandName}`, data),
  deleteCommand: (commandName: string) => apiClient.delete(`/commands/${commandName}`),
  toggleCommandStatus: (commandName: string, isActive: boolean) => apiClient.patch(`/commands/${commandName}/status`, { isActive }),
  getCommandDetails: (commandName: string) => apiClient.get(`/commands/${commandName}`),
  createCommand: (data: any) => apiClient.post('/commands', data),
  exportCommands: (format = 'json') => apiClient.get(`/commands/export?format=${format}`),
  getCommandCode: (commandName: string) => apiClient.get(`/commands/${commandName}/code`),
  updateCommandCode: (commandName: string, code: string) => apiClient.post(`/commands/${commandName}/code`, { code }),
}

export const userService = {
  getUserStats: () => apiClient.get('/users'),
  getUsers: (params: any) => apiClient.get('/users/list', { params }),
  getUserAnalytics: () => apiClient.get('/users/analytics'),
  getTopUsers: (limit = 10) => apiClient.get(`/users/top?limit=${limit}`),
  getActiveUsers: (hours = 24) => apiClient.get(`/users/active?hours=${hours}`),
  getUserById: (userId: string) => apiClient.get(`/users/${userId}`),
  getUserDetails: (userId: string) => apiClient.get(`/users/${userId}/details`),
  updateUser: (userId: string, data: any) => apiClient.put(`/users/${userId}`, data),
  banUser: (userId: string, data: any) => apiClient.post(`/users/${userId}/ban`, data),
  unbanUser: (userId: string) => apiClient.post(`/users/${userId}/unban`),
  warnUser: (userId: string, data: any) => apiClient.post(`/users/${userId}/warn`, data),
  removeWarning: (warningId: string) => apiClient.delete(`/users/warnings/${warningId}`),
  searchUsers: (query: string) => apiClient.get(`/users/search/${query}`),
  exportUserStats: (format = 'json') => apiClient.get(`/users/stats/export?format=${format}`),
  getUsersByRank: (rank: string, limit = 10) => apiClient.get(`/users/rank/${rank}?limit=${limit}`),
  checkAvatar: (userId: string) => apiClient.get(`/users/${userId}/avatar`),
  
  // New methods for user actions
  getUserActions: (params: any) => apiClient.get('/users/actions', { params }),
  performBulkAction: (data: any) => apiClient.post('/users/bulk-actions', data),
  getUserWarnings: (userId: string) => apiClient.get(`/users/${userId}/warnings`),
}

export const adminService = {
  // Admin configuration
  getConfig: () => apiClient.get('/admin/config'),
  updateConfig: (data: any) => apiClient.post('/admin/config', data),
  
  // Admin users management
  getUsers: () => apiClient.get('/admin/users'),
  addUser: (data: any) => apiClient.post('/admin/users/add', data),
  removeUser: (data: any) => apiClient.post('/admin/users/remove', data),
  bulkOperation: (data: any) => apiClient.post('/admin/users/bulk', data),
  checkUserRole: (uid: string) => apiClient.get(`/admin/users/check/${uid}`),
  getUserInfo: (uid: string) => apiClient.get(`/admin/users/info/${uid}`),
}

export default apiClient
