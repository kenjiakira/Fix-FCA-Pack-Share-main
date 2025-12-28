'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@/components/ui';
import { Plus, RefreshCw, Trash2, Crown, Calendar, User } from 'lucide-react';

interface VIPUser {
  userId: string;
  name?: string;
  packageName: string;
  expireTime: string;
}

export default function VIPPage() {
  const [vipUsers, setVipUsers] = useState<VIPUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ userId: '', packageId: 3, days: 30 });

  useEffect(() => {
    loadVIPList();
  }, []);

  const loadVIPList = async () => {
    setLoading(true);
    const result = await api.vip.list();
    if (result.success) {
      setVipUsers((result.data as VIPUser[]) || []);
    }
    setLoading(false);
  };

  const handleAddVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.vip.add(formData.userId, formData.packageId, formData.days);
    if (result.success) {
      setShowModal(false);
      setFormData({ userId: '', packageId: 3, days: 30 });
      loadVIPList();
      alert('Thêm VIP thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  const handleRemoveVIP = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa VIP của user này?')) return;
    const result = await api.vip.remove(userId);
    if (result.success) {
      loadVIPList();
      alert('Xóa VIP thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  const activeVIPCount = vipUsers.filter(user => new Date(user.expireTime) > new Date()).length;
  const expiredVIPCount = vipUsers.filter(user => new Date(user.expireTime) <= new Date()).length;

  return (
    <DashboardLayout title="Quản lý VIP Gold">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Tổng VIP</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{vipUsers.length}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Đang hoạt động</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{activeVIPCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Đã hết hạn</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{expiredVIPCount}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5">
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm VIP Gold
        </Button>
        <Button variant="secondary" onClick={loadVIPList}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <TableHead className="font-semibold text-slate-700">
                <User className="w-4 h-4 inline mr-2" />
                User ID
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Tên</TableHead>
              <TableHead className="font-semibold text-slate-700">
                <Crown className="w-4 h-4 inline mr-2" />
                Gói VIP
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <Calendar className="w-4 h-4 inline mr-2" />
                Hết hạn
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Đang tải dữ liệu...</p>
                </TableCell>
              </TableRow>
            ) : vipUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <Crown className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Chưa có người dùng VIP Gold</p>
                  <p className="text-sm mt-1">Nhấn "Thêm VIP Gold" để bắt đầu</p>
                </TableCell>
              </TableRow>
            ) : (
              vipUsers.map((user) => {
                const expireDate = new Date(user.expireTime);
                const isExpired = expireDate < new Date();
                const daysLeft = Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow 
                    key={user.userId}
                    className={`hover:bg-slate-50 transition-colors ${isExpired ? 'opacity-60' : ''}`}
                  >
                    <TableCell className="font-mono text-sm">{user.userId}</TableCell>
                    <TableCell className="font-medium">{user.name || <span className="text-slate-400">N/A</span>}</TableCell>
                    <TableCell>
                      <Badge 
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-sm"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {user.packageName || 'VIP Gold'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                          {formatDate(expireDate)}
                        </span>
                        {!isExpired && (
                          <span className="text-xs text-slate-500 mt-0.5">
                            Còn {daysLeft} ngày
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs text-red-500 mt-0.5">
                            Đã hết hạn
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => handleRemoveVIP(user.userId)}
                        className="hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-yellow-500" />
              Thêm VIP Gold
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVIP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-medium">
                <User className="w-4 h-4 inline mr-1" />
                User ID
              </Label>
              <Input
                id="userId"
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Nhập User ID"
                required
                className="focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageId" className="text-sm font-medium">
                <Crown className="w-4 h-4 inline mr-1" />
                Gói VIP
              </Label>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-md">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700">VIP Gold</span>
                <Badge className="ml-auto bg-yellow-500 text-white">Mặc định</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Hiện tại chỉ hỗ trợ gói VIP Gold
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="days" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                Số ngày
              </Label>
              <Input
                id="days"
                type="number"
                value={formData.days}
                onChange={(e) =>
                  setFormData({ ...formData, days: parseInt(e.target.value) || 30 })
                }
                placeholder="Nhập số ngày (mặc định: 30)"
                required
                min={1}
                max={365}
                className="focus:ring-yellow-500 focus:border-yellow-500"
              />
              <p className="text-xs text-slate-500">
                Gợi ý: 30 ngày (1 tháng), 90 ngày (3 tháng), 180 ngày (6 tháng), 365 ngày (1 năm)
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm VIP Gold
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
