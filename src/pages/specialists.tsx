import SpecialistsMarketplacePage from '@/components/proffi-mock/SpecialistsMarketplacePage';
import { TitleSeo } from '@/components/seo/title-seo';
import { fetchTreaboSpecialists, type TreaboSpecialist } from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type SpecialistsPageProps = {
  specialists: TreaboSpecialist[];
};

const SpecialistsPage: NextPageWithLayout<SpecialistsPageProps> = ({ specialists }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');
  const router = useRouter();
  const isRu = router.locale === 'ru';

  return (
    <>
      <TitleSeo
        title={isRu ? 'Найти специалиста в Молдове - Treabo' : 'Găsește specialist în Moldova - Treabo'}
        description={isRu
          ? 'Каталог мастеров Treabo: рейтинг, отзывы, документы, портфолио и выезд к клиенту.'
          : 'Catalogul specialiștilor Treabo: rating, recenzii, documente, portofoliu și deplasare la client.'}
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
