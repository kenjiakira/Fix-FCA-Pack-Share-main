'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@/components/ui';
import { Search, Edit, Eye } from 'lucide-react';

interface User {
  uid: string;
  name?: string;
  balance?: number;
  vip?: { name: string };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await api.users.list(page, 20);
    if (result.success) {
      setUsers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return user.uid.toLowerCase().includes(query) || 
           (user.name && user.name.toLowerCase().includes(query));
  });

  return (
    <DashboardLayout title="Người dùng">
      <div className="flex gap-3 mb-5">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Tìm kiếm người dùng (UID hoặc tên)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="default" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UID</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Số dư</TableHead>
              <TableHead>VIP</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-mono">{user.uid}</TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{formatNumber(user.balance || 0)}</TableCell>
                  <TableCell>
                    {user.vip ? (
                      <Badge variant="success">{user.vip.name}</Badge>
                    ) : (
                      <Badge variant="outline">Không</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="default" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
