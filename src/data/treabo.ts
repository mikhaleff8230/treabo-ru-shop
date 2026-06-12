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
  photos_count?: number;
  lat?: number | null;
  lng?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TreaboUpload = {
  disk?: string;
  path?: string;
  url?: string;
  mime?: string | null;
  size?: number | null;
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

export function taskPublicSlug(task: Pick<TreaboTask, 'id' | 'title'>) {
  return taskSlugFromTitle(task.title, task.id);
}

export async function fetchTreaboCategories() {
  return (await fetchJson<TreaboCategory[]>('/categories')) ?? [];
}

export async function fetchTreaboTasks(filters?: TreaboTaskFilters) {
  return (await fetchJson<TreaboTask[]>(`/tasks${buildQuery(filters)}`)) ?? [];
}

export async function fetchTreaboTask(id: string) {
  return await fetchJson<TreaboTask>(`/tasks/${encodeURIComponent(id)}`);
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
