import { useCallback, useEffect, useState } from 'react';
import {
  clearTreaboSession,
  getStoredTreaboUser,
  isTreaboOtpSentResponse,
  isTreaboSpecialist,
  treaboLogin,
  treaboMe,
  treaboRegister,
  treaboSendPhoneOtp,
  treaboUpdateProfile,
  treaboVerifyPhoneOtp,
  type TreaboAuthResponse,
  type TreaboAuthResult,
  type TreaboOtpSentResponse,
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

  const completeAuth = useCallback((data: TreaboAuthResponse) => {
    setUser(data.user);
    return data;
  }, []);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isSpecialist: isTreaboSpecialist(user),
    refresh,
    logout,
    sendOtp: async (input: {
      phone: string;
      purpose: 'login' | 'register';
      password?: string;
      name?: string;
      role?: 'customer' | 'specialist';
      email?: string;
      city?: string;
    }): Promise<TreaboOtpSentResponse> => treaboSendPhoneOtp(input),
    verifyOtp: async (input: { phone: string; otp_id: string; code: string }) => {
      const data = await treaboVerifyPhoneOtp(input);
      setUser(data.user);
      return data;
    },
    login: async (input: { phone?: string; email?: string; password: string }): Promise<TreaboAuthResult> => {
      const data = await treaboLogin(input);
      if (!isTreaboOtpSentResponse(data)) {
        return completeAuth(data);
      }
      return data;
    },
    register: async (input: {
      name: string;
      phone: string;
      password: string;
      role: 'customer' | 'specialist';
      email?: string;
      city?: string;
    }): Promise<TreaboAuthResult> => {
      const data = await treaboRegister(input);
      if (!isTreaboOtpSentResponse(data)) {
        return completeAuth(data);
      }
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
