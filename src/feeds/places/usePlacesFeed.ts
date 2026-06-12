import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { usePlacesFeedAPI } from './usePlacesFeedAPI';
import { FEED_TYPES, FeedType } from './feeds.config';

interface UsePlacesFeedOptions {
  type: FeedType;
  params: Record<string, any>;
}

interface UsePlacesFeedOptions {
  type: FeedType;
  params: Record<string, any>;
}

export function usePlacesFeed({ type, params }: UsePlacesFeedOptions) {
  const { fetchPlacesFeed } = usePlacesFeedAPI();

  // Для cursor-based фидов используем infinite query
  if (type === FEED_TYPES.MAIN || type === FEED_TYPES.SIMILAR) {
    const query = useInfiniteQuery({
      queryKey: ['places-feed', type, params],
      queryFn: async ({ pageParam = null }: { pageParam?: string | null }) => {
        const queryParams = { ...params };
        if (pageParam) {
          queryParams.cursor = pageParam;
        }
        return fetchPlacesFeed(queryParams);
      },
      getNextPageParam: (lastPage: any) => {
        return lastPage.meta?.has_more ? lastPage.meta?.next_cursor : undefined;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    });

    const places = query.data?.pages?.flatMap((page: any) => page.data || []) || [];

    return {
      places,
      isLoading: query.isLoading,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      fetchNextPage: query.fetchNextPage,
      error: query.error,
    };
  }

  // Для page-based фидов (HASHTAG, FAVORITES) и MAIN фида используем state-based пагинацию
  else {
    const [page, setPage] = useState(1);
    const [allPlaces, setAllPlaces] = useState<any[]>([]);

    const { data, error, isLoading, isFetching } = useQuery({
      queryKey: ['places-feed', type, params, page],
      queryFn: () => fetchPlacesFeed({ ...params, page }),
      keepPreviousData: true,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        if (!res?.data) return;
        setAllPlaces((prev) => page === 1 ? res.data : [...prev, ...res.data]);
      },
    });

    const paginatorInfo = data?.meta ?? null;
    const hasNextPage =
      paginatorInfo?.current_page &&
      paginatorInfo?.per_page &&
      paginatorInfo?.total
        ? paginatorInfo.current_page * paginatorInfo.per_page < paginatorInfo.total
        : false;

    const isLoadingMore = isFetching && !isLoading;

    const fetchNextPage = () => {
      if (!hasNextPage || isLoadingMore) return;
      setPage((prev) => prev + 1);
    };

    return {
      places: allPlaces,
      isLoading,
      isFetchingNextPage: isLoadingMore,
      hasNextPage,
      fetchNextPage,
      error,
    };
  }
}