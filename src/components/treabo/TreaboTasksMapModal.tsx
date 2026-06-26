import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { TreaboTask } from '@/data/treabo';
import routes from '@/config/routes';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MOSCOW_CENTER: [number, number] = [55.7522, 37.6156];

type TreaboTasksMapModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: TreaboTask[];
};

type MapPoint = {
  id: string;
  title: string;
  lat: number;
  lng: number;
};

export default function TreaboTasksMapModal({ open, onClose, tasks }: TreaboTasksMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  const points = useMemo<MapPoint[]>(
    () =>
      tasks
        .filter((task) => task.lat != null && task.lng != null)
        .map((task) => ({
          id: String(task.id),
          title: task.title,
          lat: Number(task.lat),
          lng: Number(task.lng),
        })),
    [tasks],
  );

  const center = useMemo<[number, number]>(() => {
    if (!points.length) return MOSCOW_CENTER;
    const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  useEffect(() => {
    if (!open) return;

    let destroyed = false;

    function initMap() {
      if (!mapRef.current || !window.ymaps || destroyed) return;

      mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
        center,
        zoom: points.length === 1 ? 13 : points.length ? 11 : 10,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      points.forEach((point) => {
        const placemark = new window.ymaps.Placemark(
          [point.lat, point.lng],
          {
            balloonContent: `<strong>${point.title}</strong>`,
            hintContent: point.title,
          },
          { preset: 'islands#darkGreenDotIcon' },
        );

        placemark.events.add('click', () => {
          const task = tasks.find((item) => String(item.id) === point.id);
          if (task) {
            window.location.href = routes.taskUrl(task);
          }
        });

        mapInstanceRef.current.geoObjects.add(placemark);
      });

      setLoading(false);
    }

    function loadScript() {
      if (window.ymaps) {
        window.ymaps.ready(initMap);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=ru_RU`;
      script.async = true;
      script.onload = () => window.ymaps.ready(initMap);
      document.head.appendChild(script);
    }

    setLoading(true);
    loadScript();

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          // ignore destroy errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [open, center, points, tasks]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:h-[80vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-[#7d849b]">Карта заданий</div>
            <h2 className="text-xl font-black text-[#232323]">
              {points.length ? `${points.length} точек на карте` : 'Москва и Россия'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-[#7d849b]">
              Загрузка Яндекс.Карт…
            </div>
          ) : null}
          <div ref={mapRef} className="h-full w-full" />
          {!points.length && !loading ? (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#232323] shadow">
              Координаты заданий пока не указаны — показан центр Москвы
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
