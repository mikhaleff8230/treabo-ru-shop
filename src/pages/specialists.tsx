import SpecialistsMarketplacePage from '@/components/proffi-mock/SpecialistsMarketplacePage';
import { TitleSeo } from '@/components/seo/title-seo';
import { fetchTreaboSpecialists, type TreaboSpecialist } from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type SpecialistsPageProps = {
  specialists: TreaboSpecialist[];
};

const SpecialistsPage: NextPageWithLayout<SpecialistsPageProps> = ({ specialists }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');
  return (
    <>
      <TitleSeo
        title="Найти специалиста в России — Treabo"
        description="Каталог мастеров Treabo: рейтинг, отзывы, документы, портфолио и выезд к клиенту."
        canonical={`${siteUrl}/specialists`}
      />
      <SpecialistsMarketplacePage specialists={specialists} />
    </>
  );
};

SpecialistsPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale, query }) => {
  const specialists = await fetchTreaboSpecialists({
    city: typeof query.city === 'string' ? query.city : null,
  });

  return {
    props: {
      specialists,
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

export default SpecialistsPage;
