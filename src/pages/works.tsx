import JobsMarketplacePage from '@/components/proffi-mock/JobsMarketplacePage';
import { TitleSeo } from '@/components/seo/title-seo';
import {
  fetchTreaboLandingData,
  filterTasksClientSide,
  type TreaboCategory,
  type TreaboTask,
  type TreaboTaskFilters,
} from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type WorksPageProps = {
  categories: TreaboCategory[];
  tasks: TreaboTask[];
  filters: TreaboTaskFilters;
  seoCategory?: string | null;
};

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

function buildCanonical(siteUrl: string, filters: TreaboTaskFilters) {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.q) params.set('q', filters.q);
  if (filters.budget_min != null) params.set('budget_min', String(filters.budget_min));
  if (filters.budget_max != null) params.set('budget_max', String(filters.budget_max));
  const query = params.toString();

  return `${siteUrl}/works${query ? `?${query}` : ''}`;
}

const WorksPage: NextPageWithLayout<WorksPageProps> = ({ categories, tasks, filters, seoCategory }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru').replace(/\/+$/, '');
  const city = filters.city?.trim();
  const service = filters.q?.trim() || seoCategory || '';
  const locationPart = city ? ` в ${cityInLocative(city)}` : '';
  const servicePart = service ? `${service}: ` : '';
  const title = `${servicePart}задания и заказы${locationPart} - Treabo`;
  const description = service
    ? `Актуальные задания Treabo по услуге «${service}»${locationPart}: бюджет, адрес, карта, отклики и быстрый контакт с заказчиком.`
    : `Актуальные задания Treabo${locationPart}: бюджет, адрес, карта, отклики и быстрый контакт с заказчиком.`;

  return (
    <>
      <TitleSeo
        title={title}
        description={description}
        canonical={buildCanonical(siteUrl, filters)}
      />
      <JobsMarketplacePage categories={categories} tasks={tasks} initialFilters={filters} />
    </>
  );
};

WorksPage.hideCookieConsent = true;

function parseFilters(query: Record<string, string | string[] | undefined>): TreaboTaskFilters {
  const pick = (key: string) => {
    const value = query[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };

  const budgetMin = pick('budget_min');
  const budgetMax = pick('budget_max');

  return {
    category: pick('category'),
    category_id: pick('category_id'),
    city: pick('city'),
    q: pick('q'),
    budget_min: budgetMin ? Number(budgetMin) : null,
    budget_max: budgetMax ? Number(budgetMax) : null,
  };
}

export const getServerSideProps: GetServerSideProps<WorksPageProps> = async ({ locale, query }) => {
  const filters = parseFilters(query);
  const { categories, tasks } = await fetchTreaboLandingData(filters);
  const seoCategory = filters.category_id
    ? categories.find((category) => String(category.id) === String(filters.category_id))?.name_ru || null
    : null;

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      categories,
      tasks: filterTasksClientSide(tasks, filters),
      filters,
      seoCategory,
    },
  };
};

export default WorksPage;
