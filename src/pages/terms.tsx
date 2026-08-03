import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import PageHeading from '@/components/ui/page-heading';
import GeneralContainer from '@/layouts/_general-container';
import { termsData } from '@/data/static/terms-setting';
import Seo from '@/layouts/_seo';
import routes from '@/config/routes';
import { ProffiFooter, ProffiHeader } from '@/components/proffi-mock/ProffiShell';

const TermsPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-[#f6f7f2] text-[#232323]">
      <ProffiHeader />
      <Seo
        title="Terms & Conditions"
        description="Fastest digital download template built with React, NextJS, TypeScript, React-Query and Tailwind CSS."
        url={routes.terms}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <PageHeading
          title={t('text-terms-page-title')}
          subtitle={t('text-terms-page-subtitle')}
        />
        <GeneralContainer>
          {termsData?.map((item) => (
            <div
              key={item.id}
              className="order-list-enable mb-8 last:mb-0 lg:mb-10"
            >
              <h3 className="mb-4 text-sm font-medium text-dark dark:text-light lg:mb-5">
                {t(item.title)}
              </h3>
              <div
                className="space-y-5 leading-6"
                dangerouslySetInnerHTML={{
                  __html: t(item.description),
                }}
              />
            </div>
          ))}
        </GeneralContainer>
      </div>
      <ProffiFooter />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default TermsPage;
