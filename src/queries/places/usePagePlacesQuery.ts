import { useQuery } from '@tanstack/react-query';
import { fetchPlacesByHashtag } from '@/api/places/places.api';

export function usePagePlacesQuery(params: {
  hashtag_slug: string;
  page?: number;
  limit?: number;
}) {
  const { hashtag_slug, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['places-page', hashtag_slug, page, limit],
    queryFn: () => fetchPlacesByHashtag({ hashtag_slug, page, limit }),
  });
}
