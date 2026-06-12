import { useState, useEffect, useCallback } from 'react';
import { geoLocationService, UserLocation } from '../services/geoLocationService';

interface UseGeoLocationReturn {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  isRussian: boolean;
  city: string | null;
  coordinates: { lat: number; lon: number } | null;
  refreshLocation: () => Promise<void>;
  setManualLocation: (cityId: string, cityName: string, region: string) => Promise<void>;
}

export const useGeoLocation = (userId: number): UseGeoLocationReturn => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRussian, setIsRussian] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Загружаем местоположение пользователя
  const loadUserLocation = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Проверяем, является ли пользователь из России
      const isRussianUser = await geoLocationService.isRussianUser();
      setIsRussian(isRussianUser);

      // Получаем местоположение для всех пользователей
      const currentLocation = await geoLocationService.getCurrentLocation();
      setUserLocation(currentLocation);

      if (currentLocation) {
        setCity(currentLocation.location.city);
        setCoordinates({
          lat: currentLocation.location.lat,
          lon: currentLocation.location.lon
        });
      }

      // Получаем сохраненное местоположение
      let savedLocation = await geoLocationService.getUserLocation(userId);

      // Если нет сохраненного местоположения, пытаемся определить автоматически
      if (!savedLocation) {
        savedLocation = await geoLocationService.autoDetectAndSaveLocation(userId);
      }

      // Используем сохраненное местоположение если есть, иначе текущее
      const finalLocation = savedLocation || currentLocation;
      setUserLocation(finalLocation);

      if (finalLocation) {
        setCity(finalLocation.city || currentLocation?.location.city);
        setCoordinates({
          lat: finalLocation.latitude || currentLocation?.location.lat || 0,
          lon: finalLocation.longitude || currentLocation?.location.lon || 0
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки местоположения:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Обновляем местоположение
  const refreshLocation = useCallback(async () => {
    await loadUserLocation();
  }, [loadUserLocation]);

  // Устанавливаем местоположение вручную
  const setManualLocation = useCallback(async (cityId: string, cityName: string, region: string) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const location = await geoLocationService.setUserCity(userId, cityId, cityName, region);
      setUserLocation(location);
      setCity(location.city);
      setCoordinates({
        lat: location.latitude,
        lon: location.longitude
      });
    } catch (err) {
      console.error('Ошибка установки местоположения:', err);
      setError(err instanceof Error ? err.message : 'Не удалось установить местоположение');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Загружаем местоположение при монтировании компонента
  useEffect(() => {
    loadUserLocation();
  }, [loadUserLocation]);

  return {
    userLocation,
    isLoading,
    error,
    isRussian,
    city,
    coordinates,
    refreshLocation,
    setManualLocation
  };
};
