import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  Filter,
  Map,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';
import team4 from '@/assets/images/team/4.png';
import team5 from '@/assets/images/team/5.png';
import team6 from '@/assets/images/team/6.png';
import type { TreaboSpecialist } from '@/data/treabo';
import { getTreaboText } from '@/lib/treabo/i18n';
import {
  MarketplaceFilterGroup,
  MarketplaceFilterOption,
  MarketplaceFilterSidebar,
  MarketplaceMobileFiltersDrawer,
  MarketplaceResultsBar,
  marketplace,
} from './marketplace-ui';
import { ProffiFooter, ProffiHeader } from './ProffiShell';

type Specialist = {
  name: string;
  online: string;
  rating: string;
  reviews: string;
  praise: string;
  team: string;
  verified: string;
  qualification: string;
  location: string;
  services: string[];
  photos: Array<StaticImageData | string>;
  avatar: StaticImageData | string;
};

function buildSpecialists(locale?: string, apiSpecialists: TreaboSpecialist[] = []): Specialist[] {
  if (apiSpecialists.length) {
    const fallbackAvatars = [team1, team2, team3];
    const fallbackPhotos = [[team2, team3, team4], [team5, team6, team3], [team4, team1, team6]];

    return apiSpecialists.map((item, index) => ({
      name: item.name || 'Специалист Treabo',
      online: item.last_seen ? 'Был в сети недавно' : 'Онлайн',
      rating: String(item.rating || '5,0').replace('.', ','),
      reviews: `${item.reviews_count || 0} отзывов`,
      praise: 'Профиль Treabo',
      team: 'Выезд к клиенту',
      verified: item.email ? 'Профиль проверен' : 'Анкета заполнена',
      qualification:
        item.bio ||
        'Специалист принимает заявки Treabo. Портфолио и услуги можно заполнить в анкете мастера.',
      location: item.city || 'Кишинёв',
      services: item.services?.length ? item.services : ['Ремонт', 'Сантехника', 'Плитка'],
      photos: item.portfolio?.length ? item.portfolio.slice(0, 3) : fallbackPhotos[index % fallbackPhotos.length],
      avatar: item.avatar || fallbackAvatars[index % fallbackAvatars.length],
    }));
  }

  return [
    {
      name: 'Дмитрий Е.',
      online: 'Был в сети сегодня в 06:34',
      rating: '5,0',
      reviews: '52 отзыва',
      praise: 'Очень хвалят',
      team: 'С командой',
      verified: 'Паспорт проверен',
      qualification:
        'Специалист сдал экзамен по услугам: малярные и штукатурные работы, поклейка обоев.',
      location: 'Кишинёв, Ботаника',
      services: ['Ремонт квартир', 'Покраска стен', 'Плитка', 'Штукатурка'],
      photos: [team2, team3, team4],
      avatar: team1,
    },
    {
      name: 'Андрей П.',
      online: 'Онлайн',
      rating: '4,9',
      reviews: '38 отзывов',
      praise: 'Быстро отвечает',
      team: 'Работает сам',
      verified: 'Документы проверены',
      qualification: 'Выполняет сантехнические работы, сборку мебели и мелкий ремонт по дому.',
      location: 'Кишинёв, Центр',
      services: ['Сантехника', 'Мелкий ремонт', 'Сборка мебели'],
      photos: [team5, team6, team3],
      avatar: team2,
    },
    {
      name: 'Михаил С.',
      online: 'Был в сети вчера',
      rating: '4,8',
      reviews: '71 отзыв',
      praise: 'Аккуратная работа',
      team: 'С напарником',
      verified: 'Профиль подтвержден',
      qualification: 'Берет заказы по электрике, диагностике, установке розеток и светильников.',
      location: 'Бельцы',
      services: ['Электрика', 'Диагностика', 'Светильники'],
      photos: [team4, team1, team6],
      avatar: team3,
    },
  ];
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)), template);
}

function SmartImage({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: StaticImageData | string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) {
  if (typeof src === 'string') {
    return <img src={src} alt={alt} width={width} height={height} className={className} loading="lazy" />;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}

function SpecialistCard({ specialist }: { specialist: Specialist }) {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const [saved, setSaved] = useState(false);

  return (
    <article className={marketplace.card}>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-6 sm:p-7 xl:p-8">
          <div className="flex gap-4 sm:gap-5">
            <SmartImage
              src={specialist.avatar}
              alt={specialist.name}
              width={104}
              height={124}
              className="h-[104px] w-[88px] shrink-0 rounded-[22px] object-cover sm:w-[104px]"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[26px] font-bold leading-tight text-[#232323] sm:text-[28px]">{specialist.name}</h2>
              <p className="mt-1 text-sm text-[#777D88]">{specialist.online}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#232323]">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {specialist.rating}
                </span>
                <span className="inline-flex items-center gap-1 text-[#777D88]">
                  <MessageCircle className="h-4 w-4" />
                  {specialist.reviews}
                </span>
                <span className="inline-flex items-center gap-1 text-[#777D88]">
                  <ShieldCheck className="h-4 w-4" />
                  {specialist.verified}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#777D88]">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" /> {specialist.team}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <div className="text-[15px] font-semibold text-[#232323]">{text.specialists.qualification}</div>
              <p className="mt-1 line-clamp-3 max-w-2xl text-sm leading-6 text-[#777D88]">{specialist.qualification}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {specialist.services.map((service) => (
              <span key={service} className={marketplace.chip}>
                {service}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
            {specialist.photos.map((photo, index) => (
              <SmartImage
                key={`${specialist.name}-${index}`}
                src={photo}
                alt={`${specialist.name} portfolio ${index + 1}`}
                width={180}
                height={120}
                className="h-20 w-full rounded-xl object-cover sm:h-24"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col border-[#E7E9EC] p-6 sm:p-7 xl:border-l xl:p-8">
          <button
            type="button"
            className="min-h-[54px] w-full rounded-[18px] bg-[#EEF3F8] px-4 py-3 text-sm font-semibold text-[#777D88]"
          >
            {text.specialists.message}
          </button>
          <p className="mt-3 text-sm leading-6 text-[#777D88]">{text.specialists.messageHint}</p>
          <div className="my-5 h-px bg-[#E7E9EC]" />
          <div className="text-sm font-semibold text-[#232323]">{text.specialists.visitClient}</div>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#777D88]">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            {specialist.location}
          </div>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-pressed={saved}
            className={`mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] border bg-white text-sm font-semibold transition ${
              saved ? 'border-[#D9F36B] text-[#232323]' : 'border-[#E7E9EC] text-[#777D88]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-[#232323]' : ''}`} />
            {saved ? text.common.saved : text.common.save}
          </button>
        </div>
      </div>
    </article>
  );
}

function SpecialistsFiltersPanel({
  text,
  openSections,
  toggleSection,
  visualSelections,
  toggleVisual,
}: {
  text: ReturnType<typeof getTreaboText>;
  openSections: Set<string>;
  toggleSection: (key: string) => void;
  visualSelections: Set<string>;
  toggleVisual: (key: string) => void;
}) {
  return (
    <>
      {text.specialists.filters.map((group) => (
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
              selected={visualSelections.has(`${group.title}:${option}`)}
              onClick={() => toggleVisual(`${group.title}:${option}`)}
            />
          ))}
        </MarketplaceFilterGroup>
      ))}
    </>
  );
}

export default function SpecialistsMarketplacePage({ specialists: apiSpecialists = [] }: { specialists?: TreaboSpecialist[] }) {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const specialists = buildSpecialists(router.locale, apiSpecialists);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set([text.specialists.filters[0]?.title]));
  const [visualSelections, setVisualSelections] = useState<Set<string>>(() => new Set());

  function toggleSection(key: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleVisual(key: string) {
    setVisualSelections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetFilters() {
    setVisualSelections(new Set());
  }

  const filtersPanel = (
    <SpecialistsFiltersPanel
      text={text}
      openSections={openSections}
      toggleSection={toggleSection}
      visualSelections={visualSelections}
      toggleVisual={toggleVisual}
    />
  );

  return (
    <div className={`min-h-screen ${marketplace.pageBg} ${marketplace.text}`}>
      <ProffiHeader />
      <main>
        <section className="border-b border-[#E7E9EC] bg-white">
          <div className={`mx-auto ${marketplace.maxWidth} px-4 py-7 sm:px-6 lg:px-8`}>
            <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <h1 className="text-[34px] font-bold leading-[1.05] text-[#232323] sm:text-[44px]">{text.specialists.title}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#777D88]">{text.specialists.subtitle}</p>
              </div>
              <div className="rounded-[28px] border border-[#E7E9EC] bg-[#D9F36B] p-5">
                <div className="text-sm font-semibold">{text.specialists.availableToday}</div>
                <div className="mt-1 text-3xl font-bold">{text.specialists.mastersCount}</div>
                <div className="mt-2 text-sm font-medium">{text.specialists.answerAfterRequest}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 rounded-[28px] border border-[#E7E9EC] bg-white p-2 shadow-[0_10px_36px_rgba(24,28,35,0.06)] sm:grid-cols-[1fr_220px_160px]">
              <label className="flex h-14 items-center gap-3 rounded-2xl bg-[#F6F7F5] px-4">
                <Search className="h-5 w-5 text-[#777D88]" />
                <input
                  className="w-full bg-transparent font-medium text-[#232323] outline-none placeholder:text-[#777D88]"
                  placeholder={text.common.servicePlaceholder}
                />
              </label>
              <label className="flex h-14 items-center gap-3 rounded-2xl bg-[#F6F7F5] px-4">
                <MapPin className="h-5 w-5 text-[#777D88]" />
                <input
                  className="w-full bg-transparent font-medium text-[#232323] outline-none placeholder:text-[#777D88]"
                  placeholder={text.city}
                />
              </label>
              <button className="rounded-2xl bg-[#232323] px-5 font-semibold text-white">{text.common.search}</button>
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-30 border-b border-[#E7E9EC] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#232323] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Filter className="h-4 w-4" />
            {text.common.filters}
          </button>
        </div>

        <section className={`mx-auto grid ${marketplace.maxWidth} gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-8`}>
          <aside className="hidden lg:block">
            <MarketplaceFilterSidebar
              title={text.common.filters}
              resetLabel={text.common.reset}
              onReset={resetFilters}
              applyLabel={text.common.apply}
              onApply={() => setFiltersOpen(false)}
              viewOnMapLabel={text.common.viewOnMap}
              onViewMap={() => {}}
              showMapButton
            >
              {filtersPanel}
            </MarketplaceFilterSidebar>
          </aside>

          <section>
            <MarketplaceResultsBar
              foundLabel={text.common.found}
              countLabel={interpolate(text.specialists.foundCount, { count: specialists.length })}
              action={
                <Link
                  href="/request/new"
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[14px] bg-[#D9F36B] px-5 py-2.5 text-sm font-semibold text-[#232323]"
                >
                  <Briefcase className="h-4 w-4" />
                  {text.common.createRequest}
                </Link>
              }
            />

            <div className="space-y-5 sm:space-y-6">
              {specialists.map((specialist) => (
                <SpecialistCard key={specialist.name} specialist={specialist} />
              ))}
            </div>
          </section>
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
        onApply={() => undefined}
      >
        {filtersPanel}
      </MarketplaceMobileFiltersDrawer>
    </div>
  );
}
