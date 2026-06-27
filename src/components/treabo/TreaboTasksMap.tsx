import { useEffect, useMemo, useRef, useState } from 'react';
import type { TreaboTask } from '@/data/treabo';
import routes from '@/config/routes';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MOSCOW_CENTER: [number, number] = [55.7522, 37.6156];
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let ymapsLoadPromise: Promise<void> | null = null;

function loadYmaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.ymaps) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve()));
  }
  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps) window.ymaps.ready(() => resolve());
      else reject(new Error('ymaps missing'));
    };
    script.onerror = () => reject(new Error('ymaps load failed'));
    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
}

export type TreaboTasksMapPoint = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  priceLabel: string;
};

export function formatTaskPriceLabel(task: TreaboTask) {
  if (task.budget && task.budget > 0) {
    return `от ${new Intl.NumberFormat('ru-RU').format(task.budget)} ₽`;
  }
  return 'Цена договорная';
}

export function buildTaskMapPoints(tasks: TreaboTask[]): TreaboTasksMapPoint[] {
  return tasks
    .filter((task) => task.lat != null && task.lng != null)
    .map((task) => ({
      id: String(task.id),
      title: task.title,
      lat: Number(task.lat),
      lng: Number(task.lng),
      priceLabel: formatTaskPriceLabel(task),
    }));
}

type TreaboTasksMapProps = {
  tasks: TreaboTask[];
  className?: string;
  heightClassName?: string;
  highlightedTaskId?: string | null;
  onTaskClick?: (task: TreaboTask) => void;
  navigateOnClick?: boolean;
};

export default function TreaboTasksMap({
  tasks,
  className = '',
  heightClassName = 'h-[360px]',
  highlightedTaskId,
  onTaskClick,
  navigateOnClick = true,
}: TreaboTasksMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarksRef = useRef<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const points = useMemo(() => buildTaskMapPoints(tasks), [tasks]);

  const center = useMemo<[number, number]>(() => {
    if (!points.length) return MOSCOW_CENTER;
    const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  useEffect(() => {
    let destroyed = false;

    function createPlaqueLayout() {
      return window.ymaps.templateLayoutFactory.createClass(
        `<div style="background:#232323;color:#fff;padding:8px 12px;border-radius:12px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.28);max-width:200px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;{{ properties.active ? 'outline:2px solid #D9F36B;outline-offset:2px;' : '' }}">
          <div style="font-size:12px;font-weight:700;white-space:nowrap;">{{ properties.priceLabel }}</div>
          <div style="font-size:11px;margin-top:4px;line-height:1.35;opacity:0.95;">{{ properties.title }}</div>
        </div>`,
      );
    }

    function renderMap() {
      if (!mapRef.current || !window.ymaps || destroyed) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center,
          zoom: points.length === 1 ? 13 : points.length ? 11 : 10,
          controls: ['zoomControl'],
        });
      } else {
        mapInstanceRef.current.setCenter(center, points.length === 1 ? 13 : points.length ? 11 : 10);
      }

      placemarksRef.current.forEach((placemark) => mapInstanceRef.current.geoObjects.remove(placemark));
      placemarksRef.current.clear();

      const layout = createPlaqueLayout();

      points.forEach((point) => {
        const task = tasks.find((item) => String(item.id) === point.id);
        const active = highlightedTaskId === point.id;

        const placemark = new window.ymaps.Placemark(
          [point.lat, point.lng],
          {
            priceLabel: point.priceLabel,
            title: point.title,
            active: active ? '1' : '',
            hintContent: point.title,
          },
          {
            iconLayout: 'default#imageWithContent',
            iconImageHref: TRANSPARENT_PIXEL,
            iconImageSize: [1, 1],
            iconImageOffset: [0, 0],
            iconContentLayout: layout,
            iconContentOffset: [-72, -48],
            iconContentSize: [144, 48],
            zIndex: active ? 1000 : 1,
          },
        );

        placemark.events.add('click', () => {
          if (!task) return;
          if (onTaskClick) {
            onTaskClick(task);
            return;
          }
          if (navigateOnClick) {
            window.location.href = routes.taskUrl(task);
          }
        });

        mapInstanceRef.current.geoObjects.add(placemark);
        placemarksRef.current.set(point.id, placemark);
      });

      setLoading(false);
    }

    setLoading(true);
    setLoadError('');
    loadYmaps()
      .then(() => {
        if (!destroyed) renderMap();
      })
      .catch(() => {
        if (!destroyed) {
          setLoadError('Не удалось загрузить Яндекс.Карты');
          setLoading(false);
        }
      });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
        placemarksRef.current.clear();
      }
    };
  }, [center, points, tasks, onTaskClick, navigateOnClick, highlightedTaskId]);

  return (
    <div className={`relative overflow-hidden rounded-[24px] border border-[#E7E9EC] bg-[#eef1f7] ${heightClassName} ${className}`}>
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[#7d849b]">
          Загрузка карты заданий…
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-[#7d849b]">
          {loadError}
        </div>
      ) : null}
      <div ref={mapRef} className="h-full w-full" />
      {!points.length && !loading && !loadError ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#232323] shadow">
          Координаты заданий пока не указаны — показан центр Москвы
        </div>
      ) : null}
    </div>
  );
}
