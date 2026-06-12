import { useState, useEffect, useRef, useCallback } from 'react';
import { Place } from '@/types';
import PlaceMasonryGrid from '@/components/places/place-masonry-grid';
import { usePlaces } from '@/data/place';
import Loader from '@/components/ui/loader/spinner/spinner';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';

interface SimilarPlacesProps {
  currentPlaceId: string;
  currentPlaceTitle?: string;
  className?: string;
}

export default function SimilarPlaces({ 
  currentPlaceId, 
  currentPlaceTitle = '',
  className = '' 
}: SimilarPlacesProps) {
  const { t } = useTranslation('common');
  const [page, setPage] = useState(1);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  // Запрос плейсов с фильтрацией по похожести (пока просто все плейсы)
  const { places, paginatorInfo, isLoading, error } = usePlaces({
    limit: 12,
    page,
    orderBy: 'created_at',
    sortedBy: 'desc',
  });

  // Сохраняем позицию скролла перед обновлением
  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
  }, [allPlaces]);

  // Восстанавливаем позицию скролла после обновления
  useEffect(() => {
    if (scrollPositionRef.current > 0 && page > 1) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'auto'
        });
      });
    }
  }, [allPlaces, page]);

  // Фильтруем похожие плейсы
  const getSimilarPlaces = useCallback((places: Place[]) => {
    if (!currentPlaceTitle) return places.filter(p => p.id !== currentPlaceId);
    
    // Простой алгоритм похожести по названию
    const keywords = currentPlaceTitle.toLowerCase().split(' ').filter(word => word.length > 2);
    
    return places
      .filter(place => place.id !== currentPlaceId)
      .map(place => ({
        ...place,
        similarity: keywords.reduce((score, keyword) => {
          if (place.title?.toLowerCase().includes(keyword)) score += 1;
          if (place.description?.toLowerCase().includes(keyword)) score += 0.5;
          return score;
        }, 0)
      }))
      .sort((a, b) => (b.similarity as number) - (a.similarity as number));
  }, [currentPlaceId, currentPlaceTitle]);

  // Обновляем список плейсов при получении новых данных
  useEffect(() => {
    if (places && places.length > 0) {
      setIsLoadingMore(false);
      const similarPlaces = getSimilarPlaces(places);
      
      if (page === 1) {
        setAllPlaces(similarPlaces);
      } else {
        setAllPlaces((prev: Place[]) => [...prev, ...similarPlaces]);
      }
      
      setHasMore(
        paginatorInfo?.currentPage < paginatorInfo?.lastPage
      );
    }
  }, [places, paginatorInfo, page, getSimilarPlaces]);

  // Обработчик кнопки "Показать ещё"
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    setPage(prevPage => prevPage + 1);
  }, [isLoadingMore, hasMore]);


  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Ошибка загрузки похожих плейсов
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Единый компонент для отображения masonry grid */}
      {allPlaces && allPlaces.length > 0 && (
        <PlaceMasonryGrid 
          places={allPlaces}
          className={className}
        />
      )}

      {/* Кнопка "Показать ещё" */}
      {hasMore && allPlaces.length > 0 && (
        <div className="mt-8 grid place-content-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore || isLoading}
            isLoading={isLoadingMore || isLoading}
          >
            {t('text-loadmore')}
          </Button>
        </div>
      )}

      {/* Индикатор окончания списка */}
      {!hasMore && allPlaces.length > 0 && (
        <div className="text-center py-8 text-light-base dark:text-dark-base text-sm">
          Все похожие плейсы загружены
        </div>
      )}

      {/* Пустое состояние */}
      {!isLoading && allPlaces.length === 0 && (
        <div className="text-center py-12 text-light-base dark:text-dark-base">
          <div className="w-16 h-16 bg-light-200 dark:bg-dark-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p>Похожие плейсы не найдены</p>
        </div>
      )}
    </div>
  );
} 