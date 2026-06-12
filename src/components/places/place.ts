import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import client from '@/data/client';
import { Place, QueryOptions } from '@/types';

export const usePlaces = (options: any = {}, queryOptions: any = {}) => {
  const opts = { limit: 10000, ...options };
  const { data, error, isLoading } = useQuery(
    [API_ENDPOINTS.PLACES, opts],
    () => client.places.all(opts),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 секунд
      cacheTime: 60000, // 1 минута
      refetchOnWindowFocus: false,
      retry: 3, // Повторить 3 раза при ошибке
      retryDelay: 1000, // Задержка 1 секунда между попытками
      ...queryOptions, // Позволяем переопределить опции, например enabled
    }
  );



  return {
    places: data?.data ?? [],
    paginatorInfo: data?.meta,
    error,
    isLoading,
  };
};

export const usePlace = (id: string) => {
  const { data, error, isLoading } = useQuery(
    [API_ENDPOINTS.PLACES, id],
    () => client.places.get(id),
    {
      enabled: !!id,
    }
  );

  return {
    place: data,
    error,
    isLoading,
  };
};

export const useCreatePlace = () => {
  const queryClient = useQueryClient();
  return useMutation((formData: FormData) => client.places.create(formData), {
    onSuccess: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PLACES);
    },
  });
}; 