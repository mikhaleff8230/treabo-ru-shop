import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API_ENDPOINTS } from './client/endpoints';
import toast from 'react-hot-toast';

export function useTogglePlaceLike(place_id: string) {
  const queryClient = useQueryClient();
  const { mutate: togglePlaceLike, isLoading, isSuccess, data } = useMutation<
    { liked: boolean; likes_count: number },
    unknown,
    void
  >(
    () => client.placeLike.toggle({ place_id }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries([API_ENDPOINTS.PLACES]);
        queryClient.invalidateQueries(['place-likes', place_id]);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Ошибка лайка');
      },
    }
  );
  
  return { 
    togglePlaceLike, 
    isLoading, 
    isSuccess, 
    data 
  };
}

export function useIsPlaceLiked(place_id: string, enabled: boolean) {
  const isValidPlaceId = place_id && 
    place_id !== 'undefined' && 
    place_id !== 'null' && 
    place_id !== '' && 
    !isNaN(Number(place_id)) && 
    Number(place_id) > 0;

  const { data, isLoading, error, refetch } = useQuery(
    ['place-likes', 'check', place_id],
    () => client.placeLike.check({ place_id }),
    { 
      enabled: enabled && isValidPlaceId,
      retry: false
    }
  );
  
  return { 
    liked: data?.liked || false, 
    isLoading, 
    error, 
    refetch 
  };
}

export function useMyPlaceLikes(params?: any) {
  const opts = { limit: 10000, ...params };
  return useQuery(
    [API_ENDPOINTS.MY_PLACE_LIKES, opts],
    () => client.placeLike.my(opts)
  );
} 