'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatUptime } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { Button, Badge } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface SystemInfo {
  status?: string;
  uptime?: number;
  commands?: number;
  events?: number;
  nodeVersion?: string;
  memory?: string;
  cpuUsage?: string;
  platform?: string;
  memoryDetails?: {
    heapUsed?: string;
    heapTotal?: string;
    rss?: string;
    external?: string;
  };
}

export default function SystemPage() {
  const [info, setInfo] = useState<SystemInfo>({});
  const [loading, setLoading] = useState(true);

  const loadSystemInfo = async () => {
    const result = await api.system.info();
    if (result.success && result.data) {
      setInfo(result.data);
      setLoading(false);
    }
  };

  const { startPolling } = usePolling(loadSystemInfo, {
    interval: 60000,
    immediate: true,
  });

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  const handleClearCache = () => {
    if (!confirm('Bạn có chắc muốn xóa cache?')) return;
    alert('Đã xóa cache');
  };

  const infoCards = [
    {
      title: 'Thông tin Bot',
      items: [
        { label: 'Trạng thái', value: info.status || '--' },
        { label: 'Uptime', value: formatUptime(info.uptime || 0) },
        { label: 'Commands', value: info.commands || '--' },
        { label: 'Events', value: info.events || '--' },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { label: 'Node.js', value: info.nodeVersion || '--' },
        { label: 'Memory', value: info.memory || '--' },
        { label: 'CPU Usage', value: info.cpuUsage || '--' },
        { label: 'Platform', value: info.platform || '--' },
      ],
    },
    {
      title: 'Hiệu suất',
      items: [
        { label: 'Heap Used', value: info.memoryDetails?.heapUsed || '--' },
        { label: 'Heap Total', value: info.memoryDetails?.heapTotal || '--' },
        { label: 'RSS', value: info.memoryDetails?.rss || '--' },
        { label: 'External', value: info.memoryDetails?.external || '--' },
      ],
    },
  ];

  return (
    <DashboardLayout title="Hệ thống">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
        {infoCards.map((card, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 md:mb-5 pb-3 border-b border-slate-200">
              {card.title}
            </h3>
            <div className="space-y-2 md:space-y-3">
              {card.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0 gap-1"
                >
                  <span className="text-xs md:text-sm text-slate-500 font-medium">{item.label}:</span>
                  <span className="text-xs md:text-sm text-slate-800 font-semibold font-mono break-words">
                    {item.label === 'Trạng thái' && item.value !== '--' ? (
                      <Badge variant={item.value === 'online' ? 'success' : 'danger'} className="text-xs">
                        {item.value}
                      </Badge>
                    ) : (
                      item.value
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 md:gap-3 flex-wrap">
        <Button variant="secondary" onClick={handleClearCache} className="text-sm md:text-base">
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa Cache
        </Button>
      </div>
    </DashboardLayout>
  );
}
