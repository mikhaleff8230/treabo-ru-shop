# 📋 Places Architecture - Быстрый обзор

## 🎯 Что реализовано

✅ **Новая архитектура "Format once - trust everywhere"**
✅ **Безопасность:** `preview_image` НЕ ломает UI
✅ **Универсальность:** Один `PlaceGrid` для всех страниц
✅ **Изоляция:** Каждый слой за свою задачу
✅ **Единый контракт:** `images` всегда массив

## 🏗️ Структура (кратко)

```
src/
├── domain/place/      # 🔒 Контракты и типы
├── api/places/        # 🔌 Изоляция API
├── normalizers/place/ # 🛡️ Безопасность данных
├── queries/places/    # ⚙️ Загрузка данных
├── filters/places/    # 🔍 Логика фильтров
├── feeds/places/      # 🎼 Оркестратор
├── components/places/ # 🎨 UI компоненты
└── pages/places/      # ⚙️ Конфигурация страниц
```

## 🚀 Как использовать

### В странице:
```typescript
import { usePlacesFeed } from '@/feeds/places';
import { FEED_TYPES } from '@/feeds/places';
import { PlaceGrid } from '@/components/places';

export default function MyPage() {
  const { places, isLoading, fetchNextPage } = usePlacesFeed({
    type: FEED_TYPES.MAIN, // или HASHTAG, FAVORITES, etc.
    params: { limit: 20 },
  });

  return <PlaceGrid places={places} />;
}
```

### Добавить новый фид:
```typescript
// 1. Добавить тип
FEED_TYPES.NEW_FEED = 'cursor';

// 2. Создать фильтр (опционально)
export function buildNewFilter(param) {
  return { new_param: param };
}

// 3. Использовать
const { places } = usePlacesFeed({
  type: FEED_TYPES.NEW_FEED,
  params: buildNewFilter('value'),
});
```

## ✅ Преимущества

- 🔒 **Безопасность** - нет неожиданных крашей
- 🎯 **Простота** - один компонент для всех фидов
- 🔄 **Расширяемость** - легко добавить новый тип
- ⚡ **Производительность** - нормализация только раз
- 🎨 **UI/UX** - консистентный интерфейс

## 📚 Документация

- **[Полная инструкция](./PLACES_NEW_ARCHITECTURE_GUIDE.md)** - детальное описание
- **[Шпаргалка](./PLACES_CHEATSHEET.md)** - быстрый старт
- **[Старая архитектура](./PLACES_SYSTEM_GUIDE.md)** - для понимания миграции

## 🎯 Ключевой принцип

**Format once — trust everywhere**

1. Данные нормализуются **единожды** в `usePlacesFeed`
2. Все компоненты **доверяют** интерфейсу `Place[]`
3. Работает **везде** - SSR, CSR, разные страницы

---

**🚀 Архитектура готова к использованию!** ✨
