import { useEffect, useRef, useState } from 'react';
import type { TreaboTask } from '@/data/treabo';

declare global {
  interface Window {
    ymaps: any;
  }
}

const CHISINAU_CENTER: [number, number] = [47.0105, 28.8638];

export default function TreaboTaskMap({ task }: { task: TreaboTask }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const center: [number, number] =
    task.lat != null && task.lng != null
      ? [Number(task.lat), Number(task.lng)]
      : CHISINAU_CENTER;

  useEffect(() => {
    let destroyed = false;

    function initMap() {
      if (!mapRef.current || !window.ymaps || destroyed) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom: task.lat != null && task.lng != null ? 14 : 10,
        controls: ['zoomControl'],
      });

      if (task.lat != null && task.lng != null) {
        map.geoObjects.add(
          new window.ymaps.Placemark(center, { hintContent: task.title }, { preset: 'islands#darkGreenDotIcon' }),
        );
      }

      setLoading(false);
    }

    if (window.ymaps) {
      window.ymaps.ready(initMap);
    } else {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=ru_RU`;
      script.async = true;
      script.onload = () => window.ymaps.ready(initMap);
      document.head.appendChild(script);
    }

    return () => {
      destroyed = true;
    };
  }, [center, task.lat, task.lng, task.title]);

  return (
    <div className="relative mt-4 h-[270px] overflow-hidden rounded-[26px] border border-zinc-200 bg-[#eaf0e3] sm:h-[360px]">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[#7d849b]">
          Загрузка карты…
        </div>
      ) : null}
      <div ref={mapRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-4 max-w-[80%] rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#232323] shadow-sm">
        {task.city || 'Кишинёв'}
      </div>
    </div>
  );
}
