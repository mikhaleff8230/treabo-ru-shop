import RequestWizard from '@/components/treabo-request/RequestWizard';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewRequestPage: NextPageWithLayout = () => {
  return <RequestWizard />;
};

NewRequestPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common'])),
  },
});

export default NewRequestPage;
