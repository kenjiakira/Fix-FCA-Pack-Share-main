'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { 
  LayoutDashboard, 
  Users, 
  Gem, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  Menu,
  Bot,
  Circle,
  FileJson
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const status = useSystemStatus();

  const navItems = [
    { href: '/', icon: LayoutDashboard, text: 'Tổng quan' },
    { href: '/users', icon: Users, text: 'Người dùng' },
    { href: '/vip', icon: Gem, text: 'VIP' },
    { href: '/threads', icon: MessageSquare, text: 'Nhóm' },
    { href: '/economy', icon: DollarSign, text: 'Kinh tế' },
    { href: '/appstate', icon: FileJson, text: 'AppState' },
    { href: '/system', icon: Settings, text: 'Hệ thống' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-800 text-white flex flex-col transition-transform duration-300 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0`}>
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-xl font-semibold">CMS</h2>
        </div>
        <button
          className="md:hidden text-white hover:text-gray-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-5 py-3 text-white/70 hover:bg-slate-700 hover:text-white transition-colors border-l-3 ${
                active 
                  ? 'bg-slate-700 text-white border-l-4 border-primary' 
                  : 'border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.text}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-5 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm">
          <Circle 
            className={`w-2 h-2 ${
              status?.status === 'online' 
                ? 'text-success fill-success animate-pulse-dot' 
                : 'text-danger fill-danger animate-pulse-dot'
            }`}
          />
          <span>
            {status?.status === 'online' 
              ? 'Bot đang hoạt động' 
              : status 
                ? 'Bot đang offline' 
                : 'Đang kiểm tra...'}
          </span>
        </div>
      </div>
    </aside>
  );
}

