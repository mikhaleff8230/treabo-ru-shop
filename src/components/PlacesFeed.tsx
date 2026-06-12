import React, { useRef } from 'react';
import { useInfinitePlacesFeed } from '@/data/places/useInfinitePlacesFeed';
import { usePlacesWindow } from '@/data/places/virtualization/usePlacesWindow';
import { VirtualizedMasonry } from './VirtualizedMasonry';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';

export function PlacesFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const infiniteRef = useRef<HTMLDivElement>(null);

  // Получаем все плейсы + пагинацию
  const {
    places,          // полный массив данных
    fetchNextPage,   // функция для подгрузки следующей страницы
    hasNextPage,
    isFetching
  } = useInfinitePlacesFeed();

  // Хук виртуализации — ограничиваем DOM
  const {
    visibleItems,
    paddingTop,
    paddingBottom
  } = usePlacesWindow({
    items: places,
    containerRef,
    estimatedItemHeight: 320, // аппроксимация высоты карточки
    overscan: 10,
    windowSize: 60, // max DOM элементов
  });

  // intersectionObserver для infinite scroll
  useIntersectionObserver({
    target: infiniteRef,
    enabled: hasNextPage && !isFetching,
    onIntersect: fetchNextPage,
  });

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto"
    >
      <VirtualizedMasonry
        places={visibleItems}
        topSpacerHeight={paddingTop}
        bottomSpacerHeight={paddingBottom}
        onPlaceClick={(place) => console.log('Clicked place', place.id)}
      />

      {/* Anchor для InfiniteScroll */}
      <div
        ref={infiniteRef}
        style={{ height: 1, width: '100%', pointerEvents: 'none' }}
        data-infinite-scroll-trigger
      />
    </div>
  );
}
