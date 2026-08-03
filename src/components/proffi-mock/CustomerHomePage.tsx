import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import routes from '@/config/routes';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  ArrowRight,
  Bath,
  CheckCircle2,
  ChevronRight,
  Download,
  Drill,
  Fan,
  MapPin,
  Search,
  Send,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import { normalizeTreaboAssetUrl, type TreaboCategory, type TreaboHomeStats, type TreaboSpecialist } from '@/data/treabo';
import { useTreaboBrandLogo } from '@/hooks/use-treabo-brand-logo';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';
import { FloatingMobileCTA, ProffiFooter, ProffiHeader } from './ProffiShell';

type CustomerHomePageProps = {
  categories?: TreaboCategory[];
  topSpecialists?: TreaboSpecialist[];
  homeStats?: TreaboHomeStats | null;
};

const categoryIcons: Record<string, any> = {
  Bath,
  Drill,
  Fan,
  Wrench,
  Zap,
  Grid2X2: Drill,
};

const clientAppDownloadPath =
  process.env.NEXT_PUBLIC_TREABO_CLIENT_APP_APK_URL ||
  '/downloads/treabo-client.apk';
const publicSiteUrl = (
  process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru'
).replace(/\/+$/, '');
const clientAppDownloadUrl = /^https?:\/\//i.test(clientAppDownloadPath)
  ? clientAppDownloadPath
  : `${publicSiteUrl}${clientAppDownloadPath.startsWith('/') ? '' : '/'}${clientAppDownloadPath}`;
const clientAppQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(
  clientAppDownloadUrl
)}`;

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function buildCategories(
  categories: TreaboCategory[],
  locale: string | undefined,
  fallbackCategories: Array<{ title: string; count: string }>
) {
  if (!categories.length) {
    return fallbackCategories.map((category, index) => ({
      ...category,
      icon: [Drill, Star, Wrench, Bath, Fan, Zap, Drill, Wrench][index] || Wrench,
    }));
  }

  return categories.slice(0, 8).map((category) => ({
    title: category.name_ru,
    count: 'Treabo',
    icon: categoryIcons[category.icon || ''] || Wrench,
  }));
}

export default function CustomerHomePage({ categories = [], topSpecialists = [], homeStats = null }: CustomerHomePageProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { src: brandLogoSrc, alt: brandLogoAlt } = useTreaboBrandLogo();
  const [prompt, setPrompt] = useState('');
  const fallbackCategories = asArray<{ title: string; count: string }>(t('treabo.home.categories', { returnObjects: true }), []);
  const fallbackSearches = asArray<string>(t('treabo.home.searches', { returnObjects: true }), []);
  const localizedStats = asArray<{ value: string; label: string }>(t('treabo.home.stats', { returnObjects: true }), []);
  const localizedSteps = asArray<{ title: string; text: string }>(t('treabo.home.howSteps', { returnObjects: true }), []);
  const localizedSpecialists = asArray<{ name: string; role: string; reviews: string; price: string; tags: string[] }>(t('treabo.home.specialists', { returnObjects: true }), []);
  const visibleCategories = buildCategories(categories, router.locale, fallbackCategories);
  const visibleSearches = categories.length
    ? categories.slice(0, 8).map((category) => category.name_ru)
    : fallbackSearches;
  const openTasksCount = homeStats?.open_tasks || 0;
  const isPromptOpen = prompt.trim().length > 0;
  const specialistAvatars = [team1, team2, team3];
  const realSpecialists = topSpecialists.slice(0, 3);
  const visibleSpecialists = realSpecialists.length
    ? realSpecialists.map((specialist, index) => ({
        name: specialist.name,
        role: specialist.services?.[0] || specialist.bio?.split(/[.!?]/)[0] || 'Специалист Treabo',
        rating: Number(specialist.rating || 0) > 0 ? Number(specialist.rating).toFixed(1) : 'Новый',
        reviews: `${Number(specialist.reviews_count || 0)} отзывов`,
        price: specialist.min_price ? `от ${Number(specialist.min_price).toLocaleString('ru-RU')} ₽` : 'Цена по задаче',
        avatar: specialist.avatar ? normalizeTreaboAssetUrl(specialist.avatar) : specialistAvatars[index] || team1,
        tags: specialist.services?.length ? specialist.services.slice(0, 3) : ['Профиль Treabo'],
      }))
    : localizedSpecialists.map((person, index) => ({
        ...person,
        rating: '4.9',
        avatar: specialistAvatars[index] || team1,
      }));

  function startRequest(event?: FormEvent) {
    event?.preventDefault();
    const query = prompt.trim() ? `?q=${encodeURIComponent(prompt.trim())}` : '';
    router.push(`/request/new${query}`);
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f6f7f2] text-[#232323]" style={{ width: '100vw' }}>
      <ProffiHeader />
      <main className="overflow-hidden">
        <section className="relative overflow-hidden bg-[#f6f7f2]">
          <div className="mx-auto grid max-w-[1160px] gap-10 px-4 pb-12 pt-8 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:pb-16 md:pt-14 lg:px-8">
            <div className="flex min-w-0 max-w-full flex-col justify-center" style={{ width: 'min(100%, calc(100vw - 2rem))' }}>
              <div className="mb-5 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-[#232323] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('treabo.home.badge')}
              </div>
              <h1 className="max-w-full break-words text-[34px] font-black leading-[1.04] text-[#232323] sm:max-w-3xl sm:text-6xl lg:text-7xl">
                {t('treabo.home.heroTitle')}
              </h1>
              <p className="mt-5 max-w-full text-base leading-7 text-[#232323] sm:max-w-2xl sm:text-lg">
                {t('treabo.home.heroText')}
              </p>

              <form onSubmit={startRequest} className={`mt-7 rounded-[28px] border border-zinc-200 bg-white p-2 shadow-[0_22px_70px_rgba(31,41,55,0.12)] transition-all ${isPromptOpen ? 'max-w-3xl' : 'max-w-2xl'}`}>
                <div className="grid gap-2 transition-all sm:grid-cols-[1fr_190px]">
                  <label className={`flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 transition-all ${isPromptOpen ? 'min-h-[132px] py-4' : 'min-h-[58px] items-center py-0'}`}>
                    <Search className="mt-0.5 h-5 w-5 shrink-0 text-[#232323]" />
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={isPromptOpen ? 4 : 1}
                      className="w-full resize-none appearance-none border-0 bg-transparent text-base font-bold text-[#232323] outline-none placeholder:text-[#232323] focus:border-0 focus:outline-none focus:ring-0"
                      placeholder={t('treabo.home.searchPlaceholder')}
                    />
                  </label>
                  <label className="flex min-h-[58px] items-center gap-3 rounded-2xl bg-zinc-50 px-4">
                    <MapPin className="h-5 w-5 text-[#232323]" />
                    <input className="w-full bg-transparent text-base font-bold text-[#232323] outline-none placeholder:text-[#232323]" placeholder="Город" />
                  </label>
                </div>
                {isPromptOpen && (
                  <div className="mt-2 flex justify-end">
                    <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f36b] text-[#232323] transition hover:bg-[#c7e85a]">
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {visibleSearches.map((item) => (
                  <button key={item} onClick={() => router.push(`/request/new?q=${encodeURIComponent(item)}`)} className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#232323] shadow-sm">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[460px] md:min-h-[560px]">
              <div className="absolute right-0 top-4 h-[82%] w-[82%] rounded-[48px] bg-[#d9f36b]" />
              <div className="absolute left-4 top-0 w-[78%] overflow-hidden rounded-[38px] border-[10px] border-white bg-zinc-950 shadow-2xl">
                <div className="aspect-[4/5] bg-[radial-gradient(circle_at_25%_20%,#fef08a,transparent_26%),linear-gradient(145deg,#18181b,#3f3f46)] p-5">
                  <div className="rounded-3xl bg-white p-4 shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#232323]">{t('treabo.home.nearbyTask')}</div>
                        <div className="font-black">{t('treabo.home.defaultTaskTitle')}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {visibleSpecialists.map((person) => (
                        <div key={person.name} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
                          {typeof person.avatar === 'string' ? (
                            <img src={person.avatar} alt={person.name} width={46} height={46} className="h-[46px] w-[46px] rounded-full object-cover" />
                          ) : (
                            <Image src={person.avatar} alt={person.name} width={46} height={46} className="rounded-full object-cover" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold">{person.name}</div>
                            <div className="truncate text-xs text-[#232323]">{person.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-black">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {person.rating}
                            </div>
                            <div className="text-xs text-[#232323]">{person.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-7 right-2 rounded-[28px] bg-white p-5 shadow-2xl sm:right-8">
                <div className="mb-2 text-sm font-bold text-[#232323]">{t('treabo.home.openTasks')}</div>
                <div className="text-3xl font-black">{openTasksCount}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-7">
          <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-3 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {localizedStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl bg-zinc-50 p-5">
                <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-[#232323]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1160px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t('treabo.home.popularTitle')}</h2>
              <p className="mt-2 text-[#232323]">{t('treabo.home.popularText')}</p>
            </div>
            <Link href={routes.works} className="hidden items-center gap-2 text-sm font-black md:flex">
              {t('treabo.home.allTasks')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCategories.map(({ title, count, icon: Icon }) => (
              <button key={title} onClick={() => router.push(`/request/new?q=${encodeURIComponent(title)}`)} className="group flex min-h-[142px] flex-col justify-between rounded-[28px] border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                <Icon className="h-7 w-7 text-[#232323]" />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black leading-tight">{title}</h3>
                    <ChevronRight className="h-5 w-5 text-[#232323] transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-sm text-[#232323]">{count}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="how" className="bg-white py-14 text-[#232323]">
          <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{t('treabo.home.howTitle')}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {localizedSteps.map((step, index) => (
                <div key={step.title} className="rounded-[30px] border border-zinc-200 bg-[#f6f7f2] p-6 shadow-sm">
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#232323] text-lg font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#232323]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="mx-auto max-w-[1160px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t('treabo.home.specialistTitle')}</h2>
              <p className="mt-3 text-[#232323]">{t('treabo.home.specialistText')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {visibleSpecialists.map((person) => (
                <article key={person.name} className="rounded-[30px] bg-white p-5 shadow-sm">
                  {typeof person.avatar === 'string' ? (
                    <img src={person.avatar} alt={person.name} width={72} height={72} className="h-[72px] w-[72px] rounded-3xl object-cover" />
                  ) : (
                    <Image src={person.avatar} alt={person.name} width={72} height={72} className="rounded-3xl object-cover" />
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black">{person.name}</h3>
                      <p className="text-sm text-[#232323]">{person.role}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-black">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      {person.rating}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {person.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-[#232323]">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                    <span className="text-sm font-black">{person.price}</span>
                    <span className="text-xs text-[#232323]">{person.reviews}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1160px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[36px] bg-[#d9f36b] lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-7 sm:p-10">
              <img
                src={brandLogoSrc}
                alt={brandLogoAlt}
                className="mb-7 h-12 w-auto max-w-[190px] object-contain object-left"
              />
              <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">{t('treabo.home.ctaTitle')}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">{t('treabo.home.ctaText')}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-[152px_1fr]">
                <div className="rounded-[26px] bg-white p-3 shadow-sm">
                  <img
                    src={clientAppQrUrl}
                    alt="QR-код для скачивания приложения Treabo"
                    className="aspect-square w-full rounded-2xl object-contain"
                  />
                  <div className="mt-2 text-center text-xs font-black text-[#232323]">
                    Наведите камеру
                  </div>
                </div>
                <div className="grid content-start gap-3">
                  <a
                    href={clientAppDownloadUrl}
                    download
                    className="flex min-h-[64px] items-center justify-center gap-3 rounded-[22px] bg-[#232323] px-6 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    <Download className="h-6 w-6" />
                    Скачать приложение
                  </a>
                  <div
                    aria-disabled="true"
                    className="flex min-h-[82px] cursor-not-allowed items-center gap-4 rounded-[22px] border border-white/70 bg-white/75 px-5 text-[#232323] shadow-sm"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#28d17c,#06a866)] text-2xl font-black text-white shadow-md">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#66704c]">
                        Скоро
                      </div>
                      <div className="text-xl font-black">Скачать в RuStore</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {asArray<string>(t('treabo.home.checklist', { returnObjects: true }), []).map((item) => (
                  <div key={item} className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(135deg,#bef264,#84cc16)]">
              <Image
                src="/proffi/34343434.png"
                alt={t('treabo.home.ctaTitle')}
                width={932}
                height={932}
                className="absolute inset-0 h-full w-full bg-black object-contain object-center"
                priority
              />
            </div>
          </div>
        </section>
      </main>
      <ProffiFooter />
      <FloatingMobileCTA />
    </div>
  );
}
