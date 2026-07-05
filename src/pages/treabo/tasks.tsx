import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { CalendarClock, MessageCircle, Plus, Wallet, X } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  closeTreaboTask,
  fetchMyTreaboTasks,
  updateTreaboTaskBudget,
  type TreaboTask,
} from '@/data/treabo';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import routes from '@/config/routes';

const money = new Intl.NumberFormat('ru-RU');

type BudgetForm = {
  budget_type: 'fixed' | 'range';
  budget: string;
  budget_min: string;
  budget_max: string;
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('treabo_token');
}

function taskBudgetLabel(task: TreaboTask) {
  if (task.budget_type === 'range') {
    const min = task.budget_min != null ? Number(task.budget_min) : null;
    const max = task.budget_max != null ? Number(task.budget_max) : null;
    if (min != null && max != null) return `от ${money.format(min)} до ${money.format(max)} ₽`;
    if (min != null) return `от ${money.format(min)} ₽`;
    if (max != null) return `до ${money.format(max)} ₽`;
  }

  const budget = Number(task.budget || 0);
  return budget > 0 ? `${money.format(budget)} ₽` : 'Цена договорная';
}

function isClosed(task: TreaboTask) {
  return ['closed', 'cancelled', 'done', 'completed'].includes(String(task.status || ''));
}

export default function TreaboTasksPage() {
  const auth = useTreaboAuth();
  const [tasks, setTasks] = useState<TreaboTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState<TreaboTask | null>(null);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    budget_type: 'fixed',
    budget: '',
    budget_min: '',
    budget_max: '',
  });
  const [saving, setSaving] = useState(false);

  function loadTasks() {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMyTreaboTasks(token)
      .then(setTasks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить задания'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function openBudgetModal(task: TreaboTask) {
    setEditingTask(task);
    setBudgetForm({
      budget_type: task.budget_type === 'range' ? 'range' : 'fixed',
      budget: task.budget ? String(task.budget) : '',
      budget_min: task.budget_min != null ? String(task.budget_min) : '',
      budget_max: task.budget_max != null ? String(task.budget_max) : '',
    });
  }

  async function submitBudget(event: FormEvent) {
    event.preventDefault();
    if (!editingTask) return;

    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      const updated = await updateTreaboTaskBudget(editingTask.id, token, {
        budget_type: budgetForm.budget_type,
        budget: budgetForm.budget_type === 'fixed' && budgetForm.budget ? Number(budgetForm.budget) : null,
        budget_min: budgetForm.budget_type === 'range' && budgetForm.budget_min ? Number(budgetForm.budget_min) : null,
        budget_max: budgetForm.budget_type === 'range' && budgetForm.budget_max ? Number(budgetForm.budget_max) : null,
      });
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setEditingTask(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить бюджет');
    } finally {
      setSaving(false);
    }
  }

  async function closeTask(task: TreaboTask) {
    if (!confirm('Снять задачу с публикации? Специалисты больше не смогут откликаться.')) return;

    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      const updated = await closeTreaboTask(task.id, token);
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось снять задачу');
    } finally {
      setSaving(false);
    }
  }

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
            const closed = isClosed(task);
            return (
              <article key={task.id} className={`rounded-[28px] bg-white p-5 shadow-sm transition hover:shadow-md ${closed ? 'opacity-75' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={routes.taskUrl(task)} className="text-xl font-normal text-[#232323] transition hover:underline">
                      {task.title}
                    </Link>
                    <div className="mt-2 text-sm font-semibold text-[#7d849b]">
                      {[task.city, task.address].filter(Boolean).join(', ') || 'Адрес не указан'}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f3f5fa] px-3 py-1.5 text-xs font-black text-[#232323]">
                    {closed ? 'Закрыта' : task.status === 'open' ? 'Открыта' : task.status || 'Новая'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-[#232323]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f6f1] px-3 py-1.5">
                    <Wallet className="h-4 w-4" />
                    {taskBudgetLabel(task)}
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

                <div className="mt-4 flex flex-wrap gap-2">
                  {!closed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openBudgetModal(task)}
                        className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-black text-[#232323] transition hover:border-zinc-950"
                      >
                        Редактировать бюджет
                      </button>
                      <button
                        type="button"
                        onClick={() => closeTask(task)}
                        disabled={saving}
                        className="rounded-2xl bg-[#232323] px-4 py-2 text-sm font-black text-white transition hover:bg-black disabled:opacity-60"
                      >
                        Снять задачу
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="text-xl font-black text-[#232323]">Заданий пока нет</div>
          <p className="mt-2 text-sm font-semibold text-[#7d849b]">Создайте первую заявку, и специалисты смогут откликнуться.</p>
        </div>
      )}

      {editingTask ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={submitBudget} className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-[#232323]">Изменить бюджет</div>
                <p className="mt-1 text-sm font-semibold text-[#7d849b]">Изменить можно только бюджет задания.</p>
              </div>
              <button type="button" onClick={() => setEditingTask(null)} className="rounded-full p-2 hover:bg-[#f5f6f1]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f6f1] p-1">
              {(['fixed', 'range'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBudgetForm((current) => ({ ...current, budget_type: type }))}
                  className={`rounded-xl px-3 py-2 text-sm font-black ${
                    budgetForm.budget_type === type ? 'bg-white shadow-sm' : 'text-[#7d849b]'
                  }`}
                >
                  {type === 'fixed' ? 'Точная сумма' : 'Интервал'}
                </button>
              ))}
            </div>

            {budgetForm.budget_type === 'fixed' ? (
              <label className="mt-4 block">
                <span className="text-sm font-black text-[#232323]">Сумма, ₽</span>
                <input
                  type="number"
                  min={0}
                  value={budgetForm.budget}
                  onChange={(event) => setBudgetForm((current) => ({ ...current, budget: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-zinc-950"
                  placeholder="5000"
                />
              </label>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label>
                  <span className="text-sm font-black text-[#232323]">От, ₽</span>
                  <input
                    type="number"
                    min={0}
                    value={budgetForm.budget_min}
                    onChange={(event) => setBudgetForm((current) => ({ ...current, budget_min: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-zinc-950"
                    placeholder="1000"
                  />
                </label>
                <label>
                  <span className="text-sm font-black text-[#232323]">До, ₽</span>
                  <input
                    type="number"
                    min={0}
                    value={budgetForm.budget_max}
                    onChange={(event) => setBudgetForm((current) => ({ ...current, budget_max: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-zinc-950"
                    placeholder="5000"
                  />
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 h-12 w-full rounded-2xl bg-[#d9f36b] text-sm font-black text-[#232323] disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : 'Сохранить бюджет'}
            </button>
          </form>
        </div>
      ) : null}
    </TreaboAccountShell>
  );
}
