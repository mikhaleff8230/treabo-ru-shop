import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from '@/components/ui/image';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { ChevronRight } from '@/components/icons/chevron-right';
import { PlayIcon } from '@/components/icons/play-icon';
import placeholder from '@/assets/images/placeholders/product.svg';
import { extractMediaUrls } from '@/data/utils/media-utils';
import cn from 'classnames';

interface VideoItem {
  url?: string;
  poster?: string;
  thumbnail?: string;
}

interface PlaceImageSliderProps {
  images: string[];
  videos: string[] | VideoItem[];
  title: string;
  maxHeight?: string;
  className?: string;
  preserveAspectRatio?: boolean;
}

export default function PlaceImageSlider({ images, videos, title, maxHeight = '90vh', className = '', preserveAspectRatio = false }: PlaceImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Состояния для плавного свайпа
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Объединяем изображения и видео в один массив, фильтруя невалидные URL
  type MediaItem = 
    | { type: 'image'; src: string; id: string }
    | { type: 'video'; src: string; poster: string | null; id: string };
  
  const media: MediaItem[] = [
    ...extractMediaUrls(Array.isArray(images) ? images : [])
      .map((img, idx) => ({ type: 'image' as const, src: img, id: `img-${idx}` })),
    ...(Array.isArray(videos) ? videos : []).map((vid, idx) => {
      // Обрабатываем видео - может быть строкой или объектом с url и poster
      if (typeof vid === 'string') {
        return { type: 'video' as const, src: vid, poster: null, id: `vid-${idx}` };
      }
      if (vid && typeof vid === 'object') {
        const videoUrl = vid.url || vid.video_url || null;
        const posterUrl = vid.poster || vid.poster_url || vid.thumbnail || vid.thumbnail_url || null;
        if (videoUrl) {
          return { type: 'video' as const, src: videoUrl, poster: posterUrl, id: `vid-${idx}` };
        }
      }
      return null;
    }).filter((item): item is { type: 'video'; src: string; poster: string | null; id: string } => item !== null)
  ];
  

  // Обработка изменения текущего медиа
  useEffect(() => {
    const currentMedia = media[currentIndex];
    if (currentMedia?.type === 'video' && videoRef.current) {
      // Сбрасываем видео при смене слайда
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [currentIndex, media]);

  if (media.length === 0) {
    return (
      <div 
        className="relative w-full bg-light-200 dark:bg-dark-300 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ 
          height: '400px',
          maxHeight: '90vh'
        }}
      >
        <Image 
          src={placeholder} 
          alt="placeholder" 
          fill 
          className="object-cover" 
        />
      </div>
    );
  }

  const currentMedia = media[currentIndex];
  
  // Проверяем, что currentMedia существует
  if (!currentMedia) {
    return (
      <div 
        className="relative w-full bg-light-200 dark:bg-dark-300 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ 
          height: '400px',
          maxHeight: '90vh'
        }}
      >
        <Image 
          src={placeholder} 
          alt="placeholder" 
          fill 
          className="object-cover" 
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev: number) => (prev - 1 + media.length) % media.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev: number) => (prev + 1) % media.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Обработчики для плавного свайпа
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (media.length <= 1) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    setDragOffset(0);
    setIsHorizontalSwipe(false);
  }, [media.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || media.length <= 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - dragStart.x;
    const diffY = touch.clientY - dragStart.y;
    
    // Определяем, горизонтальный ли это свайп
    if (!isHorizontalSwipe && Math.abs(diffX) > 10) {
      // Если горизонтальное движение больше 10px, считаем это горизонтальным свайпом
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setIsHorizontalSwipe(true);
      }
    }
    
    // Если это горизонтальный свайп, предотвращаем скролл страницы
    if (isHorizontalSwipe || Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
      
      // Ограничиваем свайп в пределах разумного (не более ширины одного слайда)
      const containerWidth = containerRef.current?.clientWidth || 400;
      const limitedDiff = Math.max(-containerWidth, Math.min(containerWidth, diffX));
      setDragOffset(limitedDiff);
    }
  }, [isDragging, dragStart, media.length, isHorizontalSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || media.length <= 1) {
      setIsDragging(false);
      setDragOffset(0);
      setIsHorizontalSwipe(false);
      return;
    }

    // Если это был горизонтальный свайп, применяем snap
    if (isHorizontalSwipe) {
      const threshold = (containerRef.current?.clientWidth || 400) * 0.3; // 30% от ширины для snap
      const shouldSnap = Math.abs(dragOffset) > threshold;

      if (shouldSnap) {
        // Определяем направление свайпа
        if (dragOffset > 0) {
          // Свайп вправо - предыдущее фото
          setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
        } else {
          // Свайп влево - следующее фото
          setCurrentIndex((prev) => (prev + 1) % media.length);
        }
      }
    }

    // Сбрасываем состояние
    setIsDragging(false);
    setDragOffset(0);
    setIsHorizontalSwipe(false);
  }, [isDragging, dragOffset, media.length, isHorizontalSwipe]);

  // Обработчики для мыши (для десктопа, если нужно)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (media.length <= 1) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    setDragOffset(0);
    setIsHorizontalSwipe(false);
  }, [media.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || media.length <= 1) return;
    const diffX = e.clientX - dragStart.x;
    const diffY = e.clientY - dragStart.y;
    
    // Определяем, горизонтальный ли это свайп
    if (!isHorizontalSwipe && Math.abs(diffX) > 10) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setIsHorizontalSwipe(true);
      }
    }
    
    if (isHorizontalSwipe || Math.abs(diffX) > Math.abs(diffY)) {
      const containerWidth = containerRef.current?.clientWidth || 400;
      const limitedDiff = Math.max(-containerWidth, Math.min(containerWidth, diffX));
      setDragOffset(limitedDiff);
    }
  }, [isDragging, dragStart, media.length, isHorizontalSwipe]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || media.length <= 1) {
      setIsDragging(false);
      setDragOffset(0);
      setIsHorizontalSwipe(false);
      return;
    }

    // Если это был горизонтальный свайп, применяем snap
    if (isHorizontalSwipe) {
      const threshold = (containerRef.current?.clientWidth || 400) * 0.3;
      const shouldSnap = Math.abs(dragOffset) > threshold;

      if (shouldSnap) {
        if (dragOffset > 0) {
          setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
        } else {
          setCurrentIndex((prev) => (prev + 1) % media.length);
        }
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    setIsHorizontalSwipe(false);
  }, [isDragging, dragOffset, media.length, isHorizontalSwipe]);

  // Если нужно сохранить оригинальное соотношение сторон
  if (preserveAspectRatio) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full bg-light-200 dark:bg-dark-300 rounded-2xl overflow-hidden",
          className
        )}
        style={{ 
          touchAction: 'pan-y pinch-zoom',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Контейнер для всех медиа с плавным свайпом */}
        <div 
          className="relative w-full flex"
          style={{
            transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isDragging ? 'transform' : 'auto',
          }}
        >
          {media.map((item, index) => (
            <div
              key={item.id || index}
              className="relative flex-shrink-0 w-full"
              style={{
                minWidth: '100%',
                maxWidth: '100%',
              }}
            >
              {item.type === 'image' ? (
                <div className="relative w-full">
                  {item.src && typeof item.src === 'string' ? (
                    <img 
                      src={item.src} 
                      alt={`${title} - ${index + 1}`} 
                      className="w-full h-auto rounded-2xl"
                      loading="lazy"
                      decoding="async"
                      onError={(e: any) => {
                        console.error('Ошибка загрузки изображения:', item.src);
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      Неверный URL изображения: {String(item.src)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full">
                  <video 
                    ref={index === currentIndex ? videoRef : null}
                    src={item.src} 
                    poster={item.type === 'video' ? (item.poster || undefined) : undefined}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-auto rounded-2xl"
                    onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
                      const target = e.target as HTMLVideoElement;
                      console.error('Ошибка загрузки видео:', target.error);
                    }}
                  >
                    <source src={item.src} type="video/mp4" />
                    Ваш браузер не поддерживает воспроизведение видео.
                  </video>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Индикатор типа медиа */}
        {currentMedia.type === 'video' && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-10">
            <PlayIcon className="h-3 w-3" />
            Видео
          </div>
        )}

        {/* Навигационные кнопки */}
        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Улучшенные индикаторы (точки) слайдера */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative w-4 h-4 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white scale-110 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/75 hover:scale-105'
                }`}
                title={`${item.type === 'video' ? 'Видео' : 'Изображение'} ${index + 1}`}
              >
                {/* Индикатор типа медиа внутри точки */}
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayIcon className="h-2 w-2 text-black" />
                  </div>
                )}
                
                {/* Анимация активной точки */}
                {index === currentIndex && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Счетчик */}
        {media.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs z-10">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full bg-light-200 dark:bg-dark-300 rounded-2xl overflow-hidden",
        className
      )}
      style={{ 
        maxHeight: maxHeight,
        touchAction: 'pan-y pinch-zoom', // Разрешаем вертикальный скролл и зум
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Сбрасываем при уходе мыши
    >
      {/* Контейнер для всех медиа с плавным свайпом */}
      <div 
        className="relative w-full h-full flex"
        style={{
          transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: isDragging ? 'transform' : 'auto',
        }}
      >
        {media.map((item, index) => (
          <div
            key={item.id || index}
            className="relative flex-shrink-0 w-full h-full"
            style={{
              minWidth: '100%',
              maxWidth: '100%',
            }}
          >
            {item.type === 'image' ? (
              <div className="relative w-full h-full">
                {item.src && typeof item.src === 'string' ? (
                  <Image 
                    src={item.src} 
                    alt={`${title} - ${index + 1}`} 
                    fill 
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e: any) => {
                      console.error('Ошибка загрузки изображения:', item.src);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Неверный URL изображения: {String(item.src)}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video 
                  ref={index === currentIndex ? videoRef : null}
                  src={item.src} 
                  poster={item.type === 'video' ? (item.poster || undefined) : undefined}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-contain rounded-2xl"
                  onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
                    const target = e.target as HTMLVideoElement;
                    console.error('Ошибка загрузки видео:', target.error);
                  }}
                >
                  <source src={item.src} type="video/mp4" />
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Индикатор типа медиа */}
      {currentMedia.type === 'video' && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <PlayIcon className="h-3 w-3" />
          Видео
        </div>
      )}

      {/* Навигационные кнопки */}
      {media.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Улучшенные индикаторы (точки) слайдера */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative w-4 h-4 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/75 hover:scale-105'
              }`}
              title={`${item.type === 'video' ? 'Видео' : 'Изображение'} ${index + 1}`}
            >
              {/* Индикатор типа медиа внутри точки */}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayIcon className="h-2 w-2 text-black" />
                </div>
              )}
              
              {/* Анимация активной точки */}
              {index === currentIndex && (
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Счетчик */}
      {media.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs z-10">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
} 