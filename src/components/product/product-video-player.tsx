import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon } from '@/components/icons/play-icon';
import { PauseIcon } from '@/components/icons/pause-icon';
import type { ProductVideo } from '@/types';

interface ProductVideoPlayerProps {
  video: ProductVideo;
  className?: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export default function ProductVideoPlayer({
  video,
  className = '',
  poster,
  autoplay = false,
  controls = true,
}: ProductVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Получаем URL видео
  const videoUrl = video.video_url || video.url || video.preview_url;
  const posterUrl = poster || video.poster_url || video.thumbnail_url;

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((e) => {
          console.error('Error playing video:', e);
          setError('Не удалось воспроизвести видео');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoClick = () => {
    if (controls) {
      togglePlay();
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Ошибка загрузки видео');
  };

  if (!videoUrl) {
    return null;
  }

  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-dark-300 ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        className="h-full w-full object-cover"
        controls={controls}
        playsInline
        onLoadedData={handleLoadedData}
        onError={handleError}
        onClick={handleVideoClick}
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-light-400 border-t-light-100"></div>
        </div>
      )}

      {/* Кнопка воспроизведения/паузы (если controls отключены) */}
      {!controls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity hover:bg-opacity-50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <PauseIcon className="h-16 w-16 text-white" />
          ) : (
            <PlayIcon className="h-16 w-16 text-white" />
          )}
        </button>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
          <p className="text-sm text-light-400">{error}</p>
        </div>
      )}

      {/* Длительность видео (если есть) */}
      {video.duration && !isPlaying && (
        <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
          {formatDuration(video.duration)}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

