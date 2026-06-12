import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { InformationIcon } from '@/components/icons/information-icon';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/data/user';
import { userAddressesApi } from '@/data/user-addresses';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import routes from '@/config/routes';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useModalAction } from '@/components/modal-views/context';

dayjs.locale('ru');

interface ProductDeliveryBlockProps {
  product: any;
  className?: string;
}

interface DeliveryDate {
  courier?: string;
  pvz?: string;
}

export default function ProductDeliveryBlock({ 
  product, 
  className = '' 
}: ProductDeliveryBlockProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { me } = useMe();
  const { openModal } = useModalAction();
  const [userCity, setUserCity] = useState<string>('');
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate>({});
  const [selectedPvz, setSelectedPvz] = useState<any>(null);

  // Получаем адреса пользователя
  const { data: addressesData } = useQuery(
    ['user-addresses', 'pvz'],
    () => userAddressesApi.getAddresses('pvz'),
    {
      enabled: !!me,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Получаем город пользователя из геолокации или профиля
  useEffect(() => {
    const getUserCity = async () => {
      try {
        // Пробуем получить из сохраненного адреса
        if (addressesData?.data && addressesData.data.length > 0) {
          const defaultPvz = addressesData.data.find(addr => addr.is_default) || addressesData.data[0];
          setSelectedPvz(defaultPvz);
          setUserCity(defaultPvz.city);
        } else {
          // Пробуем получить из localStorage или геолокации
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            const location = JSON.parse(savedLocation);
            setUserCity(location.city || 'Москва');
          } else {
            // Определяем через API геолокации
            const geoResponse = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/api/geo/location`);
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              setUserCity(geoData.city || 'Москва');
            } else {
              setUserCity('Москва');
            }
          }
        }
      } catch (error) {
        console.error('Error getting user city:', error);
        setUserCity('Москва');
      }
    };
    getUserCity();
  }, [addressesData]);

  // Получаем город продавца
  const sellerCity = product?.shop?.address?.city || 'Москва';

  // Рассчитываем дату доставки через СДЭК
  useEffect(() => {
    const calculateDeliveryDates = async () => {
      if (!userCity || !sellerCity) return;

      try {
        // Расчет для курьера (тариф 136 - дверь-дверь)
        const courierResponse = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/api/cdek/calculate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from_city: sellerCity,
              to_city: userCity,
              tariff_code: 136, // Курьер
              weight: 1,
              length: 10,
              width: 10,
              height: 10,
            }),
          }
        );

        // Расчет для ПВЗ (тариф 137 - склад-склад)
        const pvzResponse = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/api/cdek/calculate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from_city: sellerCity,
              to_city: userCity,
              tariff_code: 137, // ПВЗ
              weight: 1,
              length: 10,
              width: 10,
              height: 10,
            }),
          }
        );

        if (courierResponse.ok) {
          const courierData = await courierResponse.json();
          if (courierData.period_min && courierData.period_max) {
            const minDate = dayjs().add(courierData.period_min, 'day');
            const maxDate = dayjs().add(courierData.period_max, 'day');
            setDeliveryDates(prev => ({
              ...prev,
              courier: `${minDate.format('D MMMM')} - ${maxDate.format('D MMMM')}`,
            }));
          }
        }

        if (pvzResponse.ok) {
          const pvzData = await pvzResponse.json();
          if (pvzData.period_min && pvzData.period_max) {
            const minDate = dayjs().add(pvzData.period_min, 'day');
            const maxDate = dayjs().add(pvzData.period_max, 'day');
            setDeliveryDates(prev => ({
              ...prev,
              pvz: `${minDate.format('D MMMM')} - ${maxDate.format('D MMMM')}`,
            }));
          }
        }
      } catch (error) {
        console.error('Error calculating delivery dates:', error);
        // Fallback даты
        const tomorrow = dayjs().add(1, 'day');
        setDeliveryDates({
          courier: tomorrow.format('D MMMM'),
          pvz: tomorrow.format('D MMMM'),
        });
      }
    };

    if (userCity && sellerCity) {
      calculateDeliveryDates();
    }
  }, [userCity, sellerCity]);

  // Формируем адрес для отображения
  const displayAddress = selectedPvz 
    ? selectedPvz.address || selectedPvz.name || 'ПВЗ СДЭК' // Короткий адрес выбранного ПВЗ
    : userCity 
      ? `${userCity}, пункты СДЭК` // Если не выбран ПВЗ - показываем город и "пункты СДЭК"
      : 'Выберите город';

  // Обработчик изменения адреса
  const handleChangeAddress = () => {
    if (!me) {
      // Если не зарегистрирован - открываем модальное окно входа/регистрации
      // Сохраняем текущую страницу для возврата после регистрации
      const returnUrl = router.asPath;
      localStorage.setItem('returnUrl', returnUrl);
      openModal('LOGIN_VIEW');
      return;
    }
    // Сохраняем текущую страницу для возврата
    const returnUrl = router.asPath;
    localStorage.setItem('returnUrl', returnUrl);
    router.push('/select-address');
  };

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
        {t('text-delivery')}
      </h3>

      <div className="space-y-4">
        {/* Адрес доставки */}
        <div className="flex items-start space-x-3">
          <MapPinIcon className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-light-600 dark:text-dark-600 mb-1">
              {selectedPvz ? 'Пункт выдачи' : 'Город доставки'}
            </div>
            <div className="text-sm font-medium text-dark dark:text-light break-words">
              {displayAddress}
            </div>
            <button 
              onClick={handleChangeAddress}
              className="text-xs text-brand hover:text-brand-dark transition-colors mt-1"
            >
              {t('text-change-address')}
            </button>
          </div>
        </div>

        {/* Способы доставки */}
        <div className="pt-3 border-t border-light-300 dark:border-dark-400">
          <div className="space-y-3">
            {/* Курьером */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-dark dark:text-light mb-1">
                  Курьером СДЭК
                </div>
                {deliveryDates.courier ? (
                  <div className="text-xs text-light-600 dark:text-dark-600">
                    {deliveryDates.courier}
                  </div>
                ) : (
                  <div className="text-xs text-light-600 dark:text-dark-600">
                    Расчет даты...
                  </div>
                )}
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                Без доплат
              </span>
            </div>

            {/* Пункты выдачи */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-dark dark:text-light mb-1">
                  Пункты выдачи и постаматы
                </div>
                {deliveryDates.pvz ? (
                  <div className="text-xs text-light-600 dark:text-dark-600">
                    {deliveryDates.pvz}
                  </div>
                ) : (
                  <div className="text-xs text-light-600 dark:text-dark-600">
                    Расчет даты...
                  </div>
                )}
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                Без доплат
              </span>
            </div>
          </div>
        </div>

        {/* Информация о возврате */}
        <div className="pt-3 border-t border-light-300 dark:border-dark-400">
          <Link 
            href={routes.return || '/help/return'}
            className="flex items-start space-x-3 text-sm text-dark dark:text-light hover:text-brand transition-colors"
          >
            <InformationIcon className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
            <span className="flex-1">
              Можно вернуть в течение 21 дня
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 