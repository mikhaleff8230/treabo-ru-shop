import { useCallback, useEffect, useState } from 'react';
import {
  clearTreaboSession,
  getStoredTreaboUser,
  isTreaboSpecialist,
  treaboLogin,
  treaboMe,
  treaboRegister,
  treaboUpdateProfile,
  type TreaboUser,
} from '@/data/treabo-auth';

export function useTreaboAuth() {
  const [user, setUser] = useState<TreaboUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const cached = getStoredTreaboUser();
    if (cached) setUser(cached);

    const fresh = await treaboMe();
    setUser(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    clearTreaboSession();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isSpecialist: isTreaboSpecialist(user),
    refresh,
    logout,
    login: async (input: { phone?: string; email?: string; password: string }) => {
      const data = await treaboLogin(input);
      setUser(data.user);
      return data;
    },
    register: async (input: {
      name: string;
      phone: string;
      password: string;
      role: 'customer' | 'specialist';
      email?: string;
      city?: string;
    }) => {
      const data = await treaboRegister(input);
      setUser(data.user);
      return data;
    },
    updateProfile: async (input: {
      bio?: string;
      services?: string[];
      avatar?: string;
      portfolio?: string[];
      city?: string;
      lat?: number;
      lng?: number;
    }) => {
      const updated = await treaboUpdateProfile(input);
      setUser(updated);
      return updated;
    },
  };
}
