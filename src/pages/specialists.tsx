import SpecialistsMarketplacePage from '@/components/proffi-mock/SpecialistsMarketplacePage';
import { TitleSeo } from '@/components/seo/title-seo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const SpecialistsPage: NextPageWithLayout = () => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');

  return (
    <>
      <TitleSeo
        title="Найти специалиста в Молдове - Treabo"
        description="Каталог мастеров Treabo: рейтинг, отзывы, документы, портфолио и выезд к клиенту."
        canonical={`${siteUrl}/specialists`}
      />
      <SpecialistsMarketplacePage />
    </>
  );
};

SpecialistsPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common'])),
  },
});

export default SpecialistsPage;
