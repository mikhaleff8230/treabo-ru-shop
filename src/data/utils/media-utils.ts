/**
 * Utility functions for safely processing media URLs
 */

export interface MediaItem {
  id?: string;
  url: string;
  [key: string]: any;
}

/**
 * Safely extracts URLs from an array of media items
 * Handles both string arrays and object arrays with url properties
 */
export function extractMediaUrls(media: any[] | null | undefined): string[] {
  if (!media || !Array.isArray(media)) {
    return [];
  }

  return media
    .map(item => {
      try {
        if (typeof item === 'string') {
          return item && item.trim() !== '' && !item.includes('[object Object]') ? item : null;
        }
        if (item && typeof item === 'object' && item.url) {
          const url = item.url;
          // Безопасная проверка url перед вызовом trim()
          if (url && typeof url === 'string' && url.trim() !== '' && !url.includes('[object Object]')) {
            return url;
          }
        }
        return null;
      } catch (error) {
        console.warn('Error processing media item:', error, item);
        return null;
      }
    })
    .filter((url): url is string => url !== null && url !== undefined);
}

/**
 * Safely extracts the first media URL
 */
export function extractFirstMediaUrl(media: any[] | null | undefined): string | null {
  const urls = extractMediaUrls(media);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Checks if a URL is valid and safe to use
 */
export function isValidMediaUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  if (url.includes('[object Object]')) return false;
  if (url.includes('undefined') || url.includes('null')) return false;
  return true;
}
