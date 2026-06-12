# 📚 Places System Documentation Index

## 🎯 АКТУАЛЬНАЯ АРХИТЕКТУРА (2025)

### Основная документация
- **[README_PLACES_ARCHITECTURE.md](./README_PLACES_ARCHITECTURE.md)** - Быстрый обзор новой архитектуры
- **[PLACES_NEW_ARCHITECTURE_GUIDE.md](./PLACES_NEW_ARCHITECTURE_GUIDE.md)** - Полная инструкция по новой архитектуре "Format once - trust everywhere"
- **[PLACES_CHEATSHEET.md](./PLACES_CHEATSHEET.md)** - Шпаргалка для быстрого старта

### Ключевые преимущества новой архитектуры:
- ✅ **Безопасность:** `preview_image` НЕ МОЖЕТ сломать UI
- ✅ **Универсальность:** Один `PlaceGrid` для всех страниц
- ✅ **Изоляция:** Каждый слой отвечает за свою задачу
- ✅ **Единый контракт:** `images` ВСЕГДА массив

## 📋 СТАРАЯ АРХИТЕКТУРА (устаревшая)

### Документация по старой системе
- **[PLACES_SYSTEM_GUIDE.md](./PLACES_SYSTEM_GUIDE.md)** - Описание старой гибридной архитектуры (useUnifiedPlacesFeed)

### Что изменилось:
- ❌ `useUnifiedPlacesFeed` → ✅ `usePlacesFeed`
- ❌ `PlacesFeed` компонент → ✅ `PlaceGrid`
- ❌ Ручная обработка `preview_image` → ✅ Автоматическая нормализация
- ❌ Разные компоненты для разных страниц → ✅ Один универсальный компонент

## 🗂️ Структура проекта

```
src/
├── domain/place/           # 🔒 Жёсткий контракт (новая архитектура)
├── api/places/             # 🔌 Изоляция API (новая архитектура)
├── normalizers/place/      # 🛡️ Слой безопасности (новая архитектура)
├── queries/places/         # ⚙️ Механика загрузки (новая архитектура)
├── filters/places/         # 🔍 Логика фильтров (новая архитектура)
├── feeds/places/           # 🎼 Оркестратор (новая архитектура)
├── components/places/      # 🎨 UI компоненты (обновлено)
├── pages/places/           # ⚙️ Конфигурация страниц (обновлено)
├── data/place.ts           # 📊 Старые хуки (для обратной совместимости)
└── components/places/      # 🎨 Старые компоненты (для обратной совместимости)
    ├── places-feed.tsx     # (устарел, не использовать)
    └── place-masonry-grid.tsx # (устарел, использовать PlaceGrid)
```

## 🚀 МИГРАЦИЯ

### Как перейти на новую архитектуру:

1. **Заменить импорт:**
```typescript
// ❌ СТАРОЕ
import PlacesFeed from '@/components/places/places-feed';
import { useUnifiedPlacesFeed } from '@/data/place';

// ✅ НОВОЕ
import { PlaceGrid } from '@/components/places/PlaceGrid';
import { usePlacesFeed } from '@/feeds/places';
import { FEED_TYPES } from '@/feeds/places';
```

2. **Заменить использование:**
```typescript
// ❌ СТАРОЕ
const { places, isLoading } = useUnifiedPlacesFeed({
  limit: 20,
  filters: { hashtag_slug: 'travel' }
});

return <PlacesFeed limit={20} filters={filters} />;

// ✅ НОВОЕ
const { places, isLoading } = usePlacesFeed({
  type: FEED_TYPES.HASHTAG,
  params: buildHashtagFilter('travel'),
});

return <PlaceGrid places={places} />;
```

3. **Удалить устаревший код:**
- `useUnifiedPlacesFeed`
- `PlacesFeed` компонент
- Ручную обработку `preview_image`

## 📈 РОАДМАП

### Завершено ✅
- [x] Новая архитектура "Format once - trust everywhere"
- [x] Domain слой с жёстким контрактом
- [x] API изоляция
- [x] Нормализатор для безопасности
- [x] Query хуки для загрузки
- [x] Filters слой
- [x] Feeds оркестратор
- [x] UI компоненты (PlaceGrid)
- [x] Обновление страниц
- [x] Документация

### В работе 🚧
- [ ] Тестирование производительности
- [ ] Оптимизация загрузки изображений
- [ ] Добавление новых типов фидов (FAVORITES, SIMILAR)

### Планируется 📋
- [ ] Интеграция с ElasticSearch
- [ ] Кэширование на уровне сервиса
- [ ] A/B тестирование UX

## 👥 КОНТАКТЫ

При возникновении вопросов по архитектуре:
1. Сначала прочитайте [PLACES_NEW_ARCHITECTURE_GUIDE.md](./PLACES_NEW_ARCHITECTURE_GUIDE.md)
2. Посмотрите примеры в [PLACES_CHEATSHEET.md](./PLACES_CHEATSHEET.md)
3. Проверьте существующую реализацию в коде

## 🎯 ПРИНЦИП

**Format once — trust everywhere**

Нормализуем данные единожды → доверяем интерфейсу везде → консистентность и безопасность.

---

**🚀 Новая архитектура Places готова к продакшену!** ✨
