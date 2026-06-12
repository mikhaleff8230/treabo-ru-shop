import React, { useState, useEffect } from 'react';
import { videoCache } from '@/lib/video-cache';

interface VideoTimeDisplayProps {
  videoUrl: string | null;
}

export default function VideoTimeDisplay({ videoUrl }: VideoTimeDisplayProps) {
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) {
      setDuration(null);
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

  }, [videoUrl]);

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
    <span>
      {isLoading ? '...' : (duration ? formatTime(duration) : '0:00')}
    </span>
  );
} 