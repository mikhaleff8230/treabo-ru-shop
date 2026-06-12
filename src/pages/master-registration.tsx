import MasterRegistrationPage from '@/components/proffi-mock/MasterRegistrationPage';
import { TitleSeo } from '@/components/seo/title-seo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const MasterRegistration: NextPageWithLayout = () => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');

  return (
    <>
      <TitleSeo
        title="Регистрация мастера - Treabo"
        description="Зарегистрируйтесь как специалист Treabo и получайте заявки от клиентов."
        canonical={`${siteUrl}/master-registration`}
      />
      <MasterRegistrationPage />
    </>
  );
};

MasterRegistration.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common'])),
  },
});

export default MasterRegistration;
