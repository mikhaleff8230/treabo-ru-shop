import { useMemo } from 'react';
import { buildHashtagFilter } from '@/filters/places/hashtag.filter';

export function useHashtagFilter(hashtagSlug: string) {
  return useMemo(() => {
    if (!hashtagSlug) return {};
    return buildHashtagFilter(hashtagSlug);
  }, [hashtagSlug]);
}

