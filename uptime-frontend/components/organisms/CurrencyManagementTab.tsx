'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { currencyApi, CurrencyStats, UserCurrency, Transaction, UserDetails } from '@/src/services/currencyApi'
import { formatNumber, formatDate } from '@/lib/utils'
import CurrencyChart from '@/components/CurrencyChart'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity, 
  Search, 
  Plus, 
  Edit, 
  Eye,
  Wallet,
  Building,
  ArrowUpDown,
  RefreshCw,
  User
} from 'lucide-react'

export default function CurrencyManagementTab() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CurrencyStats | null>(null)
  const [users, setUsers] = useState<UserCurrency[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false)
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isEditWalletOpen, setIsEditWalletOpen] = useState(false)
  const [isEditBankOpen, setIsEditBankOpen] = useState(false)
  const [isEditCreditOpen, setIsEditCreditOpen] = useState(false)
  
  const [updateForm, setUpdateForm] = useState({
    userId: '',
    amount: '',
    type: 'wallet'
  })
  const [transactionForm, setTransactionForm] = useState({
    userId: '',
    type: 'in' as 'in' | 'out',
    amount: '',
    description: ''
  })
  
  // New edit forms
  const [editUserForm, setEditUserForm] = useState({
    walletBalance: '',
    bankBalance: '',
    creditScore: '',
    description: ''
  })
  
  const [editWalletForm, setEditWalletForm] = useState({
    balance: '',
    description: ''
  })
  
  const [editBankForm, setEditBankForm] = useState({
    balance: '',
    description: ''
  })
  
  const [editCreditForm, setEditCreditForm] = useState({
    creditScore: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab, currentPage, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'overview') {
        const statsData = await currencyApi.getStats()
        setStats(statsData)
      } else if (activeTab === 'charts') {
        const statsData = await currencyApi.getStats()
        setStats(statsData)
      } else if (activeTab === 'users') {
        const usersData = await currencyApi.getUsers(currentPage, 20, searchTerm)
        setUsers(usersData.users)
        setTotalPages(usersData.pagination.totalPages)
      } else if (activeTab === 'transactions') {
        const transactionsData = await currencyApi.getTransactions(undefined, 50)
        setTransactions(transactionsData)
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể tải dữ liệu: ${errorMessage}`)
      } else if (err.request) {
        // Network error
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        // Other errors
        setError('Không thể tải dữ liệu. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBalance = async () => {
    try {
      const amount = parseFloat(updateForm.amount)
      if (isNaN(amount)) {
        setError('Số tiền không hợp lệ')
        return
      }

      await currencyApi.updateUserBalance(updateForm.userId, amount, updateForm.type)
      setIsUpdateBalanceOpen(false)
      setUpdateForm({ userId: '', amount: '', type: 'wallet' })
      loadData()
    } catch (err: any) {
      console.error('Error updating balance:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể cập nhật số dư: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể cập nhật số dư')
      }
    }
  }

  const handleCreateTransaction = async () => {
    try {
      const amount = parseFloat(transactionForm.amount)
      if (isNaN(amount)) {
        setError('Số tiền không hợp lệ')
        return
      }

      await currencyApi.createTransaction(
        transactionForm.userId,
        transactionForm.type,
        amount,
        transactionForm.description
      )
      setIsCreateTransactionOpen(false)
      setTransactionForm({ userId: '', type: 'in', amount: '', description: '' })
      loadData()
    } catch (err: any) {
      console.error('Error creating transaction:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể tạo giao dịch: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể tạo giao dịch')
      }
    }
  }

  // State để lưu userId đang được edit
  const [editingUserId, setEditingUserId] = useState('')

  // New edit handlers
  const handleEditUser = async () => {
    try {
      if (!editingUserId) {
        setError('Vui lòng chọn người dùng để chỉnh sửa')
        return
      }

      const userData: any = {}
      if (editUserForm.walletBalance) userData.walletBalance = parseFloat(editUserForm.walletBalance)
      if (editUserForm.bankBalance) userData.bankBalance = parseFloat(editUserForm.bankBalance)
      if (editUserForm.creditScore) userData.creditScore = parseInt(editUserForm.creditScore)
      if (editUserForm.description) userData.description = editUserForm.description

      await currencyApi.updateUserDetails(editingUserId, userData)
      setIsEditUserOpen(false)
      setEditUserForm({ walletBalance: '', bankBalance: '', creditScore: '', description: '' })
      setEditingUserId('')
      loadData()
    } catch (err: any) {
      console.error('Error editing user:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể chỉnh sửa người dùng: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể chỉnh sửa người dùng')
      }
    }
  }

  const handleEditWallet = async () => {
    try {
      if (!editingUserId) {
        setError('Vui lòng chọn người dùng để chỉnh sửa')
        return
      }

      const balance = parseFloat(editWalletForm.balance)
      if (isNaN(balance)) {
        setError('Số dư không hợp lệ')
        return
      }

      await currencyApi.setUserWalletBalance(
        editingUserId,
        balance,
        editWalletForm.description
      )
      setIsEditWalletOpen(false)
      setEditWalletForm({ balance: '', description: '' })
      setEditingUserId('')
      loadData()
    } catch (err: any) {
      console.error('Error editing wallet:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể chỉnh sửa ví: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể chỉnh sửa ví')
      }
    }
  }

  const handleEditBank = async () => {
    try {
      if (!editingUserId) {
        setError('Vui lòng chọn người dùng để chỉnh sửa')
        return
      }

      const balance = parseFloat(editBankForm.balance)
      if (isNaN(balance)) {
        setError('Số dư không hợp lệ')
        return
      }

      await currencyApi.setUserBankBalance(
        editingUserId,
        balance,
        editBankForm.description
      )
      setIsEditBankOpen(false)
      setEditBankForm({ balance: '', description: '' })
      setEditingUserId('')
      loadData()
    } catch (err: any) {
      console.error('Error editing bank:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể chỉnh sửa ngân hàng: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể chỉnh sửa ngân hàng')
      }
    }
  }

  const handleEditCredit = async () => {
    try {
      if (!editingUserId) {
        setError('Vui lòng chọn người dùng để chỉnh sửa')
        return
      }

      const creditScore = parseInt(editCreditForm.creditScore)
      if (isNaN(creditScore)) {
        setError('Điểm tín dụng không hợp lệ')
        return
      }

      await currencyApi.updateUserCreditScore(
        editingUserId,
        creditScore,
        editCreditForm.description
      )
      setIsEditCreditOpen(false)
      setEditCreditForm({ creditScore: '', description: '' })
      setEditingUserId('')
      loadData()
    } catch (err: any) {
      console.error('Error editing credit score:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể chỉnh sửa điểm tín dụng: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể chỉnh sửa điểm tín dụng')
      }
    }
  }

  const handleViewUserDetails = async (userId: string) => {
    try {
      const userDetails = await currencyApi.getUserDetails(userId)
      setSelectedUser(userDetails)
      setIsUserDetailsOpen(true)
    } catch (err: any) {
      console.error('Error loading user details:', err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Lỗi từ máy chủ'
        setError(`Không thể tải thông tin người dùng: ${errorMessage}`)
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      } else {
        setError('Không thể tải thông tin người dùng')
      }
    }
  }

  const getCurrencyIcon = (type: string) => {
    switch (type) {
      case 'wallet': return <Wallet className="h-4 w-4" />
      case 'bank': return <Building className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getCurrencyColor = (type: string) => {
    switch (type) {
      case 'wallet': return 'text-green-600'
      case 'bank': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Tiền tệ</h2>
          <p className="text-muted-foreground">
            Quản lý hệ thống tiền tệ và giao dịch của người dùng
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 bg-white dark:bg-gray-900">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="actions">Thao tác</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg">
          {stats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng tiền ví</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalBalance)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng tiền ngân hàng</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalBankBalance)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 người dùng giàu nhất (Ví)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topUsersByBalance.slice(0, 10).map((user, index) => (
                        <div key={user.userId} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-sm">
                              {index + 1}: {user.name || user.userId}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {formatNumber(user.amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Phân bố tiền tệ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-green-600" />
                          Ví
                        </span>
                        <Badge variant="outline">
                          {formatNumber(stats.currencyDistribution.wallet)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          Ngân hàng
                        </span>
                        <Badge variant="outline">
                          {formatNumber(stats.currencyDistribution.bank)}
                        </Badge>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg">
          {stats && <CurrencyChart stats={stats} />}
        </TabsContent>

        <TabsContent value="users" className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo ID hoặc tên người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>
                Quản lý thông tin tiền tệ của người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Ví</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Tổng cộng</TableHead>
                    <TableHead>Điểm tín dụng</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {user.userId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          {formatNumber(user.walletBalance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600">
                          {formatNumber(user.bankBalance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {formatNumber(user.totalBalance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.creditScore >= 70 ? "default" : "secondary"}>
                          {user.creditScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUserDetails(user.userId)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                                                        <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUserId(user.userId)
                                  setEditUserForm({
                                    walletBalance: user.walletBalance.toString(),
                                    bankBalance: user.bankBalance.toString(),
                                    creditScore: user.creditScore.toString(),
                                    description: ''
                                  })
                                  setIsEditUserOpen(true)
                                }}
                              >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Xem tất cả giao dịch trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>ID người dùng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Mô tả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        {formatDate(transaction.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                          {transaction.type === 'in' ? 'Nhập' : 'Xuất'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'in' ? '+' : '-'}{formatNumber(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cập nhật số dư</CardTitle>
                <CardDescription>
                  Thêm hoặc trừ tiền từ tài khoản người dùng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isUpdateBalanceOpen} onOpenChange={setIsUpdateBalanceOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Cập nhật số dư
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cập nhật số dư</DialogTitle>
                      <DialogDescription>
                        Nhập thông tin để cập nhật số dư người dùng
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userId">ID người dùng</Label>
                        <Input
                          id="userId"
                          value={updateForm.userId}
                          onChange={(e) => setUpdateForm({ ...updateForm, userId: e.target.value })}
                          placeholder="Nhập ID người dùng"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Số tiền</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={updateForm.amount}
                          onChange={(e) => setUpdateForm({ ...updateForm, amount: e.target.value })}
                          placeholder="Nhập số tiền"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Loại tài khoản</Label>
                        <Select
                          value={updateForm.type}
                          onValueChange={(value) => setUpdateForm({ ...updateForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wallet">Ví</SelectItem>
                            <SelectItem value="bank">Ngân hàng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUpdateBalanceOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleUpdateBalance}>
                        Cập nhật
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tạo giao dịch</CardTitle>
                <CardDescription>
                  Tạo giao dịch mới cho người dùng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isCreateTransactionOpen} onOpenChange={setIsCreateTransactionOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Tạo giao dịch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo giao dịch</DialogTitle>
                      <DialogDescription>
                        Tạo giao dịch mới cho người dùng
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="txUserId">ID người dùng</Label>
                        <Input
                          id="txUserId"
                          value={transactionForm.userId}
                          onChange={(e) => setTransactionForm({ ...transactionForm, userId: e.target.value })}
                          placeholder="Nhập ID người dùng"
                        />
                      </div>
                      <div>
                        <Label htmlFor="txType">Loại giao dịch</Label>
                        <Select
                          value={transactionForm.type}
                          onValueChange={(value: 'in' | 'out') => setTransactionForm({ ...transactionForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">Nhập tiền</SelectItem>
                            <SelectItem value="out">Xuất tiền</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="txAmount">Số tiền</Label>
                        <Input
                          id="txAmount"
                          type="number"
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                          placeholder="Nhập số tiền"
                        />
                      </div>
                      <div>
                        <Label htmlFor="txDescription">Mô tả</Label>
                        <Input
                          id="txDescription"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                          placeholder="Mô tả giao dịch"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateTransactionOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleCreateTransaction}>
                        Tạo giao dịch
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chỉnh sửa chi tiết người dùng</CardTitle>
                <CardDescription>
                  Chỉnh sửa thông tin chi tiết của người dùng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Dialog open={isEditWalletOpen} onOpenChange={setIsEditWalletOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Wallet className="h-4 w-4 mr-2" />
                        Chỉnh sửa ví
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa số dư ví</DialogTitle>
                        <DialogDescription>
                          Đặt số dư ví tuyệt đối cho người dùng
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">

                        <div>
                          <Label htmlFor="editWalletBalance">Số dư mới</Label>
                          <Input
                            id="editWalletBalance"
                            type="number"
                            value={editWalletForm.balance}
                            onChange={(e) => setEditWalletForm({ ...editWalletForm, balance: e.target.value })}
                            placeholder="Nhập số dư mới"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editWalletDescription">Mô tả</Label>
                          <Input
                            id="editWalletDescription"
                            value={editWalletForm.description}
                            onChange={(e) => setEditWalletForm({ ...editWalletForm, description: e.target.value })}
                            placeholder="Mô tả thay đổi"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditWalletOpen(false)}>
                          Hủy
                        </Button>
                        <Button onClick={handleEditWallet}>
                          Cập nhật
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditBankOpen} onOpenChange={setIsEditBankOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Building className="h-4 w-4 mr-2" />
                        Chỉnh sửa ngân hàng
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa số dư ngân hàng</DialogTitle>
                        <DialogDescription>
                          Đặt số dư ngân hàng tuyệt đối cho người dùng
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editBankUserId">ID người dùng</Label>
                          <Input
                            id="editBankUserId"
                            value={editingUserId}
                            onChange={(e) => setEditingUserId(e.target.value)}
                            placeholder="Nhập ID người dùng"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBankBalance">Số dư mới</Label>
                          <Input
                            id="editBankBalance"
                            type="number"
                            value={editBankForm.balance}
                            onChange={(e) => setEditBankForm({ ...editBankForm, balance: e.target.value })}
                            placeholder="Nhập số dư mới"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBankDescription">Mô tả</Label>
                          <Input
                            id="editBankDescription"
                            value={editBankForm.description}
                            onChange={(e) => setEditBankForm({ ...editBankForm, description: e.target.value })}
                            placeholder="Mô tả thay đổi"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditBankOpen(false)}>
                          Hủy
                        </Button>
                        <Button onClick={handleEditBank}>
                          Cập nhật
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditCreditOpen} onOpenChange={setIsEditCreditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Chỉnh sửa điểm tín dụng
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa điểm tín dụng</DialogTitle>
                        <DialogDescription>
                          Cập nhật điểm tín dụng cho người dùng
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editCreditUserId">ID người dùng</Label>
                          <Input
                            id="editCreditUserId"
                            value={editingUserId}
                            onChange={(e) => setEditingUserId(e.target.value)}
                            placeholder="Nhập ID người dùng"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editCreditScore">Điểm tín dụng mới</Label>
                          <Input
                            id="editCreditScore"
                            type="number"
                            value={editCreditForm.creditScore}
                            onChange={(e) => setEditCreditForm({ ...editCreditForm, creditScore: e.target.value })}
                            placeholder="Nhập điểm tín dụng (0-100)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editCreditDescription">Mô tả</Label>
                          <Input
                            id="editCreditDescription"
                            value={editCreditForm.description}
                            onChange={(e) => setEditCreditForm({ ...editCreditForm, description: e.target.value })}
                            placeholder="Mô tả thay đổi"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditCreditOpen(false)}>
                          Hủy
                        </Button>
                        <Button onClick={handleEditCredit}>
                          Cập nhật
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về tài khoản tiền tệ
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedUser.userId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Điểm tín dụng</Label>
                  <Badge variant={selectedUser.creditScore >= 70 ? "default" : "secondary"}>
                    {selectedUser.creditScore}
                  </Badge>
                </div>
                <div>
                  <Label>Số dư ví</Label>
                  <p className="text-sm font-bold text-green-600">
                    {formatNumber(selectedUser.walletBalance)}
                  </p>
                </div>
                <div>
                  <Label>Số dư ngân hàng</Label>
                  <p className="text-sm font-bold text-blue-600">
                    {formatNumber(selectedUser.bankBalance)}
                  </p>
                </div>
                <div>
                  <Label>Tổng giao dịch</Label>
                  <p className="text-sm">{selectedUser.totalTransactions}</p>
                </div>
              </div>

              <div>
                <Label>Giao dịch gần đây</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedUser.recentTransactions.map((tx, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                      <span>{tx.description}</span>
                      <Badge variant={tx.type === 'in' ? 'default' : 'destructive'}>
                        {tx.type === 'in' ? '+' : '-'}{formatNumber(tx.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin chi tiết của người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editWalletBalance">Số dư ví</Label>
                <Input
                  id="editWalletBalance"
                  type="number"
                  value={editUserForm.walletBalance}
                  onChange={(e) => setEditUserForm({ ...editUserForm, walletBalance: e.target.value })}
                  placeholder="Số dư ví"
                />
              </div>
              <div>
                <Label htmlFor="editBankBalance">Số dư ngân hàng</Label>
                <Input
                  id="editBankBalance"
                  type="number"
                  value={editUserForm.bankBalance}
                  onChange={(e) => setEditUserForm({ ...editUserForm, bankBalance: e.target.value })}
                  placeholder="Số dư ngân hàng"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editCreditScore">Điểm tín dụng</Label>
              <Input
                id="editCreditScore"
                type="number"
                value={editUserForm.creditScore}
                onChange={(e) => setEditUserForm({ ...editUserForm, creditScore: e.target.value })}
                placeholder="Điểm tín dụng (0-100)"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Mô tả thay đổi</Label>
              <Input
                id="editDescription"
                value={editUserForm.description}
                onChange={(e) => setEditUserForm({ ...editUserForm, description: e.target.value })}
                placeholder="Mô tả lý do thay đổi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditUser}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về tài khoản tiền tệ
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedUser.userId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Điểm tín dụng</Label>
                  <Badge variant={selectedUser.creditScore >= 70 ? "default" : "secondary"}>
                    {selectedUser.creditScore}
                  </Badge>
                </div>
                <div>
                  <Label>Số dư ví</Label>
                  <p className="text-sm font-bold text-green-600">
                    {formatNumber(selectedUser.walletBalance)}
                  </p>
                </div>
                <div>
                  <Label>Số dư ngân hàng</Label>
                  <p className="text-sm font-bold text-blue-600">
                    {formatNumber(selectedUser.bankBalance)}
                  </p>
                </div>
                <div>
                  <Label>Tổng giao dịch</Label>
                  <p className="text-sm">{selectedUser.totalTransactions}</p>
                </div>
              </div>

              <div>
                <Label>Giao dịch gần đây</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedUser.recentTransactions.map((tx, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                      <span>{tx.description}</span>
                      <Badge variant={tx.type === 'in' ? 'default' : 'destructive'}>
                        {tx.type === 'in' ? '+' : '-'}{formatNumber(tx.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
