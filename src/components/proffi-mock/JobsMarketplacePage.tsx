import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
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
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboTasksMapModal from '@/components/treabo/TreaboTasksMapModal';
import type { TreaboCategory, TreaboTask, TreaboTaskFilters } from '@/data/treabo';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';
import { jobCards } from './mock-data';
import { ProffiFooter, ProffiHeader } from './ProffiShell';

type JobsMarketplacePageProps = {
  categories?: TreaboCategory[];
  tasks?: TreaboTask[];
  initialFilters?: TreaboTaskFilters;
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
  icon: typeof Wrench;
  photos: string[];
  task?: TreaboTask;
};

const money = new Intl.NumberFormat('ru-RU');

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)), template);
}

function categoryName(category: TreaboCategory | undefined, _locale: string) {
  if (!category) return null;
  return category.name_ru;
}

function mapTaskToCard(task: TreaboTask, categories: TreaboCategory[], locale: string): UiJobCard {
  const text = getTreaboText(locale);
  const category = categories.find(
    (item) => item.id === task.category_id || item.id === task.category || item.slug === task.category,
  );
  const categoryLabel = categoryName(category, locale) || text.works.taskTag;
  const budget = Number(task.budget || 0);

  return {
    id: String(task.id),
    title: task.title,
    brand: categoryLabel || text.works.privateCustomer,
    location: [task.city || text.city, task.address].filter(Boolean).join(', '),
    time: task.deadline || text.works.agreementTerm,
    pay: budget > 0 ? `${money.format(budget)} MDL` : text.works.negotiablePrice,
    duration: task.status === 'open' ? text.works.open : task.status || text.works.newOrder,
    tags: [
      categoryLabel,
      task.photos?.length ? text.works.objectPhoto : text.works.clarifyDetails,
      task.updated_at ? text.works.updatedRecently : text.works.new,
    ],
    icon: category?.icon === 'Wrench' ? Wrench : Paintbrush,
    photos: (task.photos || [])
      .map((photo) => (typeof photo === 'string' ? photo : photo.url || photo.path || ''))
      .filter(Boolean)
      .slice(0, 3),
    task,
  };
}

function buildJobCards(tasks: TreaboTask[], categories: TreaboCategory[], locale: string): UiJobCard[] {
  if (!tasks.length) {
    return jobCards.map((card, index) => ({ ...card, id: `mock-${index + 1}`, photos: [], task: undefined }));
  }

  return tasks.slice(0, 100).map((task) => mapTaskToCard(task, categories, locale));
}

function buildQuery(filters: TreaboTaskFilters) {
  const params = new URLSearchParams();
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.category) params.set('category', filters.category);
  if (filters.city) params.set('city', filters.city);
  if (filters.q) params.set('q', filters.q);
  if (filters.budget_min != null) params.set('budget_min', String(filters.budget_min));
  if (filters.budget_max != null) params.set('budget_max', String(filters.budget_max));
  return params.toString();
}

export default function JobsMarketplacePage({
  categories = [],
  tasks = [],
  initialFilters = {},
}: JobsMarketplacePageProps) {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [filters, setFilters] = useState<TreaboTaskFilters>({
    city: initialFilters.city || text.city,
    ...initialFilters,
  });

  const visibleJobs = useMemo(() => buildJobCards(tasks, categories, 'ru'), [tasks, categories]);
  const availableCount = tasks.length || visibleJobs.length;
  const quickTags = ['срочно', 'с фото', 'рядом с домом', 'ремонт', 'плитка', 'сантехника', 'электрика'];

  const categoryOptions = categories.length
    ? categories.map((item) => ({ id: item.id, label: categoryName(item, 'ru') || item.slug || item.id }))
    : [];

  function applyFilters(next: TreaboTaskFilters) {
    const query = buildQuery(next);
    router.push(query ? `${routes.works}?${query}` : routes.works);
  }

  function resetFilters() {
    const next = { city: text.city };
    setFilters(next);
    applyFilters(next);
  }

  function toggleCategory(categoryId: string) {
    setFilters((current) => ({
      ...current,
      category_id: current.category_id === categoryId ? undefined : categoryId,
    }));
  }

  function toggleBudgetPreset(preset: string) {
    const first = text.works.filters[0].options;
    if (preset === first[0]) {
      setFilters((current) => ({ ...current, budget_min: undefined, budget_max: undefined }));
      return;
    }
    if (preset === first[1]) {
      setFilters((current) => ({ ...current, budget_min: 5000, budget_max: undefined }));
      return;
    }
    if (preset === first[2]) {
      setFilters((current) => ({ ...current, q: 'срочно' }));
    }
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f5f6f1] text-[#232323]" style={{ width: '100vw' }}>
      <ProffiHeader />
      <main className="overflow-hidden">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 text-sm text-[#232323] md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="hover:opacity-75">{text.common.home}</Link>
                <span>/</span>
                <span>{filters.city || text.city}</span>
                <span>/</span>
                <span>{text.common.allTasks}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold text-[#232323]">
                <MapPin className="h-4 w-4" /> {filters.city || text.city}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="min-w-0" style={{ width: 'min(100%, calc(100vw - 2rem))' }}>
              <h1 className="max-w-full break-words text-[34px] font-black leading-[1.05] sm:text-5xl">
                {interpolate(text.works.title, { city: filters.city || text.city })}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#232323]">{text.works.subtitle}</p>
            </div>
            <div className="rounded-[28px] border border-zinc-200 bg-[#d9f36b] p-5 text-[#232323] shadow-sm">
              <div className="text-sm font-semibold text-[#232323]">{text.works.availableToday}</div>
              <div className="mt-1 text-3xl font-black text-[#232323]">{interpolate(text.works.tasksCount, { count: availableCount })}</div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#232323]">
                <CalendarClock className="h-4 w-4" />
                {text.works.responsesAfterLogin}
              </div>
            </div>
          </div>

          <div className="sticky top-16 z-30 -mx-4 mb-4 border-y border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">
                <Filter className="h-4 w-4" />
                {text.common.filters}
              </button>
              <button type="button" onClick={() => setMapOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-bold">
                <Map className="h-4 w-4" />
                {text.common.map}
              </button>
              <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-bold">
                <ArrowUpDown className="h-4 w-4" />
                {text.common.sort}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black">{text.common.filters}</h2>
                  <button type="button" onClick={resetFilters} className="text-sm font-bold text-[#232323]">
                    {text.common.reset}
                  </button>
                </div>

                <div className="space-y-5">
                  {categoryOptions.length ? (
                    <div className="border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0">
                      <div className="mb-3 font-black">{text.common.category}</div>
                      <div className="flex flex-wrap gap-2">
                        {categoryOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleCategory(option.id)}
                            className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                              filters.category_id === option.id
                                ? 'bg-zinc-950 text-white'
                                : 'bg-zinc-100 text-[#232323] hover:bg-zinc-950 hover:text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-t border-zinc-100 pt-5">
                    <div className="mb-3 font-black">{text.common.city}</div>
                    <input
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                      value={filters.city || ''}
                      onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                      placeholder={text.city}
                    />
                  </div>

                  {text.works.filters.map((group) => (
                    <div key={group.title} className="border-t border-zinc-100 pt-5">
                      <div className="mb-3 flex items-center justify-between font-black">
                        {group.title}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              if (group.title === text.works.filters[0].title) toggleBudgetPreset(option);
                            }}
                            className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold text-[#232323] transition hover:bg-zinc-950 hover:text-white"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => applyFilters(filters)} className="mt-6 w-full rounded-2xl bg-zinc-950 px-5 py-3 font-black text-white">
                  {text.common.apply}
                </button>
                <button type="button" onClick={() => setMapOpen(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-black">
                  <Map className="h-4 w-4" />
                  {text.common.viewOnMap}
                </button>
              </div>
            </aside>

            <section>
              <div className="mb-4 flex flex-col gap-3 rounded-[26px] border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-[#232323]">{text.common.found}</div>
                  <div className="text-xl font-black">{interpolate(text.works.matchedTasks, { count: visibleJobs.length })}</div>
                </div>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black">
                  <SlidersHorizontal className="h-4 w-4" />
                  {text.common.newestFirst}
                </button>
              </div>

              <div className="space-y-4">
                {visibleJobs.map(({ icon: Icon, task, ...job }) => (
                  <article key={job.id} className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-xl">
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
                          {job.photos.length ? (
                            <div className="mt-4 grid max-w-md grid-cols-3 gap-2">
                              {job.photos.map((photo, index) => (
                                <img
                                  key={`${job.id}-photo-${index}`}
                                  src={photo}
                                  alt={`${job.title} ${index + 1}`}
                                  className="h-20 w-full rounded-2xl object-cover"
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-col md:items-stretch">
                        <div>
                          <div className="text-sm font-bold text-[#232323]">{job.duration}</div>
                          <div className="text-3xl font-black text-[#232323]">{job.pay}</div>
                        </div>
                        <div className="flex w-full flex-row gap-2 md:flex-col">
                          {auth.isSpecialist ? (
                            <button type="button" className="min-h-[48px] flex-1 rounded-2xl bg-[#d9f36b] px-5 py-3 text-sm font-semibold text-[#232323] shadow-[0_12px_26px_rgba(132,204,22,0.24)] transition hover:bg-[#c7e85a]">
                              {text.works.apply}
                            </button>
                          ) : auth.isAuthenticated ? null : (
                            <button type="button" onClick={() => setAuthOpen(true)} className="min-h-[48px] flex-1 rounded-2xl bg-[#d9f36b] px-5 py-3 text-sm font-semibold text-[#232323]">
                              {text.works.loginAndApply}
                            </button>
                          )}
                          <Link href={routes.taskUrl(task || { id: job.id, title: job.title })} className="flex min-h-[48px] w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3f8] px-0 py-3 text-sm font-semibold text-[#232323] transition hover:bg-[#e3ebf2] md:w-full md:flex-1 md:px-5">
                            <Info className="h-5 w-5 md:hidden" />
                            <span className="hidden md:inline">{text.common.more}</span>
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
            {quickTags.map((tag) => (
              <button key={tag} type="button" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#232323]">
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{text.works.faqTitle}</h2>
            <p className="mt-3 text-[#232323]">{text.works.faqText}</p>
          </div>
        </section>
      </main>
      <ProffiFooter />

      <TreaboTasksMapModal open={mapOpen} onClose={() => setMapOpen(false)} tasks={tasks} />
      <TreaboAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab="login"
        login={auth.login}
        register={auth.register}
        onSuccess={auth.refresh}
      />
    </div>
  );
}
