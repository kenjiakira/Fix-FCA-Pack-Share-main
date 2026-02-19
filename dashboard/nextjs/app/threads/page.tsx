'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

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
      setThreads((result.data as Thread[]) || []);
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
    <DashboardLayout title="Nhóm">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Tìm kiếm (ThreadID)"
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
                <TableHead className="w-[30%] md:w-[35%]">
                  <span className="md:hidden">ID</span>
                  <span className="hidden md:inline">ThreadID</span>
                </TableHead>
                <TableHead className="w-[25%] md:w-[25%] hidden sm:table-cell">Tên nhóm</TableHead>
                <TableHead className="w-[15%] md:w-[15%]">
                  <span className="md:hidden">TV</span>
                  <span className="hidden md:inline">Thành viên</span>
                </TableHead>
                <TableHead className="w-[15%] md:w-[15%]">Prefix</TableHead>
                <TableHead className="w-[15%] md:w-[10%] text-center">
                  <span className="hidden sm:inline">Thao tác</span>
                  <span className="sm:hidden">TT</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredThreads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 px-2 md:px-4">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredThreads.map((thread) => (
                  <TableRow key={thread.threadID}>
                    <TableCell className="font-mono text-xs md:text-sm truncate px-2 md:px-4" title={thread.threadID}>
                      {thread.threadID}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm truncate px-2 md:px-4 hidden sm:table-cell" title={thread.name || 'N/A'}>
                      {thread.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4">
                      {thread.memberCount || 0}
                    </TableCell>
                    <TableCell className="font-mono text-xs md:text-sm whitespace-nowrap px-2 md:px-4">
                      {thread.prefix || '/'}
                    </TableCell>
                    <TableCell className="text-center px-2 md:px-4">
                      <div className="flex justify-center">
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
