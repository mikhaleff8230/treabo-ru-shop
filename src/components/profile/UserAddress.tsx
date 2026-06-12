import React, { useState, useEffect, useCallback } from 'react';
import { LocationWithModal } from '@/components/GeoLocation/LocationWithModal';

interface Address {
  value?: string;
  full_address?: string;
  address?: string;
  city?: string;
  region?: string;
  region_with_type?: string;
  country?: string;
  street?: string;
  street_with_type?: string;
  house?: string;
  flat?: string;
  postal_code?: string;
  lat?: number;
  lon?: number;
}

const UserAddress: React.FC = () => {
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Загружаем сохраненный адрес из таблицы user_addresses (тип user_selected)
  const loadAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.sancan.ru/api/geoip/address/saved', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          setSavedAddress(data.address);
          console.log('✅ Адрес загружен из БД:', data.address);
        } else {
          setSavedAddress(null);
        }
      } else if (response.status === 404) {
        // Адрес не найден - это нормально, пользователь еще не указал адрес
        setSavedAddress(null);
      } else {
        console.error('Ошибка загрузки адреса:', response.status, response.statusText);
        setSavedAddress(null);
      }
    } catch (err) {
      console.error('Не удалось загрузить сохраненный адрес:', err);
      setSavedAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddress();
  }, [loadAddress, refreshKey]);

  // Обновляем адрес при фокусе окна (на случай, если адрес был сохранен в другой вкладке)
  useEffect(() => {
    const handleFocus = () => {
      loadAddress();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadAddress]);

  // Обновляем адрес после сохранения (через кастомное событие от LocationWithModal)
  useEffect(() => {
    const handleAddressSaved = () => {
      console.log('🔄 Событие address-saved получено, обновляем адрес...');
      // Небольшая задержка, чтобы дать время API сохранить данные
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 500);
    };

    window.addEventListener('address-saved', handleAddressSaved);
    return () => window.removeEventListener('address-saved', handleAddressSaved);
  }, []);

  if (isLoading) {
    return (
      <div className="mb-6">
        <span className="block cursor-pointer pb-2.5 font-normal text-dark/70 dark:text-light/70">
          Мой адрес
        </span>
        <div className="p-4 bg-gray-50 dark:bg-dark-300 rounded-lg">
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <span className="block cursor-pointer pb-2.5 font-normal text-dark/70 dark:text-light/70">
        Мой адрес
      </span>
      <div className="p-4 bg-gray-50 dark:bg-dark-300 rounded-lg">
        {savedAddress && (savedAddress.full_address || savedAddress.value || savedAddress.address || savedAddress.city) ? (
          <div className="space-y-3">
            {/* Полный адрес */}
            <div className="font-semibold text-base text-dark dark:text-light">
              {savedAddress.full_address || savedAddress.value || savedAddress.address || savedAddress.city}
            </div>
            
            {/* Детали адреса (улица, дом, квартира) */}
            {(savedAddress.street_with_type || savedAddress.house || savedAddress.flat) && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {savedAddress.street_with_type && savedAddress.street_with_type}
                {savedAddress.house && `, д. ${savedAddress.house}`}
                {savedAddress.flat && `, кв. ${savedAddress.flat}`}
              </div>
            )}
            
            {/* Город и регион */}
            {(savedAddress.city || savedAddress.region_with_type) && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {savedAddress.city}
                {savedAddress.region_with_type && `, ${savedAddress.region_with_type}`}
                {savedAddress.country && `, ${savedAddress.country}`}
              </div>
            )}
            
            {/* Почтовый индекс */}
            {savedAddress.postal_code && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Индекс: {savedAddress.postal_code}
              </div>
            )}
            
            {/* Кнопка уточнить адрес */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <LocationWithModal />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Адрес не указан. Вы можете указать адрес, нажав на кнопку ниже.
            </div>
            <div className="pt-2">
              <LocationWithModal />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAddress;

