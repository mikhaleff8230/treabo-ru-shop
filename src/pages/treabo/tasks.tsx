import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarClock, MessageCircle, Plus, Wallet } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import { fetchMyTreaboTasks, type TreaboTask } from '@/data/treabo';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import routes from '@/config/routes';

const money = new Intl.NumberFormat('ru-RU');

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('treabo_token');
}

export default function TreaboTasksPage() {
  const auth = useTreaboAuth();
  const [tasks, setTasks] = useState<TreaboTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMyTreaboTasks(token)
      .then(setTasks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить задания'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <TreaboAccountShell title="Мои задания">
      <div className="mb-4 flex justify-end">
        <Link href="/request/new" className="inline-flex items-center gap-2 rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-black text-[#232323]">
          <Plus className="h-4 w-4" />
          Создать задание
        </Link>
      </div>

      {!auth.isAuthenticated && !loading ? (
        <div className="rounded-[28px] bg-white p-6 text-sm font-bold text-[#7d849b] shadow-sm">
          Войдите как заказчик, чтобы увидеть свои задания.
        </div>
      ) : null}

      {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

      {loading ? (
        <div className="rounded-[28px] bg-white p-6 text-sm font-bold text-[#7d849b] shadow-sm">Загружаем задания...</div>
      ) : tasks.length ? (
        <div className="grid gap-4">
          {tasks.map((task) => {
            const budget = Number(task.budget || 0);
            return (
              <Link key={task.id} href={routes.taskUrl(task)} className="rounded-[28px] bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-black text-[#232323]">{task.title}</div>
                    <div className="mt-2 text-sm font-semibold text-[#7d849b]">{[task.city, task.address].filter(Boolean).join(', ') || 'Адрес не указан'}</div>
                  </div>
                  <span className="rounded-full bg-[#f3f5fa] px-3 py-1.5 text-xs font-black text-[#232323]">{task.status === 'open' ? 'Открыт' : task.status || 'Новый'}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-[#232323]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5">
                    <Wallet className="h-4 w-4" />
                    {budget > 0 ? `${money.format(budget)} ₽` : 'Цена договорная'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5">
                    <MessageCircle className="h-4 w-4" />
                    {Number(task.applications_count || 0)} откликов
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5">
                    <CalendarClock className="h-4 w-4" />
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('ru-RU') : 'Дата не указана'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="text-xl font-black text-[#232323]">Заданий пока нет</div>
          <p className="mt-2 text-sm font-semibold text-[#7d849b]">Создайте первую заявку — специалисты смогут откликнуться.</p>
        </div>
      )}
    </TreaboAccountShell>
  );
}
