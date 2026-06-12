import JobsMarketplacePage from '@/components/proffi-mock/JobsMarketplacePage';
import { fetchTreaboLandingData, type TreaboCategory, type TreaboTask } from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type PodrabotkaProps = {
  categories: TreaboCategory[];
  tasks: TreaboTask[];
};

const Podrabotka: NextPageWithLayout<PodrabotkaProps> = ({ categories, tasks }) => {
  return <JobsMarketplacePage categories={categories} tasks={tasks} />;
};

Podrabotka.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<PodrabotkaProps> = async ({ locale }) => {
  const { categories, tasks } = await fetchTreaboLandingData();

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      categories,
      tasks,
    },
  };
};

export default Podrabotka;
