'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Crown, DollarSign, Clock, Download, Plus, Search, Star, Sparkles, Edit, Save, X } from 'lucide-react';

interface VIPUser {
  userId: string;
  packageId: number;
  name: string;
  userName?: string;
  expireTime: number;
  daysLeft: number;
  isExpired: boolean;
  status: 'active' | 'expired';
  purchaseInfo?: {
    purchaseDate: number;
    months: number;
    voucherApplied?: string;
  };
}



interface VIPStats {
  total: number;
  active: number;
  expired: number;
  byPackage: Record<string, number>;
  expiringSoon: number;
  revenue: {
    total: number;
    thisMonth: number;
    thisYear: number;
  };
}

interface VIPRevenue {
  total: number;
  byMonth: Record<string, number>;
  byPackage: Record<string, number>;
  trend: Array<{ month: string; revenue: number }>;
}

const VipManagementTab: React.FC = () => {
  const [users, setUsers] = useState<VIPUser[]>([]);
  const [stats, setStats] = useState<VIPStats | null>(null);
  const [revenue, setRevenue] = useState<VIPRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<VIPUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [displayConfig, setDisplayConfig] = useState<any>(null);
  const [showEditDisplayDialog, setShowEditDisplayDialog] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<any>(null);
  const [newUser, setNewUser] = useState({ userId: '', packageId: 3, months: 1, reason: '' }); // Chỉ VIP GOLD

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch VIP users
      const usersResponse = await fetch(
        `${API_BASE}/vip/users?page=${currentPage}&limit=20&search=${searchTerm}&status=${statusFilter}`
      );
      const usersData = await usersResponse.json();
      
      if (usersData.success) {
        setUsers(usersData.data.users);
        setTotalPages(usersData.data.pagination.totalPages);
      }

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE}/vip/stats`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch revenue
      const revenueResponse = await fetch(`${API_BASE}/vip/revenue`);
      const revenueData = await revenueResponse.json();
      if (revenueData.success) {
        setRevenue(revenueData.data);
      }

      // Fetch display config
      const displayResponse = await fetch(`${API_BASE}/vip/display-config`);
      const displayData = await displayResponse.json();
      if (displayData.success) {
        setDisplayConfig(displayData.data);
      }
    } catch (error) {
      console.error('Error fetching VIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVIP = async () => {
    try {
      const response = await fetch(`${API_BASE}/vip/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      
      const result = await response.json();
      if (result.success) {
        setShowAddDialog(false);
        setNewUser({ userId: '', packageId: 3, months: 1, reason: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding VIP:', error);
    }
  };

  const handleRemoveVIP = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/vip/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin removal' }),
      });
      
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error removing VIP:', error);
    }
  };

  const handleUpdateVIP = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`${API_BASE}/vip/users/${selectedUser.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedUser.packageId,
          months: 1,
          reason: 'Admin update'
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setShowEditDialog(false);
        setSelectedUser(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating VIP:', error);
    }
  };



  const handleEditDisplay = (packageType: string) => {
    if (!displayConfig || !displayConfig[packageType]) return;
    setEditingDisplay({ packageType, config: { ...displayConfig[packageType] } });
    setShowEditDisplayDialog(true);
  };

  const handleSaveDisplay = async () => {
    if (!editingDisplay || !displayConfig) return;
    
    try {
      const updatedConfig = {
        ...displayConfig,
        [editingDisplay.packageType]: editingDisplay.config
      };
      
      const response = await fetch(`${API_BASE}/vip/display-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig }),
      });
      
      const result = await response.json();
      if (result.success) {
        setShowEditDisplayDialog(false);
        setEditingDisplay(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating display config:', error);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`${API_BASE}/vip/export?format=${format}`);
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vip_users.${format}`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vip_users.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg">
        <Sparkles className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="destructive" className="font-semibold shadow-lg">
        Expired
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Golden Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-200" />
              VIP GOLD Management
              <Star className="h-6 w-6 text-yellow-200 animate-pulse" />
            </h2>
            <p className="text-yellow-100 mt-2 text-lg">Quản lý người dùng VIP GOLD Premium</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => exportData('csv')} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => exportData('json')} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add VIP GOLD
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-yellow-700">
                    <Crown className="h-5 w-5" />
                    Add VIP GOLD User
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userId" className="text-yellow-700 font-semibold">User ID</Label>
                    <Input
                      id="userId"
                      value={newUser.userId}
                      onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                      placeholder="Enter user ID"
                      className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="package" className="text-yellow-700 font-semibold">Package</Label>
                    <div className="text-sm text-yellow-700 p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border-2 border-yellow-300 font-semibold">
                      <Crown className="w-4 h-4 inline mr-2" />
                      VIP GOLD (200,000 VND/tháng)
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="months" className="text-yellow-700 font-semibold">Months</Label>
                    <Select value={newUser.months.toString()} onValueChange={(value) => setNewUser({ ...newUser, months: parseInt(value) })}>
                      <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason" className="text-yellow-700 font-semibold">Reason</Label>
                    <Input
                      id="reason"
                      value={newUser.reason}
                      onChange={(e) => setNewUser({ ...newUser, reason: e.target.value })}
                      placeholder="Reason for adding VIP"
                      className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                  <Button onClick={handleAddVIP} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold">
                    <Crown className="w-4 h-4 mr-2" />
                    Add VIP GOLD
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-yellow-700">Total VIP Users</CardTitle>
              <Crown className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.total}</div>
              <p className="text-xs text-yellow-600 mt-1">
                {stats.active} active, {stats.expired} expired
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-700">Active VIP</CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.active}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats.expiringSoon} expiring soon
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700">Monthly Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(stats.revenue.thisMonth)}</div>
              <p className="text-xs text-blue-600 mt-1">
                Total: {formatCurrency(stats.revenue.total)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-700">Expiring Soon</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">{stats.expiringSoon}</div>
              <p className="text-xs text-orange-600 mt-1">
                Next 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300">
          <TabsTrigger value="users" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-semibold">VIP Users</TabsTrigger>
          <TabsTrigger value="display" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-semibold">Display Config</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-semibold">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Enhanced Filters */}
          <Card className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-yellow-700 font-semibold">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-yellow-600" />
                    <Input
                      id="search"
                      placeholder="Search by user ID or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="status" className="text-yellow-700 font-semibold">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Users Table */}
          <Card className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-b-2 border-yellow-300">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Crown className="h-5 w-5" />
                VIP GOLD Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-yellow-100 to-yellow-200">
                    <TableHead className="text-yellow-700 font-semibold">User ID / Name</TableHead>
                    <TableHead className="text-yellow-700 font-semibold">Package</TableHead>
                    <TableHead className="text-yellow-700 font-semibold">Status</TableHead>
                    <TableHead className="text-yellow-700 font-semibold">Days Left</TableHead>
                    <TableHead className="text-yellow-700 font-semibold">Expire Date</TableHead>
                    <TableHead className="text-yellow-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.userId} className="hover:bg-yellow-50 transition-colors">
                      <TableCell className="font-mono font-semibold">
                        <div>
                          <div>{user.userId}</div>
                          {user.userName && (
                            <div className="text-sm text-yellow-600 font-normal">{user.userName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-yellow-700">{user.name}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.daysLeft > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{user.daysLeft} days</span>
                            <Progress 
                              value={Math.max(0, Math.min(100, (user.daysLeft / 30) * 100))} 
                              className="w-16 h-2" 
                              style={{
                                '--progress-background': 'linear-gradient(to right, #fbbf24, #f59e0b)'
                              } as React.CSSProperties}
                            />
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold">Expired</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{formatDate(user.expireTime)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="shadow-lg">Remove</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-2 border-red-200 shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-700">Remove VIP</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-700">
                                  Are you sure you want to remove VIP from user {user.userId}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveVIP(user.userId)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 border-t-2 border-yellow-300">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 font-semibold text-yellow-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="display" className="space-y-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-b-2 border-yellow-300">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Edit className="h-5 w-5" />
                VIP Display Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6">
                {displayConfig && Object.entries(displayConfig).map(([packageType, config]: [string, any]) => (
                  <Card key={packageType} className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-white border-4 border-yellow-400 shadow-2xl hover:shadow-3xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-yellow-200 to-yellow-300 border-b-2 border-yellow-400">
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-3 text-yellow-800">
                          <span className="text-2xl">{config.icon}</span>
                          {config.name}
                          {config.active !== false ? (
                            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </CardTitle>
                        <Button
                          onClick={() => handleEditDisplay(packageType)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Display
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold mb-4 text-yellow-700 bg-gradient-to-r from-yellow-200 to-yellow-300 p-3 rounded-lg text-center">
                        {config.price} VND
                      </div>
                      <p className="text-sm text-yellow-700 mb-6 font-medium">{config.description}</p>
                      <div className="text-sm">
                        <h4 className="font-bold mb-3 text-yellow-800 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Quyền lợi hiển thị:
                        </h4>
                        <ul className="space-y-2">
                          {Array.isArray(config.benefits) ? 
                            config.benefits.sort((a: any, b: any) => a.order - b.order).map((benefit: any) => (
                              <li key={benefit.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <span className="font-medium text-yellow-700">{benefit.title}</span>
                                <span className="font-mono font-bold text-yellow-800 bg-yellow-200 px-2 py-1 rounded">{benefit.description}</span>
                              </li>
                            )) : 
                            Object.entries(config.benefits || {}).map(([key, benefit]: [string, any]) => (
                              <li key={key} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <span className="font-medium text-yellow-700">{benefit.title}</span>
                                <span className="font-mono font-bold text-yellow-800 bg-yellow-200 px-2 py-1 rounded">{benefit.description}</span>
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {revenue && (
            <Card className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-b-2 border-yellow-300">
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <DollarSign className="h-5 w-5" />
                  Revenue Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-yellow-700 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Revenue by Package
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(revenue.byPackage).map(([pkg, amount]) => (
                        <div key={pkg} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border border-yellow-300">
                          <span className="font-semibold text-yellow-700">{pkg}</span>
                          <span className="font-bold text-yellow-800 bg-yellow-300 px-3 py-1 rounded">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-yellow-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Monthly Trend
                    </h3>
                    <div className="space-y-3">
                      {revenue.trend.slice(-6).map((item) => (
                        <div key={item.month} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border border-yellow-300">
                          <span className="font-semibold text-yellow-700">{item.month}</span>
                          <span className="font-bold text-yellow-800 bg-yellow-300 px-3 py-1 rounded">{formatCurrency(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-700">
              <Crown className="h-5 w-5" />
              Edit VIP GOLD User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-yellow-700 font-semibold">User ID</Label>
                <Input value={selectedUser.userId} disabled className="bg-yellow-50 border-yellow-300" />
              </div>
              <div>
                <Label className="text-yellow-700 font-semibold">Package</Label>
                <div className="text-sm text-yellow-700 p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border-2 border-yellow-300 font-semibold">
                  <Crown className="w-4 h-4 inline mr-2" />
                  VIP GOLD (200,000 VND/tháng)
                </div>
              </div>
              <Button onClick={handleUpdateVIP} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold">
                <Crown className="w-4 h-4 mr-2" />
                Update VIP GOLD
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Display Config Dialog */}
      <Dialog open={showEditDisplayDialog} onOpenChange={setShowEditDisplayDialog}>
        <DialogContent className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-700">
              <Edit className="h-5 w-5" />
              Edit VIP Display Configuration
            </DialogTitle>
          </DialogHeader>
          {editingDisplay && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-700 font-semibold">Package Name</Label>
                  <Input
                    value={editingDisplay.config.name}
                    onChange={(e) => setEditingDisplay({
                      ...editingDisplay,
                      config: { ...editingDisplay.config, name: e.target.value }
                    })}
                    className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <Label className="text-yellow-700 font-semibold">Price (VND)</Label>
                  <Input
                    value={editingDisplay.config.price}
                    onChange={(e) => setEditingDisplay({
                      ...editingDisplay,
                      config: { ...editingDisplay.config, price: e.target.value }
                    })}
                    className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-yellow-700 font-semibold">Icon</Label>
                <Input
                  value={editingDisplay.config.icon}
                  onChange={(e) => setEditingDisplay({
                    ...editingDisplay,
                    config: { ...editingDisplay.config, icon: e.target.value }
                  })}
                  className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="👑"
                />
              </div>
              
              <div>
                <Label className="text-yellow-700 font-semibold">Description</Label>
                <Textarea
                  value={editingDisplay.config.description}
                  onChange={(e) => setEditingDisplay({
                    ...editingDisplay,
                    config: { ...editingDisplay.config, description: e.target.value }
                  })}
                  rows={3}
                  className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-700 font-semibold">Payment Command</Label>
                  <Input
                    value={editingDisplay.config.payment_command}
                    onChange={(e) => setEditingDisplay({
                      ...editingDisplay,
                      config: { ...editingDisplay.config, payment_command: e.target.value }
                    })}
                    className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    placeholder=".qr vip gold"
                  />
                </div>
                <div>
                  <Label className="text-yellow-700 font-semibold">Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={editingDisplay.config.active !== false}
                      onChange={(e) => setEditingDisplay({
                        ...editingDisplay,
                        config: { ...editingDisplay.config, active: e.target.checked }
                      })}
                      className="w-4 h-4 text-yellow-600 bg-yellow-100 border-yellow-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="active" className="text-sm text-yellow-700">
                      {editingDisplay.config.active !== false ? 'Active' : 'Inactive'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-yellow-700 font-semibold">Benefits Configuration</Label>
                  <Button
                    onClick={() => {
                      const newBenefit = {
                        id: `benefit_${Date.now()}`,
                        title: "🎯 Quyền lợi mới",
                        description: "Mô tả quyền lợi",
                        order: (editingDisplay.config.benefits?.length || 0) + 1
                      };
                      setEditingDisplay({
                        ...editingDisplay,
                        config: {
                          ...editingDisplay.config,
                          benefits: [...(editingDisplay.config.benefits || []), newBenefit]
                        }
                      });
                    }}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-4">
                  {Array.isArray(editingDisplay.config.benefits) ? 
                    editingDisplay.config.benefits.sort((a: any, b: any) => a.order - b.order).map((benefit: any, index: number) => (
                      <div key={benefit.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-yellow-700">#{benefit.order}</span>
                          <Button
                            onClick={() => {
                              const newBenefits = editingDisplay.config.benefits.filter((b: any) => b.id !== benefit.id);
                              setEditingDisplay({
                                ...editingDisplay,
                                config: {
                                  ...editingDisplay.config,
                                  benefits: newBenefits
                                }
                              });
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm text-yellow-700 font-medium">ID</Label>
                            <Input
                              value={benefit.id}
                              onChange={(e) => {
                                const newBenefits = editingDisplay.config.benefits.map((b: any) => 
                                  b.id === benefit.id ? { ...b, id: e.target.value } : b
                                );
                                setEditingDisplay({
                                  ...editingDisplay,
                                  config: { ...editingDisplay.config, benefits: newBenefits }
                                });
                              }}
                              className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-yellow-700 font-medium">Title</Label>
                            <Input
                              value={benefit.title}
                              onChange={(e) => {
                                const newBenefits = editingDisplay.config.benefits.map((b: any) => 
                                  b.id === benefit.id ? { ...b, title: e.target.value } : b
                                );
                                setEditingDisplay({
                                  ...editingDisplay,
                                  config: { ...editingDisplay.config, benefits: newBenefits }
                                });
                              }}
                              className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-yellow-700 font-medium">Order</Label>
                            <Input
                              type="number"
                              value={benefit.order}
                              onChange={(e) => {
                                const newBenefits = editingDisplay.config.benefits.map((b: any) => 
                                  b.id === benefit.id ? { ...b, order: parseInt(e.target.value) || 1 } : b
                                );
                                setEditingDisplay({
                                  ...editingDisplay,
                                  config: { ...editingDisplay.config, benefits: newBenefits }
                                });
                              }}
                              className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <Label className="text-sm text-yellow-700 font-medium">Description</Label>
                          <Input
                            value={benefit.description}
                            onChange={(e) => {
                              const newBenefits = editingDisplay.config.benefits.map((b: any) => 
                                b.id === benefit.id ? { ...b, description: e.target.value } : b
                              );
                              setEditingDisplay({
                                ...editingDisplay,
                                config: { ...editingDisplay.config, benefits: newBenefits }
                              });
                            }}
                            className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    )) : 
                    Object.entries(editingDisplay.config.benefits || {}).map(([key, benefit]: [string, any]) => (
                      <div key={key} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-yellow-700 font-medium">Title</Label>
                            <Input
                              value={benefit.title}
                              onChange={(e) => setEditingDisplay({
                                ...editingDisplay,
                                config: {
                                  ...editingDisplay.config,
                                  benefits: {
                                    ...editingDisplay.config.benefits,
                                    [key]: { ...benefit, title: e.target.value }
                                  }
                                }
                              })}
                              className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-yellow-700 font-medium">Description</Label>
                            <Input
                              value={benefit.description}
                              onChange={(e) => setEditingDisplay({
                                ...editingDisplay,
                                config: {
                                  ...editingDisplay.config,
                                  benefits: {
                                    ...editingDisplay.config.benefits,
                                    [key]: { ...benefit, description: e.target.value }
                                  }
                                }
                              })}
                              className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveDisplay} 
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setShowEditDisplayDialog(false)} 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VipManagementTab;
