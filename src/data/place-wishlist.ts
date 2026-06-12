import type {
  PlacePaginator,
  WishlistQueryOptions,
} from '@/types';
import axios from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { mapPaginatorData } from '@/data/utils/data-mapper';
import toast from 'react-hot-toast';

export function useTogglePlaceWishlist(place_id: string) {
  const queryClient = useQueryClient();
  const {
    mutate: toggleWishlist,
    isLoading,
    isSuccess,
  } = useMutation(client.placeWishlist.toggle, {
    onSuccess: (data) => {
      queryClient.setQueryData(
        [`${API_ENDPOINTS.PLACE_WISHLIST}/in_wishlist`, place_id],
        (old) => !old
      );
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message || 'Ошибка при добавлении в избранное');
      }
    },
  });

  return { toggleWishlist, isLoading, isSuccess };
}

export function useRemoveFromPlaceWishlist() {
  const queryClient = useQueryClient();
  const {
    mutate: removeFromWishlist,
    isLoading,
    isSuccess,
  } = useMutation(client.placeWishlist.remove, {
    onSuccess: () => {
      toast.success('Удалено из избранного!');
      queryClient.refetchQueries([API_ENDPOINTS.USERS_PLACE_WISHLIST]);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message || 'Ошибка при удалении из избранного');
      }
    },
  });

  return { removeFromWishlist, isLoading, isSuccess };
}

export function usePlaceWishlist(options?: WishlistQueryOptions) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<PlacePaginator, Error>(
    [API_ENDPOINTS.USERS_PLACE_WISHLIST, options],
    ({ queryKey, pageParam }) =>
      client.placeWishlist.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
    }
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    wishlists: Array.isArray(data?.pages) ? data.pages.flatMap((page) => page.data) : [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    error,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    hasNextPage: Boolean(hasNextPage),
  };
}

export function useInPlaceWishlist({
  enabled,
  place_id,
}: {
  place_id: string;
  enabled: boolean;
}) {
  const { data, isLoading, error, refetch } = useQuery<boolean, Error>(
    [`${API_ENDPOINTS.PLACE_WISHLIST}/in_wishlist`, place_id],
    () => client.placeWishlist.checkIsInWishlist({ place_id }),
    {
      enabled: enabled && !!place_id,
      staleTime: 5 * 60 * 1000, // 5 минут
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );
  return {
    inWishlist: Boolean(data) ?? false,
    isLoading,
    error,
    refetch,
  };
}

