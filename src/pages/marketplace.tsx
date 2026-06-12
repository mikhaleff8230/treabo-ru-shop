import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import GeneralLayout from '@/layouts/_general-layout';
import PageHeading from '@/components/ui/page-heading';
import GeneralContainer from '@/layouts/_general-container';
import Accordion from '@/components/ui/accordion';
import Seo from '@/layouts/_seo';
import { marketplaceData } from '@/data/static/marketplace-setting';
import routes from '@/config/routes';

const MarketplacePage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  return (
    <>
      <Seo
        title="Sancan маркетплейс"
        description="Информация о маркетплейсе Sancan"
        url={routes.marketplace}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <PageHeading
          title={t('text-marketplace-page-title')}
          subtitle={t('text-marketplace-page-subtitle')}
        />
        <GeneralContainer>
          {marketplaceData?.map((item) => (
            <Accordion key={`${item.title}-${item.id}`} item={item} />
          ))}
        </GeneralContainer>
      </div>
    </>
  );
};

MarketplacePage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default MarketplacePage;

