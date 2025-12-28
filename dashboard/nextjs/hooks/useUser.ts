'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface UserInfo {
  username: string;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get from localStorage first
      const cachedUsername = localStorage.getItem('cms_username');
      if (cachedUsername) {
        setUser({ username: cachedUsername });
        setLoading(false);
      }

      // Verify and get username from API
      try {
        const result = await api.auth.verify();
        if (result.success && result.data?.username) {
          const username = result.data.username;
          localStorage.setItem('cms_username', username);
          setUser({ username });
        }
      } catch (error) {
        console.error('Failed to verify user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
}

