'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { Users, MessageSquare, Gem, DollarSign } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState<{
    totalUsers?: number;
    totalThreads?: number;
    totalVIP?: number;
    totalBalance?: number;
  }>({});

  const { startPolling } = usePolling(async () => {
    const result = await api.overview();
    if (result.success && result.data) {
      setData(result.data);
    }
  }, {
    interval: 60000,
    immediate: true,
  });

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  const stats = [
    { icon: Users, label: 'Tổng người dùng', value: data.totalUsers || 0 },
    { icon: MessageSquare, label: 'Tổng nhóm', value: data.totalThreads || 0 },
    { icon: Gem, label: 'VIP Users', value: data.totalVIP || 0 },
    { icon: DollarSign, label: 'Tổng số dư', value: formatNumber(data.totalBalance || 0) },
  ];

  return (
    <DashboardLayout title="Tổng quan">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 flex items-center gap-4 md:gap-5 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl opacity-80 shrink-0">
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs md:text-sm text-slate-500 font-medium mb-1 md:mb-2">{stat.label}</h3>
                <p className="text-xl md:text-2xl font-semibold text-slate-800 break-words">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

