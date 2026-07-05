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

function getMapZoom(pointsCount: number) {
  if (pointsCount === 1) return 13;
  return pointsCount ? 11 : 10;
}

function escapeMapText(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#096;');
}

function safeMapPhotoUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
    return escapeMapText(trimmed);
  }
  return null;
}

function formatRub(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function createPlaqueLayout() {
  return window.ymaps.templateLayoutFactory.createClass(
    `<div style="background:#232323;color:#fff;padding:10px 12px;border-radius:14px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.28);max-width:220px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;{{ properties.active ? 'outline:2px solid #D9F36B;outline-offset:2px;' : '' }}">
      {{ properties.photoUrl ? '<img src="' + properties.photoUrl + '" style="width:100%;height:64px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />' : '' }}
      <div style="font-size:12px;font-weight:700;white-space:nowrap;">{{ properties.priceLabel }}</div>
      <div style="font-size:12px;font-weight:800;margin-top:4px;line-height:1.35;">{{ properties.title }}</div>
      {{ properties.location ? '<div style="font-size:11px;margin-top:4px;line-height:1.35;opacity:0.9;">' + properties.location + '</div>' : '' }}
      <div style="font-size:10px;margin-top:6px;opacity:0.75;">Открыть задание →</div>
    </div>`,
  );
}

function createCompactPlaqueLayout() {
  return window.ymaps.templateLayoutFactory.createClass(
    `<div style="width:176px;height:62px;background:#232323;color:#fff;padding:9px 12px;border-radius:14px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.28);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-sizing:border-box;{{ properties.active ? 'outline:2px solid #D9F36B;outline-offset:2px;' : '' }}">
      <div style="font-size:12px;font-weight:800;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ properties.title }}</div>
      <div style="margin-top:5px;display:inline-flex;max-width:152px;height:22px;align-items:center;border-radius:999px;background:#D9F36B;color:#232323;padding:0 9px;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box;">{{ properties.priceLabel }}</div>
    </div>`,
  );
}

function createClusterLayout() {
  return window.ymaps.templateLayoutFactory.createClass(
    `<div style="width:44px;height:44px;border-radius:999px;background:#D9F36B;color:#232323;border:3px solid #fff;box-shadow:0 8px 24px rgba(0,0,0,0.24);display:flex;align-items:center;justify-content:center;font:900 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">{{ properties.geoObjects.length }}</div>`,
  );
}

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
  city?: string | null;
  address?: string | null;
  category?: string | null;
  photoUrl?: string | null;
};

export function formatTaskPriceLabel(task: TreaboTask) {
  if (task.budget_label) return task.budget_label;
  if (task.budget_type === 'range') {
    const min = task.budget_min != null ? Number(task.budget_min) : null;
    const max = task.budget_max != null ? Number(task.budget_max) : null;
    if (min != null && max != null) return `от ${formatRub(min)} до ${formatRub(max)} ₽`;
    if (min != null) return `от ${formatRub(min)} ₽`;
    if (max != null) return `до ${formatRub(max)} ₽`;
  }
  if (task.budget && task.budget > 0) {
    return `от ${formatRub(task.budget)} ₽`;
  }
  return 'Цена договорная';
}

export type TreaboMapBounds = {
  southWest: [number, number];
  northEast: [number, number];
};

export function readYandexMapBounds(map: { getBounds: () => [number, number][] }): TreaboMapBounds {
  const bounds = map.getBounds();
  return {
    southWest: bounds[0],
    northEast: bounds[1],
  };
}

export function isTaskWithinMapBounds(task: TreaboTask, bounds: TreaboMapBounds): boolean {
  if (task.lat == null || task.lng == null) return false;
  const lat = Number(task.lat);
  const lng = Number(task.lng);
  const [south, west] = bounds.southWest;
  const [north, east] = bounds.northEast;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

export function filterTasksByMapBounds(tasks: TreaboTask[], bounds: TreaboMapBounds | null): TreaboTask[] {
  if (!bounds) {
    return tasks.filter((task) => task.lat != null && task.lng != null);
  }
  return tasks.filter((task) => isTaskWithinMapBounds(task, bounds));
}

export function buildTaskMapPoints(tasks: TreaboTask[]): TreaboTasksMapPoint[] {
  return tasks
    .filter((task) => task.lat != null && task.lng != null)
    .map((task) => {
      const firstPhoto = task.photos?.[0];
      const photoUrl =
        typeof firstPhoto === 'string'
          ? firstPhoto
          : firstPhoto?.url || (firstPhoto?.path ? `/api/treabo/files/${firstPhoto.path}` : null);

      return {
        id: String(task.id),
        title: escapeMapText(task.title),
        lat: Number(task.lat),
        lng: Number(task.lng),
        priceLabel: escapeMapText(formatTaskPriceLabel(task)),
        city: task.city ? escapeMapText(task.city) : null,
        address: task.address ? escapeMapText(task.address) : null,
        category: task.category ? escapeMapText(task.category) : null,
        photoUrl: safeMapPhotoUrl(photoUrl),
      };
    });
}

type TreaboTasksMapProps = {
  tasks: TreaboTask[];
  className?: string;
  heightClassName?: string;
  highlightedTaskId?: string | null;
  onTaskClick?: (task: TreaboTask) => void;
  navigateOnClick?: boolean;
  onBoundsChange?: (bounds: TreaboMapBounds) => void;
  preserveViewport?: boolean;
};

export default function TreaboTasksMap({
  tasks,
  className = '',
  heightClassName = 'h-[360px]',
  highlightedTaskId,
  onTaskClick,
  navigateOnClick = true,
  onBoundsChange,
  preserveViewport = false,
}: TreaboTasksMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const placemarksRef = useRef<Map<string, any>>(new Map());
  const onBoundsChangeRef = useRef(onBoundsChange);
  const centerRef = useRef<[number, number]>(MOSCOW_CENTER);
  const pointsRef = useRef<TreaboTasksMapPoint[]>([]);
  const tasksRef = useRef<TreaboTask[]>(tasks);
  const onTaskClickRef = useRef(onTaskClick);
  const navigateOnClickRef = useRef(navigateOnClick);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  onBoundsChangeRef.current = onBoundsChange;
  onTaskClickRef.current = onTaskClick;
  navigateOnClickRef.current = navigateOnClick;
  tasksRef.current = tasks;

  const points = useMemo(() => buildTaskMapPoints(tasks), [tasks]);

  const center = useMemo<[number, number]>(() => {
    if (!points.length) return MOSCOW_CENTER;
    const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    let destroyed = false;

    function createMap() {
      if (!mapRef.current || !window.ymaps || destroyed || mapInstanceRef.current) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: centerRef.current,
          zoom: getMapZoom(pointsRef.current.length),
          controls: ['zoomControl'],
        });

        const emitBounds = () => {
          if (!mapInstanceRef.current || destroyed) return;
          onBoundsChangeRef.current?.(readYandexMapBounds(mapInstanceRef.current));
        };

        mapInstanceRef.current.events.add('actionend', emitBounds);
        emitBounds();
        setMapReady(true);
        setLoading(false);
      }
    }

    setLoading(true);
    setLoadError('');
    loadYmaps()
      .then(() => {
        if (!destroyed) createMap();
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
        clustererRef.current = null;
        placemarksRef.current.clear();
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || preserveViewport) return;
    mapInstanceRef.current.setCenter(center, getMapZoom(points.length));
  }, [center, points.length, preserveViewport]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapInstanceRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.container.fitToViewport();
        onBoundsChangeRef.current?.(readYandexMapBounds(mapInstanceRef.current));
      });
    });

    resizeObserver.observe(mapRef.current);
    return () => resizeObserver.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.ymaps) return;

    if (clustererRef.current) {
      mapInstanceRef.current.geoObjects.remove(clustererRef.current);
    }
    placemarksRef.current.clear();

    const layout = createCompactPlaqueLayout();
    const clusterer = new window.ymaps.Clusterer({
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: false,
      groupByCoordinates: false,
      gridSize: 96,
      hasBalloon: false,
      hasHint: false,
      clusterIconLayout: createClusterLayout(),
      clusterIconShape: {
        type: 'Circle',
        coordinates: [22, 22],
        radius: 24,
      },
    });
    clustererRef.current = clusterer;

    points.forEach((point) => {
      const task = tasksRef.current.find((item) => String(item.id) === point.id);
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
          iconContentOffset: [-88, -62],
          iconContentSize: [176, 62],
          iconShape: {
            type: 'Rectangle',
            coordinates: [[-88, -62], [88, 0]],
          },
          zIndex: active ? 1000 : 1,
        },
      );

      placemark.events.add('click', () => {
        if (!task) return;
        if (onTaskClickRef.current) {
          onTaskClickRef.current(task);
          return;
        }
        if (navigateOnClickRef.current) {
          window.location.href = routes.taskUrl(task);
        }
      });

      clusterer.add(placemark);
      placemarksRef.current.set(point.id, placemark);
    });

    mapInstanceRef.current.geoObjects.add(clusterer);
  }, [points, highlightedTaskId, mapReady]);

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
