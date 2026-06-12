import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface PvzPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  work_time?: string;
  service: string;
}

interface YandexMapWidgetProps {
  points: PvzPoint[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  city?: string;
}

const YandexMapWidget: React.FC<YandexMapWidgetProps> = ({ 
  points, 
  selectedId, 
  onSelect, 
  city = 'Москва' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRefs = useRef<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Цвета маркеров для разных служб
  const getServiceColor = (service: string) => {
    switch (service) {
      case 'sdek': return '#4CAF50'; // Зеленый
      case 'yandex': return '#FFD700'; // Желтый
      case '5post': return '#FF5722'; // Оранжевый
      default: return '#2196F3'; // Синий
    }
  };

  // Расчет центра карты по точкам
  const calculateMapCenter = (points: PvzPoint[]) => {
    if (points.length === 0) {
      // Координаты городов по умолчанию
      const cityCoords: { [key: string]: [number, number] } = {
        'Москва': [55.755814, 37.617635],
        'Санкт-Петербург': [59.939095, 30.315868],
        'Новосибирск': [55.030204, 82.920430],
        'Екатеринбург': [56.838926, 60.605702],
      };
      return cityCoords[city] || [55.755814, 37.617635];
    }

    const latSum = points.reduce((sum, point) => sum + point.latitude, 0);
    const lngSum = points.reduce((sum, point) => sum + point.longitude, 0);
    
    return [latSum / points.length, lngSum / points.length];
  };

  // Расчет оптимального зума
  const calculateOptimalZoom = (points: PvzPoint[]) => {
    if (points.length === 0) return 10;
    if (points.length === 1) return 14;

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);

    if (maxSpread > 0.5) return 8;
    if (maxSpread > 0.1) return 11;
    if (maxSpread > 0.05) return 13;
    return 15;
  };

  useEffect(() => {
    // Загрузка Яндекс.Карт API
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          initializeMap();
        });
      };
      document.head.appendChild(script);
    } else {
      window.ymaps.ready(() => {
        initializeMap();
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Yandex map:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && window.ymaps) {
      updateMapPoints();
    }
  }, [points, selectedId]);

  const initializeMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    try {
      const center = calculateMapCenter(points);
      const zoom = calculateOptimalZoom(points);

      mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
      });

      // Добавляем тему карты
      mapInstanceRef.current.options.set('theme', 'islands#light');
      
      updateMapPoints();
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка инициализации Яндекс карты:', error);
      setIsLoading(false);
    }
  };

  const updateMapPoints = () => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    try {
      // Очищаем предыдущие маркеры
      placemarkRefs.current.forEach(placemark => {
        mapInstanceRef.current.geoObjects.remove(placemark);
      });
      placemarkRefs.current.clear();

      // Добавляем новые маркеры
      points.forEach(point => {
        const color = getServiceColor(point.service);
        const isSelected = selectedId === point.id;

        const placemark = new window.ymaps.Placemark(
          [point.latitude, point.longitude],
          {
            balloonContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">
                  ${point.name}
                </div>
                <div style="margin-bottom: 6px; color: #4b5563; font-size: 14px;">
                  📍 ${point.address}
                </div>
                ${point.phone ? `<div style="margin-bottom: 4px; color: #6b7280; font-size: 13px;">📞 ${point.phone}</div>` : ''}
                ${point.work_time ? `<div style="margin-bottom: 8px; color: #6b7280; font-size: 13px;">🕒 ${point.work_time}</div>` : ''}
                <div style="display: inline-block; padding: 2px 8px; background: ${color}; color: white; border-radius: 12px; font-size: 11px; font-weight: 500;">
                  ${point.service.toUpperCase()}
                </div>
              </div>
            `,
            hintContent: point.name
          },
          {
            preset: 'islands#dotIcon',
            iconColor: color,
            iconImageSize: isSelected ? [40, 40] : [30, 30],
            iconImageOffset: isSelected ? [-20, -40] : [-15, -30]
          }
        );

        // Обработчик клика по маркеру
        placemark.events.add('click', () => {
          onSelect(point.id);
        });

        mapInstanceRef.current.geoObjects.add(placemark);
        placemarkRefs.current.set(point.id, placemark);
      });

      // Центрируем карту по новым точкам
      if (points.length > 0) {
        const center = calculateMapCenter(points);
        const zoom = calculateOptimalZoom(points);
        
        mapInstanceRef.current.setCenter(center, zoom, {
          duration: 500 // Анимация 500мс
        });
      }

    } catch (error) {
      console.error('Ошибка обновления точек на карте:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Загрузка Яндекс.Карт...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Легенда служб доставки */}
      {points.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm font-semibold mb-2">Службы доставки:</div>
          {Array.from(new Set(points.map(p => p.service))).map(service => (
            <div key={service} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getServiceColor(service) }}
              />
              <span className="text-xs">{service.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YandexMapWidget;
