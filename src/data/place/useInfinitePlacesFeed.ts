// УСТАРЕВШИЙ ХУК - используется только для обратной совместимости
// Рекомендуется использовать useCursorPlacesQuery из @/queries/places

import { useCursorPlacesQuery } from '@/queries/places/useCursorPlacesQuery';

/**
 * @deprecated Используйте useCursorPlacesQuery из @/queries/places
 */
export function useInfinitePlacesFeed(options: {
  limit?: number;
  initialData?: any;
} = {}) {
  const { limit = 30 } = options;

  return useCursorPlacesQuery({ limit });
}

