import { useCallback, useEffect, useRef, useState } from 'react';
import RussiaCityInput from '@/components/treabo/RussiaCityInput';

declare global {
  interface Window {
    ymaps?: any;
  }
}

let ymapsLoadPromise: Promise<void> | null = null;

function loadYmaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.ymaps) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve()));
  }
  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU&coordorder=latlong`;
    script.async = true;
    script.dataset.yandexMapsApi = '2.1';
    script.onload = () => {
      if (window.ymaps) window.ymaps.ready(() => resolve());
      else reject(new Error('ymaps not defined'));
    };
    script.onerror = () => reject(new Error('Yandex Maps script failed'));
    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  Москва: [55.7522, 37.6156],
  'Санкт-Петербург': [59.9343, 30.3351],
};

type TreaboAddressPickerProps = {
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  onCityChange: (city: string) => void;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  addressPlaceholder?: string;
  mapHint?: string;
};

export default function TreaboAddressPicker({
  city,
  address,
  lat,
  lng,
  onCityChange,
  onAddressChange,
  onCoordinatesChange,
  addressPlaceholder = 'Улица и номер дома',
  mapHint = 'Перетащите маркер или выберите адрес из подсказок',
}: TreaboAddressPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadYmaps(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const geocodeQuery = useCallback(
    (query: string) => {
      if (!window.ymaps || !query.trim()) return;
      const fullQuery = query.includes(city) ? query : `${city}, ${query}`;
      setLoading(true);
      window.ymaps
        .geocode(fullQuery, { results: 1 })
        .then((res: any) => {
          const first = res?.geoObjects?.get?.(0);
          if (!first) return;
          const coords = first.geometry?.getCoordinates?.();
          if (!coords || coords.length < 2) return;
          const nextLat = Number(coords[0]);
          const nextLng = Number(coords[1]);
          if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;
          const line =
            first.getAddressLine?.() || first.properties?.get?.('text') || query;
          onAddressChange(String(line));
          onCoordinatesChange(nextLat, nextLng);
        })
        .finally(() => setLoading(false));
    },
    [city, onAddressChange, onCoordinatesChange],
  );

  const pickSuggestion = useCallback(
    (item: any) => {
      const query = item?.value || item?.displayName || String(item);
      if (!query) return;
      setSuggestOpen(false);
      geocodeQuery(query);
    },
    [geocodeQuery],
  );

  const runSuggest = useCallback(
    (text: string) => {
      if (!ready || !window.ymaps || text.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const suggestFn = window.ymaps.suggest;
      if (typeof suggestFn !== 'function') return;
      const query = `${city}, ${text.trim()}`;
      suggestFn
        .call(window.ymaps, query, { results: 8 })
        .then((items: any[]) => {
          setSuggestions(Array.isArray(items) ? items : []);
          setSuggestOpen(true);
        })
        .catch(() => setSuggestions([]));
    },
    [ready, city],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSuggest(address), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, runSuggest]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.ymaps) return;

    const center: [number, number] =
      lat != null && lng != null
        ? [lat, lng]
        : CITY_CENTERS[city] || CITY_CENTERS['Москва'];

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
        center,
        zoom: lat != null && lng != null ? 16 : 11,
        controls: ['zoomControl'],
      });

      placemarkRef.current = new window.ymaps.Placemark(
        center,
        {},
        { draggable: true, preset: 'islands#blackCircleDotIcon' },
      );

      placemarkRef.current.events.add('dragend', () => {
        const coords = placemarkRef.current.geometry.getCoordinates();
        if (coords?.length >= 2) {
          onCoordinatesChange(Number(coords[0]), Number(coords[1]));
          window.ymaps
            .geocode(coords, { kind: 'house' })
            .then((res: any) => {
              const first = res?.geoObjects?.get?.(0);
              const line = first?.getAddressLine?.();
              if (line) onAddressChange(String(line));
            })
            .catch(() => {});
        }
      });

      mapInstanceRef.current.geoObjects.add(placemarkRef.current);

      mapInstanceRef.current.events.add('click', (event: any) => {
        const coords = event.get('coords');
        if (!coords) return;
        placemarkRef.current.geometry.setCoordinates(coords);
        onCoordinatesChange(Number(coords[0]), Number(coords[1]));
        window.ymaps
          .geocode(coords, { kind: 'house' })
          .then((res: any) => {
            const first = res?.geoObjects?.get?.(0);
            const line = first?.getAddressLine?.();
            if (line) onAddressChange(String(line));
          })
          .catch(() => {});
      });
    } else {
      const nextCenter =
        lat != null && lng != null ? [lat, lng] : CITY_CENTERS[city] || CITY_CENTERS['Москва'];
      mapInstanceRef.current.setCenter(nextCenter, lat != null && lng != null ? 16 : 11);
      placemarkRef.current.geometry.setCoordinates(nextCenter);
    }
  }, [ready, city, lat, lng, onAddressChange, onCoordinatesChange]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, []);

  const inputClass =
    'w-full rounded-2xl bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

  return (
    <div className="mt-8 space-y-4">
      <div>
        <div className="mb-2 text-sm font-bold text-[#232323]">Город</div>
        <div className={`${inputClass} !py-3`}>
          <RussiaCityInput
            value={city}
            onChange={onCityChange}
            inputClassName="w-full bg-transparent text-base text-[#232323] outline-none"
          />
        </div>
      </div>

      <div ref={wrapRef} className="relative">
        <div className="mb-2 text-sm font-bold text-[#232323]">Адрес</div>
        <input
          value={address}
          onChange={(event) => {
            onAddressChange(event.target.value);
            setSuggestOpen(true);
          }}
          onFocus={() => address.trim().length >= 2 && setSuggestOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (address.trim().length >= 3) geocodeQuery(address);
            }, 200);
          }}
          placeholder={addressPlaceholder}
          className={inputClass}
        />
        {loading ? (
          <div className="mt-2 text-xs font-semibold text-[#7d849b]">Определяем координаты…</div>
        ) : null}
        {suggestOpen && suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-2xl border border-[#dfe4ee] bg-white py-1 shadow-lg">
            {suggestions.map((item, idx) => {
              const label = item?.displayName || item?.value || String(item);
              return (
                <li key={`${idx}-${label}`}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-[#f3f5fa]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(item)}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-2xl border border-[#dfe4ee] md:h-[420px]">
        {!apiKey ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#7d849b]">
            Для карты задайте NEXT_PUBLIC_YANDEX_MAPS_API_KEY
          </div>
        ) : !ready ? (
          <div className="flex h-full items-center justify-center text-sm text-[#7d849b]">
            Загрузка Яндекс.Карт…
          </div>
        ) : (
          <div ref={mapRef} className="h-full w-full" />
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#232323]">
          {mapHint}
        </div>
      </div>
    </div>
  );
}
