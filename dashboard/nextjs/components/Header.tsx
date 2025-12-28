'use client';

import { useRouter } from 'next/navigation';
import { formatUptime } from '@/lib/utils';
import { removeToken } from '@/lib/auth';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { LogOut, Clock, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const status = useSystemStatus();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden text-slate-600 hover:text-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-lg md:text-2xl font-semibold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-5">
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Uptime: {status ? formatUptime(status.uptime) : '--'}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors text-sm md:text-base"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}

