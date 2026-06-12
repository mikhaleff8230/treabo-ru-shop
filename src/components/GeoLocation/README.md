# 🌍 Система геолокации пользователей (Фронтенд)

## 📋 Обзор

Система определения и сохранения местоположения пользователей для использования в поиске ПВЗ, картах и других сервисах.

## 🚀 Компоненты

### 1. **GeoLocationService** (`services/geoLocationService.ts`)
Основной сервис для работы с геолокацией.

**Методы:**
- `getCurrentLocation()` - Получить полную информацию о местоположении
- `getCountryInfo()` - Получить информацию о стране
- `isRussianUser()` - Проверить, является ли пользователь из России
- `getRussianCity()` - Получить город пользователя (только для России)
- `getCoordinates()` - Получить координаты пользователя
- `saveUserLocation()` - Сохранить местоположение в профиль
- `getUserLocation()` - Получить сохраненное местоположение
- `updateUserLocation()` - Обновить местоположение
- `autoDetectAndSaveLocation()` - Автоматически определить и сохранить
- `getLocationForMap()` - Получить местоположение для карты
- `getRussianCities()` - Получить список российских городов
- `setUserCity()` - Ручной выбор города

### 2. **useGeoLocation** (`hooks/useGeoLocation.ts`)
React хук для использования геолокации в компонентах.

**Возвращает:**
- `userLocation` - Данные о местоположении пользователя
- `isLoading` - Состояние загрузки
- `error` - Ошибка, если есть
- `isRussian` - Является ли пользователь из России
- `city` - Город пользователя
- `coordinates` - Координаты пользователя
- `refreshLocation()` - Обновить местоположение
- `setManualLocation()` - Установить местоположение вручную

### 3. **LocationDisplay** (`components/GeoLocation/LocationDisplay.tsx`)
Компонент для отображения текущего местоположения.

**Пропсы:**
- `userId` - ID пользователя
- `showRefreshButton` - Показать кнопку обновления
- `showCitySelector` - Показать кнопку выбора города
- `onLocationChange` - Колбэк при изменении местоположения
- `className` - CSS классы

### 4. **CitySelector** (`components/GeoLocation/CitySelector.tsx`)
Компонент для выбора города из списка.

**Пропсы:**
- `userId` - ID пользователя
- `onCitySelect` - Колбэк при выборе города
- `currentCity` - Текущий город
- `className` - CSS классы

### 5. **MapWithLocation** (`components/GeoLocation/MapWithLocation.tsx`)
Компонент карты с отображением местоположения и ПВЗ.

**Пропсы:**
- `userId` - ID пользователя
- `onLocationChange` - Колбэк при изменении местоположения
- `className` - CSS классы
- `height` - Высота карты
- `showUserLocation` - Показать местоположение пользователя
- `showPVZMarkers` - Показать маркеры ПВЗ

### 6. **GeoLocationExample** (`components/GeoLocation/GeoLocationExample.tsx`)
Пример использования всех компонентов вместе.

## 🛠️ Использование

### Базовое использование
```tsx
import { useGeoLocation } from '../hooks/useGeoLocation';

function MyComponent({ userId }) {
  const {
    userLocation,
    isLoading,
    error,
    isRussian,
    city,
    coordinates,
    refreshLocation
  } = useGeoLocation(userId);

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!isRussian) return <div>Сервис доступен только для России</div>;

  return (
    <div>
      <p>Город: {city}</p>
      <p>Координаты: {coordinates?.lat}, {coordinates?.lon}</p>
      <button onClick={refreshLocation}>Обновить</button>
    </div>
  );
}
```

### Использование сервиса напрямую
```tsx
import { geoLocationService } from '../services/geoLocationService';

async function handleLocation() {
  try {
    const isRussian = await geoLocationService.isRussianUser();
    if (!isRussian) return;

    const location = await geoLocationService.autoDetectAndSaveLocation(userId);
    console.log('Местоположение:', location);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}
```

### Использование компонентов
```tsx
import { LocationDisplay } from '../components/GeoLocation/LocationDisplay';
import { MapWithLocation } from '../components/GeoLocation/MapWithLocation';

function MyPage({ userId }) {
  return (
    <div>
      <LocationDisplay userId={userId} />
      <MapWithLocation userId={userId} height="400px" />
    </div>
  );
}
```

## 🔧 API Endpoints

### 1. **GeoIP API**
- `GET /api/geoip/location` - Полная информация о местоположении
- `GET /api/geoip/country` - Информация о стране
- `GET /api/geoip/location/{ip}` - Местоположение по IP

### 2. **User Location API**
- `GET /api/user-location/{userId}` - Получить местоположение пользователя
- `POST /api/user-location` - Сохранить местоположение
- `PUT /api/user-location/{userId}` - Обновить местоположение

### 3. **Cities API**
- `GET /api/russian-cities` - Список российских городов

## 📊 Типы данных

### UserLocation
```typescript
interface UserLocation {
  id?: number;
  user_id: number;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ip_address: string;
  is_auto_detected: boolean;
  created_at?: string;
  updated_at?: string;
}
```

### GeoLocationData
```typescript
interface GeoLocationData {
  ip: string;
  location: {
    ip: string;
    country: string;
    iso_code: string;
    city: string | null;
    state: string | null;
    state_name: string | null;
    postal_code: string | null;
    lat: number;
    lon: number;
    timezone: string;
    continent: string;
    currency: string;
  };
}
```

## 🎯 Особенности

### 1. **Автоматическое определение**
- Система автоматически определяет местоположение по IP
- Сохраняет данные в профиль пользователя
- Работает только для российских IP

### 2. **Ручной выбор**
- Пользователь может выбрать город вручную
- Поиск по названию города и региону
- Автодополнение при вводе

### 3. **Интеграция с картами**
- Начальная точка для поиска ПВЗ
- Отображение маркеров местоположения
- Интеграция с Яндекс.Картами

### 4. **Кэширование**
- Данные кэшируются в состоянии компонента
- Автоматическое обновление при изменении
- Обработка ошибок и состояний загрузки

## 🔒 Безопасность

- Проверка российского IP перед сохранением
- Валидация данных на сервере
- Обработка ошибок и исключений
- Защита от XSS и CSRF атак

## 📈 Производительность

- Ленивая загрузка компонентов
- Кэширование API запросов
- Оптимизированные перерендеры
- Минимальная нагрузка на сервер

## 🆘 Устранение неполадок

### Ошибка "Пользователь не из России"
- Проверьте IP адрес пользователя
- Убедитесь, что GeoIP API работает
- Проверьте настройки VPN

### Ошибка загрузки карты
- Проверьте API ключ Яндекс.Карт
- Убедитесь, что скрипт карты загружается
- Проверьте консоль браузера на ошибки

### Ошибка сохранения местоположения
- Проверьте API endpoints
- Убедитесь, что пользователь авторизован
- Проверьте валидацию данных

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера
2. Убедитесь в правильности API endpoints
3. Проверьте авторизацию пользователя
4. Обратитесь к документации API

---

**Дата создания:** 25 октября 2025  
**Версия:** 1.0  
**Статус:** ✅ Готов к использованию


