import { taskSlugFromTitle } from '@/lib/treabo/slug';

export type TreaboCategory = {
  id: string;
  slug?: string | null;
  icon?: string | null;
  name_ru: string;
  name_ro?: string | null;
  sort_order?: number;
};

export type TreaboTask = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  category_id?: string | null;
  city?: string | null;
  address?: string | null;
  budget?: number | null;
  deadline?: string | null;
  status?: string | null;
  photos?: Array<string | TreaboUpload>;
  applications_count?: number;
  response_price_mdl?: number | null;
  photos_count?: number;
  lat?: number | null;
  lng?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TreaboApplication = {
  id: string;
  task_id: string;
  task_title?: string;
  message?: string | null;
  price?: number | null;
  response_fee_mdl?: number | null;
  status?: string | null;
  chat_id?: string | null;
  created_at?: string | null;
};

export type TreaboApplicationPreview = {
  has_applied: boolean;
  free_daily_limit: number;
  free_used_today: number;
  free_remaining_before: number;
  free_remaining_after: number;
  charge_required: boolean;
  is_free: boolean;
  response_fee_mdl: number;
  default_response_price_mdl: number;
  currency: 'MDL';
};

export type TreaboChat = {
  id: string;
  task_id: string;
  task_title?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  specialist_id?: string | null;
  specialist_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TreaboMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  user_id?: string;
  text: string;
  type?: string;
  created_at?: string | null;
};

export type TreaboBalance = {
  balance: number;
  total_deposited: number;
  total_spent: number;
};

export type TreaboManualDeposit = {
  success: boolean;
  message?: string;
  payment_method?: 'manual';
  payment_url?: string;
  payment_id?: string;
  deposit_id?: number;
  amount?: number;
  currency?: string;
  expires_at?: string;
};

export type TreaboManualDepositReport = {
  success: boolean;
  message?: string;
  data?: {
    deposit_id: number;
    amount: number;
    currency: 'MDL';
    reported_at?: string | null;
  };
};

export type TreaboUpload = {
  disk?: string;
  path?: string;
  url?: string;
  mime?: string | null;
  size?: number | null;
};

export type TreaboSpecialist = {
  id: string;
  phone?: string;
  name: string;
  role: 'specialist' | 'customer' | 'admin';
  city?: string | null;
  email?: string | null;
  rating?: number;
  reviews_count?: number;
  bio?: string | null;
  services?: string[];
  avatar?: string | null;
  portfolio?: string[];
  lat?: number | null;
  lng?: number | null;
  last_seen?: string | null;
};

export type TreaboTaskFilters = {
  category?: string | null;
  category_id?: string | null;
  city?: string | null;
  q?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');

const apiCandidates = () => {
  const explicit = process.env.TREABO_API_ENDPOINT || process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT;

  return [
    explicit,
    'http://host.docker.internal:8001/api',
    'http://127.0.0.1:8001/api',
  ].filter(Boolean) as string[];
};

function buildQuery(filters?: TreaboTaskFilters) {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.city) params.set('city', filters.city);
  if (filters.q) params.set('q', filters.q);
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function fetchJson<T>(path: string): Promise<T | null> {
  for (const baseUrl of apiCandidates()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${trimSlash(baseUrl)}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // Try the next local candidate; the mock UI remains available if API is down.
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

export function getTreaboPublicApiBase(): string {
  if (typeof window !== 'undefined') {
    const explicit = process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT;
    if (explicit) return trimSlash(explicit);
    if (window.location.hostname === 'treabo.md' || window.location.hostname.endsWith('.treabo.md')) {
      return 'https://api.treabo.md/api';
    }
    return '/api/treabo';
  }

  return trimSlash(apiCandidates()[0] || 'http://127.0.0.1:8001/api');
}

export async function uploadTreaboFile(
  file: File,
  input: { token?: string | null; folder?: string } = {},
): Promise<TreaboUpload> {
  const formData = new FormData();
  formData.append('file', file);
  if (input.folder) formData.append('folder', input.folder);

  const response = await fetch(`${getTreaboPublicApiBase()}/uploads`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail || payload?.message || 'Upload failed';
    throw new Error(typeof detail === 'string' ? detail : 'Upload failed');
  }

  return payload as TreaboUpload;
}

export async function treaboApiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(`${getTreaboPublicApiBase()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || 'Treabo API request failed';
    throw new Error(typeof detail === 'string' ? detail : 'Treabo API request failed');
  }

  return payload as T;
}

export function taskPublicSlug(task: Pick<TreaboTask, 'id' | 'title'>) {
  return taskSlugFromTitle(task.title, task.id);
}

export async function fetchTreaboCategories() {
  return (await fetchJson<TreaboCategory[]>('/categories')) ?? [];
}

export async function fetchTreaboTasks(filters?: TreaboTaskFilters) {
  return (await fetchJson<TreaboTask[]>(`/tasks${buildQuery(filters)}`)) ?? [];
}

export async function fetchTreaboSpecialists(filters?: { city?: string | null }) {
  const params = new URLSearchParams();
  if (filters?.city) params.set('city', filters.city);
  const query = params.toString();
  return (await fetchJson<TreaboSpecialist[]>(`/specialists${query ? `?${query}` : ''}`)) ?? [];
}

export async function createTreaboTask(token: string, input: Partial<TreaboTask>) {
  return treaboApiRequest<TreaboTask>('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export async function fetchTreaboTask(id: string) {
  return await fetchJson<TreaboTask>(`/tasks/${encodeURIComponent(id)}`);
}

export async function createTreaboTaskApplication(
  taskId: string,
  token: string,
  input: { message: string; price?: number | null },
) {
  return treaboApiRequest<TreaboApplication>(`/tasks/${encodeURIComponent(taskId)}/applications`, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export async function fetchTreaboTaskApplicationPreview(taskId: string, token: string) {
  return treaboApiRequest<TreaboApplicationPreview>(
    `/tasks/${encodeURIComponent(taskId)}/applications/preview`,
    { token },
  );
}

export async function fetchTreaboChats(token: string) {
  return treaboApiRequest<TreaboChat[]>('/chats', { token });
}

export async function fetchTreaboChat(chatId: string, token: string) {
  return treaboApiRequest<TreaboChat>(`/chats/${encodeURIComponent(chatId)}`, { token });
}

export async function fetchTreaboChatMessages(chatId: string, token: string) {
  return treaboApiRequest<TreaboMessage[]>(`/chats/${encodeURIComponent(chatId)}/messages`, { token });
}

export async function sendTreaboChatMessage(chatId: string, token: string, text: string) {
  return treaboApiRequest<TreaboMessage>(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ text }),
  });
}

export async function fetchTreaboBalance(token: string) {
  const payload = await treaboApiRequest<{ success: boolean; data: TreaboBalance }>('/balance', { token });
  return payload.data;
}

export async function createTreaboManualBalanceDeposit(token: string, amount: number) {
  return treaboApiRequest<TreaboManualDeposit>('/balance/deposit', {
    method: 'POST',
    token,
    body: JSON.stringify({ amount, payment_method: 'manual' }),
  });
}

export async function reportTreaboManualBalancePayment(token: string, depositId?: number | null) {
  return treaboApiRequest<TreaboManualDepositReport>('/balance/deposit/report', {
    method: 'POST',
    token,
    body: JSON.stringify({ deposit_id: depositId || undefined }),
  });
}

export async function fetchTreaboLandingData(filters?: TreaboTaskFilters) {
  const [categories, tasks] = await Promise.all([
    fetchTreaboCategories(),
    fetchTreaboTasks(filters),
  ]);

  return { categories, tasks };
}

export function filterTasksClientSide(tasks: TreaboTask[], filters: TreaboTaskFilters) {
  return tasks.filter((task) => {
    if (filters.budget_min != null && Number(task.budget || 0) < filters.budget_min) {
      return false;
    }
    if (filters.budget_max != null && Number(task.budget || 0) > filters.budget_max) {
      return false;
    }
    return true;
  });
}
