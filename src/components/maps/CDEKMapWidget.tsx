import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    CDEKWidget: any;
  }
}

interface CDEKMapWidgetProps {
  city: string;
  onPvzSelect: (pvz: any) => void;
  selectedPvzId?: string | null;
}

const CDEKMapWidget: React.FC<CDEKMapWidgetProps> = ({ 
  city, 
  onPvzSelect, 
  selectedPvzId 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Загружаем скрипт СДЭК виджета если его еще нет
    if (!window.CDEKWidget) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@cdek-it/widget@3';
      script.async = true;
      script.onload = () => {
        initializeWidget();
      };
      document.head.appendChild(script);
    } else {
      initializeWidget();
    }

    return () => {
      // Очищаем виджет при размонтировании
      if (widgetRef.current) {
        try {
          widgetRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying CDEK widget:', e);
        }
      }
    };
  }, [city]);

  const initializeWidget = () => {
    if (!mapRef.current || !window.CDEKWidget) return;

    try {
      // Очищаем предыдущий виджет
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }

      // Очищаем контейнер
      mapRef.current.innerHTML = '';

      // Создаем новый виджет СДЭК
      widgetRef.current = new window.CDEKWidget({
        from: city, // Город отправки
        to: city,   // Город получения (для ПВЗ совпадает)
        root: mapRef.current,
        apiKey: process.env.NEXT_PUBLIC_CDEK_API_KEY, // Публичный ключ СДЭК
        
        // Настройки виджета
        defaultLocation: city,
        servicePath: '/api/cdek', // Путь к вашему API
        
        // Языковые настройки
        lang: 'rus',
        currency: 'RUB',
        
        // Настройки отображения
        hideFilters: false,
        hideDeliveryOptions: false,
        hideDetailsService: false,
        
        // Обработчики событий
        onReady: () => {
          console.log('CDEK Widget готов');
        },
        
        onCalculate: (result: any) => {
          console.log('CDEK расчет:', result);
        },
        
        onChoose: (result: any) => {
          console.log('CDEK выбор ПВЗ:', result);
          
          // Преобразуем данные СДЭК в наш формат
          const pvzData = {
            id: result.pvz?.code || result.code,
            name: result.pvz?.name || result.name,
            address: result.pvz?.address || result.address,
            latitude: result.pvz?.location?.latitude || result.latitude,
            longitude: result.pvz?.location?.longitude || result.longitude,
            phone: result.pvz?.phone || result.phone,
            work_time: result.pvz?.work_time || result.work_time,
            service: 'sdek'
          };
          
          onPvzSelect(pvzData);
        },
        
        onError: (error: any) => {
          console.error('CDEK Widget ошибка:', error);
        }
      });

    } catch (error) {
      console.error('Ошибка инициализации CDEK виджета:', error);
    }
  };

  return (
    <div className="h-full w-full">
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default CDEKMapWidget;
