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

const API_BASE = getApiBase();

export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  
  const token = localStorage.getItem('cms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, message: 'Lỗi kết nối' };
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    verify: () => apiRequest('/auth/verify'),
  },
  overview: () => apiRequest('/overview'),
  users: {
    list: (page: number = 1, limit: number = 20) =>
      apiRequest(`/users?page=${page}&limit=${limit}`),
    get: (uid: string) => apiRequest(`/users/${uid}`),
    updateBalance: (uid: string, amount: number) =>
      apiRequest(`/users/${uid}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  },
  vip: {
    list: () => apiRequest('/vip'),
    add: (userId: string, packageId: number, days: number) =>
      apiRequest('/vip', {
        method: 'POST',
        body: JSON.stringify({ userId, packageId, days }),
      }),
    remove: (userId: string) =>
      apiRequest(`/vip/${userId}`, { method: 'DELETE' }),
  },
  threads: {
    list: (page: number = 1, limit: number = 20) =>
      apiRequest(`/threads?page=${page}&limit=${limit}`),
    get: (threadID: string) => apiRequest(`/threads/${threadID}`),
  },
  economy: {
    get: () => apiRequest('/economy'),
    updateBalance: (uid: string, amount: number, operation: 'set' | 'add' | 'subtract' = 'set') =>
      apiRequest('/economy/balance', {
        method: 'POST',
        body: JSON.stringify({ uid, amount, operation }),
      }),
    transfer: (fromUid: string, toUid: string, amount: number) =>
      apiRequest('/economy/transfer', {
        method: 'POST',
        body: JSON.stringify({ fromUid, toUid, amount }),
      }),
    getUserBalance: (uid: string) => apiRequest(`/economy/balance/${uid}`),
    updateQuy: (amount: number, operation: 'set' | 'add' | 'subtract' = 'set') =>
      apiRequest('/economy/quy', {
        method: 'POST',
        body: JSON.stringify({ amount, operation }),
      }),
    getQuy: () => apiRequest('/economy/quy'),
  },
  system: {
    status: () => apiRequest('/system/status'),
    info: () => apiRequest('/system/info'),
  },
  appstate: {
    update: (content: any[]) =>
      apiRequest('/appstate', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
};

