export const FEED_TYPES = {
  MAIN: 'cursor',
  HASHTAG: 'page',
  FAVORITES: 'page',
  SIMILAR: 'cursor',
} as const;

export type FeedType = typeof FEED_TYPES[keyof typeof FEED_TYPES];


