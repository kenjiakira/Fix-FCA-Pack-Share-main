import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMS Dashboard',
  description: 'CMS Dashboard Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

