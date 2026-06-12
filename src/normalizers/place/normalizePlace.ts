import { Place } from '@/domain/place/place.types';

export function normalizePlace(raw: any): Place {
  const images =
    Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images
      : raw.preview_image
        ? [{
            id: raw.preview_image.id ?? 'preview',
            url: raw.preview_image.url,
            thumbnail: raw.preview_image.thumbnail ?? raw.preview_image.url,
          }]
        : [];

  return {
    ...raw,
    images,
  };
}
