'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { DollarSign, Building2, Plus, ArrowRightLeft, Edit, Trash2, RefreshCw } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuyModal, setShowQuyModal] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ uid: '', amount: 0, operation: 'set' as 'set' | 'add' | 'subtract' });
  const [transferForm, setTransferForm] = useState({ fromUid: '', toUid: '', amount: 0 });
  const [quyForm, setQuyForm] = useState({ amount: 0, operation: 'set' as 'set' | 'add' | 'subtract' });
  const [editingUser, setEditingUser] = useState<TopUser | null>(null);

  const loadEconomy = async () => {
    setLoading(true);
    const result = await api.economy.get();
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

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.economy.updateBalance(
      balanceForm.uid, 
      balanceForm.amount, 
      balanceForm.operation
    );
    if (result.success) {
      setShowBalanceModal(false);
      setShowEditModal(false);
      setBalanceForm({ uid: '', amount: 0, operation: 'set' });
      setEditingUser(null);
      loadEconomy();
      alert('Cập nhật số dư thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.economy.transfer(
      transferForm.fromUid,
      transferForm.toUid,
      transferForm.amount
    );
    if (result.success) {
      setShowTransferModal(false);
      setTransferForm({ fromUid: '', toUid: '', amount: 0 });
      loadEconomy();
      alert('Chuyển tiền thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  const handleEditUser = (user: TopUser) => {
    setEditingUser(user);
    setBalanceForm({ uid: user.uid, amount: user.balance || 0, operation: 'set' });
    setShowEditModal(true);
  };

  const handleUpdateQuy = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.economy.updateQuy(quyForm.amount, quyForm.operation);
    if (result.success) {
      setShowQuyModal(false);
      setQuyForm({ amount: 0, operation: 'set' });
      loadEconomy();
      alert('Cập nhật quỹ hệ thống thành công!');
    } else {
      alert('Lỗi: ' + (result.message || 'Unknown error'));
    }
  };

  return (
    <DashboardLayout title="Kinh tế">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 flex items-center gap-4 md:gap-5">
          <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xs md:text-sm text-slate-500 font-medium mb-1 md:mb-2">Tổng số dư hệ thống</h3>
            <p className="text-xl md:text-2xl font-semibold text-slate-800 break-words">{formatNumber(data.totalBalance || 0)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 flex items-center gap-4 md:gap-5">
          <Building2 className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xs md:text-sm text-slate-500 font-medium mb-1 md:mb-2">Quỹ hệ thống</h3>
            <p className="text-xl md:text-2xl font-semibold text-slate-800 break-words">{formatNumber(data.quy || 0)}</p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setQuyForm({ amount: data.quy || 0, operation: 'set' });
              setShowQuyModal(true);
            }}
            className="shrink-0 h-9 w-9 md:h-10 md:w-10"
            title="Cập nhật quỹ hệ thống"
            aria-label="Cập nhật quỹ hệ thống"
          >
            <Edit className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4 md:mb-5">
        <Button onClick={() => setShowBalanceModal(true)} className="text-sm md:text-base">
          <Plus className="w-4 h-4 mr-2" />
          Thêm/Cập nhật số dư
        </Button>
        <Button onClick={() => setShowTransferModal(true)} variant="secondary" className="text-sm md:text-base">
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Chuyển tiền
        </Button>
        <Button onClick={loadEconomy} variant="outline" className="text-sm md:text-base">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-800">Top người giàu nhất</h3>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 z-[5] bg-slate-50">
            <TableRow>
              <TableHead className="w-[10%]">#</TableHead>
              <TableHead className="w-[30%] md:w-[35%]">UID</TableHead>
              <TableHead className="w-[20%] md:w-[20%] hidden sm:table-cell">Tên</TableHead>
              <TableHead className="w-[25%] md:w-[20%]">Số dư</TableHead>
              <TableHead className="w-[15%] md:w-[15%] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !data.topUsers || data.topUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.topUsers.map((user, index) => (
                <TableRow key={user.uid}>
                  <TableCell className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4">{index + 1}</TableCell>
                  <TableCell className="font-mono text-xs md:text-sm truncate px-2 md:px-4" title={user.uid}>
                    {user.uid}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm truncate px-2 md:px-4 hidden sm:table-cell" title={user.name || 'N/A'}>
                    {user.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4">
                    {formatNumber(user.balance || 0)}
                  </TableCell>
                  <TableCell className="px-2 md:px-4">
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-7 w-7 md:h-9 md:w-9 shrink-0"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Add/Update Balance Modal */}
      <Dialog open={showBalanceModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowBalanceModal(false);
          setShowEditModal(false);
          setBalanceForm({ uid: '', amount: 0, operation: 'set' });
          setEditingUser(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Cập nhật số dư' : 'Thêm/Cập nhật số dư'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBalance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balanceUID">User ID</Label>
              <Input
                id="balanceUID"
                type="text"
                value={balanceForm.uid}
                onChange={(e) => setBalanceForm({ ...balanceForm, uid: e.target.value })}
                placeholder="User ID"
                required
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceOperation">Thao tác</Label>
              <Select
                value={balanceForm.operation}
                onValueChange={(value) => setBalanceForm({ ...balanceForm, operation: value as 'set' | 'add' | 'subtract' })}
              >
                <SelectTrigger id="balanceOperation">
                  <SelectValue placeholder="Chọn thao tác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Đặt số dư (Set)</SelectItem>
                  <SelectItem value="add">Thêm vào (Add)</SelectItem>
                  <SelectItem value="subtract">Trừ đi (Subtract)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceAmount">Số tiền</Label>
              <Input
                id="balanceAmount"
                type="number"
                value={balanceForm.amount}
                onChange={(e) =>
                  setBalanceForm({ ...balanceForm, amount: parseInt(e.target.value) || 0 })
                }
                placeholder="Số tiền"
                required
                min={0}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowBalanceModal(false);
                setShowEditModal(false);
                setBalanceForm({ uid: '', amount: 0, operation: 'set' });
                setEditingUser(null);
              }}>
                Hủy
              </Button>
              <Button type="submit">{editingUser ? 'Cập nhật' : 'Thêm'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển tiền</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromUID">User ID người gửi</Label>
              <Input
                id="fromUID"
                type="text"
                value={transferForm.fromUid}
                onChange={(e) => setTransferForm({ ...transferForm, fromUid: e.target.value })}
                placeholder="User ID người gửi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toUID">User ID người nhận</Label>
              <Input
                id="toUID"
                type="text"
                value={transferForm.toUid}
                onChange={(e) => setTransferForm({ ...transferForm, toUid: e.target.value })}
                placeholder="User ID người nhận"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferAmount">Số tiền</Label>
              <Input
                id="transferAmount"
                type="number"
                value={transferForm.amount}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, amount: parseInt(e.target.value) || 0 })
                }
                placeholder="Số tiền"
                required
                min={1}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransferModal(false)}>
                Hủy
              </Button>
              <Button type="submit">Chuyển tiền</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quỹ hệ thống Modal */}
      <Dialog open={showQuyModal} onOpenChange={setShowQuyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật Quỹ hệ thống</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateQuy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quyOperation">Thao tác</Label>
              <Select
                value={quyForm.operation}
                onValueChange={(value) => setQuyForm({ ...quyForm, operation: value as 'set' | 'add' | 'subtract' })}
              >
                <SelectTrigger id="quyOperation">
                  <SelectValue placeholder="Chọn thao tác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Đặt quỹ (Set)</SelectItem>
                  <SelectItem value="add">Thêm vào (Add)</SelectItem>
                  <SelectItem value="subtract">Trừ đi (Subtract)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quyAmount">Số tiền</Label>
              <Input
                id="quyAmount"
                type="number"
                value={quyForm.amount}
                onChange={(e) =>
                  setQuyForm({ ...quyForm, amount: parseInt(e.target.value) || 0 })
                }
                placeholder="Số tiền"
                required
                min={0}
              />
              <p className="text-xs text-slate-500">
                Quỹ hiện tại: {formatNumber(data.quy || 0)}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowQuyModal(false)}>
                Hủy
              </Button>
              <Button type="submit">Cập nhật</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
