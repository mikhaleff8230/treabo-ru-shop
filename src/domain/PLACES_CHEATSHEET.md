# 🚀 PLACES ARCHITECTURE - ШПАРГАЛКА

## 🎯 БЫСТРЫЙ СТАРТ

### 1. Добавить новый тип фида:

```typescript
// feeds/places/feeds.config.ts
export const FEED_TYPES = {
  // ... существующие
  MY_FEED: 'cursor', // или 'page'
} as const;
```

### 2. Создать фильтр (если нужно):

```typescript
// filters/places/my.filter.ts
export function buildMyFilter(param: string) {
  return { my_param: param };
}
```

### 3. Использовать в странице:

```typescript
// pages/my-page.tsx
import { usePlacesFeed } from '@/feeds/places';
import { FEED_TYPES } from '@/feeds/places';
import { buildMyFilter } from '@/filters/places/my.filter';
import { PlaceGrid } from '@/components/places/PlaceGrid';

export default function MyPage() {
  const { places, isLoading, fetchNextPage, hasNextPage } = usePlacesFeed({
    type: FEED_TYPES.MY_FEED,
    params: buildMyFilter('value'),
  });

  if (isLoading && !places.length) {
    return <Loader />;
  }

  return (
    <div>
      <PlaceGrid places={places} />

      {hasNextPage && (
        <button onClick={fetchNextPage}>
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
```

## ✅ ЧТО МОЖНО ДЕЛАТЬ

- ✅ Использовать `usePlacesFeed` для всех фидов
- ✅ Передавать `Place[]` в `PlaceGrid`
- ✅ Доверять, что `place.images` всегда массив
- ✅ Добавлять новые фильтры без изменения UI

## ❌ ЧТО ЗАПРЕЩЕНО

- ❌ `useUnifiedPlacesFeed` (устарел)
- ❌ `PlacesFeed` компонент (старый)
- ❌ `place.preview_image` в компонентах
- ❌ `place.images?.length` проверки
- ❌ Ручная нормализация данных

## 🔧 ОСНОВНЫЕ КОМПОНЕНТЫ

| Компонент | Ответственность | Использование |
|-----------|----------------|---------------|
| `usePlacesFeed` | Оркестратор + нормализация | Все страницы |
| `PlaceGrid` | Отображение массива | `<PlaceGrid places={places} />` |
| `PlaceCard` | Карточка одного плейса | Автоматически в PlaceGrid |
| `normalizePlace` | Безопасность данных | Только в usePlacesFeed |

## 📊 ТИПЫ ФИДОВ

| Тип | Стратегия | Примеры страниц |
|-----|-----------|-----------------|
| `MAIN` | cursor | Главная `/places` |
| `HASHTAG` | page | `/places/element/travel` |
| `FAVORITES` | page | Избранные плейсы |
| `SIMILAR` | cursor | Похожие плейсы |

## 🛠️ ДОБАВЛЕНИЕ НОВОГО API

### 1. Добавить эндпоинт:
```typescript
// api/places/places.endpoints.ts
export const PLACES_ENDPOINTS = {
  // ... существующие
  NEW_ENDPOINT: '/places/new',
} as const;
```

### 2. Добавить API функцию:
```typescript
// api/places/places.api.ts
export async function fetchNewPlaces(params) {
  return HttpClient.get(PLACES_ENDPOINTS.NEW_ENDPOINT, params);
}
```

### 3. Добавить query хук (если новая стратегия):
```typescript
// queries/places/useNewQuery.ts
export function useNewQuery(params) {
  return useQuery({
    queryKey: ['places-new', params],
    queryFn: () => fetchNewPlaces(params),
  });
}
```

## 🧪 ТЕСТИРОВАНИЕ

### Критерии качества:
- ✅ `places` всегда `Place[]`
- ✅ Нет `null/undefined` в `images`
- ✅ UI не ломается при `preview_image`
- ✅ SSR и CSR работают одинаково

### Мониторинг:
```typescript
// В компоненте - это ДОЛЖНО работать всегда
places.forEach(place => {
  console.log(place.images.length); // ✅ Всегда число
});
```

## 🎯 ПРИНЦИП "FORMAT ONCE - TRUST EVERYWHERE"

1. **Format:** `normalizePlace()` преобразует данные → `Place[]`
2. **Trust:** Все компоненты доверяют интерфейсу
3. **Everywhere:** Один контракт для всего приложения

---

**🚀 Нужна помощь?** Смотри [PLACES_NEW_ARCHITECTURE_GUIDE.md](./PLACES_NEW_ARCHITECTURE_GUIDE.md)
