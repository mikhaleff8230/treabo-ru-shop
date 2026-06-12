import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { ChevronRight } from '@/components/icons/chevron-right';
import { PlayIcon } from '@/components/icons/play-icon';
import ProductImageLightbox from './product-image-lightbox';
import ProductVideoPlayer from './product-video-player';
import type { Product, ProductVideo } from '@/types';
import cn from 'classnames';

interface ProductImageSliderProps {
  product: Product;
  className?: string;
}

export default function ProductImageSlider({ product, className = '' }: ProductImageSliderProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileSliderRef = useRef<HTMLDivElement>(null);

  // Функция для возврата назад
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Тип медиа-элемента: изображение или видео
  type MediaItem = {
    type: 'image';
    data: any; // Attachment
  } | {
    type: 'video';
    data: ProductVideo;
  };

  // Получаем медиа-элементы: сначала главное фото, потом галерея, потом видео
  const mediaItems: MediaItem[] = [];
  
  // Добавляем главное изображение
  if (product.image) {
    mediaItems.push({ type: 'image', data: product.image });
  }
  
  // Добавляем галерею
  if (product.gallery && Array.isArray(product.gallery)) {
    product.gallery.forEach(img => {
      mediaItems.push({ type: 'image', data: img });
    });
  }
  
  // Добавляем видео
  if (product.videos && Array.isArray(product.videos) && product.videos.length > 0) {
    product.videos.forEach(video => {
      mediaItems.push({ type: 'video', data: video });
    });
  }

  // Отладочная информация
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductImageSlider - media debug:', {
      product_id: product?.id,
      product_name: product?.name,
      videos: product?.videos,
      videos_count: product?.videos?.length || 0,
      mediaItems_count: mediaItems.length,
      mediaItems: mediaItems.map(item => ({
        type: item.type,
        hasData: !!item.data,
        url: item.type === 'video' ? (item.data?.url || item.data?.video_url || item.data?.preview_url) : null,
      })),
    });
  }

  const placeholder = '/placeholders/placeholder-450.svg';

  // Валидация медиа-элементов
  const validMediaItems = mediaItems.filter(item => {
    if (item.type === 'image') {
      return item.data && 
        typeof item.data === 'object' && 
        (item.data.original || item.data.thumbnail) &&
        typeof (item.data.original || item.data.thumbnail) === 'string';
    } else {
      // Для видео проверяем наличие url или video_url или preview_url
      const hasUrl = item.data && (item.data.url || item.data.video_url || item.data.preview_url);
      if (process.env.NODE_ENV === 'development' && !hasUrl) {
        console.warn('ProductImageSlider - video validation failed:', {
          video: item.data,
          hasUrl: !!item.data?.url,
          hasVideoUrl: !!item.data?.video_url,
          hasPreviewUrl: !!item.data?.preview_url,
        });
      }
      return hasUrl;
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('ProductImageSlider - valid media:', {
      validMediaItems_count: validMediaItems.length,
      validMediaItems: validMediaItems.map(item => ({
        type: item.type,
        url: item.type === 'video' ? (item.data?.url || item.data?.video_url || item.data?.preview_url) : (item.data?.original || item.data?.thumbnail),
      })),
    });
  }

  // Если нет медиа-элементов, показываем placeholder
  if (validMediaItems.length === 0) {
    return (
      <motion.div variants={fadeInBottom()} className={`${className}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-light-500 dark:bg-dark-300">
          <Image
            alt={product.name || 'Product placeholder'}
            fill
            quality={100}
            src={placeholder}
            className="object-cover"
            unoptimized={true}
          />
        </div>
      </motion.div>
    );
  }

  const selectMedia = (index: number) => {
    setCurrentImageIndex(index);
    // На мобильных: прокручиваем основной слайдер к нужному слайду
    if (mobileSliderRef.current && window.innerWidth < 1024) {
      const slide = mobileSliderRef.current.children[index] as HTMLElement;
      if (slide) {
        slide.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  const nextMedia = () => {
    setCurrentImageIndex((prev) => (prev + 1) % validMediaItems.length);
  };

  const prevMedia = () => {
    setCurrentImageIndex((prev) => (prev - 1 + validMediaItems.length) % validMediaItems.length);
  };

  // Отслеживание текущего слайда через scroll (только для мобильных)
  useEffect(() => {
    if (!mobileSliderRef.current || window.innerWidth >= 1024) return;

    const container = mobileSliderRef.current;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollLeft = container.scrollLeft;
        const slideWidth = container.clientWidth;
        const currentIndex = Math.round(scrollLeft / slideWidth);
        setCurrentImageIndex(currentIndex);
      }, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleMobileImageClick = () => {
    setIsMobileFullscreen(true);
  };

  // Автоскролл к активной миниатюре (только для вертикальных миниатюр на десктопе)
  useEffect(() => {
    if (thumbsContainerRef.current && window.innerWidth >= 1024) {
      const activeThumb = thumbsContainerRef.current.children[currentImageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentImageIndex]);

  // Обработка клавиш для мобильного полноэкранного режима
  useEffect(() => {
    if (!isMobileFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFullscreen]);

  // Блокируем скролл body в мобильном полноэкранном режиме
  useEffect(() => {
    if (isMobileFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFullscreen]);

  return (
    <motion.div variants={fadeInBottom()} className={`${className} relative`}>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[84px_1fr]">
        {/* Вертикальные миниатюры слева (только на lg+) */}
        {validMediaItems.length > 1 ? (
          <div
            ref={thumbsContainerRef}
            className="hidden h-[520px] flex-col gap-2 overflow-y-auto pr-1 lg:flex"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
            }}
          >
            {validMediaItems.map((item, index) => (
              <button
                key={index}
                ref={(node) => (thumbRefs.current[index] = node)}
                onClick={() => selectMedia(index)}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                  index === currentImageIndex
                    ? 'border-brand'
                    : 'border-light-300 dark:border-dark-400 hover:border-light-400 dark:hover:border-dark-500'
                }`}
              >
                {item.type === 'image' ? (
                  item.data && (item.data?.thumbnail || item.data?.original) ? (
                    <Image
                      alt={`${product.name || 'Product'} - превью ${index + 1}`}
                      fill
                      quality={100}
                      src={item.data?.thumbnail || item.data?.original}
                      className="object-cover"
                      unoptimized={true}
                      onError={() => {
                        console.warn(`Failed to load thumbnail ${index + 1}`);
                      }}
                    />
                  ) : (
                    <Image
                      alt={`${product.name || 'Product'} - превью ${index + 1}`}
                      fill
                      quality={100}
                      src={placeholder}
                      className="object-cover"
                      unoptimized={true}
                    />
                  )
                ) : (
                  // Видео миниатюра
                  <div className="relative h-full w-full bg-dark-300 flex items-center justify-center">
                    {item.data?.thumbnail_url || item.data?.poster_url ? (
                      <Image
                        alt={`${product.name || 'Product'} - видео ${index + 1}`}
                        fill
                        quality={100}
                        src={item.data.thumbnail_url || item.data.poster_url}
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <PlayIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Большое изображение (справа на десктопе, сверху на мобиле) */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-light-500 dark:bg-dark-300 group">
          {/* Кнопка "Назад" для мобильных (поверх изображения) - вне контейнера для правильного z-index */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBack();
            }}
            className={cn(
              "absolute top-4 left-4 z-50 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg transition-all duration-200",
              "hover:bg-white active:scale-95 touch-manipulation",
              "lg:hidden", // Скрываем на десктопе
              "flex items-center justify-center",
              "min-w-[48px] min-h-[48px]", // Минимальная зона нажатия для пальца
            )}
            aria-label="Назад"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              pointerEvents: 'auto',
            }}
          >
            <ChevronLeft className="h-6 w-6 text-dark dark:text-light" />
          </button>

          {/* На мобилке - нативный scroll слайдер */}
          <div 
            ref={mobileSliderRef}
            className="mobile-product-slider lg:hidden w-full h-full flex overflow-x-auto overscroll-x-contain"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {validMediaItems.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 h-full relative cursor-pointer"
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                }}
                onClick={handleMobileImageClick}
              >
                {item.type === 'image' ? (
                  item.data && (item.data?.original || item.data?.thumbnail) ? (
                    <Image
                      alt={product.name || 'Product image'}
                      fill
                      quality={100}
                      src={item.data?.original || item.data?.thumbnail}
                      className="object-contain"
                      unoptimized={true}
                      onError={() => {
                        console.warn(`Failed to load product image at index ${index}`);
                      }}
                    />
                  ) : (
                    <Image
                      alt={product.name || 'Product image'}
                      fill
                      quality={100}
                      src={placeholder}
                      className="object-contain"
                      unoptimized={true}
                    />
                  )
                ) : item.type === 'video' ? (
                  <ProductVideoPlayer
                    video={item.data}
                    className="h-full w-full"
                    controls={true}
                  />
                ) : (
                  <Image
                    alt={product.name || 'Product image'}
                    fill
                    quality={100}
                    src={placeholder}
                    className="object-contain"
                  />
                )}
              </div>
            ))}
          </div>

          {/* На десктопе - лайтбокс (только для изображений) */}
          <div 
            className={`hidden lg:block w-full h-full ${validMediaItems[currentImageIndex]?.type === 'image' ? 'cursor-zoom-in' : ''}`}
            onClick={() => validMediaItems[currentImageIndex]?.type === 'image' && setIsLightboxOpen(true)}
          >
            {validMediaItems[currentImageIndex]?.type === 'image' ? (
              validMediaItems[currentImageIndex].data && (validMediaItems[currentImageIndex].data?.original || validMediaItems[currentImageIndex].data?.thumbnail) ? (
                <Image
                  alt={product.name || 'Product image'}
                  fill
                  quality={100}
                  src={validMediaItems[currentImageIndex].data?.original || validMediaItems[currentImageIndex].data?.thumbnail}
                  className="object-contain"
                  unoptimized={true}
                  onError={() => {
                    console.warn(`Failed to load product image at index ${currentImageIndex}`);
                  }}
                />
              ) : (
                <Image
                  alt={product.name || 'Product image'}
                  fill
                  quality={100}
                  src={placeholder}
                  className="object-contain"
                />
              )
            ) : validMediaItems[currentImageIndex]?.type === 'video' ? (
              <ProductVideoPlayer
                video={validMediaItems[currentImageIndex].data}
                className="h-full w-full"
                controls={true}
              />
            ) : (
              <Image
                alt={product.name || 'Product image'}
                fill
                quality={100}
                src={placeholder}
                className="object-contain"
              />
            )}
          </div>

          {/* Навигационные стрелки (только на десктопе) */}
          {validMediaItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dark-200/80 z-20 hidden lg:block"
              >
                <ChevronLeft className="h-5 w-5 text-dark dark:text-light" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dark-200/80 z-20 hidden lg:block"
              >
                <ChevronRight className="h-5 w-5 text-dark dark:text-light" />
              </button>
            </>
          )}

          {/* Счетчик медиа */}
          {validMediaItems.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded bg-white/80 px-2 py-1 text-sm text-dark dark:bg-dark-200/80 dark:text-light">
              {currentImageIndex + 1} / {validMediaItems.length}
            </div>
          )}
        </div>
      </div>


      {/* Точки (индикаторы) слайдера */}
      {validMediaItems.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {validMediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => selectMedia(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentImageIndex
                  ? 'bg-brand scale-110 shadow-md'
                  : 'bg-light-400 dark:bg-dark-400 hover:bg-light-500 dark:hover:bg-dark-500 hover:scale-105'
              }`}
              title={`Перейти к медиа ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Лайтбокс только для десктопа (только изображения) */}
      <ProductImageLightbox
        images={validMediaItems.filter(item => item.type === 'image').map(item => item.data)}
        startIndex={validMediaItems.slice(0, currentImageIndex).filter(item => item.type === 'image').length}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

      {/* Мобильный полноэкранный режим */}
      {isMobileFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black lg:hidden"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        >
          <div className="relative w-full h-full overflow-hidden">
            {validMediaItems[currentImageIndex]?.type === 'image' ? (
              validMediaItems[currentImageIndex].data && (validMediaItems[currentImageIndex].data?.original || validMediaItems[currentImageIndex].data?.thumbnail) ? (
                <img
                  alt={product.name || 'Product image'}
                  src={validMediaItems[currentImageIndex].data?.original || validMediaItems[currentImageIndex].data?.thumbnail}
                  className="w-full h-full object-contain"
                  style={{ 
                    touchAction: 'pan-x pan-y pinch-zoom',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                  onError={() => {
                    console.warn(`Failed to load mobile fullscreen image at index ${currentImageIndex}`);
                  }}
                />
              ) : (
                <img
                  alt={product.name || 'Product image'}
                  src={placeholder}
                  className="w-full h-full object-contain"
                  style={{ 
                    touchAction: 'pan-x pan-y pinch-zoom',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                />
              )
            ) : validMediaItems[currentImageIndex]?.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center">
                <ProductVideoPlayer
                  video={validMediaItems[currentImageIndex].data}
                  className="w-full h-full"
                  controls={true}
                />
              </div>
            ) : (
              <img
                alt={product.name || 'Product image'}
                src={placeholder}
                className="w-full h-full object-contain"
                style={{ 
                  touchAction: 'pan-x pan-y pinch-zoom',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              />
            )}
            
            {/* Кнопка закрытия для мобилки */}
            <button
              onClick={() => setIsMobileFullscreen(false)}
              className="absolute top-4 right-4 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm z-10"
              style={{ touchAction: 'manipulation' }}
            >
              ✕
            </button>

            {/* Счетчик медиа для мобилки */}
            {validMediaItems.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-sm z-10">
                {currentImageIndex + 1} / {validMediaItems.length}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
} 