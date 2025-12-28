'use client';

import { useEffect } from 'react';
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Header title={title} />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

