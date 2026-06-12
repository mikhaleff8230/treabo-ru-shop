import { MyReportsQueryOptions, ReportsPaginator } from '@/types';
import { useQuery } from '@tanstack/react-query';
import client from './client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { mapPaginatorData } from '@/data/utils/data-mapper';

export function useMyReports(options?: MyReportsQueryOptions) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useQuery<ReportsPaginator, Error>(
    [API_ENDPOINTS.MY_REPORTS, options],
    ({ queryKey, pageParam }) =>
      client.myReports.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
    }
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    reports: Array.isArray(data?.pages) ? data.pages.flatMap((page) => page.data) : [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    error,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
}
