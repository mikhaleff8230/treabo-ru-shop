import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { NextPageWithLayout, Place } from '@/types';
import Layout from '@/layouts/_layout';
import PlacesFeed from '@/components/places/PlacesFeed';
import { TitleSeo } from '@/components/seo/title-seo';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { useMe } from '@/data/user';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDrawer } from '@/components/drawer-views/context';

interface FavoritesPageProps {
  initialPlaces: Place[];
  initialPaginatorInfo: any;
}

export const getServerSideProps: GetServerSideProps<FavoritesPageProps> = async ({ locale, res }) => {
  // Устанавливаем заголовки кэширования
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );

  const queryClient = new QueryClient();
  const SSR_LIMIT = 30;

  try {
    // Для SSR загружаем плейсы без фильтра (проверка авторизации будет на клиенте)
    // Если пользователь не авторизован, страница обработает это на клиенте
    const response = await import('@/data/client').then(client => client.default.places.all({
      limit: SSR_LIMIT,
      orderBy: 'created_at',
      sortedBy: 'desc'
    }));

    const initialPlaces = response?.data ?? [];
    const initialPaginatorInfo = response?.meta ?? null;

    return {
      props: {
        initialPlaces,
        initialPaginatorInfo,
        ...(await serverSideTranslations(locale!, ['common'])),
        dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
      },
    };
  } catch (error) {
    return {
      props: {
        initialPlaces: [],
        initialPaginatorInfo: null,
        ...(await serverSideTranslations(locale!, ['common'])),
        dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
      },
    };
  }
};

const FavoritesPage: NextPageWithLayout<FavoritesPageProps> = ({ initialPlaces, initialPaginatorInfo }) => {
  const { t } = useTranslation('common');
  const { me, isAuthorized, isLoading: isMeLoading } = useMe();
  const router = useRouter();
  const { openDrawer } = useDrawer();

  // Если пользователь не авторизован, открываем модальное окно авторизации
  useEffect(() => {
    if (!isMeLoading && !isAuthorized) {
      openDrawer('AUTH_VIEW');
      // Возвращаем на главную страницу после открытия модалки
      router.push('/');
    }
  }, [isAuthorized, isMeLoading, openDrawer, router]);

  // Показываем загрузку пока проверяем авторизацию
  if (isMeLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если не авторизован, не показываем контент (модалка авторизации откроется в useEffect)
  if (!isAuthorized) {
    return null;
  }

  // Для авторизованных пользователей показываем избранные плейсы
  const favoritedBy = me?.id;
  const hasValidUser = favoritedBy && (typeof favoritedBy === 'number' || typeof favoritedBy === 'string') && Number(favoritedBy) > 0;
  const filters = hasValidUser ? { favorited_by: String(favoritedBy) } : {};

  return (
    <>
      <TitleSeo title="Мои плейсы - SANCAN" />

      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-heading mb-4">
            Мои плейсы
          </h1>
          <p className="text-body text-lg max-w-2xl mx-auto">
            Плейсы, которые вы добавили в избранное
          </p>
        </div>

        <PlacesFeed
          limit={30}
          showLoadMore={true}
          filters={filters}
          initialPlaces={[]} // Не используем SSR данные для избранных, так как нужен фильтр по пользователю
          initialPaginatorInfo={null}
        />
      </div>
    </>
  );
};

FavoritesPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default FavoritesPage;
