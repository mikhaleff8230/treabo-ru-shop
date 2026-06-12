import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import GeneralLayout from '@/layouts/_general-layout';
import PageHeading from '@/components/ui/page-heading';
import GeneralContainer from '@/layouts/_general-container';
import Accordion from '@/components/ui/accordion';
import Seo from '@/layouts/_seo';
import { earnData } from '@/data/static/earn-setting';
import routes from '@/config/routes';

const EarnPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  return (
    <>
      <Seo
        title="Зарабатывать с Sancan"
        description="Информация о том, как начать зарабатывать на маркетплейсе Sancan"
        url={routes.earn}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <PageHeading
          title={t('text-earn-page-title')}
          subtitle={t('text-earn-page-subtitle')}
        />
        <GeneralContainer>
          {earnData?.map((item) => (
            <Accordion key={`${item.title}-${item.id}`} item={item} />
          ))}
        </GeneralContainer>
      </div>
    </>
  );
};

EarnPage.getLayout = function getLayout(page) {
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

export default EarnPage;

