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
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type WorksPageProps = {
  categories: TreaboCategory[];
  tasks: TreaboTask[];
  filters: TreaboTaskFilters;
};

const WorksPage: NextPageWithLayout<WorksPageProps> = ({ categories, tasks, filters }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');
  const router = useRouter();
  const isRu = router.locale === 'ru';

  return (
    <>
      <TitleSeo
        title={isRu ? 'Задания и заказы в Молдове - Treabo' : 'Comenzi și lucrări în Moldova - Treabo'}
        description={isRu
          ? 'Лента заданий Treabo для специалистов и заказчиков: фильтры, карта, отклики и быстрые заказы.'
          : 'Feed Treabo pentru specialiști și clienți: filtre, hartă, oferte și comenzi rapide.'}
        canonical={`${siteUrl}/works`}
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

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      categories,
      tasks: filterTasksClientSide(tasks, filters),
      filters,
    },
  };
};

export default WorksPage;
