import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { ChevronRight } from '@/components/icons/chevron-right';
import { CloseIcon } from '@/components/icons/close-icon';
import type { Attachment } from '@/types';

interface ProductImageLightboxProps {
  images: Attachment[];
  startIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductImageLightbox({
  images,
  startIndex,
  isOpen,
  onClose
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);

  // Обновляем индекс при изменении startIndex
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  // Обработка клавиш
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Блокируем скролл body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const selectImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Автоскролл к активной миниатюре
  useEffect(() => {
    if (thumbsContainerRef.current) {
      const activeThumb = thumbsContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const placeholder = '/placeholders/placeholder-450.svg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Вертикальные миниатюры слева */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <div
          ref={thumbsContainerRef}
          className="flex h-[600px] w-20 flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-light-400 dark:scrollbar-thumb-dark-400"
        >
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => selectImage(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                index === currentIndex
                  ? 'border-brand shadow-lg shadow-brand/30'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              {image && (image?.thumbnail || image?.original) ? (
                <Image
                  alt={`${image?.alt || 'Product'} - превью ${index + 1}`}
                  fill
                  quality={100}
                  src={image?.thumbnail || image?.original}
                  className="object-cover"
                  onError={() => {
                    console.warn(`Failed to load lightbox thumbnail ${index + 1}`);
                  }}
                />
              ) : (
                <Image
                  alt={`Product - превью ${index + 1}`}
                  fill
                  quality={100}
                  src={placeholder}
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Основное изображение по центру */}
      <div className="relative flex h-full w-full items-center justify-center px-24">
        <div
          className="relative h-full w-full max-w-4xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentImage && (currentImage?.original || currentImage?.thumbnail) ? (
            <Image
              alt={currentImage?.alt || 'Product image'}
              fill
              quality={100}
              src={currentImage?.original || currentImage?.thumbnail}
              className="object-contain"
              onError={() => {
                console.warn(`Failed to load lightbox image at index ${currentIndex}`);
              }}
            />
          ) : (
            <Image
              alt="Product image"
              fill
              quality={100}
              src={placeholder}
              className="object-contain"
            />
          )}
        </div>

        {/* Навигационные стрелки */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Счетчик изображений */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
      >
        <CloseIcon className="h-6 w-6" />
      </button>
    </div>
  );
}