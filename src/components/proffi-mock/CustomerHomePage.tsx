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
  Drill,
  Fan,
  MapPin,
  Search,
  Send,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import type { TreaboCategory, TreaboTask } from '@/data/treabo';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';
import { treaboMinimal } from './marketplace-ui';
import { FloatingMobileCTA, ProffiFooter, ProffiHeader } from './ProffiShell';

type CustomerHomePageProps = {
  categories?: TreaboCategory[];
  tasks?: TreaboTask[];
};

const categoryIcons: Record<string, any> = {
  Bath,
  Drill,
  Fan,
  Wrench,
  Zap,
  Grid2X2: Drill,
};

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

export default function CustomerHomePage({ categories = [], tasks = [] }: CustomerHomePageProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
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
  const openTasksCount = tasks.length || 248;
  const firstTask = tasks[0];
  const isPromptOpen = prompt.trim().length > 0;
  const specialistAvatars = [team1, team2, team3];

  function startRequest(event?: FormEvent) {
    event?.preventDefault();
    const query = prompt.trim() ? `?q=${encodeURIComponent(prompt.trim())}` : '';
    router.push(`/request/new${query}`);
  }

  return (
    <div className={treaboMinimal.page} style={{ width: '100vw' }}>
      <ProffiHeader />
      <main className="overflow-hidden">
        <section className="relative overflow-hidden">
          <div className={`${treaboMinimal.section} grid gap-8 pb-8 pt-6 md:grid-cols-[1.08fr_0.92fr] md:pb-10 md:pt-9`}>
            <div className="flex min-w-0 max-w-full flex-col justify-center" style={{ width: 'min(100%, calc(100vw - 2rem))' }}>
              <div className={`${treaboMinimal.eyebrow} mb-4 max-w-full`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('treabo.home.badge')}
              </div>
              <h1 className={`${treaboMinimal.heroTitle} max-w-full break-words sm:max-w-3xl`}>
                {t('treabo.home.heroTitle')}
              </h1>
              <p className={`${treaboMinimal.body} mt-4 max-w-full sm:max-w-2xl`}>
                {t('treabo.home.heroText')}
              </p>

              <form onSubmit={startRequest} className={`${treaboMinimal.inputShell} mt-6 transition-all ${isPromptOpen ? 'max-w-3xl' : 'max-w-2xl'}`}>
                <div className="grid gap-2 transition-all sm:grid-cols-[1fr_190px]">
                  <label className={`flex items-start gap-2.5 ${treaboMinimal.input} transition-all ${isPromptOpen ? 'min-h-[112px] py-3' : 'min-h-[46px] items-center py-0'}`}>
                    <Search className="mt-0.5 h-4 w-4 shrink-0 text-[#777D88]" />
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={isPromptOpen ? 4 : 1}
                      className="w-full resize-none bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]"
                      placeholder={t('treabo.home.searchPlaceholder')}
                    />
                  </label>
                  <label className={`flex min-h-[46px] items-center gap-2.5 ${treaboMinimal.input}`}>
                    <MapPin className="h-4 w-4 text-[#777D88]" />
                    <input className="w-full bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]" placeholder={t('treabo.common.city')} />
                  </label>
                </div>
                {isPromptOpen && (
                  <div className="mt-2 flex justify-end">
                    <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#D9F36B] text-[#232323] transition hover:bg-[#c7e85a]">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {visibleSearches.map((item) => (
                  <button key={item} onClick={() => router.push(`/request/new?q=${encodeURIComponent(item)}`)} className={treaboMinimal.chip}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[360px] md:min-h-[450px]">
              <div className="absolute right-0 top-4 h-[80%] w-[80%] rounded-[34px] bg-[#D9F36B]" />
              <div className="absolute left-4 top-0 w-[78%] overflow-hidden rounded-[28px] border-[7px] border-white bg-zinc-950 shadow-[0_16px_46px_rgba(25,31,42,0.16)]">
                <div className="aspect-[4/5] bg-[radial-gradient(circle_at_25%_20%,#fef08a,transparent_26%),linear-gradient(145deg,#18181b,#3f3f46)] p-4">
                  <div className="rounded-[22px] bg-white p-3 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-medium text-[#777D88]">{t('treabo.home.nearbyTask')}</div>
                        <div className="text-[15px] font-[400] leading-tight">{firstTask?.title || t('treabo.home.defaultTaskTitle')}</div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">{t('treabo.home.taskResponses')}</span>
                    </div>
                    <div className="space-y-2">
                      {localizedSpecialists.map((person, index) => (
                        <div key={person.name} className="flex items-center gap-2.5 rounded-[16px] bg-zinc-50 p-2.5">
                          <Image src={specialistAvatars[index] || team1} alt={person.name} width={38} height={38} className="rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{person.name}</div>
                            <div className="truncate text-[11px] text-[#777D88]">{person.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs font-semibold">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              4.9
                            </div>
                            <div className="text-[11px] text-[#777D88]">{person.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-7 right-2 rounded-[22px] bg-white p-4 shadow-[0_14px_36px_rgba(25,31,42,0.12)] sm:right-8">
                <div className="mb-1 text-xs font-medium text-[#777D88]">{t('treabo.home.openTasks')}</div>
                <div className="text-2xl font-[400]">{openTasksCount}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-5">
          <div className={`${treaboMinimal.section} grid grid-cols-2 gap-3 md:grid-cols-4`}>
            {localizedStats.map((stat) => (
              <div key={stat.label} className="rounded-[22px] bg-zinc-50 p-4">
                <div className="text-[24px] font-[300] tracking-[-0.03em]">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-[#777D88]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${treaboMinimal.section} py-9`}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className={treaboMinimal.h2}>{t('treabo.home.popularTitle')}</h2>
              <p className={`${treaboMinimal.body} mt-2`}>{t('treabo.home.popularText')}</p>
            </div>
            <Link href={routes.works} className="hidden items-center gap-2 text-xs font-semibold text-[#232323] md:flex">
              {t('treabo.home.allTasks')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCategories.map(({ title, count, icon: Icon }) => (
              <button key={title} onClick={() => router.push(`/request/new?q=${encodeURIComponent(title)}`)} className={`${treaboMinimal.compactCard} group flex min-h-[112px] flex-col justify-between p-4 text-left`}>
                <Icon className="h-5 w-5 text-[#232323]" />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-[400] leading-tight">{title}</h3>
                    <ChevronRight className="h-4 w-4 text-[#777D88] transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-[11px] text-[#777D88]">{count}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="how" className="bg-white py-10 text-[#232323]">
          <div className={treaboMinimal.section}>
            <h2 className={`${treaboMinimal.h2} max-w-2xl`}>{t('treabo.home.howTitle')}</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {localizedSteps.map((step, index) => (
                <div key={step.title} className="rounded-[24px] border border-[#E7E9EC] bg-[#F7F7F4] p-5 shadow-[0_8px_24px_rgba(25,31,42,0.04)]">
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#232323] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <h3 className="text-[17px] font-[400]">{step.title}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#777D88]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className={`${treaboMinimal.section} py-10`}>
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <h2 className={treaboMinimal.h2}>{t('treabo.home.specialistTitle')}</h2>
              <p className={`${treaboMinimal.body} mt-2`}>{t('treabo.home.specialistText')}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {localizedSpecialists.map((person, index) => (
                <article key={person.name} className={`${treaboMinimal.compactCard} p-4`}>
                  <Image src={specialistAvatars[index] || team1} alt={person.name} width={58} height={58} className="rounded-[18px] object-cover" />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-[400]">{person.name}</h3>
                      <p className="text-xs text-[#777D88]">{person.role}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-semibold">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      4.9
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {person.tags.map((tag) => (
                      <span key={tag} className={treaboMinimal.badge}>{tag}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                    <span className="text-sm font-[400]">{person.price}</span>
                    <span className="text-xs text-[#777D88]">{person.reviews}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${treaboMinimal.section} pb-12`}>
          <div className="grid overflow-hidden rounded-[28px] bg-[#D9F36B] md:grid-cols-[1fr_0.75fr]">
            <div className="p-6 sm:p-8">
              <h2 className={`${treaboMinimal.h2} max-w-2xl`}>{t('treabo.home.ctaTitle')}</h2>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#232323]/75">{t('treabo.home.ctaText')}</p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {asArray<string>(t('treabo.home.checklist', { returnObjects: true }), []).map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(135deg,#bef264,#84cc16)]">
              <Image
                src="/proffi/phone-display.png"
                alt={t('treabo.home.ctaTitle')}
                width={1132}
                height={869}
                className="absolute bottom-0 left-1/2 h-[118%] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-2xl sm:h-[126%] md:h-[118%] lg:h-[132%]"
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
