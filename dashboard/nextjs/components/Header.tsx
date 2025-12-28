'use client';

import { useRouter } from 'next/navigation';
import { formatUptime } from '@/lib/utils';
import { removeToken } from '@/lib/auth';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { LogOut, Clock } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const status = useSystemStatus();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Uptime: {status ? formatUptime(status.uptime) : '--'}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}

