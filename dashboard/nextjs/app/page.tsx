'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatNumber, formatUptime, getAvatarUrl } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { 
  Users, 
  MessageSquare, 
  Gem,
  DollarSign, 
  TrendingUp,
  Server,
  Code,
  Zap,
  Activity,
  Wallet,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

interface OverviewData {
  totalUsers?: number;
  totalThreads?: number;
  totalVIP?: number;
  totalBalance?: number;
  quy?: number;
  topUsers?: Array<{ uid: string; name: string; balance: number; avatarUrl?: string }>;
  system?: {
    commands?: number;
    events?: number;
    uptime?: number;
    memory?: {
      used?: number;
      total?: number;
      rss?: number;
    };
    nodeVersion?: string;
    platform?: string;
  };
  vipDistribution?: Record<number, number>;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData>({});
  const [loading, setLoading] = useState(true);

  const { startPolling } = usePolling(async () => {
    const result = await api.overview();
    if (result.success && result.data) {
      setData(result.data);
      setLoading(false);
    }
  }, {
    interval: 60000,
    immediate: true,
  });

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  const mainStats = [
    { 
      icon: Users, 
      label: 'Tổng người dùng', 
      value: data.totalUsers || 0,
    },
    { 
      icon: MessageSquare, 
      label: 'Tổng nhóm', 
      value: data.totalThreads || 0,
    },
    { 
      icon: Gem, 
      label: 'Người dùng VIP', 
      value: data.totalVIP || 0,
    },
    { 
      icon: DollarSign, 
      label: 'Tổng số dư', 
      value: formatNumber(data.totalBalance || 0),
    },
  ];

  const economyStats = [
    {
      icon: Wallet,
      label: 'Quỹ hệ thống',
      value: formatNumber(data.quy || 0),
    },
    {
      icon: TrendingUp,
      label: 'Tổng lưu thông',
      value: formatNumber((data.totalBalance || 0) + (data.quy || 0)),
    },
  ];

  const systemStats = [
    {
      icon: Code,
      label: 'Lệnh',
      value: data.system?.commands || 0,
      link: '/system',
    },
    {
      icon: Zap,
      label: 'Sự kiện',
      value: data.system?.events || 0,
      link: '/system',
    },
    {
      icon: Activity,
      label: 'Uptime',
      value: data.system?.uptime ? formatUptime(data.system.uptime) : '--',
      link: '/system',
    },
    {
      icon: HardDrive,
      label: 'Bộ nhớ',
      value: data.system?.memory ? `${data.system.memory.used}MB / ${data.system.memory.total}MB` : '--',
      link: '/system',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Tổng quan">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Đang tải...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tổng quan">
      <div className="space-y-6">
        {/* Main Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-slate-600" />
                  <h3 className="text-xs text-slate-500 font-medium">{stat.label}</h3>
                </div>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Economy Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Economy Stats */}
            <div className="grid grid-cols-2 gap-4">
              {economyStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <h3 className="text-sm text-slate-500 font-medium">{stat.label}</h3>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Top Users */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Top người dùng giàu nhất
                </h2>
                <Link 
                  href="/users" 
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Xem tất cả
                </Link>
              </div>
              {data.topUsers && data.topUsers.length > 0 ? (
                <div className="space-y-3">
                  {data.topUsers.map((user, index) => (
                    <div
                      key={user.uid}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                target.style.display = 'none';
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0 ${user.avatarUrl ? 'hidden' : ''}`}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{user.uid}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-800">{formatNumber(user.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </div>

            {/* System Info */}
            <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Thông tin hệ thống
              </h2>
              <div className="space-y-2">
                {systemStats.map((stat, index) => {
                  const Icon = stat.icon;
                  const content = (
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700">{stat.label}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{stat.value}</span>
                    </div>
                  );
                  
                  return stat.link ? (
                    <Link key={index} href={stat.link} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={index}>{content}</div>
                  );
                })}
              </div>
              {data.system?.nodeVersion && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Node.js</span>
                    <span className="font-medium text-slate-800">{data.system.nodeVersion}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-500">Platform</span>
                    <span className="font-medium text-slate-800 capitalize">{data.system.platform}</span>
                  </div>
                </div>
              )}
            </div>

            {/* VIP Distribution */}
            {data.vipDistribution && Object.keys(data.vipDistribution).length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Phân bổ VIP
                </h2>
                <div className="space-y-2">
                  {Object.entries(data.vipDistribution).map(([packageId, count]) => (
                    <div key={packageId} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700">
                        Gói {packageId === '3' ? 'Gold' : `#${packageId}`}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{count} người</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
