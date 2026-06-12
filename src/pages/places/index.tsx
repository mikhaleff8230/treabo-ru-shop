import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import PlacesFeed from '@/components/places/places-feed';
import { TitleSeo } from '@/components/seo/title-seo';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { dehydrate, QueryClient } from '@tanstack/react-query';

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery(
      [API_ENDPOINTS.PLACES, { limit: 20, orderBy: 'created_at', sortedBy: 'desc' }],
      ({ queryKey }) =>
        client.places.all(queryKey[1])
    );
    return {
      props: {
        ...(await serverSideTranslations(locale!, ['common'])),
        dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
      },
      revalidate: 60, // In seconds
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

const PlacesPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <TitleSeo title={'Плейсы'} />
      
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-heading mb-4">
            Плейсы
          </h1>
          <p className="text-body text-lg max-w-2xl mx-auto">
            Продвигай свои товары, создавая визуальные Плейсы!
          </p>
        </div>
        
        <PlacesFeed limit={20} showLoadMore={true} />
      </div>
    </>
  );
};

PlacesPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default PlacesPage; 