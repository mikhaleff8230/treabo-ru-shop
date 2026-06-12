import { useState, useEffect, useCallback, useRef } from 'react';
import { Place } from '@/domain/place/place.types';

interface UseVirtualizedWindowOptions {
  items: Place[];
  containerRef: React.RefObject<HTMLElement>;
  itemHeightEstimate?: number; // Примерная высота элемента (px)
  overscan?: number; // Дополнительные элементы сверху/снизу для плавности
  minWindowSize?: number; // Минимальный размер окна
  maxWindowSize?: number; // Максимальный размер окна
}

interface VirtualizedWindowResult {
  visibleItems: Place[];
  visibleStartIndex: number;
  visibleEndIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  totalHeight: number;
  scrollTop: number;
  containerHeight: number;
}

export function useVirtualizedWindow({
  items,
  containerRef,
  itemHeightEstimate = 300, // Средняя высота карточки места
  overscan = 10,
  minWindowSize = 40, // windowSize = 40
  maxWindowSize = 40, // Фиксированный размер окна
}: UseVirtualizedWindowOptions): VirtualizedWindowResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

  // Размеры окна виртуализации (фиксированный windowSize = 40)
  const windowSize = 40;

  // Вычисление видимого диапазона
  const visibleStartIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeightEstimate) - overscan
  );

  const visibleEndIndex = Math.min(
    items.length - 1,
    visibleStartIndex + windowSize + overscan * 2
  );

  console.log('useVirtualizedWindow: calculations', {
    itemsCount: items.length,
    scrollTop,
    containerHeight,
    itemHeightEstimate,
    windowSize,
    visibleStartIndex,
    visibleEndIndex,
    visibleItemsCount: visibleEndIndex - visibleStartIndex + 1
  });

  // Видимые элементы
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);

  // Вычисление высот spacers с учётом измеренных высот
  const topSpacerHeight = Math.max(0, visibleStartIndex * itemHeightEstimate);
  const bottomSpacerHeight = Math.max(0, (items.length - visibleEndIndex - 1) * itemHeightEstimate);
  const totalHeight = items.length * itemHeightEstimate;

  // Обработчик скролла
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (target) {
      setScrollTop(target.scrollTop);
    }
  }, []);

  // Обновление размеров контейнера
  const updateContainerHeight = useCallback(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setContainerHeight(height);
    }
  }, [containerRef]);

  // Функция для измерения высоты элемента
  const measureItemHeight = useCallback((id: string, height: number) => {
    setMeasuredHeights(prev => new Map(prev.set(id, height)));
  }, []);

  // Эффект для установки слушателя скролла
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Начальные размеры
    updateContainerHeight();

    // Слушатель скролла
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Слушатель изменения размеров
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef, handleScroll, updateContainerHeight]);

  // Эффект для обновления высот на основе измерений
  useEffect(() => {
    if (measuredHeights.size === 0) return;

    // Можно улучшить расчёт высот на основе реальных измерений
    // Пока используем простую эвристику
  }, [measuredHeights]);

  return {
    visibleItems,
    visibleStartIndex,
    visibleEndIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    totalHeight,
    scrollTop,
    containerHeight,
  };
}
