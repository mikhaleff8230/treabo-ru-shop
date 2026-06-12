import PlacesFeed from '@/components/places/places-feed';
import { TitleSeo } from '@/components/seo/title-seo';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import Layout from '@/layouts/_layout';
import type { NextPageWithLayout, Hashtag, Place } from '@/types';
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
} from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { dehydrate, QueryClient } from '@tanstack/react-query';

// Dynamic rendering - no static generation
type PageProps = {
  hashtag: Hashtag;
  initialPlaces: Place[];
  initialPaginatorInfo: any;
};

export const getServerSideProps: GetServerSideProps<
  PageProps
> = async ({ params, locale, res }) => {
  const { hashtagSlug } = params!;
  
  // Set cache headers for better performance
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
  
  const queryClient = new QueryClient();
  const SSR_LIMIT = 20; // Первая порция через SSR
  
  try {
    // ВАЖНО: На сервере используем прямой fetch, а не client (который работает только в браузере)
    const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';
    
    // Загружаем плейсы с фильтром по хэштегу
    const placesUrl = new URL(`${apiUrl}${API_ENDPOINTS.PLACES}`);
    placesUrl.searchParams.append('hashtag_slug', hashtagSlug as string);
    placesUrl.searchParams.append('limit', String(SSR_LIMIT));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout
    
    const placesRes = await fetch(placesUrl.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!placesRes.ok) {
      console.error('API вернул статус:', placesRes.status, placesRes.statusText);
      return {
        notFound: true,
      };
    }
    
    const placesText = await placesRes.text();
    let placesData;
    try {
      placesData = JSON.parse(placesText);
    } catch (e) {
      console.error('JSON parse error:', e, 'Response text:', placesText);
      return {
        notFound: true,
      };
    }
    
    // Обрабатываем ответ - Laravel paginate возвращает { data: [...], links: {...}, meta: {...} }
    // Или может быть просто { data: [...] } если не пагинация
    const placesResponse = placesData.data !== undefined 
      ? { data: placesData.data, meta: placesData.meta || null }
      : { data: Array.isArray(placesData) ? placesData : [], meta: null };
    
    console.log('HashtagPage SSR - получены данные:', {
      hashtagSlug,
      placesCount: placesResponse?.data?.length || 0,
      hasMeta: !!placesResponse?.meta,
      firstPlaceHasHashtags: placesResponse?.data?.[0]?.hashtags?.length > 0,
    });
    
    // Если плейсы найдены, берем первый хэштег из первого плейса
    let hashtag: Hashtag | null = null;
    if (placesResponse?.data && Array.isArray(placesResponse.data) && placesResponse.data.length > 0) {
      const firstPlace = placesResponse.data[0];
      if (firstPlace.hashtags && Array.isArray(firstPlace.hashtags) && firstPlace.hashtags.length > 0) {
        // Ищем хештег по slug, если не найден - берем первый
        hashtag = firstPlace.hashtags.find((h: Hashtag) => {
          const hSlug = typeof h === 'string' ? null : (h?.slug || null);
          return hSlug === hashtagSlug;
        }) || firstPlace.hashtags[0];
        
        // Если hashtag - объект, используем его, если строка - создаем объект
        if (typeof hashtag === 'string') {
          hashtag = {
            id: undefined,
            name: hashtag,
            slug: hashtagSlug as string,
          };
        }
      }
    }
    
    if (!hashtag) {
      console.error('Хештег не найден для slug:', hashtagSlug, {
        placesCount: placesResponse?.data?.length || 0,
        firstPlaceHasHashtags: placesResponse?.data?.[0]?.hashtags?.length > 0,
      });
      return {
        notFound: true,
      };
    }

    const initialPlaces = placesResponse?.data ?? [];
    const initialPaginatorInfo = placesResponse?.meta ?? null;
    
    return {
      props: {
        hashtag,
        initialPlaces,
        initialPaginatorInfo,
        dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
        ...(await serverSideTranslations(locale!, ['common'])),
      },
    };
  } catch (error) {
    console.error('HashtagPage SSR - ошибка:', error);
    // В режиме разработки показываем детали ошибки
    if (process.env.NODE_ENV === 'development') {
      console.error('HashtagPage SSR - детали ошибки:', {
        hashtagSlug,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    }
    return {
      notFound: true,
    };
  }
};

const HashtagPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ hashtag, initialPlaces, initialPaginatorInfo }) => {
  const { t } = useTranslation('common');
  
  const filters = {
    hashtag_slug: hashtag.slug,
  };

  // Формируем canonical URL для страницы хештега плейсов
  const baseUrl = 'https://sancan.ru';
  const canonicalUrl = `${baseUrl}/places/element/${hashtag.slug}`;

  return (
    <>
      <TitleSeo 
        title={`#${hashtag.name} - Плейсы`}
        canonical={canonicalUrl}
      />
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-heading mb-4">
            #{hashtag.name}
          </h1>
          <p className="text-body text-lg max-w-2xl mx-auto">
            Плейсы с хэштегом #{hashtag.name}
          </p>
        </div>
        <PlacesFeed 
          limit={20} 
          showLoadMore={true}
          filters={filters}
          initialPlaces={initialPlaces}
          initialPaginatorInfo={initialPaginatorInfo}
        />
      </div>
    </>
  );
};

HashtagPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default HashtagPage;

