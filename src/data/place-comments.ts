import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API_ENDPOINTS } from './client/endpoints';
import toast from 'react-hot-toast';

export interface PlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  parent_id?: string | null;
  comment: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: PlaceComment[];
  created_at: string;
  updated_at: string;
}

export interface PlaceCommentsResponse {
  success: boolean;
  data: PlaceComment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Хук для получения списка комментариев плейса
 */
export function usePlaceComments(place_id: string, enabled: boolean = true) {
  const isValidPlaceId = place_id && 
    place_id !== 'undefined' && 
    place_id !== 'null' && 
    place_id !== '' && 
    !isNaN(Number(place_id)) && 
    Number(place_id) > 0;

  const { data, isLoading, error, refetch } = useQuery<PlaceCommentsResponse>(
    ['place-comments', place_id],
    () => client.placeComments.all({ place_id }),
    { 
      enabled: enabled && isValidPlaceId,
      retry: false
    }
  );
  
  return { 
    comments: data?.data || [], 
    meta: data?.meta,
    isLoading, 
    error, 
    refetch 
  };
}

/**
 * Хук для создания комментария
 */
export function useCreatePlaceComment(place_id: string) {
  const queryClient = useQueryClient();
  
  const { mutate: createComment, isLoading, isSuccess } = useMutation<
    { success: boolean; data: PlaceComment; message: string },
    unknown,
    { comment: string; parent_id?: string }
  >(
    (input) => client.placeComments.create({ 
      place_id, 
      comment: input.comment,
      parent_id: input.parent_id 
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['place-comments', place_id]);
        toast.success('Комментарий добавлен');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Ошибка при добавлении комментария');
      },
    }
  );
  
  return { 
    createComment, 
    isLoading, 
    isSuccess 
  };
}

/**
 * Хук для обновления комментария
 */
export function useUpdatePlaceComment(place_id: string) {
  const queryClient = useQueryClient();
  
  const { mutate: updateComment, isLoading, isSuccess } = useMutation<
    { success: boolean; data: PlaceComment; message: string },
    unknown,
    { comment_id: string; comment: string }
  >(
    (input) => client.placeComments.update({ 
      place_id, 
      comment_id: input.comment_id,
      comment: input.comment 
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['place-comments', place_id]);
        toast.success('Комментарий обновлен');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Ошибка при обновлении комментария');
      },
    }
  );
  
  return { 
    updateComment, 
    isLoading, 
    isSuccess 
  };
}

/**
 * Хук для удаления комментария
 */
export function useDeletePlaceComment(place_id: string) {
  const queryClient = useQueryClient();
  
  const { mutate: deleteComment, isLoading, isSuccess } = useMutation<
    { success: boolean; message: string },
    unknown,
    string
  >(
    (comment_id) => client.placeComments.delete({ 
      place_id, 
      comment_id 
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['place-comments', place_id]);
        toast.success('Комментарий удален');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Ошибка при удалении комментария');
      },
    }
  );
  
  return { 
    deleteComment, 
    isLoading, 
    isSuccess 
  };
}

