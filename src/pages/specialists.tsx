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
};

function pickQuery(query: Record<string, string | string[] | undefined>, key: string) {
  const value = query[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const SpecialistsPage: NextPageWithLayout<SpecialistsPageProps> = ({ specialists, categories }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.ru').replace(/\/+$/, '');
  return (
    <>
      <TitleSeo
        title="Найти специалиста в России — Treabo"
        description="Каталог мастеров Treabo: рейтинг, отзывы, документы, портфолио и выезд к клиенту."
        canonical={`${siteUrl}/specialists`}
      />
      <SpecialistsMarketplacePage specialists={specialists} categories={categories} />
    </>
  );
};

SpecialistsPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale, query }) => {
  const [specialists, categories] = await Promise.all([
    fetchTreaboSpecialists({
      city: pickQuery(query, 'city'),
      category_id: pickQuery(query, 'category_id'),
      q: pickQuery(query, 'q') || pickQuery(query, 'service'),
    }),
    fetchTreaboCategories(),
  ]);

  return {
    props: {
      specialists,
      categories,
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

export default SpecialistsPage;
