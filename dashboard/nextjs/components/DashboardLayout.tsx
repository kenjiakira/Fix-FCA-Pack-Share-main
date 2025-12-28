'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

export default function DashboardLayout({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const result = await api.auth.verify();
            if (!result.success) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

