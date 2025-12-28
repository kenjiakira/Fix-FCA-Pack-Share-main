'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { DollarSign, Building2, Plus, ArrowRightLeft } from 'lucide-react';
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

interface TopUser {
  uid: string;
  name?: string;
  balance?: number;
}

interface EconomyData {
  totalBalance?: number;
  quy?: number;
  topUsers?: TopUser[];
}

export default function EconomyPage() {
  const [data, setData] = useState<EconomyData>({});
  const [loading, setLoading] = useState(true);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ uid: '', amount: 0 });

  const loadEconomy = async () => {
    setLoading(true);
    const result = await api.economy();
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  const { startPolling } = usePolling(loadEconomy, {
    interval: 60000,
    immediate: true,
  });

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.users.updateBalance(balanceForm.uid, balanceForm.amount);
    if (result.success) {
      setShowBalanceModal(false);
      setBalanceForm({ uid: '', amount: 0 });
      loadEconomy();
      alert('Thêm số dư thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  return (
    <DashboardLayout title="Kinh tế">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center gap-5">
          <DollarSign className="w-10 h-10 text-primary" />
          <div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">Tổng số dư hệ thống</h3>
            <p className="text-2xl font-semibold text-slate-800">{formatNumber(data.totalBalance || 0)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center gap-5">
          <Building2 className="w-10 h-10 text-primary" />
          <div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">Quỹ hệ thống</h3>
            <p className="text-2xl font-semibold text-slate-800">{formatNumber(data.quy || 0)}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-5">
        <Button onClick={() => setShowBalanceModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm số dư
        </Button>
        <Button variant="secondary">
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Chuyển tiền
        </Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Top người giàu nhất</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>UID</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Số dư</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !data.topUsers || data.topUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.topUsers.map((user, index) => (
                <TableRow key={user.uid}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-mono">{user.uid}</TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{formatNumber(user.balance || 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm số dư</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBalance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balanceUID">User ID</Label>
              <Input
                id="balanceUID"
                type="text"
                value={balanceForm.uid}
                onChange={(e) => setBalanceForm({ ...balanceForm, uid: e.target.value })}
                placeholder="User ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceAmount">Số tiền</Label>
              <Input
                id="balanceAmount"
                type="number"
                value={balanceForm.amount}
                onChange={(e) =>
                  setBalanceForm({ ...balanceForm, amount: parseInt(e.target.value) })
                }
                placeholder="Số tiền"
                required
                min={1}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBalanceModal(false)}>
                Hủy
              </Button>
              <Button type="submit">Thêm số dư</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
