import { useQuery } from '@tanstack/react-query';
import { fetchFavoritesPlaces } from '@/api/places/places.api';

export function useFavoritesPlacesQuery(params: {
  favorited_by: string;
  page?: number;
  limit?: number;
}) {
  const { favorited_by, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['places-favorites', favorited_by, page, limit],
    queryFn: () => fetchFavoritesPlaces({ favorited_by, page, limit }),
  });
}
