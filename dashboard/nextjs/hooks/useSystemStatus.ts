'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface SystemStatus {
  status: string;
  uptime: number;
}

let globalStatus: SystemStatus | null = null;
let statusListeners: Set<(status: SystemStatus | null) => void> = new Set();
let statusInterval: NodeJS.Timeout | null = null;
let isPolling = false;

const POLL_INTERVAL = 15000;

function startPolling() {
  if (isPolling) return;
  isPolling = true;

  const fetchStatus = async () => {
    try {
      const result = await api.system.status();
      if (result.success && result.data) {
        const data = result.data as { status?: string; uptime?: number };
        globalStatus = {
          status: data.status || 'offline',
          uptime: data.uptime || 0,
        };
        statusListeners.forEach(listener => listener(globalStatus));
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  fetchStatus();
  statusInterval = setInterval(fetchStatus, POLL_INTERVAL);
}

function stopPolling() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  isPolling = false;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(globalStatus);

  useEffect(() => {
    statusListeners.add(setStatus);
    
    if (!isPolling) {
      startPolling();
    } else {
      setStatus(globalStatus);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!isPolling) startPolling();
      } else {
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      statusListeners.delete(setStatus);    
      if (statusListeners.size === 0) {
        stopPolling();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return status;
}

