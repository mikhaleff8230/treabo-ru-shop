import CustomerHomePage from '@/components/proffi-mock/CustomerHomePage';
import {
  fetchTreaboCategories,
  fetchTreaboHomeStats,
  fetchTreaboTopSpecialists,
  type TreaboCategory,
  type TreaboHomeStats,
  type TreaboSpecialist,
} from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type HomeProps = {
  categories: TreaboCategory[];
  topSpecialists: TreaboSpecialist[];
  homeStats: TreaboHomeStats | null;
};

const Home: NextPageWithLayout<HomeProps> = ({ categories, topSpecialists, homeStats }) => {
  return <CustomerHomePage categories={categories} topSpecialists={topSpecialists} homeStats={homeStats} />;
};

Home.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ locale }) => {
  const [categories, topSpecialists, homeStats] = await Promise.all([
    fetchTreaboCategories(),
    fetchTreaboTopSpecialists(3),
    fetchTreaboHomeStats(),
  ]);

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      categories,
      topSpecialists: JSON.parse(JSON.stringify((topSpecialists ?? []).map((specialist) => ({
        id: specialist.id,
        name: specialist.name,
        role: specialist.role,
        rating: specialist.rating ?? null,
        reviews_count: specialist.reviews_count ?? null,
        bio: specialist.bio ?? null,
        services: specialist.services ?? [],
        avatar: specialist.avatar ?? null,
        min_price: specialist.min_price ?? null,
      })))),
      homeStats: JSON.parse(JSON.stringify(homeStats ?? null)),
    },
  };
};

export default Home;
