import { normalizeTreaboPhone } from '@/lib/treabo/phone';

export type TreaboRole = 'customer' | 'specialist' | 'admin';

export type TreaboUser = {
  id: string;
  phone: string;
  name: string;
  role: TreaboRole;
  city?: string | null;
  email?: string | null;
  avatar?: string | null;
  portfolio?: string[];
  rating?: number;
  reviews_count?: number;
};

export type TreaboAuthResponse = {
  token: string;
  user: TreaboUser;
};

export type TreaboOtpSentResponse = {
  status: 'otp_sent';
  phone: string;
  otp_id: string;
  channel?: 'sms' | 'telegram';
};

export type TreaboAuthResult = TreaboAuthResponse | TreaboOtpSentResponse;

const TOKEN_KEY = 'treabo_token';
const USER_KEY = 'treabo_user';

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const withProffiPrefix = (value: string) => {
  const trimmed = trimSlash(value);
  if (trimmed.endsWith('/api/treabo')) return trimmed;
  return trimmed.endsWith('/proffi') ? trimmed : `${trimmed}/proffi`;
};

export function getTreaboApiBase(): string {
  if (typeof window !== 'undefined') {
    const explicit = process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT;
    return explicit ? withProffiPrefix(explicit) : '/api/treabo';
  }

  return withProffiPrefix(
    process.env.TREABO_API_ENDPOINT ||
      process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT ||
      'http://127.0.0.1:8001/api/proffi',
  );
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getTreaboApiBase()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || 'Request failed';
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }

  return payload as T;
}

export function isTreaboOtpSentResponse(payload: unknown): payload is TreaboOtpSentResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as TreaboOtpSentResponse).status === 'otp_sent' &&
    typeof (payload as TreaboOtpSentResponse).otp_id === 'string'
  );
}

export function getStoredTreaboToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredTreaboUser(): TreaboUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TreaboUser;
  } catch {
    return null;
  }
}

export function persistTreaboSession(data: TreaboAuthResponse) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  window.localStorage.setItem('treabo_role', data.user.role);
}

export function persistTreaboUser(user: TreaboUser) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem('treabo_role', user.role);
}

export function clearTreaboSession() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem('treabo_role');
}

export async function treaboSendPhoneOtp(input: {
  phone: string;
  purpose: 'login' | 'register';
  password?: string;
  name?: string;
  role: 'customer' | 'specialist';
  email?: string;
  city?: string;
  channel?: 'sms' | 'telegram';
}) {
  return authFetch<TreaboOtpSentResponse>(`/auth/${input.role}/phone/send-otp`, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phone: normalizeTreaboPhone(input.phone),
    }),
  });
}

export async function treaboVerifyPhoneOtp(input: { phone: string; otp_id: string; code: string; role: 'customer' | 'specialist' }) {
  const data = await authFetch<TreaboAuthResponse>(`/auth/${input.role}/phone/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phone: normalizeTreaboPhone(input.phone),
    }),
  });

  persistTreaboSession(data);
  return data;
}

export async function treaboRegister(input: {
  name: string;
  phone: string;
  password: string;
  role: 'customer' | 'specialist';
  email?: string;
  city?: string;
}): Promise<TreaboAuthResult> {
  const payload = await authFetch<TreaboAuthResult>(`/auth/${input.role}/register-phone`, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phone: normalizeTreaboPhone(input.phone),
    }),
  });

  if (!isTreaboOtpSentResponse(payload)) {
    persistTreaboSession(payload);
  }

  return payload;
}

export async function treaboLogin(input: {
  phone?: string;
  email?: string;
  password: string;
  role: 'customer' | 'specialist';
}): Promise<TreaboAuthResult> {
  const body: Record<string, string> = { password: input.password };

  if (input.email?.trim()) {
    body.email = input.email.trim();
  } else if (input.phone) {
    body.phone = normalizeTreaboPhone(input.phone);
  }

  body.role = input.role;
  const payload = await authFetch<TreaboAuthResult>(`/auth/${input.role}/login`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!isTreaboOtpSentResponse(payload)) {
    persistTreaboSession(payload);
  }

  return payload;
}

export async function treaboMe(token = getStoredTreaboToken()): Promise<TreaboUser | null> {
  if (!token) return null;

  try {
    const user = await authFetch<TreaboUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (typeof window !== 'undefined') {
      persistTreaboUser(user);
    }

    return user;
  } catch {
    clearTreaboSession();
    return null;
  }
}

export async function treaboUpdateProfile(
  input: {
    bio?: string;
    services?: string[];
    avatar?: string;
    portfolio?: string[];
    city?: string;
    lat?: number;
    lng?: number;
  },
  token = getStoredTreaboToken(),
): Promise<TreaboUser> {
  if (!token) throw new Error('Authentication required');

  const user = await authFetch<TreaboUser>('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  persistTreaboUser(user);
  return user;
}

export function isTreaboSpecialist(user?: TreaboUser | null) {
  return user?.role === 'specialist';
}

export function isTreaboCustomer(user?: TreaboUser | null) {
  return user?.role === 'customer';
}

export async function treaboRequestPushLogin(phone: string) {
  return authFetch<{ request_id: string; status: string; expires_in: number }>('/auth/specialist/push-login/request', {
    method: 'POST', body: JSON.stringify({ phone: normalizeTreaboPhone(phone) }),
  });
}

export async function treaboPollPushLogin(requestId: string): Promise<{ status: string; token?: string; user?: TreaboUser }> {
  const result = await authFetch<{ status: string; token?: string; user?: TreaboUser }>(`/auth/specialist/push-login/${encodeURIComponent(requestId)}`);
  if (result.status === 'approved' && result.token && result.user) persistTreaboSession({ token: result.token, user: result.user });
  return result;
}

export async function treaboSendCustomerPasswordResetCode(phone: string) {
  return authFetch<TreaboOtpSentResponse>('/auth/customer/password/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone: normalizeTreaboPhone(phone), channel: 'telegram' }),
  });
}

export async function treaboResetCustomerPassword(input: {
  phone: string;
  otp_id: string;
  code: string;
  password: string;
}) {
  const data = await authFetch<TreaboAuthResponse>('/auth/customer/password/reset', {
    method: 'POST',
    body: JSON.stringify({
      phone: normalizeTreaboPhone(input.phone),
      otp_id: input.otp_id,
      code: input.code,
      password: input.password,
      password_confirmation: input.password,
    }),
  });
  persistTreaboSession(data);
  return data;
}
