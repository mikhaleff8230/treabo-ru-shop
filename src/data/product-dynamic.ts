import type {
  ProductQueryOptions,
  Product,
  ProductPaginator,
} from '@/types';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import client from '@/data/client';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function useDynamicProducts(
  options?: Partial<ProductQueryOptions>,
  config?: any
) {
  const router = useRouter();
  const locale = router?.locale || 'ru';

  const formattedOptions = useMemo(() => ({
    ...options,
    language: locale,
  }), [options, locale]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS_DYNAMIC, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.products.dynamic(Object.assign({}, queryKey[1], pageParam)),
    {
      ...config,
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
      staleTime: 30000, // 30 секунд
      cacheTime: 300000, // 5 минут
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: 1000,
    }
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  // Ограничиваем количество товаров для предотвращения бесконечной загрузки
  const allProducts = Array.isArray(data?.pages) ? data.pages.flatMap((page) => page.data) : [];
  const maxProducts = 1000; // Максимум 1000 товаров
  const limitedProducts = allProducts.slice(0, maxProducts);
  const hasMoreLimited = allProducts.length < maxProducts && hasNextPage;

  return {
    products: limitedProducts,
    paginatorInfo: Array.isArray(data?.pages)
      ? data?.pages[data.pages.length - 1]
      : null,
    isLoading,
    error,
    hasNextPage: hasMoreLimited,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
  };
}

export function useProductSearch(
  query: string,
  options?: Partial<ProductQueryOptions>,
  config?: any
) {
  const router = useRouter();
  const locale = router?.locale || 'ru';

  const formattedOptions = useMemo(() => ({
    ...options,
    language: locale,
  }), [options, locale]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS_SEARCH, { q: query, ...formattedOptions }],
    ({ queryKey, pageParam }) =>
      client.products.search(query, Object.assign({}, queryKey[1], pageParam)),
    {
      ...config,
      enabled: !!query && query.length > 2, // Поиск только при длине запроса > 2
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
      staleTime: 60000, // 1 минута для поиска
      cacheTime: 300000, // 5 минут
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    }
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  // Ограничиваем количество товаров для поиска
  const allProducts = Array.isArray(data?.pages) ? data.pages.flatMap((page) => page.data) : [];
  const maxProducts = 500; // Максимум 500 товаров для поиска
  const limitedProducts = allProducts.slice(0, maxProducts);
  const hasMoreLimited = allProducts.length < maxProducts && hasNextPage;

  return {
    products: limitedProducts,
    paginatorInfo: Array.isArray(data?.pages)
      ? data?.pages[data.pages.length - 1]
      : null,
    isLoading,
    error,
    hasNextPage: hasMoreLimited,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
  };
}

export function useProductFilters() {
  const router = useRouter();
  const locale = router?.locale || 'ru';

  const { data, isLoading, error } = useQuery(
    [API_ENDPOINTS.PRODUCTS_FILTERS, { language: locale }],
    () => client.products.getFilters(),
    {
      staleTime: 600000, // 10 минут
      cacheTime: 1800000, // 30 минут
      refetchOnWindowFocus: false,
    }
  );

  return {
    filters: data,
    isLoading,
    error,
  };
}