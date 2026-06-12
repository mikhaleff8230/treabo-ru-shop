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
  photos?: string[];
  applications_count?: number;
  photos_count?: number;
  lat?: number | null;
  lng?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
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

async function fetchJson<T>(path: string): Promise<T | null> {
  for (const baseUrl of apiCandidates()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

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

export async function fetchTreaboCategories() {
  return (await fetchJson<TreaboCategory[]>('/categories')) ?? [];
}

export async function fetchTreaboTasks() {
  return (await fetchJson<TreaboTask[]>('/tasks')) ?? [];
}

export async function fetchTreaboTask(id: string) {
  return await fetchJson<TreaboTask>(`/tasks/${encodeURIComponent(id)}`);
}

export async function fetchTreaboLandingData() {
  const [categories, tasks] = await Promise.all([
    fetchTreaboCategories(),
    fetchTreaboTasks(),
  ]);

  return { categories, tasks };
}
