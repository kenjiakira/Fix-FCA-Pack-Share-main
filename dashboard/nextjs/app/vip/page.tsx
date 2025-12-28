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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

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
      {/* Stats */}
      <div className="flex items-center gap-6 mb-6 pb-4 border-b border-slate-200">
        <div>
          <p className="text-sm text-slate-500">Tổng VIP</p>
          <p className="text-2xl font-semibold text-slate-900">{vipUsers.length}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Đang hoạt động</p>
          <p className="text-2xl font-semibold text-slate-900">{activeVIPCount}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Đã hết hạn</p>
          <p className="text-2xl font-semibold text-slate-900">{expiredVIPCount}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm VIP Gold
        </Button>
        <Button variant="secondary" onClick={loadVIPList}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-medium text-slate-700 w-[25%] md:w-[30%]">
                <span className="md:hidden">ID</span>
                <span className="hidden md:inline">User ID</span>
              </TableHead>
              <TableHead className="font-medium text-slate-700 w-[20%] hidden sm:table-cell">Tên</TableHead>
              <TableHead className="font-medium text-slate-700 w-[20%] md:w-[15%]">
                <span className="md:hidden">VIP</span>
                <span className="hidden md:inline">Gói VIP</span>
              </TableHead>
              <TableHead className="font-medium text-slate-700 w-[20%] md:w-[20%]">
                Hết hạn
              </TableHead>
              <TableHead className="font-medium text-slate-700 text-center w-[15%] md:w-[15%]">
                <span className="hidden sm:inline">Thao tác</span>
                <span className="sm:hidden">TT</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p>Đang tải dữ liệu...</p>
                </TableCell>
              </TableRow>
            ) : vipUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <p className="text-lg font-medium">Chưa có người dùng VIP Gold</p>
                  <p className="text-sm mt-1 text-slate-400">Nhấn "Thêm VIP Gold" để bắt đầu</p>
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
                    className={`hover:bg-slate-50 ${isExpired ? 'opacity-50' : ''}`}
                  >
                    <TableCell className="font-mono text-sm truncate px-4" title={user.userId}>
                      {user.userId}
                    </TableCell>
                    <TableCell className="text-sm truncate px-4 hidden sm:table-cell" title={user.name || 'N/A'}>
                      {user.name || <span className="text-slate-400">N/A</span>}
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="text-sm text-slate-700">
                        {user.packageName || 'VIP Gold'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className={`text-sm ${isExpired ? 'text-slate-400' : 'text-slate-700'}`}>
                          {formatDate(expireDate)}
                        </span>
                        {!isExpired && (
                          <span className="text-xs text-slate-500 mt-0.5">
                            Còn {daysLeft} ngày
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs text-slate-400 mt-0.5">
                            Đã hết hạn
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVIP(user.userId)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm VIP Gold</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVIP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Nhập User ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageId">Gói VIP</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-sm text-slate-700">VIP Gold</span>
                <span className="ml-auto text-xs text-slate-500">Mặc định</span>
              </div>
              <p className="text-xs text-slate-500">
                Hiện tại chỉ hỗ trợ gói VIP Gold
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="days">Số ngày</Label>
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
              />
              <p className="text-xs text-slate-500">
                Gợi ý: 30 ngày (1 tháng), 90 ngày (3 tháng), 180 ngày (6 tháng), 365 ngày (1 năm)
              </p>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
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
