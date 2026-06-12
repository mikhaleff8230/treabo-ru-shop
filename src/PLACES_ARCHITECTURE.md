# 🎯 ФИНАЛЬНАЯ АРХИТЕКТУРА PLACES (END-TO-END)

## ЦЕЛЬ

Построить универсальный движок плейсов, где:
- grid один
- карточка одна
- логика не размазана
- SSR / CSR / cursor не конфликтуют
- preview_image НЕ МОЖЕТ сломать приложение

## 🧱 ФИНАЛЬНАЯ СТРУКТУРА ПРОЕКТА

```
src/
├── domain/
│   └── place/
│       ├── place.types.ts       # Единый интерфейс Place
│       ├── place.contract.ts    # Контракт: images ВСЕГДА массив
│       └── index.ts
│
├── api/
│   └── places/
│       ├── places.api.ts        # Изоляция API
│       ├── places.endpoints.ts  # Константы эндпоинтов
│       └── index.ts
│
├── normalizers/
│   └── place/
│       ├── normalizePlace.ts    # КРИТИЧЕСКИЙ СЛОЙ
│       └── index.ts
│
├── queries/
│   └── places/
│       ├── useCursorPlacesQuery.ts  # cursor pagination
│       ├── usePagePlacesQuery.ts    # page pagination
│       └── index.ts
│
├── filters/
│   └── places/
│       ├── hashtag.filter.ts    # Фильтр хэштегов
│       ├── favorites.filter.ts  # Фильтр избранных
│       ├── similar.filter.ts    # Фильтр похожих
│       └── index.ts
│
├── feeds/
│   └── places/
│       ├── feeds.config.ts      # Конфигурация типов фидов
│       ├── usePlacesFeed.ts     # ЕДИНСТВЕННЫЙ ОРКЕСТРАТОР
│       └── index.ts
│
├── components/
│   └── places/
│       ├── PlaceGrid.tsx        # ТУПОЙ UI
│       └── PlaceCard.tsx        # Уже существует
│
└── pages/
    └── places/
        ├── index.tsx            # Главная страница
        └── element/
            └── [hashtagSlug].tsx # Страница хэштега
```

## 1️⃣ DOMAIN — ЖЁСТКИЙ КОНТРАКТ

**place.types.ts**
```typescript
export interface PlaceImage {
  id: string;
  url: string;
  thumbnail?: string;
}

export interface Place {
  id: string;
  title: string;
  images: PlaceImage[];  // ВСЕГДА массив
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
}
```

**place.contract.ts**
```typescript
export const PLACE_CONTRACT = {
  images: 'array',  // images ВСЕГДА массив
};
```

**❗ НИКАКИЕ preview_image / null / undefined ниже этого слоя не допускаются**

## 2️⃣ API — ПОЛНАЯ ИЗОЛЯЦИЯ

**places.api.ts**
```typescript
export async function fetchPlacesFeed(params) {}
export async function fetchPlacesByHashtag(params) {}
export async function fetchSimilarPlaces(params) {}
export async function fetchMyPlaces(params) {}
```

**📌 API:**
- не знает про React
- не знает про pagination
- возвращает «как есть»

## 3️⃣ NORMALIZER — КРИТИЧЕСКИЙ СЛОЙ

**normalizePlace.ts**
```typescript
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
```

**🔥 Теперь превью НЕ МОЖЕТ сломать UI**

## 4️⃣ QUERIES — МЕХАНИКА ЗАГРУЗКИ

**useCursorPlacesQuery.ts**
```typescript
export function useCursorPlacesQuery(params) {
  return useInfiniteQuery({
    queryKey: ['places-feed', limit],  // ❗ без объектов
    queryFn: ({ pageParam }) =>
      fetchPlacesFeed({ ...params, cursor: pageParam }),
    getNextPageParam: lastPage =>
      lastPage.meta?.has_more ? lastPage.meta.next_cursor : undefined,
  });
}
```

**📌**
- НЕТ filters
- НЕТ normalize
- НЕТ UI

**usePagePlacesQuery.ts**
```typescript
export function usePagePlacesQuery(params) {
  return useQuery({
    queryKey: ['places-page', hashtag_slug, page, limit],
    queryFn: () => fetchPlacesByHashtag(params),
  });
}
```

## 5️⃣ FILTERS — ЧИСТАЯ ЛОГИКА

```typescript
export function buildHashtagFilter(slug: string) {
  return { hashtag_slug: slug };
}
```

**📌 Можно подключить ElasticSearch без изменения UI**

## 6️⃣ FEEDS — ЕДИНСТВЕННЫЙ ОРКЕСТРАТОР

**feeds.config.ts**
```typescript
export const FEED_TYPES = {
  MAIN: 'cursor',
  HASHTAG: 'page',
  FAVORITES: 'page',
  SIMILAR: 'cursor',
};
```

**usePlacesFeed.ts**
```typescript
export function usePlacesFeed({ type, params }) {
  const query =
    type === 'cursor'
      ? useCursorPlacesQuery(params)
      : usePagePlacesQuery(params);

  const places = (query.data?.pages ?? query.data ?? [])
    .flatMap(p => p.data ?? p)
    .map(normalizePlace);

  return {
    places,
    ...query,
  };
}
```

**🔥 Теперь useUnifiedPlacesFeed больше НЕ нужен**

## 7️⃣ UI — ТУПОЙ И БЕЗОПАСНЫЙ

**PlaceGrid.tsx**
```typescript
export function PlaceGrid({ places }) {
  return places.map(place => (
    <PlaceCard key={place.id} place={place} />
  ));
}
```

**📌 PlaceGrid:**
- не знает про cursor
- не знает про SSR
- не знает про filters

## 8️⃣ PAGES — ТОЛЬКО КОНФИГУРАЦИЯ

**Главная страница**
```typescript
usePlacesFeed({
  type: FEED_TYPES.MAIN,
  params: { limit: 20 },
});
```

**Страница хэштега**
```typescript
usePlacesFeed({
  type: FEED_TYPES.HASHTAG,
  params: buildHashtagFilter(slug),
});
```

## 🧠 ИТОГ АРХИТЕКТУРЫ

```
PAGE
 └── usePlacesFeed (выбор стратегии)
     ├── query (cursor | page)
     ├── normalizePlace (ЕДИНО)
     └── PlaceGrid (тупой UI)
```

## ✅ ПРЕИМУЩЕСТВА

1. **Безопасность**: preview_image НЕ МОЖЕТ сломать UI
2. **Универсальность**: один PlaceGrid для всех страниц
3. **Изоляция**: каждый слой отвечает за свою задачу
4. **Расширяемость**: легко добавить новый тип фида
5. **SSR/CSR совместимость**: нет конфликтов
6. **Чистота**: логика не размазана

## 🚀 ИСПОЛЬЗОВАНИЕ

```typescript
// Главная страница
const { places, isLoading, fetchNextPage } = usePlacesFeed({
  type: FEED_TYPES.MAIN,
  params: { limit: 20 },
});

// Страница хэштега
const { places } = usePlacesFeed({
  type: FEED_TYPES.HASHTAG,
  params: buildHashtagFilter('travel'),
});

// Страница похожих
const { places } = usePlacesFeed({
  type: FEED_TYPES.SIMILAR,
  params: buildSimilarFilter('123'),
});
```

**Format once — trust everywhere** ✨
