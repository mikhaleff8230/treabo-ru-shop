import React, { useState, useEffect, useRef } from 'react';
import { videoCache } from '@/lib/video-cache';

interface LazyVideoTimeProps {
  videoUrl: string | null;
  className?: string;
}

export default function LazyVideoTime({ videoUrl, className = '' }: LazyVideoTimeProps) {
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Intersection Observer для определения видимости элемента
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Отключаем наблюдение после первого появления
        }
      },
      {
        rootMargin: '50px' // Начинаем загрузку за 50px до появления элемента
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Загружаем метаданные только когда элемент становится видимым
  useEffect(() => {
    if (!videoUrl || !isVisible) {
      return;
    }

    setIsLoading(true);
    
    videoCache.getVideoMetadata(videoUrl)
      .then(metadata => {
        setDuration(metadata.loaded ? metadata.duration : null);
      })
      .catch(() => {
        setDuration(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [videoUrl, isVisible]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) return null;

  return (
    <span ref={elementRef} className={className}>
      {!isVisible ? '0:00' : (isLoading ? '...' : (duration ? formatTime(duration) : '0:00'))}
    </span>
  );
} 