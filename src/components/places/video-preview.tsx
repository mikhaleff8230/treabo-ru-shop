import { useState, useRef, useEffect } from 'react';
import { PlayIcon } from '@/components/icons/play-icon';

interface VideoPreviewProps {
  src: string;
  alt: string;
  className?: string;
  autoPlayDuration?: number; // в миллисекундах
  showPlayButton?: boolean;
}

export default function VideoPreview({ 
  src, 
  alt, 
  className = '', 
  autoPlayDuration = 3000,
  showPlayButton = true 
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hasError || !isLoaded) return;
    
    // Задержка перед воспроизведением
    timeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          
          // Автоматическая остановка через указанное время
          autoPlayTimeoutRef.current = setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }, autoPlayDuration);
        }).catch((error) => {
          console.error('Ошибка автопроигрывания видео:', error);
          setHasError(true);
        });
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    // Очищаем таймеры
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    
    // Останавливаем видео
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <PlayIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">Видео недоступно</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        playsInline
        loop={false}
        className="w-full h-full object-cover"
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onEnded={handleVideoEnded}
      />
      
      {/* Индикатор воспроизведения */}
      {isPlaying && (
        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <PlayIcon className="h-3 w-3" />
          Воспроизводится
        </div>
      )}
      
      {/* Кнопка воспроизведения (если не воспроизводится) */}
      {showPlayButton && !isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
            <PlayIcon className="h-6 w-6 text-dark" />
          </div>
        </div>
      )}
      
      {/* Индикатор загрузки */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
} 