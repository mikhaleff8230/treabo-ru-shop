import { taskSlugFromTitle } from '@/lib/treabo/slug';

export type TreaboCategory = {
  id: string;
  slug?: string | null;
  icon?: string | null;
  name_ru: string;
  name_ro?: string | null;
  parent_id?: string | null;
  sort_order?: number;
};

export type TreaboWork = {
  id: number | string;
  category_id?: string | null;
  title: string;
  slug?: string | null;
  aliases?: string[] | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type TreaboWorkQuestion = {
  id: number | string;
  work_id: number | string;
  category_id?: string | null;
  question: string;
  field_key?: string | null;
  type: 'text' | 'textarea' | 'number' | 'yesno' | 'select' | 'multiselect' | 'photo' | string;
  options?: string[] | null;
  placeholder?: string | null;
  help_text?: string | null;
  is_required?: boolean;
  sort_order?: number;
  is_active?: boolean;
};

export type TreaboTask = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  category_id?: string | null;
  work_id?: number | string | null;
  work_title?: string | null;
  work?: { id?: number | string | null; title?: string | null; description?: string | null } | null;
  details?: Record<string, any> | null;
  ai_details?: Record<string, any> | null;
  city?: string | null;
  address?: string | null;
  budget_type?: 'fixed' | 'range' | string | null;
  budget?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_label?: string | null;
  deadline?: string | null;
  status?: string | null;
  photos?: Array<string | TreaboUpload>;
  customer?: { name?: string | null } | null;
  customer_name?: string | null;
  client_name?: string | null;
  user?: { name?: string | null } | null;
  applications_count?: number;
  has_applied?: boolean;
  is_closed?: boolean;
  is_favorite?: boolean;
  response_price_mdl?: number | null;
  customer_id?: string | null;
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
  free_per_task_limit?: number;
  free_used_today: number;
  free_used_on_task?: number;
  free_remaining_before: number;
  free_remaining_on_task?: number;
  free_remaining_after: number;
  within_paid_period?: boolean;
  charge_required: boolean;
  is_free: boolean;
  response_fee_mdl: number;
  default_response_price_mdl: number;
  currency: 'RUB';
};

export type TreaboRecommendedSpecialist = TreaboSpecialist & {
  score?: number;
  rank?: number;
};

export type TreaboSpecialistReview = {
  id: string;
  task_id?: string | null;
  task_title?: string | null;
  customer_name?: string | null;
  rating: number;
  comment?: string | null;
  photos?: string[];
  created_at?: string | null;
};

export type TreaboSpecialistReviewsResponse = {
  rating: number;
  reviews_count: number;
  data: TreaboSpecialistReview[];
};

export type TreaboContactSpecialistResponse = {
  chat_id: string;
  task_id: string;
  specialist_id: string;
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
  unread_count?: number;
  other_is_online?: boolean;
  other_last_seen_at?: string | null;
  is_typing?: boolean;
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
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
};

export type TreaboBalance = {
  balance: number;
  total_deposited: number;
  total_spent: number;
};

export type TreaboBalanceTransaction = {
  id: string;
  type: 'deposit' | 'application_fee' | string;
  title: string;
  description?: string | null;
  status?: string | null;
  amount: number;
  direction: 'income' | 'expense';
  currency: 'RUB' | string;
  task_id?: string | null;
  task_title?: string | null;
  created_at?: string | null;
};

export type TreaboStats = {
  role: 'specialist' | 'customer';
  applied?: number;
  accepted?: number;
  completed?: number;
  active_chats?: number;
  posted?: number;
  open?: number;
  open_tasks?: number;
  in_progress?: number;
  rating?: number;
  reviews_count?: number;
};

export type TreaboHomeStats = {
  categories_count?: number;
  reviews_count?: number;
  average_rating?: number;
  open_tasks?: number;
};

export type TreaboYookassaDeposit = {
  success: boolean;
  message?: string;
  payment_method?: 'yookassa';
  payment_url?: string;
  payment_id?: string;
  amount?: number;
};

export type TreaboCheckPendingDeposit = {
  success: boolean;
  data: {
    has_pending: boolean;
    processed?: boolean;
    amount?: number;
    new_balance?: number;
    message?: string;
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
  min_price?: number | null;
  last_seen_label?: string | null;
  is_online?: boolean;
  passport_verified?: boolean;
  identity_status?: string | null;
};

export type TreaboSpecialistFilters = {
  city?: string | null;
  category_id?: string | null;
  q?: string | null;
  service?: string | null;
};

export type TreaboTaskFilters = {
  category?: string | null;
  category_id?: string | null;
  city?: string | null;
  q?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  favorites?: boolean | null;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const withProffiPrefix = (value: string) => {
  const trimmed = trimSlash(value);
  if (trimmed.endsWith('/api/treabo')) return trimmed;
  return trimmed.endsWith('/proffi') ? trimmed : `${trimmed}/proffi`;
};

const apiCandidates = () => {
  const explicit = process.env.TREABO_API_ENDPOINT || process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT;
  const candidates: string[] = [];

  if (explicit) {
    candidates.push(withProffiPrefix(explicit));
  } else {
    candidates.push('http://127.0.0.1:8001/api/proffi');
  }

  if (process.env.TREABO_IN_DOCKER === '1') {
    candidates.push('http://host.docker.internal:8001/api/proffi');
  }

  return [...new Set(candidates)];
};

function buildQuery(filters?: TreaboTaskFilters) {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.city) params.set('city', filters.city);
  if (filters.q) params.set('q', filters.q);
  if (filters.budget_min != null) params.set('budget_min', String(filters.budget_min));
  if (filters.budget_max != null) params.set('budget_max', String(filters.budget_max));
  if (filters.favorites) params.set('favorites', '1');
  const query = params.toString();
  return query ? `?${query}` : '';
}

type FetchJsonOptions = {
  retries?: number;
  timeoutMs?: number;
};

async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T | null> {
  const retries = options.retries ?? 1;
  const timeoutMs = options.timeoutMs ?? 30000;

  for (const baseUrl of apiCandidates()) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${trimSlash(baseUrl)}${path}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        if (response.status === 404) {
          return null;
        }
      } catch {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  return null;
}

export function getTreaboPublicApiBase(): string {
  if (typeof window !== 'undefined') {
    const explicit = process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT;
    if (explicit) return withProffiPrefix(explicit);
    if (window.location.hostname === 'treabo.ru' || window.location.hostname.endsWith('.treabo.ru')) {
      return 'https://api.treabo.ru/api/proffi';
    }
    if (window.location.hostname === 'treabo.md' || window.location.hostname.endsWith('.treabo.md')) {
      return 'https://api.treabo.md/api/proffi';
    }
    return '/api/treabo';
  }

  return trimSlash(apiCandidates()[0] || 'http://127.0.0.1:8001/api/proffi');
}

export function normalizeTreaboAssetUrl(value?: string | null): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) {
    return value.replace('https://treabo.ru/api/files/', 'https://api.treabo.ru/api/proffi/files/');
  }
  if (value.startsWith('/api/proffi/files/')) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('treabo.ru')) {
      return `https://api.treabo.ru${value}`;
    }
    return value;
  }
  if (value.startsWith('/api/files/')) {
    const path = value.replace(/^\/api\/files\/?/, '');
    if (typeof window !== 'undefined' && window.location.hostname.includes('treabo.ru')) {
      return `https://api.treabo.ru/api/proffi/files/${path}`;
    }
    return `/api/treabo/files/${path}`;
  }
  if (value.startsWith('/storage/') || value.startsWith('storage/')) {
    const path = value.replace(/^\/?storage\/?/, '');
    if (typeof window !== 'undefined' && window.location.hostname.includes('treabo.ru')) {
      return `https://api.treabo.ru/storage/${path}`;
    }
    const apiBase = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://127.0.0.1:8001').replace(/\/$/, '');
    return `${apiBase}/storage/${path}`;
  }
  return value;
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

export async function fetchTreaboWorks(filters?: { category_id?: string | null }) {
  const params = new URLSearchParams();
  if (filters?.category_id) params.set('category_id', filters.category_id);
  const query = params.toString();
  return (await fetchJson<TreaboWork[]>(`/works${query ? `?${query}` : ''}`)) ?? [];
}

export async function fetchTreaboWorkQuestions(filters?: { work_id?: number | string | null; category_id?: string | null }) {
  const params = new URLSearchParams();
  if (filters?.work_id != null) params.set('work_id', String(filters.work_id));
  if (filters?.category_id) params.set('category_id', filters.category_id);
  const query = params.toString();
  return (await fetchJson<TreaboWorkQuestion[]>(`/questions${query ? `?${query}` : ''}`)) ?? [];
}

export async function fetchTreaboTasks(filters?: TreaboTaskFilters) {
  return (await fetchJson<TreaboTask[]>(`/tasks${buildQuery(filters)}`)) ?? [];
}

export async function fetchTreaboTasksWithToken(filters: TreaboTaskFilters | undefined, token: string) {
  return treaboApiRequest<TreaboTask[]>(`/tasks${buildQuery(filters)}`, { token });
}

export async function fetchTreaboSpecialists(filters?: TreaboSpecialistFilters) {
  const params = new URLSearchParams();
  if (filters?.city) params.set('city', filters.city);
  if (filters?.category_id) params.set('category_id', filters.category_id);
  if (filters?.q) params.set('q', filters.q);
  if (!filters?.q && filters?.service) params.set('service', filters.service);
  const query = params.toString();
  return (await fetchJson<TreaboSpecialist[]>(`/specialists${query ? `?${query}` : ''}`)) ?? [];
}

export async function fetchTreaboTopSpecialists(limit = 3) {
  return (await fetchJson<TreaboSpecialist[]>(`/home/top-specialists?limit=${encodeURIComponent(String(limit))}`)) ?? [];
}

export async function fetchTreaboHomeStats() {
  return fetchJson<TreaboHomeStats>('/home/stats');
}

export async function createTreaboTask(token: string, input: Partial<TreaboTask>) {
  return treaboApiRequest<TreaboTask>('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export async function fetchMyTreaboTasks(token: string) {
  return treaboApiRequest<TreaboTask[]>('/tasks/mine', { token });
}

export async function updateTreaboTaskBudget(
  taskId: string,
  token: string,
  input: Pick<Partial<TreaboTask>, 'budget' | 'budget_type' | 'budget_min' | 'budget_max'>,
) {
  return treaboApiRequest<TreaboTask>(`/tasks/${encodeURIComponent(taskId)}/budget`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export async function closeTreaboTask(taskId: string, token: string) {
  return treaboApiRequest<TreaboTask>(`/tasks/${encodeURIComponent(taskId)}/close`, {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}

export async function addTreaboFavorite(taskId: string, token: string) {
  return treaboApiRequest<{ ok?: boolean }>(`/favorites/${encodeURIComponent(taskId)}`, {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}

export async function removeTreaboFavorite(taskId: string, token: string) {
  return treaboApiRequest<{ ok?: boolean }>(`/favorites/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    token,
    body: JSON.stringify({}),
  });
}

export async function fetchTreaboTask(id: string) {
  const direct = await fetchJson<TreaboTask>(`/tasks/${encodeURIComponent(id)}`, { retries: 2 });
  if (direct) return direct;

  const tasks = await fetchJson<TreaboTask[]>('/tasks', { retries: 1 });
  return tasks?.find((task) => String(task.id) === String(id)) ?? null;
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

export async function fetchTreaboTaskRecommendedSpecialists(taskId: string) {
  return (await fetchJson<TreaboRecommendedSpecialist[]>(
    `/tasks/${encodeURIComponent(taskId)}/recommended-specialists`,
    { retries: 2 },
  )) ?? [];
}

export async function fetchTreaboSpecialist(id: string) {
  return fetchJson<TreaboSpecialist>(`/specialists/${encodeURIComponent(id)}`, { retries: 2 });
}

export async function fetchTreaboSpecialistReviews(id: string) {
  return fetchJson<TreaboSpecialistReviewsResponse>(
    `/specialists/${encodeURIComponent(id)}/reviews`,
    { retries: 2 },
  );
}

export async function contactTreaboTaskSpecialist(taskId: string, specialistId: string, token: string) {
  return treaboApiRequest<TreaboContactSpecialistResponse>(
    `/tasks/${encodeURIComponent(taskId)}/contact-specialist/${encodeURIComponent(specialistId)}`,
    { method: 'POST', token, body: JSON.stringify({}) },
  );
}

export async function contactTreaboSpecialist(
  specialistId: string,
  token: string,
  input: { task_id?: string } = {},
) {
  return treaboApiRequest<TreaboContactSpecialistResponse>(
    `/specialists/${encodeURIComponent(specialistId)}/contact`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(input),
    },
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

export async function sendTreaboChatMessage(
  chatId: string,
  token: string,
  text: string,
  input: { type?: string; metadata?: Record<string, any> | null } = {},
) {
  return treaboApiRequest<TreaboMessage>(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ text, type: input.type, metadata: input.metadata }),
  });
}

export async function markTreaboChatRead(chatId: string, token: string) {
  return treaboApiRequest<{ read_at: string }>(`/chats/${encodeURIComponent(chatId)}/read`, {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}

export async function sendTreaboChatTyping(chatId: string, token: string, isTyping: boolean) {
  return treaboApiRequest<{ is_typing: boolean }>(`/chats/${encodeURIComponent(chatId)}/typing`, {
    method: 'POST',
    token,
    body: JSON.stringify({ is_typing: isTyping }),
  });
}

export async function sendTreaboPresenceHeartbeat(token: string) {
  return treaboApiRequest<{ online: boolean; last_seen_at?: string | null }>('/presence/heartbeat', {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}

export async function fetchTreaboBalance(token: string) {
  const payload = await treaboApiRequest<{ success: boolean; data: TreaboBalance }>('/balance', { token });
  return payload.data;
}

export async function fetchTreaboBalanceTransactions(token: string) {
  const payload = await treaboApiRequest<{ success: boolean; data: TreaboBalanceTransaction[] }>(
    '/balance/transactions',
    { token },
  );
  return payload.data;
}

export async function fetchTreaboStats(token: string) {
  return treaboApiRequest<TreaboStats>('/auth/stats', { token });
}

export async function createTreaboYookassaBalanceDeposit(token: string, amount: number) {
  return treaboApiRequest<TreaboYookassaDeposit>('/balance/deposit', {
    method: 'POST',
    token,
    body: JSON.stringify({ amount, payment_method: 'yookassa' }),
  });
}

export async function checkTreaboPendingDeposit(token: string) {
  return treaboApiRequest<TreaboCheckPendingDeposit>('/balance/check-pending', { token });
}

export async function fetchTreaboLandingData(filters?: TreaboTaskFilters) {
  const [categories, tasks, topSpecialists] = await Promise.all([
    fetchTreaboCategories(),
    fetchTreaboTasks(filters),
    fetchTreaboTopSpecialists(3),
  ]);

  return { categories, tasks, topSpecialists };
}

export function filterTasksClientSide(tasks: TreaboTask[], filters: TreaboTaskFilters) {
  return tasks.filter((task) => {
    const values = [task.budget, task.budget_min, task.budget_max]
      .map((value) => (value != null ? Number(value) : null))
      .filter((value): value is number => value != null && Number.isFinite(value));

    if (filters.budget_min != null && values.length && Math.max(...values) < filters.budget_min) {
      return false;
    }
    if (filters.budget_max != null && values.length && Math.min(...values) > filters.budget_max) {
      return false;
    }
    return true;
  });
}
