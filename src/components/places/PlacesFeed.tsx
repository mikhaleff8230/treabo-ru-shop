import React from 'react';
import { usePlacesFeed } from '@/feeds/places/usePlacesFeed';
import { FEED_TYPES, FeedType } from '@/feeds/places/feeds.config';
import { PlaceGrid } from './PlaceGrid';
import { InfiniteScroll } from './Pagination/InfiniteScroll';
import { LoadMoreButton } from './Pagination/LoadMoreButton';

interface PlacesFeedProps {
  limit?: number;
  showLoadMore?: boolean;
  filters?: {
    hashtag_slug?: string;
    favorited_by?: string;
    similar_to?: string;
    [key: string]: any;
  };
  className?: string;
  initialPlaces?: any[];
  initialPaginatorInfo?: any;
}

/**
 * Универсальный компонент для отображения фидов плейсов
 * Поддерживает разные типы: MAIN, HASHTAG, FAVORITES, SIMILAR
 */
export default function PlacesFeed({
  limit = 30,
  showLoadMore = false,
  filters = {},
  className = '',
  initialPlaces = [],
  initialPaginatorInfo,
}: PlacesFeedProps) {

  // Безопасная проверка фильтров
  const safeFilters = filters || {};

  // Определяем тип фида на основе фильтров
  const getFeedType = () => {
    if (safeFilters.hashtag_slug) return FEED_TYPES.HASHTAG;
    if (safeFilters.favorited_by) return FEED_TYPES.FAVORITES;
    if (safeFilters.similar_to) return FEED_TYPES.SIMILAR;
    return FEED_TYPES.MAIN;
  };

  const feedType = getFeedType();

  // Подготавливаем параметры для фида
  const feedParams = (() => {
    switch (feedType) {
      case FEED_TYPES.HASHTAG:
        return { hashtag_slug: safeFilters.hashtag_slug, limit };
      case FEED_TYPES.FAVORITES:
        return { favorited_by: safeFilters.favorited_by, limit };
      case FEED_TYPES.SIMILAR:
        return { place_id: safeFilters.similar_to, limit };
      default:
        return { limit };
    }
  })();

  // Используем хук для получения данных
  const placesData = usePlacesFeed({
    type: feedType,
    params: feedParams,
  });

  const {
    places,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = placesData;

  // Обработка ошибок
  if (error) {
    console.error('PlacesFeed: Error loading places:', error);
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Ошибка загрузки плейсов</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // Loading состояние для начальной загрузки
  if (isLoading && places.length === 0) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если нет плейсов
  if (!places || places.length === 0) {
    return (
      <div className={`flex justify-center py-12 text-gray-500 ${className}`}>
        Плейсы не найдены
      </div>
    );
  }

  // Рендерим в зависимости от типа фида
  if (feedType === FEED_TYPES.MAIN || feedType === FEED_TYPES.SIMILAR) {
    // Cursor-based feed с бесконечной прокруткой
    return (
      <div className={className}>
        <InfiniteScroll
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          children={
            <>
              <PlaceGrid
                places={places}
                onLastItemRef={(ref: React.RefObject<HTMLDivElement>) => {
                  // IntersectionObserver сам управляет последним элементом
                }}
              />

              {/* Loading indicator при подгрузке */}
              {isFetchingNextPage && (
                <div className="h-32 opacity-0" />
              )}
            </>
          }
        />
      </div>
    );
  } else {
    // Page-based feed с кнопкой "Загрузить еще"
    return (
      <div className={className}>
        <PlaceGrid places={places} />

        {/* Кнопка "Загрузить еще" */}
        {showLoadMore && hasNextPage && (
          <div className="mt-8 flex justify-center">
            <LoadMoreButton
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
            />
          </div>
        )}
      </div>
    );
  }
}