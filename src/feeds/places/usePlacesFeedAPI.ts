import client from '@/data/client';

export function usePlacesFeedAPI() {
  const fetchPlacesFeed = async (params: Record<string, any>) => {
    try {
      // Для разных типов запросов используем разные эндпоинты
      if (params.hashtag_slug) {
        // Запрос по хэштегу - используем обычный places.all с фильтром
        return client.places.all({
          tag: params.hashtag_slug,
          limit: params.limit || 30,
          page: params.page || 1,
          orderBy: 'created_at',
          sortedBy: 'desc',
        });
      } else if (params.favorited_by) {
        // Запрос избранных плейсов текущего пользователя
        // Endpoint /my-place-wishlists использует авторизацию
        try {
          return await client.placeWishlist.all({
            limit: params.limit || 30,
            page: params.page || 1,
          });
        } catch (error) {
          console.error('usePlacesFeedAPI: Error getting favorites:', error);
          // Возвращаем пустой результат при ошибке
          return { data: [], meta: { total: 0, current_page: 1, last_page: 1 } };
        }
      } else if (params.place_id) {
        // Запрос похожих плейсов
        return client.places.similar(params.place_id, {
          limit: params.limit || 24,
          cursor: params.cursor,
        });
      } else {
        // Основной фид - пробуем places.feed, если не работает - places.all
        try {
          const result = await client.places.feed(params);
          return result;
        } catch (feedError) {
          // Fallback на places.all
          const result = await client.places.all({
            ...params,
            orderBy: 'created_at',
            sortedBy: 'desc'
          });
          return result;
        }
      }
    } catch (error) {
      console.error('usePlacesFeedAPI: Error fetching places:', error);
      throw error;
    }
  };

  return {
    fetchPlacesFeed,
  };
}
