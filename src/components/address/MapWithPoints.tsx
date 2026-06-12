import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Исправляем проблему с иконками Leaflet в Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Создаем кастомные иконки для разных служб
const createCustomIcon = (color: string, service: string) => {
  return new L.DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 25px;
        height: 35px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          line-height: 1;
        ">${service.toUpperCase().slice(0, 2)}</div>
      </div>
    `,
    iconSize: [25, 35],
    iconAnchor: [12, 35],
    popupAnchor: [0, -35]
  });
};

// Иконки для разных служб
const serviceIcons = {
  sdek: createCustomIcon('#4CAF50', 'СДЭК'),    // Зеленый
  yandex: createCustomIcon('#FFD700', 'ЯД'),    // Желтый  
  '5post': createCustomIcon('#FF5722', '5P'),   // Оранжевый
  default: createCustomIcon('#2196F3', 'ПВЗ')   // Синий
};

interface Point {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  service?: string; // Добавляем поле для службы доставки
  phone?: string;
  work_time?: string;
}

interface MapWithPointsProps {
  points: Point[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddToFavorites?: (point: Point) => void;
}

// Компонент для автоматического центрирования карты
const MapController: React.FC<{ points: Point[]; selectedId: string | null }> = ({ points, selectedId }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      // Рассчитываем границы для показа всех точек
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Устанавливаем границы карты
      map.fitBounds([
        [minLat, minLng],
        [maxLat, maxLng]
      ], {
        padding: [20, 20], // Отступы
        maxZoom: 15 // Максимальный зум
      });
    }
  }, [points, map]);

  // Эффект для центрирования на выбранной точке
  useEffect(() => {
    if (selectedId && points.length > 0) {
      const selectedPoint = points.find(p => p.id === selectedId);
      if (selectedPoint) {
        // Центрируем карту на выбранной точке с увеличением
        map.setView([selectedPoint.lat, selectedPoint.lng], 16, {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [selectedId, points, map]);

  return null;
};

const MapWithPoints: React.FC<MapWithPointsProps> = ({ points, selectedId, onSelect, onAddToFavorites }) => {
  // Рассчитываем центр карты
  const center = useMemo(() => {
    if (points.length === 0) return [55.755814, 37.617635]; // Москва по умолчанию
    
    const latSum = points.reduce((sum, point) => sum + point.lat, 0);
    const lngSum = points.reduce((sum, point) => sum + point.lng, 0);
    
    return [latSum / points.length, lngSum / points.length];
  }, [points]);

  return (
    <MapContainer 
      center={center as [number, number]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      key={points.length} // Перерендер при изменении точек
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController points={points} selectedId={selectedId} />
      {points.map(point => {
        // Выбираем иконку в зависимости от службы доставки
        const iconKey = point.service as keyof typeof serviceIcons;
        const isSelected = selectedId === point.id;
        
        // Создаем специальную иконку для выбранной точки
        const icon = isSelected 
          ? createCustomIcon('#FF0000', point.service?.toUpperCase().slice(0, 2) || 'ПВЗ') // Красная для выбранной
          : serviceIcons[iconKey] || serviceIcons.default;
        
        return (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(point.id),
            }}
          >
            <Popup>
              <div className="font-semibold mb-1">{point.label}</div>
              <div className="text-sm text-gray-800 mb-2">{point.address}</div>
              {point.service && (
                <div className="inline-block px-2 py-1 text-xs rounded mb-2" style={{
                  backgroundColor: point.service === 'sdek' ? '#4CAF50' : 
                                   point.service === 'yandex' ? '#FFD700' : 
                                   point.service === '5post' ? '#FF5722' : '#2196F3',
                  color: 'white'
                }}>
                  {point.service.toUpperCase()}
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapWithPoints; 