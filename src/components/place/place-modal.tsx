import { useModalState } from '@/components/modal-views/context';
import { usePlace } from '@/data/place';
import Image from 'next/image';
import { PlayIcon } from '@/components/icons/play-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { CommentIcon } from '@/components/icons/comment-icon';
import placeholder from '@/assets/images/placeholders/product.svg';
import React, { useState } from 'react';
import { formatPlaceDate } from '@/data/utils/format';
import { useTranslation } from 'next-i18next';

const ArrowButton = ({ direction, onClick, disabled }: { direction: 'left' | 'right'; onClick: () => void; disabled?: boolean }) => (
  <button
    className={`absolute top-1/2 z-20 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all ${direction === 'left' ? 'left-4' : 'right-4'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    onClick={onClick}
    style={{ fontSize: 32, lineHeight: 1 }}
    aria-label={direction === 'left' ? 'Предыдущее фото' : 'Следующее фото'}
    disabled={disabled}
  >
    {direction === 'left' ? '‹' : '›'}
  </button>
);

export default function PlaceModal() {
  const { data } = useModalState();
  const placeId = data?.id;
  const { place, isLoading, error } = usePlace(placeId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const { t } = useTranslation('common');

  if (isLoading) return <div className="p-8">Загрузка...</div>;
  if (error || !place) return <div className="p-8 text-red-500">Ошибка загрузки плейса</div>;

  const {
    title,
    description,
    images = [],
    video,
    user,
    likes_count,
    comments_count,
    created_at,
    hashtags
  } = place;

  // Формируем массив медиа: сначала фото, потом видео (если есть)
  const media: { type: 'image' | 'video'; src: string }[] = [
    ...images.map((img: any) => ({ type: 'image', src: img.original || placeholder })),
  ];
  if (video?.original) {
    media.push({ type: 'video', src: video.original });
  }

  const selected = media[selectedIndex] || { type: 'image', src: placeholder };

  // Fullscreen close handler
  const handleCloseFullscreen = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setFullscreen(false);
  };

  // Перелистывание
  const handlePrev = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + media.length) % media.length);
  };
  const handleNext = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % media.length);
  };

  // ESC/стрелки
  React.useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreen, media.length]);

  const product = place.product; // предполагается, что product приходит с API

  return (
    <>
      {/* Fullscreen overlay */}
      {fullscreen && selected.type === 'image' && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={handleCloseFullscreen}
        >
          <button
            className="absolute top-6 right-6 text-white text-3xl z-10"
            onClick={handleCloseFullscreen}
            aria-label="Закрыть полноэкранное фото"
          >
            ×
          </button>
          {/* Стрелки */}
          {media.length > 1 && <ArrowButton direction="left" onClick={e => { e.stopPropagation(); handlePrev(); }} />}
          {media.length > 1 && <ArrowButton direction="right" onClick={e => { e.stopPropagation(); handleNext(); }} />}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={selected.src}
              alt={title}
              fill
              className="object-contain max-h-screen max-w-screen"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      <div className="w-full max-w-3xl p-6 bg-white dark:bg-dark-400 rounded-lg flex flex-col md:flex-row gap-6 relative">
        {/* Вертикальная галерея тумбнейлов */}
        <div className="flex md:flex-col gap-2 md:gap-3 md:w-20 w-full md:max-w-[80px] mb-4 md:mb-0">
          {media.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`border-2 rounded-lg overflow-hidden focus:outline-none transition-all ${selectedIndex === idx ? 'border-blue-500' : 'border-transparent'} bg-light-200 dark:bg-dark-300`}
              style={{ width: '64px', height: '64px' }}
            >
              {item.type === 'image' ? (
                <Image src={item.src} alt={title} width={64} height={64} className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-black/10">
                  <PlayIcon className="h-8 w-8 text-dark-700" />
                </div>
              )}
            </button>
          ))}
        </div>
        {/* Основное изображение/видео и инфо */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-light-200 dark:bg-dark-300 flex items-center justify-center">
            {selected.type === 'image' ? (
              <Image
                src={selected.src}
                alt={title}
                fill
                className="object-contain cursor-zoom-in"
                onClick={() => setFullscreen(true)}
              />
            ) : (
              <video 
                src={selected.src} 
                controls 
                preload="metadata"
                controlsList="nodownload"
                playsInline
                className="w-full h-full object-contain rounded-lg"
                style={{ maxHeight: '100%' }}
                onError={(e) => {
                  console.error('Ошибка загрузки видео в модальном окне:', e);
                }}
              >
                <source src={selected.src} type="video/mp4" />
                <source src={selected.src} type="video/webm" />
                <source src={selected.src} type="video/ogg" />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <div className="text-xs text-gray-500 mb-2">{formatPlaceDate(created_at, t)}</div>
            <div className="mb-2">
              {hashtags?.map((tag: any) => (
                <span key={tag.id} className="mr-2 text-xs text-blue-500">#{tag.name}</span>
              ))}
            </div>
            <div className="mb-2 text-sm text-gray-700 dark:text-light-600">{description}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-red-500"><HeartIcon className="h-4 w-4" />{likes_count || 0}</div>
              <div className="flex items-center gap-1 text-gray-500"><CommentIcon className="h-4 w-4" />{comments_count || 0}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Image src={user?.avatar || placeholder} alt={user?.name || ''} width={32} height={32} className="rounded-full" />
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          </div>
        </div>
        {product && product.slug && (
          <a
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 px-5 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-lg"
          >
            Перейти в товар
          </a>
        )}
      </div>
    </>
  );
} 