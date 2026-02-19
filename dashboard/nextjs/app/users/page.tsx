'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@/components/ui';
import { Search, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  uid: string;
  name?: string;
  balance?: number;
  vip?: { name: string };
  avatarUrl?: string;
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
      setUsers((result.data as User[]) || []);
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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (page <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <DashboardLayout title="Người dùng">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Tìm kiếm (UID hoặc tên)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm md:text-base"
          />
          <Button variant="default" size="icon" className="shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 z-[5] bg-slate-50">
              <TableRow>
                <TableHead className="w-[5%]">Avatar</TableHead>
                <TableHead className="w-[25%] md:w-[30%]">UID</TableHead>
                <TableHead className="w-[20%] md:w-[20%] hidden sm:table-cell">Tên</TableHead>
                <TableHead className="w-[15%] md:w-[15%]">VIP</TableHead>
                <TableHead className="w-[20%] md:w-[20%] text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="px-2 md:px-4">
                      {(() => {
                        const avatarUrl = getAvatarUrl(user.uid);
                        return avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user.name || user.uid}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold';
                                fallback.textContent = (user.name || user.uid).substring(0, 2).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {(user.name || user.uid).substring(0, 2).toUpperCase()}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="font-mono text-xs md:text-sm truncate px-2 md:px-4" title={user.uid}>
                      {user.uid}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm truncate px-2 md:px-4 hidden sm:table-cell" title={user.name || 'N/A'}>
                      {user.name || 'N/A'}
                    </TableCell>
                    <TableCell className="px-2 md:px-4">
                      {user.vip ? (
                        <Badge variant="success" className="text-xs whitespace-nowrap">{user.vip.name}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">Không</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center px-2 md:px-4">
                      <div className="flex gap-1 md:gap-2 justify-center">
                        <Button variant="secondary" size="icon" className="h-7 w-7 md:h-9 md:w-9 shrink-0">
                          <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button variant="default" size="icon" className="h-7 w-7 md:h-9 md:w-9 shrink-0">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 md:gap-2 mt-5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="h-8 md:h-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 md:px-2 text-slate-500 text-sm">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p as number)}
                className="h-8 w-8 md:h-9 md:w-9 text-xs md:text-sm"
              >
                {p}
              </Button>
            )
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="h-8 md:h-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
