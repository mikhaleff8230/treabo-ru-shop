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
import TreaboTaskSpecialistSearch from '@/components/treabo/TreaboTaskSpecialistSearch';
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Ruler,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';

type TaskDetailProps = {
  task: TreaboTask | null;
};

const money = new Intl.NumberFormat('ru-RU');
const DEFAULT_RESPONSE_PRICE_RUB = 15;
const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru').replace(/\/+$/, '');
const appDownloadPath = process.env.NEXT_PUBLIC_TREABO_APP_APK_URL || '/downloads/treabo-proffi.apk';

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

function buildAppDownloadUrl() {
  if (/^https?:\/\//i.test(appDownloadPath)) return appDownloadPath;
  const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : siteUrl;
  return appDownloadPath.startsWith('/') ? `${origin}${appDownloadPath}` : `${origin}/${appDownloadPath}`;
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
    task.title,
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showPrev = () => setLightboxIndex((current) => (current === null ? current : (current - 1 + visiblePhotos.length) % visiblePhotos.length));
  const showNext = () => setLightboxIndex((current) => (current === null ? current : (current + 1) % visiblePhotos.length));

  if (!visiblePhotos.length) {
    return (
      <div className="flex min-h-[104px] items-center gap-4 overflow-hidden rounded-[24px] border border-dashed border-[#d9dde6] bg-[#f3f5fa] px-5 text-[#7d849b]">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
          <ImageIcon className="h-7 w-7 text-zinc-400" />
        </div>
        <div>
          <div className="text-sm font-[400] text-[#232323]">{noPhoto}</div>
          <div className="mt-1 text-xs">Когда заказчик добавит фото, они появятся здесь лентой.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {visiblePhotos.map((photo, index) => (
          <button
            key={`${photo}-${index}`}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="group relative h-28 w-36 flex-none overflow-hidden rounded-[20px] bg-[#edf1f7] transition hover:-translate-y-0.5 sm:h-32 sm:w-44"
            aria-label={`Открыть фото ${index + 1}`}
          >
            <img src={photo} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-[400] text-[#232323]">
              {index + 1}/{visiblePhotos.length}
            </span>
          </button>
        ))}
      </div>

      {lightboxIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
          {visiblePhotos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          ) : null}
          <div className="max-h-[86vh] max-w-[92vw]">
            <img src={visiblePhotos[lightboxIndex]} alt={`${title} ${lightboxIndex + 1}`} className="max-h-[86vh] max-w-full rounded-[24px] object-contain" />
            <div className="mt-3 text-center text-sm font-[400] text-white/80">
              {lightboxIndex + 1} / {visiblePhotos.length}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)), template);
}

function DownloadAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const downloadUrl = buildAppDownloadUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(downloadUrl)}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[448px] rounded-[28px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-[#232323] transition hover:bg-[#f3f5fa]"
          aria-label="Закрыть"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="pr-9 text-3xl font-[700] leading-tight text-[#232323]">Скачать приложение</h2>
        <p className="mt-3 text-base leading-6 text-[#7d849b]">
          Отсканируйте QR-код камерой телефона или скачайте APK по ссылке.
        </p>
        <div className="mx-auto mt-6 flex h-[288px] w-[288px] items-center justify-center rounded-[28px] bg-white p-3 shadow-inner ring-1 ring-[#eef1f7]">
          <img src={qrUrl} alt="QR-код для скачивания приложения Treabo" className="h-full w-full object-contain" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-[700] text-[#232323]">
          <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3 text-center">Android APK</span>
          <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3 text-center">Treabo</span>
        </div>
        <a
          href={downloadUrl}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-base font-[700] text-[#232323] transition hover:bg-[#c7e85a]"
          download
        >
          Скачать APK
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#f3f5fa] px-5 text-sm font-[700] text-[#232323]"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
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
  const [downloadOpen, setDownloadOpen] = useState(false);
  const data = task as TreaboTask;
  const budget = Number(data.budget || 0);
  const responsePrice = Number(data.response_price_mdl || DEFAULT_RESPONSE_PRICE_RUB);
  const photos = (data.photos || []).map(photoUrl).filter(Boolean);
  const seo = buildTaskSeo(data, photos, router.locale);
  const jsonLd = buildTaskJsonLd(data, seo, router.locale);
  const isOwnTask = Boolean(auth.user?.id && data.customer_id && String(auth.user.id) === String(data.customer_id));
  const canSeeResponsePrice = auth.isAuthenticated && auth.isSpecialist;

  async function openApplyModal() {
    if (isOwnTask) {
      setApplyError('Это ваша заявка — на неё нельзя откликнуться как специалист.');
      setApplyOpen(true);
      return;
    }
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

        <main className="mx-auto max-w-[1160px] px-4 py-5 pb-28 sm:py-8">
          <div className="mb-4 flex items-center justify-between">
            <Link href={routes.works} className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-[#232323] shadow-sm hover:border-zinc-950">
              <ArrowLeft className="h-4 w-4" />
              {text.common.allTasks}
            </Link>
          </div>

          <section className="rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
            <p className="mb-3 text-sm font-normal text-[#7d849b]">
              {data.customer_name ? `Заказчик ${data.customer_name}` : text.task.privateCustomer}
            </p>
            <h1 className="text-2xl font-[400] leading-tight sm:text-4xl">{data.title}</h1>
            {(data.category_name || data.work_title || data.work?.title) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.category_name ? (
                  <span className="rounded-full bg-[#f3f5fa] px-3 py-1.5 text-xs font-bold text-[#525862]">
                    {data.category_name}
                  </span>
                ) : null}
                {data.work_title || data.work?.title ? (
                  <span className="rounded-full bg-[#d9f36b] px-3 py-1.5 text-xs font-bold text-[#232323]">
                    {data.work_title || data.work?.title}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 text-sm font-[400] text-[#232323] sm:grid-cols-2">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {[data.city, data.address].filter(Boolean).join(', ') || text.common.addressUnknown}</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {text.common.updated} {formatDate(data.updated_at || data.created_at, router.locale)}</span>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start">
            <div className="min-w-0">
              <section className="rounded-[30px] bg-white p-4 shadow-sm sm:p-6">
                <PhotoGallery photos={photos} title={data.title} noPhoto={text.task.noPhoto} />
              </section>

              <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-[400]">{text.task.description}</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-7 text-[#232323]">{data.description || text.task.noDescription}</p>
              </section>

              <section className="mt-4 grid gap-3 sm:grid-cols-2">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-[24px] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-[400] text-[#7d849b]"><Icon className="h-4 w-4" />{label}</div>
                    <div className="mt-2 text-xl font-[400]">{value}</div>
                  </div>
                ))}
              </section>

              <TreaboTaskSpecialistSearch taskId={String(data.id)} isCustomer={isOwnTask} />

              <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-[400]"><MapPin className="h-5 w-5" />{text.task.address}</h2>
                <p className="mt-3 text-base leading-7">{data.address || text.task.addressHint}</p>
                {data.city ? <div className="mt-2 inline-flex rounded-full bg-[#f3f5fa] px-3 py-1.5 text-sm font-[400]">{data.city}</div> : null}
                <TreaboTaskMap task={data} />
              </section>

              <section className="mt-4 rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-[400]">{interpolate(text.task.order, { id: data.id })}</h2>
                <div className="mt-3 space-y-2 text-sm text-[#7d849b]">
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {interpolate(text.task.created, { date: formatDate(data.created_at, router.locale) })}</div>
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {text.task.updatedRecently}</div>
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
                <div className="flex h-40 items-center justify-center bg-[#fff0a6]">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-[#232323] text-[#d9f36b] shadow-xl">
                    <Smartphone className="h-14 w-14" />
                    <span className="absolute -right-3 top-5 rounded-full bg-[#d9f36b] px-2 py-1 text-xs font-[400] text-[#232323]">Treabo</span>
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-[400]">Скачайте приложение</h2>
                  <p className="mt-2 text-sm leading-6 text-[#7d849b]">Получайте новые задания, ответы и уведомления быстрее.</p>
                  <button type="button" onClick={() => setDownloadOpen(true)} className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#d9f36b] px-4 text-sm font-[400] text-[#232323]">
                    Установить приложение
                  </button>
                </div>
              </section>

              <section className="rounded-[28px] bg-white p-5 shadow-sm">
                <div className="text-[34px] font-[400] leading-none text-[#232323]">
                  {budget > 0 ? `${money.format(budget)} ₽` : text.task.facts.negotiable}
                </div>
                <div className="mt-2 text-sm font-[400] text-[#7d849b]">{text.task.facts.budget}</div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7d849b]">{text.task.facts.term}</span>
                    <span className="text-right font-[400]">{data.deadline || text.task.facts.byAgreement}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7d849b]">{text.task.facts.status}</span>
                    <span className="text-right font-[400]">{data.status === 'open' ? text.task.facts.open : data.status || text.task.facts.new}</span>
                  </div>
                  {canSeeResponsePrice ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7d849b]">Отклик</span>
                      <span className="text-right font-[400]">{responsePrice > 0 ? `${money.format(responsePrice)} ₽` : 'бесплатно'}</span>
                    </div>
                  ) : null}
                </div>
                {!isOwnTask ? (
                  <button
                    type="button"
                    onClick={openApplyModal}
                    disabled={applyLoading}
                    className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-[400] text-white disabled:opacity-60"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {auth.isSpecialist ? text.task.writeClient : text.task.loginToApply}
                  </button>
                ) : (
                  <div className="mt-5 rounded-2xl bg-[#f3f5fa] px-4 py-3 text-center text-sm font-[400] text-[#232323]">
                    Это ваша заявка
                  </div>
                )}
              </section>
            </aside>
          </div>
        </main>

        {auth.isSpecialist ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-2xl justify-center">
              {isOwnTask ? (
                <div className="flex min-h-[52px] w-full max-w-xl items-center justify-center rounded-2xl bg-[#f3f5fa] px-5 text-center text-sm font-black text-[#232323]">
                  Это ваша заявка — специалисты смогут откликнуться на неё из своих аккаунтов.
                </div>
              ) : (
                <button type="button" onClick={openApplyModal} disabled={applyLoading} className="flex min-h-[52px] w-full max-w-xl items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-black text-white">
                  <MessageCircle className="h-5 w-5" />
                  {text.task.writeClient}
                </button>
              )}
            </div>
          </div>
        ) : !auth.isAuthenticated ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-[1160px] gap-3">
              <button type="button" onClick={() => setAuthOpen(true)} className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323]">
                {text.task.loginToApply}
              </button>
            </div>
          </div>
        ) : null}

        <TreaboAuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab="login" login={auth.login} register={auth.register} sendOtp={auth.sendOtp} verifyOtp={auth.verifyOtp} onSuccess={auth.refresh} />
        <DownloadAppModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
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

  if (!task) {
    return { notFound: true };
  }

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
