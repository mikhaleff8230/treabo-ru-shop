import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
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
      location: item.city || 'Москва',
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
      location: 'Москва, Хамовники',
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
      location: 'Москва, Центр',
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
  const previewPhotos = specialist.photos.slice(0, 3);

  return (
    <article className={marketplace.card}>
      <div className="grid gap-3 p-3.5 sm:p-4 lg:grid-cols-[minmax(0,1fr)_clamp(108px,12vw,154px)_238px] lg:items-center">
        <div className="min-w-0">
          <div className="flex gap-3 sm:gap-4">
            <SmartImage
              src={specialist.avatar}
              alt={specialist.name}
              width={64}
              height={64}
              className="h-[58px] w-[58px] shrink-0 rounded-[16px] object-cover sm:h-[64px] sm:w-[64px]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-[300] leading-4 text-[#9AA1AD] sm:text-[10px]">
                {specialist.online}
              </div>
              <h2 className="mt-0.5 truncate text-[19px] font-[300] leading-tight text-[#232323] sm:text-[20px]">
                {specialist.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#686F7D] sm:text-[12px]">
                <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#F4F5FA] px-1.5 py-0.5 text-[#566074]">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {specialist.rating}
                </span>
                <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#F4F5FA] px-1.5 py-0.5 text-[#566074]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {specialist.reviews}
                </span>
                <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#F4F5FA] px-1.5 py-0.5 text-[#566074]">
                  <ShieldCheck className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  {specialist.verified}
                </span>
                <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#F4F5FA] px-1.5 py-0.5 text-[#566074]">
                  {specialist.team}
                </span>
              </div>
              <p className="mt-1.5 max-h-5 max-w-3xl overflow-hidden text-[12px] leading-5 text-[#777D88]">
                {specialist.qualification}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {specialist.services.slice(0, 3).map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-[#E6E9EF] bg-white px-2.5 py-1 text-[11px] font-[300] leading-none text-[#3A3D45]"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:max-w-[240px] lg:max-w-none">
          {previewPhotos.map((photo, index) => (
            <SmartImage
              key={`${specialist.name}-${index}`}
              src={photo}
              alt={`${specialist.name} portfolio ${index + 1}`}
              width={96}
              height={96}
              className="aspect-square w-full rounded-[12px] object-cover"
            />
          ))}
        </div>

        <div className="flex items-center gap-2.5 border-[#E7E9EC] pt-1 lg:border-l lg:pl-4 lg:pt-0">
          <div className="min-w-0 flex-1">
            <div className="inline-flex max-w-full items-center gap-1.5 text-[12px] font-medium text-[#777D88]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{specialist.location}</span>
            </div>
            <button
              type="button"
              className="mt-2 min-h-[36px] w-full whitespace-nowrap rounded-[14px] bg-[#D9F36B] px-4 py-2 text-[12px] font-semibold text-[#232323] transition hover:bg-[#c7e85a]"
            >
              Предложить задачу
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-pressed={saved}
            aria-label={saved ? text.common.saved : text.common.save}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border bg-white transition ${
              saved ? 'border-[#D9F36B] text-[#232323]' : 'border-[#E7E9EC] text-[#777D88]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-[#232323]' : ''}`} />
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
          <div className={`mx-auto ${marketplace.maxWidth} px-4 py-5 sm:px-6 lg:px-8`}>
            <div className="grid gap-4 lg:grid-cols-[1fr_270px] lg:items-end">
              <div>
                <h1 className="text-[28px] font-[400] leading-[1.06] text-[#232323] sm:text-[36px]">{text.specialists.title}</h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#777D88] sm:text-sm">{text.specialists.subtitle}</p>
              </div>
              <div className="rounded-[20px] border border-[#E7E9EC] bg-[#D9F36B] p-4">
                <div className="text-xs font-semibold">{text.specialists.availableToday}</div>
                <div className="mt-1 text-2xl font-[400]">{text.specialists.mastersCount}</div>
                <div className="mt-1 text-xs font-medium">{text.specialists.answerAfterRequest}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 rounded-[22px] border border-[#E7E9EC] bg-white p-2 shadow-[0_8px_24px_rgba(24,28,35,0.045)] sm:grid-cols-[1fr_205px_130px]">
              <label className="flex h-11 items-center gap-2.5 rounded-[16px] bg-[#F6F7F5] px-3.5">
                <Search className="h-4 w-4 text-[#777D88]" />
                <input
                  className="w-full bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]"
                  placeholder={text.common.servicePlaceholder}
                />
              </label>
              <label className="flex h-11 items-center gap-2.5 rounded-[16px] bg-[#F6F7F5] px-3.5">
                <MapPin className="h-4 w-4 text-[#777D88]" />
                <input
                  className="w-full bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]"
                  placeholder={text.city}
                />
              </label>
              <button className="rounded-[16px] bg-[#232323] px-4 text-xs font-semibold text-white">{text.common.search}</button>
            </div>
          </div>
        </section>

        <div className="sticky top-14 z-30 border-b border-[#E7E9EC] bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#232323] px-4 py-2 text-xs font-semibold text-white"
          >
            <Filter className="h-4 w-4" />
            {text.common.filters}
          </button>
        </div>

        <section className={`mx-auto grid ${marketplace.maxWidth} gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[258px_minmax(0,1fr)] lg:px-8`}>
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
                  className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[13px] bg-[#D9F36B] px-4 py-2 text-xs font-semibold text-[#232323]"
                >
                  <Briefcase className="h-4 w-4" />
                  {text.common.createRequest}
                </Link>
              }
            />

            <div className="space-y-3 sm:space-y-4">
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
