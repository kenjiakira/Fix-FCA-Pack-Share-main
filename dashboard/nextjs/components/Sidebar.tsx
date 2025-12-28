'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUser } from '@/hooks/useUser';
import { removeToken } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Users, 
  Gem, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  X,
  Bot,
  Circle,
  FileJson,
  ChevronDown,
  LogOut,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useSystemStatus();
  const { user } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Chia menu items thành các sections
  const generalItems = [
    { href: '/', icon: LayoutDashboard, text: 'Tổng quan' },
    { href: '/users', icon: Users, text: 'Người dùng' },
    { href: '/vip', icon: Gem, text: 'VIP' },
    { href: '/threads', icon: MessageSquare, text: 'Nhóm' },
  ];

  const pagesItems = [
    { href: '/economy', icon: DollarSign, text: 'Kinh tế' },
    { href: '/appstate', icon: FileJson, text: 'AppState' },
  ];

  const otherItems = [
    { href: '/system', icon: Settings, text: 'Hệ thống' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('cms_username');
    router.push('/login');
  };

  const getInitials = (username?: string) => {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const NavSection = ({ title, items }: { title: string; items: typeof generalItems }) => (
    <div className="mb-6">
      <h3 className="px-4 md:px-5 mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
        {title}
      </h3>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            className={`flex items-center px-4 md:px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors rounded-md mx-2 mb-1 ${
              active 
                ? 'bg-white/10 text-white font-medium' 
                : ''
            }`}
          >
            <Icon className="w-4 h-4 mr-3 shrink-0" />
            <span>{item.text}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 border-r border-slate-800`}>
        {/* Header với Logo */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">CMS Admin</h2>
            </div>
          </div>
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <NavSection title="Chung" items={generalItems} />
          <NavSection title="Trang" items={pagesItems} />
          <NavSection title="Khác" items={otherItems} />
        </nav>

        {/* Footer với Status và User Profile */}
        <div className="border-t border-slate-800">
          {/* Status Indicator */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <Circle 
                className={`w-2 h-2 shrink-0 ${
                  status?.status === 'online' 
                    ? 'text-green-500 fill-green-500 animate-pulse' 
                    : 'text-red-500 fill-red-500 animate-pulse'
                }`}
              />
              <span className="text-white/70">
                {status?.status === 'online' 
                  ? 'Bot đang hoạt động' 
                  : status 
                    ? 'Bot đang offline' 
                    : 'Đang kiểm tra...'}
              </span>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4">
            <div className="relative user-menu-container">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium shrink-0">
                  {getInitials(user?.username)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.username || 'Người dùng'}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user?.username ? `${user.username}@admin.com` : 'admin@cms.com'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/system"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </Link>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Trung tâm trợ giúp</span>
                  </Link>
                  <div className="border-t border-slate-700">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
