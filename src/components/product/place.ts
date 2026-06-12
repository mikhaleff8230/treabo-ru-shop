import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import client from '@/data/client';
import { Place, QueryOptions } from '@/types';

export const usePlaces = (options: any) => {
  const { data, error, isLoading } = useQuery(
    [API_ENDPOINTS.PLACES, options],
    () => client.places.all(options),
    {
      keepPreviousData: true,
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
  const queryClient = useQuery();
  return useMutation((formData: FormData) => client.places.create(formData), {
    onSuccess: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PLACES);
      queryClient.invalidateQueries(API_ENDPOINTS.MY_PLACES);
    },
  });
};

export const useMyPlaces = (options: any) => {
  const { data, error, isLoading } = useQuery(
    [API_ENDPOINTS.MY_PLACES, options],
    () => client.places.my(options),
    {
      keepPreviousData: true,
    }
  );

  return {
    places: data?.data ?? [],
    paginatorInfo: data?.meta,
    error,
    isLoading,
  };
}; 