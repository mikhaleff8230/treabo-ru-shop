// Экспорт страниц places для удобного импорта (из других модулей)
export { default as PlacesFeedPage } from '../../pages/places/feed';
export { default as PlacesCreatePage } from '../../pages/places/create';
export { default as PlacesDetailPage } from '../../pages/places/[id]';
export { default as PlacesHashtagPage } from '../../pages/places/element/[hashtagSlug]';

// Типы для страниц
export type { FeedPageProps } from '../../pages/places/feed';
