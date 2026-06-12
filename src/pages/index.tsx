import CustomerHomePage from '@/components/proffi-mock/CustomerHomePage';
import { fetchTreaboLandingData, type TreaboCategory, type TreaboTask } from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type HomeProps = {
  categories: TreaboCategory[];
  tasks: TreaboTask[];
};

const Home: NextPageWithLayout<HomeProps> = ({ categories, tasks }) => {
  return <CustomerHomePage categories={categories} tasks={tasks} />;
};

Home.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ locale }) => {
  const { categories, tasks } = await fetchTreaboLandingData();

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      categories,
      tasks,
    },
  };
};

export default Home;
