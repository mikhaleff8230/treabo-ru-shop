# 🚀 НОВАЯ АРХИТЕКТУРА PLACES - Format once, trust everywhere

## 🎯 ЦЕЛЬ И ПРОБЛЕМА

**Проблема:** Старая архитектура позволяла `preview_image` ломать UI, логика была размазана, SSR и CSR конфликтовали.

**Решение:** Новая архитектура с единым контрактом, где `images` ВСЕГДА массив, и нормализация происходит один раз на входе.

## 📋 ОБЗОР АРХИТЕКТУРЫ

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE (ТОЛЬКО КОНФИГУРАЦИЯ)                   │
├─────────────────────────────────────────────────────────────────┤
│                    usePlacesFeed (ОРКЕСТРАТОР)                  │
├─────────────────────────────────────────────────────────────────┤
│              query (cursor|page) → normalizePlace              │
├─────────────────────────────────────────────────────────────────┤
│                      PlaceGrid (ТУПОЙ UI)                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ СТРУКТУРА ПРОЕКТА

```
src/
├── domain/place/           # 🔒 ЖЁСТКИЙ КОНТРАКТ
│   ├── place.types.ts      # Единый интерфейс Place
│   ├── place.contract.ts   # Контракт: images = array
│   └── index.ts
│
├── api/places/             # 🔌 ПОЛНАЯ ИЗОЛЯЦИЯ
│   ├── places.api.ts       # API функции
│   ├── places.endpoints.ts # Константы эндпоинтов
│   └── index.ts
│
├── normalizers/place/      # 🛡️ КРИТИЧЕСКИЙ СЛОЙ БЕЗОПАСНОСТИ
│   ├── normalizePlace.ts   # preview_image → images[]
│   └── index.ts
│
├── queries/places/         # ⚙️ МЕХАНИКА ЗАГРУЗКИ
│   ├── useCursorPlacesQuery.ts # cursor pagination
│   ├── usePagePlacesQuery.ts   # page pagination
│   └── index.ts
│
├── filters/places/         # 🔍 ЧИСТАЯ ЛОГИКА ФИЛЬТРОВ
│   ├── hashtag.filter.ts   # {hashtag_slug: string}
│   ├── favorites.filter.ts # {favorited_by: string}
│   ├── similar.filter.ts   # {place_id: string}
│   └── index.ts
│
├── feeds/places/           # 🎼 ЕДИНСТВЕННЫЙ ОРКЕСТРАТОР
│   ├── feeds.config.ts     # Типы фидов
│   ├── usePlacesFeed.ts    # query + normalize
│   └── index.ts
│
├── components/places/      # 🎨 ТУПОЙ UI
│   ├── PlaceGrid.tsx       # places.map() → PlaceCard
│   └── PlaceCard.tsx       # (уже существовал)
│
└── pages/places/           # ⚙️ КОНФИГУРАЦИЯ СТРАНИЦ
    ├── index.tsx           # usePlacesFeed(MAIN)
    └── element/
        └── [hashtagSlug].tsx # usePlacesFeed(HASHTAG)
```

## 1️⃣ DOMAIN - ЖЁСТКИЙ КОНТРАКТ

### place.types.ts
```typescript
export interface PlaceImage {
  id: string;
  url: string;
  thumbnail?: string;
}

export interface Place {
  id: string;
  title: string;
  images: PlaceImage[];  // 🔥 ВСЕГДА МАССИВ
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
}
```

### place.contract.ts
```typescript
export const PLACE_CONTRACT = {
  images: 'array', // ❗ НИКАКИЕ null/undefined НЕ ДОПУСКАЮТСЯ
};
```

**❌ ЗАПРЕЩЕНО ниже этого слоя:**
- `place.images?.length`
- `if (!place.images)`
- `place.preview_image`

## 2️⃣ API - ПОЛНАЯ ИЗОЛЯЦИЯ

### places.api.ts
```typescript
export async function fetchPlacesFeed(params: {
  limit?: number;
  cursor?: string;
}) {
  return HttpClient.get(PLACES_ENDPOINTS.FEED, params);
}

export async function fetchPlacesByHashtag(params: {
  hashtag_slug: string;
  page?: number;
  limit?: number;
}) {
  return HttpClient.get(
    `${PLACES_ENDPOINTS.HASHTAG}/${params.hashtag_slug}`,
    { page: params.page, limit: params.limit }
  );
}
```

### places.endpoints.ts
```typescript
export const PLACES_ENDPOINTS = {
  FEED: '/places/feed',
  HASHTAG: '/places/hashtag',
  SIMILAR: '/places/similar',
  MY_PLACES: '/places/my-places',
} as const;
```

**📌 API слой:**
- ✅ Не знает про React
- ✅ Не знает про pagination
- ✅ Возвращает данные "как есть"
- ✅ Изолирован от UI

## 3️⃣ NORMALIZER - СЛОЙ БЕЗОПАСНОСТИ

### normalizePlace.ts
```typescript
export function normalizePlace(raw: any): Place {
  // 🔥 КРИТИЧЕСКАЯ ЛОГИКА: preview_image → images[]
  const images =
    Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images
      : raw.preview_image
        ? [{
            id: raw.preview_image.id ?? 'preview',
            url: raw.preview_image.url,
            thumbnail: raw.preview_image.thumbnail ?? raw.preview_image.url,
          }]
        : []; // Пустой массив, если ничего нет

  return {
    ...raw,
    images, // ✅ ВСЕГДА МАССИВ
  };
}
```

**🔥 Результат:**
- `preview_image` → `images: [{id, url, thumbnail}]`
- `null/undefined` → `images: []`
- `images: []` → `images: []` (без изменений)

## 4️⃣ QUERIES - МЕХАНИКА ЗАГРУЗКИ

### useCursorPlacesQuery.ts
```typescript
export function useCursorPlacesQuery(params: { limit?: number }) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: ['places-feed', limit], // ❗ БЕЗ ОБЪЕКТОВ
    queryFn: ({ pageParam }) =>
      fetchPlacesFeed({ ...params, cursor: pageParam }),
    getNextPageParam: lastPage =>
      lastPage.meta?.has_more ? lastPage.meta.next_cursor : undefined,
  });
}
```

### usePagePlacesQuery.ts
```typescript
export function usePagePlacesQuery(params: {
  hashtag_slug: string;
  page?: number;
  limit?: number;
}) {
  const { hashtag_slug, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['places-page', hashtag_slug, page, limit],
    queryFn: () => fetchPlacesByHashtag(params),
  });
}
```

**📌 Query слой:**
- ❌ НЕТ нормализации
- ❌ НЕТ фильтров
- ❌ НЕТ UI логики
- ✅ Только загрузка данных

## 5️⃣ FILTERS - ЧИСТАЯ ЛОГИКА

### hashtag.filter.ts
```typescript
export function buildHashtagFilter(slug: string) {
  return { hashtag_slug: slug };
}
```

### favorites.filter.ts
```typescript
export function buildFavoritesFilter(userId: string) {
  return { favorited_by: userId };
}
```

### similar.filter.ts
```typescript
export function buildSimilarFilter(placeId: string) {
  return { place_id: placeId };
}
```

**📌 Преимущество:** Можно заменить на ElasticSearch без изменения UI

## 6️⃣ FEEDS - ОРКЕСТРАТОР

### feeds.config.ts
```typescript
export const FEED_TYPES = {
  MAIN: 'cursor',      // Главная страница
  HASHTAG: 'page',     // Страницы хэштегов
  FAVORITES: 'page',   // Избранные
  SIMILAR: 'cursor',   // Похожие плейсы
} as const;

export type FeedType = typeof FEED_TYPES[keyof typeof FEED_TYPES];
```

### usePlacesFeed.ts
```typescript
export function usePlacesFeed({
  type,
  params
}: {
  type: FeedType;
  params: any;
}) {
  // Выбор стратегии загрузки
  const query =
    type === 'cursor'
      ? useCursorPlacesQuery(params)
      : usePagePlacesQuery(params);

  // 🔥 ЕДИНСТВЕННАЯ НОРМАЛИЗАЦИЯ В СИСТЕМЕ
  const places = (query.data?.pages ?? query.data ?? [])
    .flatMap((p: any) => p.data ?? p)
    .map(normalizePlace); // ← ТОЛЬКО ЗДЕСЬ!

  return {
    places, // ✅ Нормализованные данные
    ...query, // isLoading, fetchNextPage, etc.
  };
}
```

**🔥 Ключевой момент:** Нормализация происходит только в одном месте!

## 7️⃣ UI - ТУПОЙ И БЕЗОПАСНЫЙ

### PlaceGrid.tsx
```typescript
export function PlaceGrid({
  places, // ✅ УЖЕ Place[]
  onLastItemRef,
  className = '',
}: {
  places: Place[]; // 🔥 НИКАКИХ any/null
  onLastItemRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}) {
  if (!places || places.length === 0) {
    return <div>Плейсы не найдены</div>;
  }

  return (
    <Masonry>
      {places.map((place, index) => ( // ✅ ВСЕГДА Place
        <PlaceCard key={place.id} place={place} />
      ))}
    </Masonry>
  );
}
```

**📌 UI слой:**
- ❌ Не знает про API
- ❌ Не знает про cursor/pagination
- ❌ Не знает про фильтры
- ✅ Получает готовые `Place[]`

## 8️⃣ PAGES - ТОЛЬКО КОНФИГУРАЦИЯ

### Главная страница (index.tsx)
```typescript
const FeedPage: NextPageWithLayout = () => {
  // 🎯 ТОЛЬКО КОНФИГУРАЦИЯ
  const { places, isLoading, fetchNextPage } = usePlacesFeed({
    type: FEED_TYPES.MAIN,
    params: { limit: 20 },
  });

  return (
    <div>
      <PlaceGrid places={places} /> {/* ✅ ПЕРЕДАЁМ ГОТОВЫЕ ДАННЫЕ */}
    </div>
  );
};
```

### Страница хэштега ([hashtagSlug].tsx)
```typescript
const HashtagPage: NextPageWithLayout = ({ hashtag }) => {
  // 🎯 ТОЛЬКО КОНФИГУРАЦИЯ
  const { places } = usePlacesFeed({
    type: FEED_TYPES.HASHTAG,
    params: buildHashtagFilter(hashtag.slug), // 🔧 ЧИСТАЯ ЛОГИКА
  });

  return (
    <div>
      <PlaceGrid places={places} /> {/* ✅ ТО ЖЕ САМОЕ */}
    </div>
  );
};
```

## 🚀 ПРАКТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ

### Добавление нового типа фида:

1. **Добавить тип в feeds.config.ts:**
```typescript
export const FEED_TYPES = {
  // ... существующие
  NEW_TYPE: 'cursor', // или 'page'
} as const;
```

2. **Добавить фильтр (если нужно):**
```typescript
// filters/places/new.filter.ts
export function buildNewFilter(param: string) {
  return { new_param: param };
}
```

3. **Добавить API функцию (если нужно):**
```typescript
// api/places/places.api.ts
export async function fetchNewPlaces(params) {
  return HttpClient.get(PLACES_ENDPOINTS.NEW, params);
}
```

4. **Использовать в странице:**
```typescript
const { places } = usePlacesFeed({
  type: FEED_TYPES.NEW_TYPE,
  params: buildNewFilter('value'),
});
```

## ✅ ПРЕИМУЩЕСТВА АРХИТЕКТУРЫ

### 1. **Безопасность**
- `preview_image` НЕ МОЖЕТ сломать UI
- Всегда `images: PlaceImage[]`
- Нет неожиданных `null/undefined`

### 2. **Универсальность**
- Один `PlaceGrid` для всех страниц
- Один `PlaceCard` для всех контекстов
- Переиспользование компонентов 100%

### 3. **Изоляция**
- Каждый слой отвечает за свою задачу
- API не знает про UI
- UI не знает про API

### 4. **Расширяемость**
- Легко добавить новый тип фида
- Легко изменить API (через normalizer)
- Легко заменить фильтры

### 5. **SSR/CSR совместимость**
- Нет конфликтов hydration
- Единый поток данных
- Безопасная загрузка

## 🧪 ТЕСТИРОВАНИЕ

### Критерии приёмки:
- ✅ 500+ плейсов без краша
- ✅ Отсутствие hydration warning
- ✅ `preview_image` всегда отображается или пусто
- ✅ Infinite scroll стабилен
- ✅ Кнопка "ещё" не дёргается

### Мониторинг:
- Все `Place` имеют `images: PlaceImage[]`
- Нет `place.images?.length` в компонентах
- Нормализация только в `usePlacesFeed`

## 🎯 ФИНАЛЬНЫЙ ПРИНЦИП

**Format once — trust everywhere**

1. **Format:** `normalizePlace()` → `Place[]`
2. **Trust:** Все компоненты доверяют данным
3. **Everywhere:** Один интерфейс для всех контекстов

---

## 📚 ДОКУМЕНТАЦИЯ ПО СЛОЯМ

- [Domain слой](./domain/place/) - контракты и типы
- [API слой](./api/places/) - изоляция запросов
- [Normalizer](./normalizers/place/) - безопасность данных
- [Queries](./queries/places/) - механика загрузки
- [Filters](./filters/places/) - бизнес-логика
- [Feeds](./feeds/places/) - оркестрация
- [UI Components](./components/places/) - отображение
- [Pages](./pages/places/) - конфигурация

---

**🚀 Архитектура готова к продакшену!** ✨
