import RequestWizard from '@/components/treabo-request/RequestWizard';
import AiRequestAssistant from '@/components/treabo-request/AiRequestAssistant';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect } from 'react';
import { reachYandexMetrikaGoal } from '@/lib/yandex-metrika';

const NewRequestPage: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    reachYandexMetrikaGoal('request_form_open');
  }, []);

  return router.query.mode === 'manual' ? <RequestWizard /> : <AiRequestAssistant />;
};

NewRequestPage.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common'])),
  },
});

export default NewRequestPage;
