import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPlacesFeed } from '@/api/places/places.api';

export function useCursorPlacesQuery(params: {
  limit?: number;
}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: ['places-feed', limit],
    queryFn: ({ pageParam }) =>
      fetchPlacesFeed({ ...params, cursor: pageParam }),
    getNextPageParam: lastPage =>
      lastPage.meta?.has_more ? lastPage.meta.next_cursor : undefined,
  });
}
