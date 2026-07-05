import SpecialistsMarketplacePage from '@/components/proffi-mock/SpecialistsMarketplacePage';
import { TitleSeo } from '@/components/seo/title-seo';
import {
  fetchTreaboCategories,
  fetchTreaboSpecialists,
  type TreaboCategory,
  type TreaboSpecialist,
} from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type SpecialistsPageProps = {
  specialists: TreaboSpecialist[];
  categories: TreaboCategory[];
  filters: {
    city?: string | null;
    category_id?: string | null;
    q?: string | null;
  };
  seoCategory?: string | null;
};

function pickQuery(query: Record<string, string | string[] | undefined>, key: string) {
  const value = query[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cityInLocative(city: string) {
  const map: Record<string, string> = {
    Москва: 'Москве',
    'Санкт-Петербург': 'Санкт-Петербурге',
    Майкоп: 'Майкопе',
    Казань: 'Казани',
    Новосибирск: 'Новосибирске',
    Екатеринбург: 'Екатеринбурге',
  };

  return map[city] || city;
}

function buildCanonical(siteUrl: string, filters: SpecialistsPageProps['filters']) {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.q) params.set('q', filters.q);
  const query = params.toString();

  return `${siteUrl}/specialists${query ? `?${query}` : ''}`;
}

const SpecialistsPage: NextPageWithLayout<SpecialistsPageProps> = ({
  specialists,
  categories,
  filters,
  seoCategory,
}) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru').replace(/\/+$/, '');
  const city = filters.city?.trim();
  const service = filters.q?.trim() || seoCategory || '';
  const locationPart = city ? ` в ${cityInLocative(city)}` : '';
  const servicePart = service ? `${service}: ` : '';
  const title = `${servicePart}найти специалиста${locationPart} - Treabo`;
  const description = service
    ? `Каталог мастеров Treabo по услуге «${service}»${locationPart}: рейтинг, отзывы, паспортная проверка, портфолио и чат.`
    : `Каталог мастеров Treabo${locationPart}: рейтинг, отзывы, паспортная проверка, портфолио и чат.`;

  return (
    <>
      <TitleSeo
        title={title}
        description={description}
        canonical={buildCanonical(siteUrl, filters)}
      />
      <SpecialistsMarketplacePage specialists={specialists} categories={categories} />
    </>
  );
};

SpecialistsPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<SpecialistsPageProps> = async ({ locale, query }) => {
  const filters = {
    city: pickQuery(query, 'city'),
    category_id: pickQuery(query, 'category_id'),
    q: pickQuery(query, 'q') || pickQuery(query, 'service'),
  };

  const [specialists, categories] = await Promise.all([
    fetchTreaboSpecialists(filters),
    fetchTreaboCategories(),
  ]);

  const seoCategory = filters.category_id
    ? categories.find((category) => String(category.id) === String(filters.category_id))?.name_ru || null
    : null;

  return {
    props: {
      specialists,
      categories,
      filters,
      seoCategory,
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

export default SpecialistsPage;
