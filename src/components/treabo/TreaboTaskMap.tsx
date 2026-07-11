import { useEffect, useRef, useState } from 'react';
import type { TreaboTask } from '@/data/treabo';
import { isYmapsReady, loadYmaps } from '@/lib/treabo/load-ymaps';

const MOSCOW_CENTER: [number, number] = [55.7522, 37.6156];

export default function TreaboTaskMap({ task }: { task: TreaboTask }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ destroy: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const center: [number, number] =
    task.lat != null && task.lng != null
      ? [Number(task.lat), Number(task.lng)]
      : MOSCOW_CENTER;

  useEffect(() => {
    let destroyed = false;

    loadYmaps()
      .then(() => {
        if (destroyed || !mapRef.current || !isYmapsReady()) {
          throw new Error('ymaps not ready');
        }

        mapInstanceRef.current?.destroy();
        mapInstanceRef.current = new window.ymaps!.Map(mapRef.current, {
          center,
          zoom: task.lat != null && task.lng != null ? 14 : 10,
          controls: ['zoomControl'],
        });

        if (task.lat != null && task.lng != null) {
          mapInstanceRef.current.geoObjects.add(
            new window.ymaps!.Placemark(
              center,
              { hintContent: task.title, iconContent: task.title },
              { preset: 'islands#darkGreenStretchyIcon' },
            ),
          );
        }

        if (!destroyed) {
          setFailed(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!destroyed) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      destroyed = true;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [center, task.lat, task.lng, task.title]);

  return (
    <div className="relative mt-4 h-[270px] overflow-hidden rounded-[26px] border border-zinc-200 bg-[#eaf0e3] sm:h-[360px]">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[#7d849b]">
          Загрузка карты…
        </div>
      ) : null}
      {failed ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-[#7d849b]">
          Карта временно недоступна
        </div>
      ) : null}
      <div ref={mapRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-4 max-w-[80%] rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#232323] shadow-sm">
        {task.city || 'Москва'}
      </div>
    </div>
  );
}
