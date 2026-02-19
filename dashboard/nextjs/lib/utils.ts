export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN').format(d);
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function getAvatarUrl(userId?: string | null): string | null {
  if (!userId) return null;
  
  const getApiBase = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}/api`;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    if (apiUrl) {
      return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    }
    const apiPort = process.env.API_PORT || '3001';
    const apiHost = process.env.API_HOST || 'localhost';
    return `http://${apiHost}:${apiPort}/api`;
  };
  
  return `${getApiBase()}/avatars/${userId}`;
}

