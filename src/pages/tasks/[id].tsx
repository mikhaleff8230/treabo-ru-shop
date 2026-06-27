import {
  createTreaboTaskApplication,
  fetchTreaboTask,
  fetchTreaboTaskApplicationPreview,
  type TreaboApplicationPreview,
  type TreaboTask,
} from '@/data/treabo';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboApplyConfirmModal from '@/components/treabo/TreaboApplyConfirmModal';
import TreaboTaskMap from '@/components/treabo/TreaboTaskMap';
import { ProffiHeader } from '@/components/proffi-mock/ProffiShell';
import { TitleSeo } from '@/components/seo/title-seo';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';
import { parseTaskIdFromSlug, taskSlugFromTitle } from '@/lib/treabo/slug';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Ruler,
  Wallet,
} from 'lucide-react';

type TaskDetailProps = {
  task: TreaboTask | null;
};

const money = new Intl.NumberFormat('ru-RU');
const DEFAULT_RESPONSE_PRICE_RUB = 15;
const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');

function mockTask(locale?: string): TreaboTask {
  const ru = locale === 'ru';
  return {
    id: 'mock-1',
    title: ru ? 'Ремонт санузла' : 'Reparație baie',
    description: ru
      ? 'Нужно выполнить ремонт санузла. Требуется укладка плитки, подключение сантехники и аккуратная отделка. Материалы можно уточнить после осмотра.'
      : 'Este necesară reparația băii: montare gresie/faianță, conectare instalații sanitare și finisare atentă. Materialele pot fi clarificate după măsurare.',
    category: 'bathroom-renovation',
    city: ru ? 'Кишинёв' : 'Chișinău',
    address: ru ? 'Кишинёв, Ботаника, str. Teilor 12' : 'Chișinău, Botanica, str. Teilor 12',
    budget: 150000,
    deadline: ru ? 'На этой неделе' : 'Săptămâna aceasta',
    status: 'open',
    photos: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function stripHtml(value?: string | null) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, limit = 160) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trim()}…`;
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${siteUrl}${value}`;
  return `${siteUrl}/${value}`;
}

function photoUrl(value: string | { path?: string | null; url?: string | null } | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || value.path || '';
}

function buildTaskCanonicalUrl(task: TreaboTask) {
  const slug = taskSlugFromTitle(task.title, task.id);
  return `${siteUrl}${routes.taskUrl(slug)}`;
}

function buildTaskSeo(task: TreaboTask, photos: string[], locale?: string) {
  const text = getTreaboText(locale);
  const canonical = buildTaskCanonicalUrl(task);
  const location = [task.city, task.address].filter(Boolean).join(', ');
  const budget = Number(task.budget || 0);
  const cleanDescription = stripHtml(task.description);
  const fallbackDescription = [
    `${text.task.treaboTask}: ${task.title}.`,
    location ? `${text.task.address}: ${location}.` : '',
    budget > 0 ? `${text.task.facts.budget}: ${money.format(budget)} ₽.` : text.task.facts.negotiable,
  ].filter(Boolean).join(' ');

  return {
    title: `${task.title} - Treabo${task.city ? `, ${task.city}` : ''}`,
    description: truncate(cleanDescription || fallbackDescription),
    canonical,
    ogImage: absoluteUrl(photos.find(Boolean)),
  };
}

function buildTaskJsonLd(task: TreaboTask, seo: ReturnType<typeof buildTaskSeo>, locale?: string) {
  const text = getTreaboText(locale);
  const budget = Number(task.budget || 0);
  const description = stripHtml(task.description) || seo.description;
  const location = [task.city, task.address].filter(Boolean).join(', ');
  const image = seo.ogImage ? [seo.ogImage] : undefined;

  const jobPosting: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: task.title,
    description,
    url: seo.canonical,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Treabo task id',
      value: String(task.id),
    },
    datePosted: task.created_at || task.updated_at || new Date().toISOString(),
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Treabo',
      sameAs: siteUrl,
    },
    jobLocation: {
      '@type': 'Place',
      name: location || task.city || text.common.addressUnknown,
      address: {
        '@type': 'PostalAddress',
        addressLocality: task.city || undefined,
        streetAddress: task.address || undefined,
      },
    },
    image,
  };

  if (budget > 0) {
    jobPosting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'RUB',
      value: {
        '@type': 'QuantitativeValue',
        value: budget,
        unitText: 'TASK',
      },
    };
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: text.common.home, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: text.common.allTasks, item: `${siteUrl}${routes.works}` },
      { '@type': 'ListItem', position: 3, name: task.title, item: seo.canonical },
    ],
  };

  return [jobPosting, breadcrumbs];
}

function formatDate(value?: string | null, locale?: string) {
  if (!value) return getTreaboText(locale).common.noDate;
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PhotoGallery({ photos, title, noPhoto }: { photos: string[]; title: string; noPhoto: string }) {
  const visiblePhotos = photos.filter(Boolean).slice(0, 12);
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = visiblePhotos[activeIndex] || visiblePhotos[0];

  if (!visiblePhotos.length) {
    return (
      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
        <div className="flex aspect-[4/3] items-center justify-center rounded-[28px] bg-[#edf1f7] text-[#232323]">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <div className="mt-3 text-sm font-bold">{noPhoto}</div>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] bg-[#f3f5fa]" />
          <div className="rounded-[22px] bg-[#f3f5fa]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_140px]">
      <div className="relative overflow-hidden rounded-[28px] bg-[#edf1f7]">
        <img src={activePhoto} alt={title} className="aspect-[4/3] h-full w-full object-cover" />
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-black text-[#232323]">
          {activeIndex + 1}/{visiblePhotos.length}
        </div>
      </div>
      <div className="flex max-h-[min(68vh,620px)] gap-3 overflow-x-auto pb-1 md:block md:space-y-3 md:overflow-x-hidden md:overflow-y-auto md:pb-0 md:pr-1">
        {visiblePhotos.map((photo, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-24 w-24 flex-none overflow-hidden rounded-[22px] bg-[#edf1f7] transition md:h-32 md:w-full ${
                isActive ? 'ring-4 ring-[#d9fb4f] ring-offset-2' : 'opacity-75 hover:opacity-100'
              }`}
              aria-label={`Показать фото ${index + 1}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <img src={photo} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" />
              {isActive ? <span className="absolute inset-0 rounded-[22px] border-2 border-[#232323]/20" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)), template);
}

const TaskDetailPage: NextPageWithLayout<TaskDetailProps> = ({ task }) => {
  const auth = useTreaboAuth();
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const [authOpen, setAuthOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyPreview, setApplyPreview] = useState<TreaboApplicationPreview | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const data = task || mockTask(router.locale);
  const budget = Number(data.budget || 0);
  const responsePrice = Number(data.response_price_mdl || DEFAULT_RESPONSE_PRICE_RUB);
  const photos = (data.photos || []).map(photoUrl).filter(Boolean);
  const seo = buildTaskSeo(data, photos, router.locale);
  const jsonLd = buildTaskJsonLd(data, seo, router.locale);

  async function openApplyModal() {
    if (!auth.isSpecialist) {
      setAuthOpen(true);
      return;
    }
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setAuthOpen(true);
      return;
    }
    setApplyLoading(true);
    setApplyError(null);
    try {
      const preview = await fetchTreaboTaskApplicationPreview(String(data.id), token);
      setApplyPreview(preview);
      setApplyOpen(true);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : 'Application preview error');
      setApplyOpen(true);
    } finally {
      setApplyLoading(false);
    }
  }

  async function handleConfirmApply() {
    if (!auth.isSpecialist) {
      setApplyOpen(false);
      setAuthOpen(true);
      return;
    }
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setApplyOpen(false);
      setAuthOpen(true);
      return;
    }
    setApplyLoading(true);
    setApplyError(null);
    try {
      const application = await createTreaboTaskApplication(String(data.id), token, {
        message: interpolate(text.task.hello, { title: data.title }),
      });
      setApplyOpen(false);
      router.push(application.chat_id ? `/treabo/chats?id=${application.chat_id}` : '/treabo/chats');
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : 'Chat creation error');
    } finally {
      setApplyLoading(false);
    }
  }

  const facts = useMemo(() => [
    { icon: Wallet, label: text.task.facts.budget, value: budget > 0 ? `${money.format(budget)} ₽` : text.task.facts.negotiable },
    { icon: CalendarClock, label: text.task.facts.term, value: data.deadline || text.task.facts.byAgreement },
    { icon: CheckCircle2, label: text.task.facts.status, value: data.status === 'open' ? text.task.facts.open : data.status || text.task.facts.new },
    { icon: Ruler, label: text.task.facts.params, value: text.task.facts.details },
  ], [budget, data.deadline, data.status, text]);

  return (
    <>
      <TitleSeo title={seo.title} description={seo.description} canonical={seo.canonical} ogImage={seo.ogImage} ogType="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#f5f6f1] text-[#232323]">
        <ProffiHeader />

        <main className="mx-auto max-w-5xl px-4 py-5 pb-28 sm:py-8">
          <div className="mb-4 flex items-center justify-between">
            <Link href={routes.works} className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-[#232323] shadow-sm hover:border-zinc-950">
              <ArrowLeft className="h-4 w-4" />
              {text.common.allTasks}
            </Link>
          </div>

          <section className="rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-[#7d849b]">
              <span>{text.task.privateCustomer}</span>
              <span className="rounded-full bg-[#d9f36b] px-3 py-1 text-[#232323]">{text.task.treaboTask}</span>
            </div>
            <h1 className="text-2xl font-black leading-tight sm:text-4xl">{data.title}</h1>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-2">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {[data.city, data.address].filter(Boolean).join(', ') || text.common.addressUnknown}</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {text.common.updated} {formatDate(data.updated_at || data.created_at, router.locale)}</span>
            </div>
          </section>

          <section className="mt-4 rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
            <PhotoGallery photos={photos} title={data.title} noPhoto={text.task.noPhoto} />
          </section>

          <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black">{text.task.description}</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-[#232323]">{data.description || text.task.noDescription}</p>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-[#7d849b]"><Icon className="h-4 w-4" />{label}</div>
                <div className="mt-2 text-xl font-black">{value}</div>
              </div>
            ))}
          </section>

          <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-black"><MapPin className="h-5 w-5" />{text.task.address}</h2>
            <p className="mt-3 text-base leading-7">{data.address || text.task.addressHint}</p>
            {data.city ? <div className="mt-2 inline-flex rounded-full bg-[#f3f5fa] px-3 py-1.5 text-sm font-bold">{data.city}</div> : null}
            <TreaboTaskMap task={data} />
          </section>

          <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black">{interpolate(text.task.order, { id: data.id })}</h2>
            <div className="mt-3 space-y-2 text-sm text-[#7d849b]">
              <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {interpolate(text.task.created, { date: formatDate(data.created_at, router.locale) })}</div>
              <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {text.task.updatedRecently}</div>
            </div>
          </section>
        </main>

        {auth.isSpecialist ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-2xl justify-center">
              <button type="button" onClick={openApplyModal} disabled={applyLoading} className="flex min-h-[52px] w-full max-w-xl items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-black text-white">
                <MessageCircle className="h-5 w-5" />
                {text.task.writeClient}
              </button>
            </div>
          </div>
        ) : !auth.isAuthenticated ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-5xl gap-3">
              <button type="button" onClick={() => setAuthOpen(true)} className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323]">
                {text.task.loginToApply}
              </button>
            </div>
          </div>
        ) : null}

        <TreaboAuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab="login" login={auth.login} register={auth.register} sendOtp={auth.sendOtp} verifyOtp={auth.verifyOtp} onSuccess={auth.refresh} />
        <TreaboApplyConfirmModal
          open={applyOpen}
          price={responsePrice}
          preview={applyPreview}
          loading={applyLoading}
          error={applyError}
          onClose={() => {
            setApplyOpen(false);
            setApplyPreview(null);
            setApplyError(null);
          }}
          onConfirm={handleConfirmApply}
        />
      </div>
    </>
  );
};

TaskDetailPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<TaskDetailProps> = async ({ locale, params }) => {
  const raw = String(params?.id || '');
  const taskId = parseTaskIdFromSlug(raw);
  const task = taskId.startsWith('mock-') ? null : await fetchTreaboTask(taskId);

  if (task && taskSlugFromTitle(task.title, task.id) !== raw && /^\d+$/.test(raw) === false) {
    return {
      redirect: {
        destination: routes.taskUrl(task),
        permanent: true,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      task,
    },
  };
};

export default TaskDetailPage;
