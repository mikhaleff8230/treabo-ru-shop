import React from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт карт для избежания SSR проблем
const CDEKMapWidget = dynamic(() => import('./CDEKMapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <div className="text-gray-600">Загрузка карты СДЭК...</div>
      </div>
    </div>
  )
});

const YandexMapWidget = dynamic(() => import('./YandexMapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <div className="text-gray-600">Загрузка Яндекс.Карт...</div>
      </div>
    </div>
  )
});

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

interface SmartMapWidgetProps {
  points: PvzPoint[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  city: string;
  service: string; // 'all', 'sdek', 'yandex', '5post'
}

const SmartMapWidget: React.FC<SmartMapWidgetProps> = ({
  points,
  selectedId,
  onSelect,
  city,
  service
}) => {
  // Определяем, какую карту использовать
  const usesCDEKWidget = () => {
    // Используем виджет СДЭК если:
    // 1. Выбрана только служба СДЭК
    // 2. Или все точки принадлежат СДЭК
    if (service === 'sdek') return true;
    
    if (service === 'all' && points.length > 0) {
      const cdekPoints = points.filter(p => p.service === 'sdek');
      const nonCdekPoints = points.filter(p => p.service !== 'sdek');
      
      // Если СДЭК точек больше 70% - используем виджет СДЭК
      return cdekPoints.length > nonCdekPoints.length * 2;
    }
    
    return false;
  };

  const handlePvzSelect = (pvzData: any) => {
    // Обработчик для виджета СДЭК
    onSelect(pvzData.id);
  };

  // Если нет точек - показываем заглушку
  if (points.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg font-medium mb-2">Карта недоступна</div>
          <div className="text-sm">
            {service === 'all' 
              ? 'Выберите город для отображения ПВЗ на карте'
              : `ПВЗ службы ${service.toUpperCase()} не найдены в городе ${city}`
            }
          </div>
        </div>
      </div>
    );
  }

  // Выбираем карту
  if (usesCDEKWidget()) {
    return (
      <div className="h-full w-full">
        <CDEKMapWidget
          city={city}
          onPvzSelect={handlePvzSelect}
          selectedPvzId={selectedId}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <YandexMapWidget
        points={points}
        selectedId={selectedId}
        onSelect={onSelect}
        city={city}
      />
    </div>
  );
};

export default SmartMapWidget;
