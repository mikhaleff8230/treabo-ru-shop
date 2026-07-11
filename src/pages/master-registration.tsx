import MasterRegistrationPage from '@/components/proffi-mock/MasterRegistrationPage';
import { TitleSeo } from '@/components/seo/title-seo';
import { fetchTreaboTopSpecialists, type TreaboSpecialist } from '@/data/treabo';
import type { NextPageWithLayout } from '@/types';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type MasterRegistrationProps = { topSpecialists: TreaboSpecialist[] };

const MasterRegistration: NextPageWithLayout<MasterRegistrationProps> = ({ topSpecialists }) => {
  const siteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://treabo.md').replace(/\/+$/, '');

  return (
    <>
      <TitleSeo
        title="Регистрация мастера - Treabo"
        description="Зарегистрируйтесь как специалист Treabo и получайте заявки от клиентов."
        canonical={`${siteUrl}/master-registration`}
      />
      <MasterRegistrationPage topSpecialists={topSpecialists} />
    </>
  );
};

MasterRegistration.hideCookieConsent = true;

export const getServerSideProps: GetServerSideProps<MasterRegistrationProps> = async ({ locale }) => {
  const topSpecialists = await fetchTreaboTopSpecialists(3);
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      topSpecialists: JSON.parse(JSON.stringify(topSpecialists ?? [])),
    },
  };
};

export default MasterRegistration;
