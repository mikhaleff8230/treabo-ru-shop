import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import { ProffiHeader } from '@/components/proffi-mock/ProffiShell';
import { TitleSeo } from '@/components/seo/title-seo';
import {
  contactTreaboSpecialist,
  fetchTreaboCategories,
  fetchTreaboSpecialist,
  fetchTreaboSpecialistReviews,
  normalizeTreaboAssetUrl,
  type TreaboCategory,
  type TreaboSpecialist,
  type TreaboSpecialistReviewsResponse,
} from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { resolveServiceLabels } from '@/lib/treabo/categories';
import { parseSpecialistIdFromSlug, specialistSlugFromName } from '@/lib/treabo/slug';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Star,
  X,
} from 'lucide-react';

type SpecialistPageProps = {
  specialist: TreaboSpecialist | null;
  reviews: TreaboSpecialistReviewsResponse | null;
  categories: TreaboCategory[];
};

const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru').replace(/\/+$/, '');
const appDownloadPath = process.env.NEXT_PUBLIC_TREABO_APP_APK_URL || '/downloads/treabo-proffi.apk';

function buildAppDownloadUrl() {
  if (/^https?:\/\//i.test(appDownloadPath)) return appDownloadPath;
  const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : siteUrl;
  return appDownloadPath.startsWith('/') ? `${origin}${appDownloadPath}` : `${origin}/${appDownloadPath}`;
}

function DownloadAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const downloadUrl = buildAppDownloadUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(downloadUrl)}`;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[448px] rounded-[28px] bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-[#232323] hover:bg-[#f3f5fa]" aria-label="Закрыть">
          <X className="h-6 w-6" />
        </button>
        <h2 className="pr-9 text-3xl font-[700] leading-tight text-[#232323]">Скачать приложение</h2>
        <div className="mx-auto mt-6 flex h-[288px] w-[288px] items-center justify-center rounded-[28px] bg-white p-3 shadow-inner ring-1 ring-[#eef1f7]">
          <img src={qrUrl} alt="QR-код" className="h-full w-full object-contain" />
        </div>
        <a href={downloadUrl} className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-base font-[700] text-[#232323]" download>
          Скачать APK
        </a>
      </div>
    </div>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-[#d9dde6]'}`}
        />
      ))}
    </div>
  );
}

const SpecialistPage: NextPageWithLayout<SpecialistPageProps> = ({ specialist, reviews, categories }) => {
  const router = useRouter();
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  if (!specialist) return null;

  const avatar = normalizeTreaboAssetUrl(specialist.avatar);
  const serviceLabels = resolveServiceLabels(specialist.services || [], categories);
  const portfolio = (specialist.portfolio || []).map(normalizeTreaboAssetUrl).filter(Boolean);
  const rating = reviews?.rating ?? specialist.rating ?? 0;
  const reviewsCount = reviews?.reviews_count ?? specialist.reviews_count ?? 0;
  const reviewItems = reviews?.data ?? [];
  const canonical = `${siteUrl}${routes.specialistUrl(specialist)}`;

  async function handleContact() {
    const token = getStoredTreaboToken();
    if (!token) {
      setAuthOpen(true);
      return;
    }

    setContactLoading(true);
    try {
      const result = await contactTreaboSpecialist(specialist!.id, token);
      router.push(result.chat_id ? `/treabo/chats?id=${result.chat_id}` : '/treabo/chats');
    } catch {
      router.push('/request/new');
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <>
      <TitleSeo
        title={`${specialist.name} — специалист Treabo${specialist.city ? `, ${specialist.city}` : ''}`}
        description={specialist.bio || `Профиль специалиста ${specialist.name} на Treabo.`}
        canonical={canonical}
        ogImage={avatar || undefined}
        ogType="profile"
      />
      <div className="min-h-screen bg-[#f5f6f1] text-[#232323]">
        <ProffiHeader />

        <main className="mx-auto max-w-[1160px] px-4 py-5 pb-28 sm:py-8">
          <div className="mb-4">
            <Link href="/specialists" className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold shadow-sm hover:border-zinc-950">
              <ArrowLeft className="h-4 w-4" />
              Все специалисты
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start">
            <div className="min-w-0 space-y-4">
              <section className="rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[#eef1f7]">
                    {avatar ? (
                      <img src={avatar} alt={specialist.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-[400] text-[#7d849b]">{specialist.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-[400] sm:text-4xl">{specialist.name}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f5fa] px-3 py-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {Number(rating).toFixed(1).replace('.', ',')}
                      </span>
                      <span className="text-[#7d849b]">{reviewsCount} отзывов</span>
                      {specialist.city ? <span className="text-[#7d849b]">{specialist.city}</span> : null}
                    </div>
                    {serviceLabels.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {serviceLabels.map((label) => (
                          <span key={label} className="rounded-full border border-[#e6e9ef] bg-white px-3 py-1 text-xs">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleContact}
                      disabled={contactLoading}
                      className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-[400] text-white disabled:opacity-60 lg:hidden"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {contactLoading ? 'Открываем чат...' : 'Написать специалисту'}
                    </button>
                  </div>
                </div>
              </section>

              {specialist.bio ? (
                <section className="rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-[400]">О себе</h2>
                  <p className="mt-3 whitespace-pre-line text-base leading-7">{specialist.bio}</p>
                </section>
              ) : null}

              {portfolio.length ? (
                <section className="rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-[400]">Портфолио</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {portfolio.map((photo, index) => (
                      <img key={`${photo}-${index}`} src={photo} alt={`${specialist.name} ${index + 1}`} className="aspect-square w-full rounded-[20px] object-cover" />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[30px] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-[400]">Отзывы</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-3xl font-[400]">{Number(rating).toFixed(1).replace('.', ',')}</span>
                      <ReviewStars rating={Math.round(rating)} />
                    </div>
                  </div>
                  <span className="text-sm text-[#7d849b]">{reviewsCount} отзывов</span>
                </div>
                <div className="mt-5 space-y-4">
                  {reviewItems.length ? reviewItems.map((review) => (
                    <article key={review.id} className="rounded-[20px] bg-[#f8f9fb] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-[400]">{review.customer_name || 'Заказчик Treabo'}</span>
                        <span className="text-xs text-[#7d849b]">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : ''}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ReviewStars rating={review.rating} />
                      </div>
                      {review.comment ? <p className="mt-3 text-sm leading-6 text-[#232323]">{review.comment}</p> : null}
                    </article>
                  )) : (
                    <p className="text-sm text-[#7d849b]">Отзывов пока нет.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
                <div className="aspect-[4/5] overflow-hidden bg-black">
                  <img src="/proffi/treabo-client-app-banner.png" alt="Приложение Treabo-client" className="h-full w-full object-cover object-center" />
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-[400]">Скачайте приложение</h2>
                  <p className="mt-2 text-sm leading-6 text-[#7d849b]">Создавайте заявки с AI, общайтесь с мастерами и получайте отклики.</p>
                  <button type="button" onClick={() => setDownloadOpen(true)} className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#d9f36b] px-4 text-sm font-[400] text-[#232323]">
                    Скачать приложение
                  </button>
                </div>
              </section>

              <button
                type="button"
                onClick={handleContact}
                disabled={contactLoading}
                className="hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-[28px] bg-[#232323] px-5 text-sm font-[400] text-white disabled:opacity-60 lg:flex"
              >
                <MessageCircle className="h-5 w-5" />
                {contactLoading ? 'Открываем чат...' : 'Написать специалисту'}
              </button>
            </aside>
          </div>
        </main>

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
        <DownloadAppModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      </div>
    </>
  );
};

SpecialistPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<SpecialistPageProps> = async ({ locale, params }) => {
  const raw = String(params?.id || '');
  const specialistId = parseSpecialistIdFromSlug(raw);
  const [specialist, reviews, categories] = await Promise.all([
    fetchTreaboSpecialist(specialistId),
    fetchTreaboSpecialistReviews(specialistId),
    fetchTreaboCategories(),
  ]);

  if (!specialist) {
    return { notFound: true };
  }

  if (specialistSlugFromName(specialist.name, specialist.id) !== raw && /^\d+$/.test(raw) === false) {
    return {
      redirect: {
        destination: routes.specialistUrl(specialist),
        permanent: true,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      specialist,
      reviews,
      categories,
    },
  };
};

export default SpecialistPage;
