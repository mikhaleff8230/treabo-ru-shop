import React, { useState, useEffect, useCallback } from 'react';
import cn from 'classnames';
import { useMe } from '@/data/user';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { getAuthToken } from '@/data/client/token.utils';

interface LocationData {
  ip: string;
  location: {
    city?: string;
    state_name?: string;
    country?: string;
    iso_code?: string;
    lat?: number;
    lon?: number;
  };
}

interface City {
  name: string;
  region?: string;
  country?: string;
  full_name: string;
  lat: number;
  lon: number;
  address: string;
}

interface Address {
  value: string; // Полный адрес
  unrestricted_value?: string;
  city?: string;
  city_with_type?: string;
  region?: string;
  region_with_type?: string;
  country?: string;
  street?: string;
  street_with_type?: string;
  house?: string;
  block?: string;
  flat?: string;
  postal_code?: string;
  lat?: number;
  lon?: number;
  kladr_id?: string;
  fias_id?: string;
  city_kladr_id?: string;
  city_fias_id?: string;
  // Для совместимости
  name?: string;
  full_name?: string;
  address?: string;
}

interface SimpleLocationProps {
  isCollapse?: boolean;
  className?: string;
}

export const LocationWithModal: React.FC<SimpleLocationProps> = ({
  isCollapse = false,
  className = ''
}) => {
  const { me, isAuthorized } = useMe();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [savedCity, setSavedCity] = useState<City | null>(null);
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Address[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false); // Защита от повторных вызовов
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Загружаем сохраненный адрес или город
  const loadSavedAddress = useCallback(async (): Promise<{ address?: Address; city?: City } | null> => {
    try {
      // Сначала пробуем загрузить сохраненный адрес
      const addressResponse = await fetch('https://api.sancan.ru/api/geoip/address/saved', {
        credentials: 'include'
      });
      
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        if (addressData && addressData.address) {
          const addr = addressData.address;
          const address: Address = {
            value: addr.full_address || addr.address || '',
            city: addr.city,
            region: addr.region,
            country: addr.country,
            street: addr.street,
            house: addr.house,
            flat: addr.flat,
            postal_code: addr.postal_code,
            lat: addr.lat,
            lon: addr.lon,
            kladr_id: addr.kladr_id,
            fias_id: addr.fias_id
          };
          
          const city: City = {
            name: addr.city || '',
            region: addr.region,
            country: addr.country || 'Россия',
            full_name: addr.full_address || addr.address || addr.city || '',
            lat: addr.lat || 0,
            lon: addr.lon || 0,
            address: addr.full_address || addr.address || addr.city || ''
          };
          
          return { address, city };
        }
      }
      
      // Если адрес не найден, пробуем загрузить сохраненный город (для обратной совместимости)
      const cityResponse = await fetch('https://api.sancan.ru/api/geoip/city/saved', {
        credentials: 'include'
      });
      
      if (cityResponse.ok) {
        const cityData = await cityResponse.json();
        if (cityData && cityData.city && cityData.city.city) {
          const city: City = {
            name: cityData.city.city,
            region: cityData.city.region,
            country: cityData.city.country,
            full_name: [cityData.city.city, cityData.city.region, cityData.city.country].filter(Boolean).join(', '),
            lat: cityData.city.lat || 0,
            lon: cityData.city.lon || 0,
            address: cityData.city.city
          };
          return { city };
        }
      }
    } catch (err) {
      console.debug('Не удалось загрузить сохраненный адрес:', err);
    }
    return null;
  }, []);

  // Получаем HTML5 Geolocation для максимальной точности (WiFi/Cell/GPS)
  const getHTML5Location = useCallback((): Promise<{lat: number, lon: number, accuracy: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy || 0
          });
        },
        (error) => {
          console.log('HTML5 Geolocation не доступен:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true, // Использует WiFi/Cell/GPS для максимальной точности
          timeout: 5000,
          maximumAge: 0 // Не использовать кэш
        }
      );
    });
  }, []);

  // Загружаем геолокацию через Яндекс Локацию с поддержкой WiFi/Cell
  const loadLocation = useCallback(async () => {
      // Защита от повторных вызовов
      if (isLoadingLocation) {
        return;
      }
      
      try {
        setIsLoadingLocation(true);
        setIsLoading(true);
        setError(null);
        
      // ПРИОРИТЕТ 1: Сначала пробуем загрузить сохраненный адрес (user_selected или auto_detected)
      try {
        const savedData = await loadSavedAddress();
        
        // Если есть сохраненный адрес (user_selected или auto_detected), используем его
        // НЕ делаем запрос к Dadata, если есть сохраненный адрес
        if (savedData && (savedData.address || savedData.city)) {
          if (savedData.address) {
            setSavedAddress(savedData.address);
            // Если есть user_selected адрес - это приоритет, не делаем запрос к Dadata
            if (savedData.address.source_type === 'user_selected') {
              setSavedCity({
                name: savedData.address.city || '',
                region: savedData.address.region,
                country: savedData.address.country || 'Россия',
                full_name: savedData.address.full_address || savedData.address.address || savedData.address.city || '',
                lat: savedData.address.lat || 0,
                lon: savedData.address.lon || 0,
                address: savedData.address.full_address || savedData.address.address || savedData.address.city || ''
              });
              setLocation({
                ip: '',
                location: {
                  city: savedData.address.city || '',
                  state_name: savedData.address.region_with_type || savedData.address.region,
                  country: savedData.address.country || 'Россия',
                  lat: savedData.address.lat || 0,
                  lon: savedData.address.lon || 0
                }
              });
              setIsLoading(false);
              setIsLoadingLocation(false);
              return; // ВАЖНО: не делаем запрос к Dadata, если есть user_selected адрес
            }
          }
          if (savedData.city) {
            setSavedCity(savedData.city);
            setLocation({
              ip: '',
              location: {
                city: savedData.city.name,
                state_name: savedData.city.region,
                country: savedData.city.country,
                lat: savedData.city.lat,
                lon: savedData.city.lon
              }
            });
          }
          setIsLoading(false);
          setIsLoadingLocation(false);
          return;
        }
      } catch (err) {
        console.debug('Ошибка загрузки сохраненного адреса, продолжаем автоопределение:', err);
        // Продолжаем выполнение, если не удалось загрузить сохраненный адрес
      }
      
      // Пробуем получить точные координаты через HTML5 Geolocation (использует WiFi/Cell/GPS)
      const html5Location = await getHTML5Location();
      
      // Подготавливаем данные для запроса
      const requestBody: any = {};
      
      // Если есть координаты от HTML5 Geolocation, отправляем их для максимальной точности
      if (html5Location) {
        requestBody.coordinates = {
          lat: html5Location.lat,
          lon: html5Location.lon,
          accuracy: html5Location.accuracy
        };
      }
      
      // Примечание: WiFi и Cell данные напрямую в браузере получить нельзя из соображений безопасности
      // Но HTML5 Geolocation уже использует WiFi/Cell/GPS для определения координат
      // Система использует DaData для обратного геокодинга координат в адрес
      
      // Отправляем POST запрос с координатами (если есть) к API геолокации
      // API использует гибридную систему: DaData (основной) -> MaxMind (fallback)
      const response = await fetch('https://api.sancan.ru/api/geoip/location', {
        method: Object.keys(requestBody).length > 0 ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
        credentials: 'include'
      });
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error || 'Ошибка загрузки геолокации');
      }
      
      // Проверяем, что данные корректны
      if (data && (data.location || data.ip)) {
        setLocation(data);
        setError(null);
        
        // Если данные пришли из сохраненного адреса (from_saved: true), обновляем savedAddress
        if (data.from_saved && data.location) {
          const loc = data.location;
          if (loc.source === 'user_selected' || loc.source === 'auto_detected') {
            // Адрес уже сохранен в БД, не нужно его сохранять повторно
            console.log('✅ Адрес загружен из сохраненных данных:', loc.source);
          }
        }
      } else {
        throw new Error('Некорректные данные от сервера');
      }
      } catch (err) {
        console.error('Ошибка загрузки геолокации:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки геолокации';
      setError(errorMessage);
      // Не очищаем location, если он был загружен ранее
      if (!location) {
        setLocation(null);
      }
      } finally {
        setIsLoading(false);
        setIsLoadingLocation(false);
      }
  }, [loadSavedAddress, getHTML5Location]);

  useEffect(() => {
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Загружаем только при монтировании компонента

  // Поиск адресов при изменении запроса
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchAddresses(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  // Поиск полных адресов через DaData API (город, улица, дом)
  // Документация: https://dadata.ru/api/suggest/address/
  const searchAddresses = async (query: string) => {
    try {
      setIsSearching(true);
      const url = `https://api.sancan.ru/api/geoip/addresses/search?q=${encodeURIComponent(query)}&count=10`;
      console.log('🔍 Поиск адресов через DaData:', query, url);
      
      // API использует DaData для поиска полных адресов
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('📡 Ответ от API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Данные получены:', data);
        // Формат ответа: { addresses: [...], total: ... }
        const addresses = data.addresses || [];
        console.log('📍 Найдено адресов:', addresses.length);
        setSearchResults(addresses);
        
        if (addresses.length === 0 && data.error) {
          console.error('❌ Ошибка от API:', data.error);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка HTTP:', response.status, errorText);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Ошибка поиска адресов:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Сохранение полного адреса (город, улица, дом)
  const saveAddress = async (address: Address) => {
    try {
      console.log('💾 Сохранение адреса:', address);
      
      const requestBody = {
        city: address.city,
        region: address.region_with_type || address.region,
        region_with_type: address.region_with_type || address.region,
        country: address.country || 'Россия',
        street: address.street_with_type || address.street,
        street_with_type: address.street_with_type || address.street,
        house: address.house,
        flat: address.flat,
        postal_code: address.postal_code,
        full_address: address.value || address.full_address || address.address,
        lat: address.lat,
        lon: address.lon,
        kladr_id: address.kladr_id,
        fias_id: address.fias_id
      };
      
      console.log('📤 Отправка данных на сервер:', requestBody);
      
      // Получаем токен авторизации
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Добавляем токен авторизации, если он есть
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('🔑 Токен авторизации:', token ? 'есть' : 'нет');
      
      const response = await fetch('https://api.sancan.ru/api/geoip/address/save', {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Ответ от сервера:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Адрес успешно сохранен:', data);
        
        setSavedAddress(address);
        
        // Обновляем также savedCity для совместимости
        if (address.city) {
          const cityData: City = {
            name: address.city,
            region: address.region_with_type || address.region,
            country: address.country || 'Россия',
            full_name: address.value || address.full_address || address.address || address.city,
            lat: address.lat || 0,
            lon: address.lon || 0,
            address: address.value || address.full_address || address.address || address.city
          };
          setSavedCity(cityData);
          setLocation({
            ip: '',
            location: {
              city: address.city,
              state_name: address.region_with_type || address.region,
              country: address.country || 'Россия',
              lat: address.lat,
              lon: address.lon
            }
          });
        }
        
        setShowModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedAddress(null);
        
        // Отправляем событие для обновления адреса в других компонентах
        window.dispatchEvent(new CustomEvent('address-saved'));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        console.error('❌ Ошибка сохранения адреса:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Ошибка сохранения адреса:', err);
      throw err; // Пробрасываем ошибку дальше
    }
  };
  
  // Сохранение города (для обратной совместимости)
  const saveCity = async (city: City) => {
    try {
      const response = await fetch('https://api.sancan.ru/api/geoip/city/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          city: city.name,
          region: city.region,
          country: city.country,
          lat: city.lat,
          lon: city.lon
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSavedCity(city);
        setLocation({
          ip: '',
          location: {
            city: city.name,
            state_name: city.region,
            country: city.country,
            lat: city.lat,
            lon: city.lon
          }
        });
        setShowModal(false);
        setSearchQuery('');
        setSearchResults([]);
        
        // Отправляем событие для обновления адреса в других компонентах
        window.dispatchEvent(new CustomEvent('address-saved'));
      }
    } catch (err) {
      console.error('Ошибка сохранения города:', err);
    }
  };

  // Обработка клика по локации (только для авторизованных пользователей)
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Показываем модальное окно только авторизованным пользователям
    if (isAuthorized) {
    setShowModal(true);
    }
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAddress(null);
  };

  // Выбор адреса из списка (без сохранения)
  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    console.log('📍 Адрес выбран:', address);
  };
  
  // Сохранение выбранного адреса
  const handleSaveSelectedAddress = async () => {
    if (!selectedAddress) {
      console.warn('⚠️ Нет выбранного адреса для сохранения');
      return;
    }
    console.log('💾 Начинаем сохранение выбранного адреса:', selectedAddress);
    try {
      await saveAddress(selectedAddress);
      console.log('✅ Адрес успешно сохранен');
      // Модальное окно закроется внутри saveAddress после успешного сохранения
    } catch (err) {
      console.error('❌ Ошибка при сохранении адреса:', err);
      alert('Ошибка при сохранении адреса. Попробуйте еще раз.');
      // Не закрываем модальное окно при ошибке, чтобы пользователь мог попробовать снова
    }
  };
  
  const handleSelectCity = (city: City) => {
    saveCity(city);
    handleCloseModal();
  };

  // Сохранение текущего местоположения (определенного по IP)
  const saveCurrentLocation = async () => {
    if (!location || !location.location?.city) {
      return;
    }
    
    try {
      // Создаем адрес из текущего местоположения
      const address: Address = {
        value: [location.location.city, location.location.state_name, location.location.country].filter(Boolean).join(', '),
        city: location.location.city,
        region: location.location.state_name,
        region_with_type: location.location.state_name,
        country: location.location.country || 'Россия',
        lat: location.location.lat,
        lon: location.location.lon
      };
      
      await saveAddress(address);
    } catch (err) {
      console.error('Ошибка сохранения текущего местоположения:', err);
    }
  };

  const handleUseCurrent = () => {
    saveCurrentLocation();
  };

  // Отображаем только город или населенный пункт (без региона, улицы и т.д.)
  // Полный адрес сохраняется, но в UI показываем только город/населенный пункт
  const displayCity = savedAddress?.city || savedCity?.name || location?.location?.city || 'Неизвестно';
  
  // Полный адрес сохраняется, но не отображается в сайдбаре
  const fullAddress = savedAddress?.value || savedAddress?.full_address || savedAddress?.address;

  return (
    <>
      <div 
        className={cn(
          isAuthorized ? "cursor-pointer hover:bg-light-200 dark:hover:bg-dark-300 rounded px-2 py-1 transition-colors" : "",
          className
        )}
        onClick={isAuthorized ? handleLocationClick : undefined}
      >
        {isLoading ? (
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            <span className="text-xs text-dark-100 dark:text-light-400">Определяем...</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-red-500">Ошибка</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                loadLocation();
              }}
              className="text-xs underline hover:no-underline text-dark-100 dark:text-light-400"
            >
              Повторить
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {/* Отображаем только город или населенный пункт (без региона, улицы и т.д.) */}
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium truncate text-dark-100 dark:text-light-400">
                {displayCity}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно выбора города */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal}
          style={{ zIndex: 99999 }}
        >
          <div 
            className="bg-white dark:bg-dark-200 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 100000 }}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-light-300 dark:border-dark-300">
              <h3 className="text-lg font-semibold text-dark-900 dark:text-light-100">
                Уточнить адрес
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-dark-400 hover:text-dark-600 dark:text-light-400 dark:hover:text-light-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Текущее местоположение */}
            {location && location.location?.city && (
              <div className="p-4 bg-light-100 dark:bg-dark-300 border-b border-light-300 dark:border-dark-300">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-dark-900 dark:text-light-100">
                      {location.location.city}
                    </div>
                    <div className="text-xs text-dark-600 dark:text-light-400">
                      {location.location.state_name && `${location.location.state_name}, `}
                      {location.location.country}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Поиск адреса (город, улица, дом) */}
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Введите адрес..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-light-300 dark:border-dark-300 rounded-lg bg-white dark:bg-dark-200 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <svg 
                  className="absolute left-3 top-2.5 w-4 h-4 text-dark-400 dark:text-light-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Результаты поиска адресов */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-dark-400 dark:text-light-400">Поиск адресов...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((address, index) => {
                    const isSelected = selectedAddress && 
                      selectedAddress.value === address.value && 
                      selectedAddress.city === address.city;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAddress(address)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500 ring-opacity-50"
                            : "border-light-300 dark:border-dark-300 hover:bg-light-100 dark:hover:bg-dark-300 hover:border-blue-400"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-dark-900 dark:text-light-100 text-sm">
                              {address.value || address.full_address || address.address || address.city || 'Адрес'}
                            </div>
                            {address.city && (address.street_with_type || address.house) && (
                              <div className="text-xs text-dark-600 dark:text-light-400 mt-1">
                                {address.city}
                                {address.street_with_type && `, ${address.street_with_type}`}
                                {address.house && `, д. ${address.house}`}
                                {address.flat && `, кв. ${address.flat}`}
                              </div>
                            )}
                            {address.region_with_type && (
                              <div className="text-xs text-dark-500 dark:text-light-500 mt-1">
                                {address.region_with_type}
                                {address.country && `, ${address.country}`}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center text-dark-400 dark:text-light-400 py-8">
                  <p className="text-sm">Адреса не найдены</p>
                  <p className="text-xs mt-2">Попробуйте изменить запрос</p>
                </div>
              ) : (
                <div className="text-center text-dark-400 dark:text-light-400 py-8">
                  <svg className="w-12 h-12 mx-auto text-blue-500 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">
                    Введите адрес для поиска
                </p>
              </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="p-4 border-t border-light-300 dark:border-dark-300 flex flex-col space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-dark-600 dark:text-light-400 hover:text-dark-800 dark:hover:text-light-200 transition-colors rounded-lg border border-light-300 dark:border-dark-300"
                >
                  Отмена
                </button>
                {selectedAddress ? (
                  <button
                    onClick={handleSaveSelectedAddress}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Сохранить
                  </button>
                ) : location && location.location?.city ? (
                  <button
                    onClick={saveCurrentLocation}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Сохранить текущий адрес
                  </button>
                ) : null}
              </div>
              {selectedAddress && (
                <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                  Выбран: {selectedAddress.value || selectedAddress.full_address || selectedAddress.city}
                </div>
              )}
              {!selectedAddress && location && location.location?.city && (
                <div className="text-xs text-dark-500 dark:text-light-500 text-center">
                  Текущее местоположение: {location.location.city}
                  {location.location.state_name && `, ${location.location.state_name}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
