import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API_ENDPOINTS } from './client/endpoints';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export function useDeletePlace() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const { mutate: deletePlace, isLoading, isSuccess } = useMutation<
    { success: boolean },
    unknown,
    string
  >(
    (place_id: string) => client.places.delete(place_id),
    {
      onSuccess: (data: any, place_id: string) => {
        // Показываем уведомление об успехе
        toast.success('Плейс успешно удален');
        
        // Полностью очищаем кэш плейсов для предотвращения мигания
        queryClient.removeQueries({ queryKey: [API_ENDPOINTS.PLACES] });
        queryClient.removeQueries({ queryKey: [API_ENDPOINTS.PLACES, place_id] });
        
        // Инвалидируем все связанные запросы
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === API_ENDPOINTS.PLACES || 
            (Array.isArray(query.queryKey) && query.queryKey[0] === API_ENDPOINTS.PLACES)
        });
        
        // Переходим на страницу плейсов
        router.push('/places');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Ошибка удаления плейса');
      },
    }
  );
  
  return { deletePlace, isLoading, isSuccess };
} 