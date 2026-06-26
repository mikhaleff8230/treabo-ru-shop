import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  CalendarClock,
  ChevronDown,
  Filter,
  Map,
  MapPin,
  Paintbrush,
  Wrench,
} from 'lucide-react';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboTasksMapModal from '@/components/treabo/TreaboTasksMapModal';
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
    brand: categoryLabel || text.works.privateCustomer,
    location: [task.city || text.city, task.address].filter(Boolean).join(', '),
    time: task.deadline || text.works.agreementTerm,
    pay: budget > 0 ? `${money.format(budget)} ₽` : text.works.negotiablePrice,
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

  return (
    <article className={marketplace.card}>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_386px]">
        <div className="p-6 sm:p-8 xl:px-9 xl:py-10">
          <div className="flex gap-5 sm:gap-7">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#D9F36B] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] sm:h-[78px] sm:w-[78px] sm:rounded-[27px]">
              <Icon className="h-8 w-8 stroke-[2.2] text-[#1F2430] sm:h-10 sm:w-10" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-[300] uppercase leading-none tracking-[0.055em] text-[#7D828D] sm:text-[15px]">
                {job.brand}
              </div>
              <h3 className="mt-4 break-words text-[28px] font-[300] leading-[1.12] tracking-[-0.035em] text-[#1F2430] sm:text-[34px] xl:text-[38px]">
                {job.title}
              </h3>
              <div className="mt-7 flex flex-col gap-3 text-[15px] font-[300] leading-none text-[#777D88] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-9 sm:gap-y-3 sm:text-[17px]">
                <span className="inline-flex items-center gap-3">
                  <MapPin className="h-[21px] w-[21px] shrink-0 stroke-[1.8] text-[#525862]" />
                  <span className="break-words">{job.location}</span>
                </span>
                <span className="inline-flex items-center gap-3">
                  <CalendarClock className="h-[21px] w-[21px] shrink-0 stroke-[1.8] text-[#525862]" />
                  {job.time}
                </span>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {job.tags.map((tag) => (
                  <span key={tag} className={marketplace.chip}>
                    {tag}
                  </span>
                ))}
              </div>
              {job.photos.length ? (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {job.photos.map((photo, index) => (
                    <img
                      key={`${job.id}-photo-${index}`}
                      src={photo}
                      alt={`${job.title} ${index + 1}`}
                      className="h-16 w-24 shrink-0 rounded-xl object-cover sm:h-20 sm:w-28"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col border-[#E7E9EC] p-6 sm:p-8 xl:my-10 xl:border-l xl:py-0 xl:pl-10 xl:pr-9">
          <div className="text-[15px] font-[300] leading-none text-[#777D88] sm:text-[17px]">{job.duration}</div>
          <div className="mt-6 text-[44px] font-[300] leading-none tracking-[-0.045em] text-[#A9CD24] sm:text-[54px]">
            {job.pay}
          </div>
          <div className="mt-8 flex gap-4">
            {auth.isSpecialist ? (
              <button
                type="button"
                className="inline-flex min-h-[62px] flex-1 items-center justify-between rounded-[16px] bg-[#D9F36B] px-8 text-[18px] font-[300] text-[#20242D] transition hover:bg-[#c7e85a] sm:min-h-[70px]"
              >
                {text.works.apply}
                <ArrowRight className="h-5 w-5 stroke-[1.8]" />
              </button>
            ) : auth.isAuthenticated ? null : (
              <button
                type="button"
                onClick={onAuthOpen}
                className="inline-flex min-h-[62px] flex-1 items-center justify-between rounded-[16px] bg-[#D9F36B] px-8 text-[18px] font-[300] text-[#20242D] transition hover:bg-[#c7e85a] sm:min-h-[70px]"
              >
                {text.works.apply}
                <ArrowRight className="h-5 w-5 stroke-[1.8]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-pressed={saved}
              className={`flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[16px] border bg-white transition sm:h-[70px] sm:w-[70px] ${
                saved ? 'border-[#D9F36B] text-[#232323]' : 'border-[#E7E9EC] text-[#777D88]'
              }`}
            >
              <Bookmark className={`h-6 w-6 stroke-[1.8] ${saved ? 'fill-[#232323]' : ''}`} />
            </button>
          </div>
          <Link
            href={routes.taskUrl(task || { id: job.id, title: job.title })}
            className="mt-8 inline-flex min-h-[54px] w-full items-center justify-center rounded-[12px] bg-[#F3F4F6] px-6 text-[16px] font-[300] text-[#3E424B] transition hover:bg-[#ECEEF2]"
          >
            <span className="flex-1 text-center">{text.common.more}</span>
            <ChevronDown className="h-5 w-5 stroke-[1.8] text-[#3E424B]" />
          </Link>
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
        <input
          className="w-full rounded-xl border border-[#E7E9EC] px-4 py-3 text-sm text-[#232323] outline-none focus:border-[#D9F36B]"
          value={filters.city || ''}
          onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
          placeholder={text.city}
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

          <div className="sticky top-16 z-30 -mx-4 mb-5 border-y border-[#E7E9EC] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
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
        onSuccess={auth.refresh}
      />
    </div>
  );
}
