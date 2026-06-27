import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  CalendarClock,
  Filter,
  Info,
  Map,
  MapPin,
  Paintbrush,
  Wrench,
} from 'lucide-react';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboTasksMapModal from '@/components/treabo/TreaboTasksMapModal';
import RussiaCityInput from '@/components/treabo/RussiaCityInput';
import type { TreaboCategory, TreaboTask, TreaboTaskFilters } from '@/data/treabo';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';
import { jobCards } from './mock-data';
import {
  MarketplaceFilterGroup,
  MarketplaceFilterOption,
  MarketplaceFilterSidebar,
  MarketplaceMobileFiltersDrawer,
  MarketplaceResultsBar,
  marketplace,
} from './marketplace-ui';
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
  priceNote: string;
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

function categoryName(category: TreaboCategory | undefined) {
  return category?.name_ru ?? null;
}

function taskCustomerName(task: TreaboTask) {
  return task.customer_name || task.customer?.name || task.client_name || task.user?.name || 'Заказчик';
}

function mapTaskToCard(task: TreaboTask, categories: TreaboCategory[], locale: string): UiJobCard {
  const text = getTreaboText(locale);
  const category = categories.find(
    (item) => item.id === task.category_id || item.id === task.category || item.slug === task.category,
  );
  const categoryLabel = categoryName(category) || text.works.taskTag;
  const budget = Number(task.budget || 0);

  return {
    id: String(task.id),
    title: task.title,
    brand: taskCustomerName(task),
    location: [task.city || text.city, task.address].filter(Boolean).join(', '),
    time: task.deadline || text.works.agreementTerm,
    pay: budget > 0 ? `${money.format(budget)} ₽` : text.works.negotiablePrice,
    priceNote: budget > 0 ? 'Начальная цена' : 'Цена по договоренности',
    duration: task.status === 'open' ? text.works.open : task.status || text.works.newOrder,
    tags: [
      categoryLabel,
      task.photos?.length ? text.works.objectPhoto : text.works.clarifyDetails,
      task.updated_at ? text.works.updatedRecently : text.works.new,
    ].filter(Boolean) as string[],
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
    return jobCards.map((card, index) => ({ ...card, id: `mock-${index + 1}`, task: undefined }));
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

function JobCard({
  job,
  task,
  Icon,
  text,
  auth,
  onAuthOpen,
}: {
  job: Omit<UiJobCard, 'icon' | 'task'>;
  task?: TreaboTask;
  Icon: typeof Wrench;
  text: ReturnType<typeof getTreaboText>;
  auth: ReturnType<typeof useTreaboAuth>;
  onAuthOpen: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const primaryPhoto = job.photos[0] || '/proffi/task-preview-default.svg';
  const previewPhotos = job.photos.slice(1, 4);

  return (
    <article className={marketplace.card}>
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_clamp(150px,18%,230px)_260px]">
        <div className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[16px] bg-[#F3F4F6] sm:h-[72px] sm:w-[72px]">
              <img src={primaryPhoto} alt={`${job.title} preview`} className="h-full w-full object-cover" loading="lazy" />
              {job.photos.length > 1 ? (
                <span className="absolute bottom-1 right-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-medium leading-none text-[#20242D]">
                  +{job.photos.length - 1}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-[400] uppercase leading-none tracking-[0.055em] text-[#7D828D] sm:text-[10px]">
                {job.brand}
              </div>
              <h3 className="mt-1.5 break-words text-[17px] font-[300] leading-[1.08] tracking-[-0.025em] text-[#1F2430] sm:text-[20px] xl:text-[21px]">
                {job.title}
              </h3>
              <div className="mt-2 flex flex-col gap-1.5 text-[11px] font-[300] leading-none text-[#777D88] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1.5 sm:text-[12px]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-[14px] w-[14px] shrink-0 stroke-[1.8] text-[#525862]" />
                  <span className="break-words">{job.location}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-[14px] w-[14px] shrink-0 stroke-[1.8] text-[#525862]" />
                  {job.time}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span key={tag} className={marketplace.chip}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center border-[#E7E9EC] px-3 py-3 xl:flex">
          {previewPhotos.length ? (
            <div className="grid w-full grid-cols-3 gap-1.5">
              {previewPhotos.map((photo, index) => (
                <div
                  key={`${job.id}-photo-${index}`}
                  className="relative overflow-hidden rounded-[12px] bg-[#F3F4F6]"
                >
                  <img
                    src={photo}
                    alt={`${job.title} ${index + 1}`}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  {index === 2 && job.photos.length > 3 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#232323]/45 text-xs font-medium text-white">
                      +{job.photos.length - 3}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <img
              src="/proffi/task-preview-default.svg"
              alt={`${job.title} default preview`}
              className="h-[76px] w-full rounded-[14px] object-cover"
              loading="lazy"
            />
          )}
        </div>

        <div className="flex flex-col border-[#E7E9EC] px-3 pb-3 pt-0 sm:px-4 sm:pb-4 xl:my-4 xl:border-l xl:px-4 xl:py-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="text-[19px] font-[300] leading-none tracking-[-0.03em] text-[#232323] sm:text-[22px]">
              {job.pay}
            </div>
            <div className="text-[9px] font-[300] leading-none text-[#8B91A0] sm:text-[10px]">
              {job.priceNote}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {auth.isSpecialist ? (
              <button
                type="button"
                className="inline-flex min-h-[34px] flex-1 items-center justify-between rounded-[11px] bg-[#D9F36B] px-3 text-[12px] font-[300] text-[#20242D] transition hover:bg-[#c7e85a] sm:min-h-[36px] sm:text-[13px]"
              >
                {text.works.apply}
                <ArrowRight className="h-4 w-4 stroke-[1.8]" />
              </button>
            ) : auth.isAuthenticated ? null : (
              <button
                type="button"
                onClick={onAuthOpen}
                className="inline-flex min-h-[34px] flex-1 items-center justify-between rounded-[11px] bg-[#D9F36B] px-3 text-[12px] font-[300] text-[#20242D] transition hover:bg-[#c7e85a] sm:min-h-[36px] sm:text-[13px]"
              >
                {text.works.apply}
                <ArrowRight className="h-4 w-4 stroke-[1.8]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-pressed={saved}
              className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border bg-white transition sm:h-[36px] sm:w-[36px] ${
                saved ? 'border-[#D9F36B] text-[#232323]' : 'border-[#E7E9EC] text-[#777D88]'
              }`}
            >
              <Bookmark className={`h-4 w-4 stroke-[1.8] ${saved ? 'fill-[#232323]' : ''}`} />
            </button>
            <Link
              href={routes.taskUrl(task || { id: job.id, title: job.title })}
              aria-label={text.common.more}
              title={text.common.more}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#F3F4F6] text-[#3E424B] transition hover:bg-[#ECEEF2] sm:h-[36px] sm:w-[36px]"
            >
              <Info className="h-4 w-4 stroke-[1.8]" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function WorksFiltersPanel({
  text,
  filters,
  setFilters,
  categoryOptions,
  openSections,
  toggleSection,
  toggleCategory,
  toggleBudgetPreset,
  isBudgetSelected,
}: {
  text: ReturnType<typeof getTreaboText>;
  filters: TreaboTaskFilters;
  setFilters: Dispatch<SetStateAction<TreaboTaskFilters>>;
  categoryOptions: { id: string; label: string }[];
  openSections: Set<string>;
  toggleSection: (key: string) => void;
  toggleCategory: (id: string) => void;
  toggleBudgetPreset: (preset: string) => void;
  isBudgetSelected: (option: string) => boolean;
}) {
  return (
    <>
      {categoryOptions.length ? (
        <MarketplaceFilterGroup
          title={text.common.category}
          open={openSections.has('category')}
          onToggle={() => toggleSection('category')}
        >
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <MarketplaceFilterOption
                key={option.id}
                label={option.label}
                type="chip"
                selected={filters.category_id === option.id}
                onClick={() => toggleCategory(option.id)}
              />
            ))}
          </div>
        </MarketplaceFilterGroup>
      ) : null}

      <MarketplaceFilterGroup
        title={text.common.city}
        open={openSections.has('city')}
        onToggle={() => toggleSection('city')}
      >
        <RussiaCityInput
          value={filters.city || ''}
          onChange={(city) => setFilters((current) => ({ ...current, city }))}
          placeholder={text.city}
          inputClassName="w-full rounded-xl border border-[#E7E9EC] px-4 py-3 text-sm text-[#232323] outline-none focus:border-[#D9F36B]"
        />
      </MarketplaceFilterGroup>

      {text.works.filters.map((group) => (
        <MarketplaceFilterGroup
          key={group.title}
          title={group.title}
          open={openSections.has(group.title)}
          onToggle={() => toggleSection(group.title)}
        >
          {group.options.map((option) => (
            <MarketplaceFilterOption
              key={option}
              label={option}
              selected={group.title === text.works.filters[0].title ? isBudgetSelected(option) : false}
              onClick={() => {
                if (group.title === text.works.filters[0].title) toggleBudgetPreset(option);
              }}
            />
          ))}
        </MarketplaceFilterGroup>
      ))}
    </>
  );
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['category', 'city', text.works.filters[0]?.title]),
  );
  const [filters, setFilters] = useState<TreaboTaskFilters>({
    city: initialFilters.city || text.city,
    ...initialFilters,
  });

  const visibleJobs = useMemo(() => buildJobCards(tasks, categories, 'ru'), [tasks, categories]);
  const availableCount = tasks.length || visibleJobs.length;
  const quickTags = ['срочно', 'с фото', 'рядом с домом', 'ремонт', 'плитка', 'сантехника', 'электрика'];

  const categoryOptions = categories.length
    ? categories.map((item) => ({ id: item.id, label: categoryName(item) || item.slug || item.id }))
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
      setFilters((current) => ({ ...current, budget_min: undefined, budget_max: undefined, q: undefined }));
      return;
    }
    if (preset === first[1]) {
      setFilters((current) => ({ ...current, budget_min: 5000, budget_max: undefined, q: undefined }));
      return;
    }
    if (preset === first[2]) {
      setFilters((current) => ({ ...current, q: 'срочно' }));
    }
  }

  function isBudgetSelected(option: string) {
    const first = text.works.filters[0].options;
    if (option === first[0]) return filters.budget_min == null && filters.budget_max == null && !filters.q;
    if (option === first[1]) return filters.budget_min === 5000;
    if (option === first[2]) return filters.q === 'срочно';
    return false;
  }

  function toggleSection(key: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtersPanel = (
    <WorksFiltersPanel
      text={text}
      filters={filters}
      setFilters={setFilters}
      categoryOptions={categoryOptions}
      openSections={openSections}
      toggleSection={toggleSection}
      toggleCategory={toggleCategory}
      toggleBudgetPreset={toggleBudgetPreset}
      isBudgetSelected={isBudgetSelected}
    />
  );

  return (
    <div className={`min-h-screen max-w-full overflow-x-hidden ${marketplace.pageBg} ${marketplace.text}`}>
      <ProffiHeader />
      <main className="overflow-hidden">
        <section className="border-b border-[#E7E9EC] bg-white">
          <div className={`mx-auto ${marketplace.maxWidth} px-4 py-4 sm:px-6 lg:px-8`}>
            <div className="flex flex-col gap-3 text-sm text-[#777D88] md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="hover:text-[#232323]">
                  {text.common.home}
                </Link>
                <span>/</span>
                <span>{filters.city || text.city}</span>
                <span>/</span>
                <span className="text-[#232323]">{text.common.allTasks}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-medium text-[#232323]">
                <MapPin className="h-4 w-4" /> {filters.city || text.city}
              </span>
            </div>
          </div>
        </section>

        <section className={`mx-auto ${marketplace.maxWidth} px-4 py-8 sm:px-6 lg:px-8`}>
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div className="min-w-0">
              <h1 className="break-words text-[34px] font-bold leading-[1.05] text-[#232323] sm:text-[44px]">
                {interpolate(text.works.title, { city: filters.city || text.city })}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#777D88]">{text.works.subtitle}</p>
            </div>
            <div className="rounded-[28px] border border-[#E7E9EC] bg-[#D9F36B] p-5 text-[#232323]">
              <div className="text-sm font-semibold">{text.works.availableToday}</div>
              <div className="mt-1 text-3xl font-bold">{interpolate(text.works.tasksCount, { count: availableCount })}</div>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4" />
                {text.works.responsesAfterLogin}
              </div>
            </div>
          </div>

          <div className="sticky top-14 z-30 -mx-4 mb-5 border-y border-[#E7E9EC] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#232323] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Filter className="h-4 w-4" />
                {text.common.filters}
              </button>
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-4 py-2.5 text-sm font-semibold"
              >
                <Map className="h-4 w-4" />
                {text.common.map}
              </button>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-4 py-2.5 text-sm font-semibold"
              >
                <ArrowUpDown className="h-4 w-4" />
                {text.common.sort}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <MarketplaceFilterSidebar
                title={text.common.filters}
                resetLabel={text.common.reset}
                onReset={resetFilters}
                applyLabel={text.common.apply}
                onApply={() => applyFilters(filters)}
                viewOnMapLabel={text.common.viewOnMap}
                onViewMap={() => setMapOpen(true)}
              >
                {filtersPanel}
              </MarketplaceFilterSidebar>
            </aside>

            <section>
              <MarketplaceResultsBar
                foundLabel={text.common.found}
                countLabel={interpolate(text.works.matchedTasks, { count: visibleJobs.length })}
                sortLabel={text.common.newestFirst}
              />

              <div className="space-y-5 sm:space-y-6">
                {visibleJobs.map(({ icon: Icon, task, ...job }) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    task={task}
                    Icon={Icon}
                    text={text}
                    auth={auth}
                    onAuthOpen={() => setAuthOpen(true)}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className={`mx-auto ${marketplace.maxWidth} px-4 pb-6 sm:px-6 lg:px-8`}>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button key={tag} type="button" className={marketplace.chip}>
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className={`mx-auto ${marketplace.maxWidth} px-4 py-12 sm:px-6 lg:px-8`}>
          <h2 className="text-3xl font-bold tracking-tight text-[#232323]">{text.works.faqTitle}</h2>
          <p className="mt-3 text-[#777D88]">{text.works.faqText}</p>
        </section>
      </main>
      <ProffiFooter />

      <MarketplaceMobileFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={text.common.filters}
        resetLabel={text.common.reset}
        onReset={resetFilters}
        applyLabel={text.common.apply}
        onApply={() => applyFilters(filters)}
      >
        {filtersPanel}
      </MarketplaceMobileFiltersDrawer>

      <TreaboTasksMapModal open={mapOpen} onClose={() => setMapOpen(false)} tasks={tasks} />
      <TreaboAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab="login"
        login={auth.login}
        register={auth.register}
        sendOtp={auth.sendOtp}
        verifyOtp={auth.verifyOtp}
        onSuccess={auth.refresh}
      />
    </div>
  );
}
