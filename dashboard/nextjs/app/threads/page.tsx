'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Search, Eye } from 'lucide-react';

interface Thread {
  threadID: string;
  name?: string;
  memberCount?: number;
  prefix?: string;
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadThreads();
  }, [page]);

  const loadThreads = async () => {
    setLoading(true);
    const result = await api.threads.list(page, 20);
    if (result.success) {
      setThreads(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    }
    setLoading(false);
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return thread.threadID.toLowerCase().includes(query) ||
           (thread.name && thread.name.toLowerCase().includes(query));
  });

  return (
    <DashboardLayout title="Nhóm">
      <div className="flex gap-3 mb-5">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Tìm kiếm nhóm (ThreadID)"
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
              <TableHead>ThreadID</TableHead>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Thành viên</TableHead>
              <TableHead>Prefix</TableHead>
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
            ) : filteredThreads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredThreads.map((thread) => (
                <TableRow key={thread.threadID}>
                  <TableCell className="font-mono">{thread.threadID}</TableCell>
                  <TableCell>{thread.name || 'N/A'}</TableCell>
                  <TableCell>{thread.memberCount || 0}</TableCell>
                  <TableCell className="font-mono">{thread.prefix || '/'}</TableCell>
                  <TableCell>
                    <Button variant="default" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
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
