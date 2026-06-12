// УСТАРЕВШИЙ ХУК - используется только для обратной совместимости
// Рекомендуется использовать usePlacesFeed из @/feeds/places

import { usePlacesFeed } from '@/feeds/places/usePlacesFeed';
import { FEED_TYPES } from '@/feeds/places/feeds.config';
import { Place } from '@/types';

interface UseUnifiedPlacesFeedOptions {
  limit?: number;
  filters?: {
    hashtag_slug?: string;
    favorited_by?: string;
    [key: string]: any;
  };
  initialData?: {
    pages?: { data?: Place[]; meta?: any }[];
    pageParams?: any[];
  };
}

/**
 * @deprecated Используйте usePlacesFeed из @/feeds/places
 */
export function useUnifiedPlacesFeed({
  limit = 30,
  filters = {},
}: UseUnifiedPlacesFeedOptions = {}) {
  // Определяем тип фида на основе фильтров
  const getFeedType = () => {
    if (filters.hashtag_slug) return FEED_TYPES.HASHTAG;
    if (filters.favorited_by) return FEED_TYPES.FAVORITES;
    return FEED_TYPES.MAIN;
  };

  const feedType = getFeedType();
  const feedParams = filters.hashtag_slug
    ? { hashtag_slug: filters.hashtag_slug }
    : filters.favorited_by
      ? { favorited_by: filters.favorited_by }
      : { limit };

  const {
    places,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = usePlacesFeed({
    type: feedType,
    params: feedParams,
  });

  return {
    places,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    hasFilters: Object.keys(filters).length > 0,
  };
}

