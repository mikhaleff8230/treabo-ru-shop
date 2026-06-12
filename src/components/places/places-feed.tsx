import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePlaces } from '@/data/place';
import PlaceMasonryGrid from '@/components/places/place-masonry-grid';
import Button from '@/components/ui/button';
import Loader from '@/components/ui/loader/spinner/spinner';
import NotFound from '@/components/ui/item-not-found';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { videoCache } from '@/lib/video-cache';
import { Place } from '@/types';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';

interface PlacesFeedProps {
  limit?: number;
  showLoadMore?: boolean;
  className?: string;
  filters?: {
    hashtag_slug?: string;
    favorited_by?: string;
    [key: string]: any;
  };
  // SSR данные для первой порции
  initialPlaces?: Place[];
  initialPaginatorInfo?: any;
}

export default function PlacesFeed({ 
  limit = 20, 
  showLoadMore = true,
  className = '',
  filters = {},
  initialPlaces = [],
  initialPaginatorInfo = null
}: PlacesFeedProps) {
  const { t } = useTranslation('common');
  const [page, setPage] = useState(initialPlaces.length > 0 ? 2 : 1); // Начинаем со страницы 2, если есть SSR данные
  const [allPlaces, setAllPlaces] = useState<Place[]>(initialPlaces);
  const [hasMore, setHasMore] = useState(
    initialPaginatorInfo 
      ? initialPaginatorInfo.currentPage < initialPaginatorInfo.lastPage
      : true
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  
  // Используем клиентскую загрузку только если нет SSR данных или для подгрузки следующих страниц
  const shouldFetch = page > 1 || initialPlaces.length === 0;
  const { places, paginatorInfo, isLoading, error } = usePlaces(
    {
      limit,
      page,
      orderBy: 'created_at',
      sortedBy: 'desc',
      ...filters,
    },
    {
      enabled: shouldFetch, // Отключаем запрос если есть SSR данные и это первая страница
    }
  );

  // Сохраняем позицию скролла перед обновлением
  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
  }, [allPlaces]);

  // Восстанавливаем позицию скролла после обновления
  useEffect(() => {
    if (scrollPositionRef.current > 0 && page > 2) {
      // Небольшая задержка для завершения рендеринга
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'auto'
        });
      });
    }
  }, [allPlaces, page]);

  // Обновляем список плейсов при получении новых данных (только для клиентской загрузки)
  useEffect(() => {
    if (shouldFetch && places && places.length > 0) {
      setIsLoadingMore(false);
      
      if (page === 2 && initialPlaces.length > 0) {
        // Добавляем к SSR данным
        setAllPlaces(prev => [...prev, ...places]);
      } else if (page > 2) {
        // Добавляем к существующим данным
        setAllPlaces(prev => [...prev, ...places]);
      } else if (page === 1 && initialPlaces.length === 0) {
        // Первая загрузка без SSR
        setAllPlaces(places);
      }
      
      setHasMore(
        paginatorInfo?.currentPage < paginatorInfo?.lastPage
      );

      // Предзагрузка видео метаданных для ускорения отображения
      const videoUrls = places
        .filter(place => place.videos && place.videos.length > 0)
        .map(place => place.videos[0])
        .filter(Boolean);
      
      if (videoUrls.length > 0) {
        // Предзагружаем с небольшой задержкой, чтобы не блокировать основной рендеринг
        setTimeout(() => {
          videoCache.preloadVideos(videoUrls);
        }, 100);
      }
    }
  }, [places, paginatorInfo, page, shouldFetch, initialPlaces.length]);

  // Обработчик кнопки "Показать ещё"
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    setPage(prevPage => prevPage + 1);
  }, [isLoadingMore, hasMore]);

  if (error && allPlaces.length === 0) {
    console.error('PlacesFeed error:', error);
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">Ошибка загрузки плейсов</p>
        <p className="text-gray-500 text-sm mb-4">
          {error.message || 'Не удалось загрузить данные с сервера'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Показываем загрузчик только если нет данных вообще (не SSR, не клиентские)
  if (isLoading && !allPlaces.length && initialPlaces.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader showText={false} />
      </div>
    );
  }

  if (!isLoading && !allPlaces.length && initialPlaces.length === 0) {
    return (
      <NotFound 
        text="Плейсы не найдены!" 
        className="px-4 pt-5 pb-10 md:px-6 md:pt-6 lg:px-7 lg:pb-12 3xl:px-8"
      />
    );
  }

  return (
    <div className={cn('w-full px-4 pt-5 pb-9 md:px-6 md:pb-10 md:pt-6 lg:px-7 lg:pb-12 3xl:px-8', className)}>
      {/* Единый компонент для отображения masonry grid */}
      <PlaceMasonryGrid 
        places={allPlaces}
      />

      {/* Кнопка "Показать ещё" с лоадером только для кнопки */}
      {showLoadMore && hasMore && (
        <div className="mt-8 grid place-content-center md:mt-10">
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
          Все плейсы загружены
        </div>
      )}
    </div>
  );
} 