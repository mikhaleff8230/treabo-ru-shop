// import axios from 'axios';

// Типы для геолокации
export interface GeoLocationData {
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

export interface CountryInfo {
  country: string;
  is_russian: boolean;
  ip: string;
}

export interface UserLocation {
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

class GeoLocationService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = (typeof window !== 'undefined' && (window as any).process?.env?.NEXT_PUBLIC_API_URL) || 'https://api.sancan.ru';
  }

  /**
   * Получить полную информацию о местоположении
   */
  async getCurrentLocation(): Promise<GeoLocationData> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/geoip/location`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
      throw new Error('Не удалось определить местоположение');
    }
  }

  /**
   * Получить информацию о стране
   */
  async getCountryInfo(): Promise<CountryInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/geoip/country`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения информации о стране:', error);
      throw new Error('Не удалось определить страну');
    }
  }

  /**
   * Проверить, является ли пользователь из России
   */
  async isRussianUser(): Promise<boolean> {
    try {
      const countryInfo = await this.getCountryInfo();
      return countryInfo.is_russian;
    } catch (error) {
      console.error('Ошибка проверки российского IP:', error);
      return false;
    }
  }

  /**
   * Получить город пользователя (только для России)
   */
  async getRussianCity(): Promise<string | null> {
    try {
      const isRussian = await this.isRussianUser();
      
      if (!isRussian) {
        console.log('Пользователь не из России');
        return null;
      }

      const location = await this.getCurrentLocation();
      return location.location.city || null;
    } catch (error) {
      console.error('Ошибка получения города:', error);
      return null;
    }
  }

  /**
   * Получить координаты пользователя
   */
  async getCoordinates(): Promise<{ lat: number; lon: number } | null> {
    try {
      const location = await this.getCurrentLocation();
      return {
        lat: location.location.lat,
        lon: location.location.lon
      };
    } catch (error) {
      console.error('Ошибка получения координат:', error);
      return null;
    }
  }

  /**
   * Сохранить местоположение пользователя в профиль
   */
  async saveUserLocation(userId: number, locationData: Partial<UserLocation>): Promise<UserLocation> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...locationData
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка сохранения местоположения:', error);
      throw new Error('Не удалось сохранить местоположение');
    }
  }

  /**
   * Получить сохраненное местоположение пользователя
   */
  async getUserLocation(userId: number): Promise<UserLocation | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user-location/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения местоположения пользователя:', error);
      return null;
    }
  }

  /**
   * Обновить местоположение пользователя
   */
  async updateUserLocation(userId: number, locationData: Partial<UserLocation>): Promise<UserLocation> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user-location/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка обновления местоположения:', error);
      throw new Error('Не удалось обновить местоположение');
    }
  }

  /**
   * Автоматически определить и сохранить местоположение пользователя
   */
  async autoDetectAndSaveLocation(userId: number): Promise<UserLocation | null> {
    try {
      const isRussian = await this.isRussianUser();
      
      if (!isRussian) {
        console.log('Пользователь не из России, местоположение не сохраняется');
        return null;
      }

      const location = await this.getCurrentLocation();
      const coordinates = await this.getCoordinates();

      if (!coordinates) {
        throw new Error('Не удалось получить координаты');
      }

      const locationData: Partial<UserLocation> = {
        user_id: userId,
        city: location.location.city || 'Неизвестно',
        region: location.location.state_name || 'Неизвестно',
        country: location.location.country,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        timezone: location.location.timezone,
        ip_address: location.ip,
        is_auto_detected: true
      };

      // Проверяем, есть ли уже сохраненное местоположение
      const existingLocation = await this.getUserLocation(userId);
      
      if (existingLocation) {
        return await this.updateUserLocation(userId, locationData);
      } else {
        return await this.saveUserLocation(userId, locationData);
      }
    } catch (error) {
      console.error('Ошибка автоматического определения местоположения:', error);
      return null;
    }
  }

  /**
   * Получить местоположение для карты (начальная точка для поиска ПВЗ)
   */
  async getLocationForMap(userId: number): Promise<{ lat: number; lon: number; city: string } | null> {
    try {
      // Сначала пытаемся получить сохраненное местоположение
      let userLocation = await this.getUserLocation(userId);
      
      // Если нет сохраненного местоположения, пытаемся определить автоматически
      if (!userLocation) {
        userLocation = await this.autoDetectAndSaveLocation(userId);
      }

      if (userLocation && userLocation.latitude && userLocation.longitude) {
        return {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          city: userLocation.city
        };
      }

      // Если ничего не получилось, возвращаем координаты Москвы по умолчанию
      return {
        lat: 55.7558,
        lon: 37.6176,
        city: 'Москва'
      };
    } catch (error) {
      console.error('Ошибка получения местоположения для карты:', error);
      // Возвращаем координаты Москвы по умолчанию
      return {
        lat: 55.7558,
        lon: 37.6176,
        city: 'Москва'
      };
    }
  }

  /**
   * Получить список российских городов для выбора
   */
  async getRussianCities(): Promise<Array<{ id: string; name: string; region: string }>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/russian-cities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения списка городов:', error);
      return [];
    }
  }

  /**
   * Ручной выбор города пользователем
   */
  async setUserCity(userId: number, cityId: string, cityName: string, region: string): Promise<UserLocation> {
    try {
      const locationData: Partial<UserLocation> = {
        user_id: userId,
        city: cityName,
        region: region,
        country: 'Russia',
        latitude: 0, // Будет определено по городу
        longitude: 0, // Будет определено по городу
        timezone: 'Europe/Moscow',
        ip_address: '',
        is_auto_detected: false
      };

      return await this.saveUserLocation(userId, locationData);
    } catch (error) {
      console.error('Ошибка установки города:', error);
      throw new Error('Не удалось установить город');
    }
  }
}

// Экспортируем singleton instance
export const geoLocationService = new GeoLocationService();
export default geoLocationService;
