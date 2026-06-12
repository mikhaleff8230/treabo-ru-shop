import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { NextPageWithLayout, Place } from '@/types';
import Layout from '@/layouts/_layout';
import PlacesFeed from '@/components/places/PlacesFeed';
import { TitleSeo } from '@/components/seo/title-seo';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { useMe } from '@/data/user';
import client from '@/data/client';

interface FeedPageProps {
  initialPlaces: Place[];
  initialPaginatorInfo: any;
}

export const getServerSideProps: GetServerSideProps<FeedPageProps> = async ({ locale, res }) => {
  // Устанавливаем заголовки кэширования
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );

  const queryClient = new QueryClient();

  // Временно отключаем SSR для избранных places чтобы избежать 502 ошибки
  // Данные будут загружаться на клиенте после аутентификации
  return {
    props: {
      initialPlaces: [],
      initialPaginatorInfo: null,
      ...(await serverSideTranslations(locale!, ['common'])),
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
  };
};

const FeedPage: NextPageWithLayout<FeedPageProps> = ({ initialPlaces, initialPaginatorInfo }) => {
  const { t } = useTranslation('common');
  const { me, isAuthorized } = useMe();
  
  // Показываем избранные плейсы для авторизованных пользователей
  // Для авторизованных пользователей фильтруем на клиенте, так как SSR не может получить их данные
  const favoritedBy = me?.id;
  const filters = isAuthorized && favoritedBy ? { favorited_by: favoritedBy } : {};
  
  // Для авторизованных пользователей не используем SSR данные, так как нужен фильтр
  const useSSRData = !isAuthorized;

  return (
    <>
      <TitleSeo title={isAuthorized ? 'Мои избранные плейсы - SANCAN' : 'Фид плейсов - SANCAN'} />
      
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-heading mb-4">
            {isAuthorized ? 'Мои избранные плейсы' : 'Фид плейсов'}
          </h1>
          <p className="text-body text-lg max-w-2xl mx-auto">
            {isAuthorized 
              ? 'Плейсы, которые вы добавили в избранное'
              : 'Откройте для себя уникальные идеи и вдохновение от наших мастеров'
            }
          </p>
        </div>
        
        <PlacesFeed 
          limit={20} 
          showLoadMore={true} 
          filters={filters}
          initialPlaces={useSSRData ? initialPlaces : []}
          initialPaginatorInfo={useSSRData ? initialPaginatorInfo : null}
        />
      </div>
    </>
  );
};

FeedPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default FeedPage;
