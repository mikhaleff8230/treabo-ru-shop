import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  CalendarClock,
  ChevronDown,
  Filter,
  Info,
  Map,
  MapPin,
  Paintbrush,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import type { TreaboCategory, TreaboTask } from '@/data/treabo';
import routes from '@/config/routes';
import { faqItems, jobCards, jobFilters, jobTags } from './mock-data';
import { ProffiFooter, ProffiHeader } from './ProffiShell';

type JobsMarketplacePageProps = {
  categories?: TreaboCategory[];
  tasks?: TreaboTask[];
};

type UiJobCard = {
  id: string;
  title: string;
  brand: string;
  location: string;
  time: string;
  pay: string;
  duration: string;
  tags: string[];
  icon: any;
};

const money = new Intl.NumberFormat('ru-RU');

function mapTaskToCard(task: TreaboTask, categories: TreaboCategory[]): UiJobCard {
  const category = categories.find((item) => item.id === task.category_id || item.id === task.category || item.slug === task.category);
  const budget = Number(task.budget || 0);

  return {
    id: String(task.id),
    title: task.title,
    brand: category?.name_ru || 'Частный заказчик',
    location: [task.city || 'Москва', task.address].filter(Boolean).join(', '),
    time: task.deadline || 'Срок по договоренности',
    pay: budget > 0 ? `${money.format(budget)} ₽` : 'Цена договорная',
    duration: task.status === 'open' ? 'Открыт' : task.status || 'Новый',
    tags: [
      category?.name_ru || 'Задание Treabo',
      task.photos?.length ? 'Фото объекта' : 'Можно уточнить детали',
      task.updated_at ? 'Обновлено недавно' : 'Новый заказ',
    ],
    icon: category?.icon === 'Wrench' ? Wrench : Paintbrush,
  };
}

function buildJobCards(tasks: TreaboTask[], categories: TreaboCategory[]) {
  if (!tasks.length) {
    return jobCards.map((card, index) => ({ ...card, id: `mock-${index + 1}` }));
  }

  return tasks.slice(0, 20).map((task) => mapTaskToCard(task, categories));
}

function readSpecialistRole() {
  if (typeof window === 'undefined') return false;

  const directRole = [
    window.localStorage.getItem('treabo_role'),
    window.localStorage.getItem('proffi_role'),
    window.localStorage.getItem('user_role'),
  ].find(Boolean);

  if (directRole && ['specialist', 'store_owner', 'master'].includes(directRole)) {
    return true;
  }

  for (const key of ['treabo_user', 'proffi_user', 'user', 'auth_user']) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const value = JSON.parse(raw);
      const role = value?.role || value?.user?.role || value?.permissions?.[0];
      if (['specialist', 'store_owner', 'master'].includes(role)) {
        return true;
      }
    } catch {
      // Ignore legacy non-json values.
    }
  }

  return false;
}

export default function JobsMarketplacePage({ categories = [], tasks = [] }: JobsMarketplacePageProps) {
  const [isSpecialist, setIsSpecialist] = useState(false);
  const visibleJobs = buildJobCards(tasks, categories);
  const availableCount = tasks.length || 248;

  useEffect(() => {
    setIsSpecialist(readSpecialistRole());
  }, []);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f5f6f1] text-[#232323]" style={{ width: '100vw' }}>
      <ProffiHeader />
      <main className="overflow-hidden">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 text-sm text-[#232323] md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="hover:opacity-75">Главная</Link>
                <span>/</span>
                <span>Москва</span>
                <span>/</span>
                <span>Все задания</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1 font-semibold text-[#232323]"><MapPin className="h-4 w-4" /> Москва</span>
                <span className="hidden sm:inline">Поддержка: 8 800 700-13-86</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="min-w-0" style={{ width: 'min(100%, calc(100vw - 2rem))' }}>
              <h1 className="max-w-full break-words text-[34px] font-black leading-[1.05] sm:text-5xl">Подработка и заказы в Москве</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#232323]">
                Лента заданий для исполнителей Treabo: фильтры, карта, карточки заказов и быстрые действия. Список подключен к Laravel API, моковые данные остаются резервом.
              </p>
            </div>
            <div className="rounded-[28px] border border-zinc-200 bg-[#d9f36b] p-5 text-[#232323] shadow-sm">
              <div className="text-sm font-semibold text-[#232323]">Доступно сегодня</div>
              <div className="mt-1 text-3xl font-black text-[#232323]">{availableCount} заданий</div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#232323]">
                <CalendarClock className="h-4 w-4" />
                выплаты от 24 часов
              </div>
            </div>
          </div>

          <div className="sticky top-16 z-30 -mx-4 mb-4 border-y border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              <button className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">
                <Filter className="h-4 w-4" />
                Фильтры
              </button>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-bold">
                <Map className="h-4 w-4" />
                Карта
              </button>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-bold">
                <ArrowUpDown className="h-4 w-4" />
                Сортировка
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black">Фильтры</h2>
                  <button className="text-sm font-bold text-[#232323]">Сбросить</button>
                </div>
                <div className="space-y-5">
                  {jobFilters.map((group) => (
                    <div key={group.title} className="border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0">
                      <div className="mb-3 flex items-center justify-between font-black">
                        {group.title}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((option) => (
                          <button key={option} className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold text-[#232323] transition hover:bg-zinc-950 hover:text-white">
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full rounded-2xl bg-zinc-950 px-5 py-3 font-black text-white">Применить</button>
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 font-black">
                  <Map className="h-4 w-4" />
                  Посмотреть на карте
                </button>
              </div>
            </aside>

            <section>
              <div className="mb-4 flex flex-col gap-3 rounded-[26px] border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-[#232323]">Найдено</div>
                  <div className="text-xl font-black">{visibleJobs.length} подходящих заданий</div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black">
                  <SlidersHorizontal className="h-4 w-4" />
                  Сначала новые
                </button>
              </div>

              <div className="space-y-4">
                {visibleJobs.map(({ icon: Icon, ...job }) => (
                  <article key={`${job.title}-${job.location}`} className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-xl">
                    <div className="grid gap-4 p-5 md:grid-cols-[1fr_190px]">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d9f36b]">
                          <Icon className="h-7 w-7 text-zinc-950" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-wide text-[#232323]">{job.brand}</div>
                          <h3 className="mt-1 text-xl font-black leading-tight">{job.title}</h3>
                          <div className="mt-3 grid gap-2 text-sm text-[#232323] sm:grid-cols-2">
                            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location}</span>
                            <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {job.time}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {job.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-[#232323]">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-col md:items-stretch">
                        <div>
                          <div className="text-sm font-bold text-[#232323]">{job.duration}</div>
                          <div className="text-3xl font-black text-[#232323]">{job.pay}</div>
                        </div>
                        <div className="flex w-full flex-row gap-2 md:flex-col">
                          {isSpecialist ? (
                            <button className="min-h-[48px] flex-1 rounded-2xl bg-[#d9f36b] px-5 py-3 text-sm font-semibold text-[#232323] shadow-[0_12px_26px_rgba(132,204,22,0.24)] transition hover:bg-[#c7e85a]">
                              Откликнуться
                            </button>
                          ) : null}
                          <Link href={routes.taskUrl(job.id)} className="flex min-h-[48px] w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3f8] px-0 py-3 text-sm font-semibold text-[#232323] transition hover:bg-[#e3ebf2] md:w-full md:flex-1 md:px-5">
                            <Info className="h-5 w-5 md:hidden" />
                            <span className="hidden md:inline">Подробнее</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {jobTags.map((tag) => (
              <button key={tag} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#232323]">
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Вопросы и ответы</h2>
            <p className="mt-3 text-[#232323]">FAQ-блок оставлен как часть основного шаблона, дальше его можно наполнить правилами Treabo.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="group rounded-[24px] bg-white p-5 shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
                  {item.q}
                  <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#232323]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <ProffiFooter />
    </div>
  );
}
