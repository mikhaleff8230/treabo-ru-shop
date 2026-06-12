interface VideoMetadata {
  duration: number;
  thumbnail?: string;
  loaded: boolean;
}

class VideoCache {
  private cache = new Map<string, VideoMetadata>();
  private loadingPromises = new Map<string, Promise<VideoMetadata>>();

  async getVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    // Если уже в кэше, возвращаем сразу
    if (this.cache.has(videoUrl)) {
      return this.cache.get(videoUrl)!;
    }

    // Если уже загружается, ждем результат
    if (this.loadingPromises.has(videoUrl)) {
      return this.loadingPromises.get(videoUrl)!;
    }

    // Создаем промис для загрузки
    const loadingPromise = this.loadVideoMetadata(videoUrl);
    this.loadingPromises.set(videoUrl, loadingPromise);

    try {
      const metadata = await loadingPromise;
      this.cache.set(videoUrl, metadata);
      return metadata;
    } finally {
      this.loadingPromises.delete(videoUrl);
    }
  }

  private loadVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);
        video.src = '';
        video.load();
      };

      const onLoadedMetadata = () => {
        if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
          resolve({
            duration: video.duration,
            loaded: true
          });
          cleanup();
        }
      };

      const onError = () => {
        resolve({
          duration: 0,
          loaded: false
        });
        cleanup();
      };

      const onCanPlay = () => {
        // Создаем thumbnail из первого кадра
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.5);
            
            resolve({
              duration: video.duration || 0,
              thumbnail,
              loaded: true
            });
          } else {
            resolve({
              duration: video.duration || 0,
              loaded: true
            });
          }
        } catch (e) {
          resolve({
            duration: video.duration || 0,
            loaded: true
          });
        }
        cleanup();
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
      video.addEventListener('canplay', onCanPlay);
      
      // Таймаут для предотвращения зависания
      setTimeout(() => {
        if (!this.cache.has(videoUrl)) {
          onError();
        }
      }, 5000);

      video.src = videoUrl;
    });
  }

  // Очистка старых записей (вызывать периодически)
  clearOldCache(maxAge: number = 10 * 60 * 1000) { // 10 минут по умолчанию
    // В простой реализации просто очищаем весь кэш
    // В продакшене можно добавить временные метки
    if (this.cache.size > 100) { // Ограничиваем размер кэша
      this.cache.clear();
    }
  }

  // Предзагрузка видео метаданных
  preloadVideos(videoUrls: string[]) {
    videoUrls.forEach(url => {
      if (!this.cache.has(url) && !this.loadingPromises.has(url)) {
        this.getVideoMetadata(url).catch(() => {
          // Игнорируем ошибки при предзагрузке
        });
      }
    });
  }
}

export const videoCache = new VideoCache();

// Очистка кэша каждые 10 минут
if (typeof window !== 'undefined') {
  setInterval(() => {
    videoCache.clearOldCache();
  }, 10 * 60 * 1000);
} 