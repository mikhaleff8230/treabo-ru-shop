import { useCallback, useEffect, useRef, useState } from 'react';
import RussiaCityInput from '@/components/treabo/RussiaCityInput';
import {
  autoDetectAddress,
  type GeoAddressResult,
  saveConfirmedAddress,
  suggestAddresses,
} from '@/services/geoLocationService';
import { getStoredTreaboToken } from '@/data/treabo-auth';

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
  onConfirmedChange?: (confirmed: boolean) => void;
  addressPlaceholder?: string;
  mapHint?: string;
};

function formatDetectedLabel(result: GeoAddressResult): string {
  if (result.full_address) return result.full_address;
  const parts = [result.city, result.address, result.region].filter(Boolean);
  return parts.join(', ') || 'Адрес не определён';
}

export default function TreaboAddressPicker({
  city,
  address,
  lat,
  lng,
  onCityChange,
  onAddressChange,
  onCoordinatesChange,
  onConfirmedChange,
  addressPlaceholder = 'Улица и номер дома',
  mapHint = 'Перетащите маркер или выберите адрес из подсказок',
}: TreaboAddressPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const detectStarted = useRef(false);

  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoAddressResult[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const [detected, setDetected] = useState<GeoAddressResult | null>(null);
  const [gpsUsed, setGpsUsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyResult = useCallback(
    (result: GeoAddressResult) => {
      if (result.city) onCityChange(result.city);
      if (result.address || result.full_address) {
        onAddressChange(result.address || result.full_address || '');
      }
      if (result.lat != null && result.lng != null) {
        onCoordinatesChange(result.lat, result.lng);
      }
    },
    [onAddressChange, onCityChange, onCoordinatesChange],
  );

  const setConfirmedState = useCallback(
    (value: boolean) => {
      setConfirmed(value);
      onConfirmedChange?.(value);
    },
    [onConfirmedChange],
  );

  useEffect(() => {
    if (detectStarted.current) return;
    detectStarted.current = true;

    autoDetectAddress()
      .then(({ result, gpsUsed: usedGps }) => {
        setDetected(result);
        setGpsUsed(usedGps);
        if (usedGps && result.full_address) {
          applyResult(result);
        } else if (result.city) {
          onCityChange(result.city);
        }
      })
      .catch(() => {
        setDetected(null);
      })
      .finally(() => setDetecting(false));
  }, [applyResult, onCityChange]);

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

  const pickSuggestion = useCallback(
    (item: GeoAddressResult) => {
      const label = item.full_address || item.address || '';
      if (!label) return;
      setSuggestOpen(false);
      setEditMode(true);
      applyResult(item);
      setDetected(item);
      setConfirmedState(false);
    },
    [applyResult, setConfirmedState],
  );

  const runSuggest = useCallback(
    async (text: string) => {
      if (text.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const items = await suggestAddresses(text, { city, count: 8 });
        setSuggestions(items);
        setSuggestOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [city],
  );

  useEffect(() => {
    if (!editMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSuggest(address), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, editMode, runSuggest]);

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
      lat != null && lng != null ? [lat, lng] : CITY_CENTERS[city] || CITY_CENTERS['Москва'];

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
          setConfirmedState(false);
        }
      });

      mapInstanceRef.current.geoObjects.add(placemarkRef.current);

      mapInstanceRef.current.events.add('click', (event: any) => {
        const coords = event.get('coords');
        if (!coords) return;
        placemarkRef.current.geometry.setCoordinates(coords);
        onCoordinatesChange(Number(coords[0]), Number(coords[1]));
        setConfirmedState(false);
      });
    } else {
      const nextCenter =
        lat != null && lng != null ? [lat, lng] : CITY_CENTERS[city] || CITY_CENTERS['Москва'];
      mapInstanceRef.current.setCenter(nextCenter, lat != null && lng != null ? 16 : 11);
      placemarkRef.current.geometry.setCoordinates(nextCenter);
    }
  }, [ready, city, lat, lng, onCoordinatesChange, setConfirmedState]);

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

  const handleConfirm = async () => {
    const payload: GeoAddressResult = {
      city: city || detected?.city || null,
      region: detected?.region || null,
      country: detected?.country || 'Россия',
      address: address || detected?.address || null,
      full_address: detected?.full_address || address || null,
      lat: lat ?? detected?.lat ?? null,
      lng: lng ?? detected?.lng ?? null,
      fias_id: detected?.fias_id,
      kladr_id: detected?.kladr_id,
      source: gpsUsed ? 'browser' : 'manual',
      needs_confirmation: false,
    };

    applyResult(payload);
    setConfirmedState(true);
    setEditMode(false);

    try {
      const token = getStoredTreaboToken();
      await saveConfirmedAddress(payload, token);
    } catch {
      // сохранение опционально — задание всё равно создастся с координатами
    }
  };

  const inputClass =
    'w-full rounded-2xl bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

  const showConfirmBlock = !editMode && !confirmed && detected && (detected.full_address || detected.city);

  return (
    <div className="mt-8 space-y-4">
      {detecting ? (
        <div className="rounded-2xl bg-[#f3f5fa] px-5 py-4 text-sm font-semibold text-[#7d849b]">
          Определяем ваш адрес…
        </div>
      ) : null}

      {showConfirmBlock ? (
        <div className="rounded-2xl border border-[#dfe4ee] bg-[#f8f9fb] p-5">
          <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">
            {gpsUsed ? 'Мы определили адрес' : 'Мы определили ваш город'}
          </div>
          <p className="mt-2 text-base font-semibold leading-7 text-[#232323]">
            {formatDetectedLabel(detected)}
          </p>
          {!gpsUsed ? (
            <p className="mt-2 text-sm text-[#7d849b]">
              Уточните точный адрес — так специалисты быстрее найдут вас на карте.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex h-11 items-center rounded-xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323]"
            >
              Подтвердить
            </button>
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setConfirmedState(false);
                if (!address && detected?.city) {
                  onCityChange(detected.city);
                }
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#eef1f7] px-5 text-sm font-bold text-[#232323]"
            >
              Изменить
            </button>
          </div>
        </div>
      ) : null}

      {confirmed && !editMode ? (
        <div className="rounded-2xl border border-[#d9f36b] bg-[#f8fce8] px-5 py-4">
          <div className="text-sm font-bold text-[#232323]">Адрес подтверждён</div>
          <p className="mt-1 text-sm text-[#5a6070]">
            {[city, address].filter(Boolean).join(', ') || formatDetectedLabel(detected || { needs_confirmation: false, source: 'manual', city, region: null, country: null, address, full_address: null, lat: lat ?? null, lng: lng ?? null })}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditMode(true);
              setConfirmedState(false);
            }}
            className="mt-3 text-sm font-bold text-[#232323] underline"
          >
            Изменить адрес
          </button>
        </div>
      ) : null}

      {(editMode || !showConfirmBlock) && !confirmed ? (
        <>
          <div>
            <div className="mb-2 text-sm font-bold text-[#232323]">Город</div>
            <div className={`${inputClass} !py-3`}>
              <RussiaCityInput
                value={city}
                onChange={(nextCity) => {
                  onCityChange(nextCity);
                  setConfirmedState(false);
                }}
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
                setConfirmedState(false);
              }}
              onFocus={() => address.trim().length >= 2 && setSuggestOpen(true)}
              placeholder={addressPlaceholder}
              className={inputClass}
            />
            {loading ? (
              <div className="mt-2 text-xs font-semibold text-[#7d849b]">Ищем адреса…</div>
            ) : null}
            {suggestOpen && suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-2xl border border-[#dfe4ee] bg-white py-1 shadow-lg">
                {suggestions.map((item, idx) => {
                  const label = item.full_address || item.address || '';
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

          {address.trim().length >= 3 ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex h-11 items-center rounded-xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323]"
            >
              Подтвердить адрес
            </button>
          ) : null}
        </>
      ) : null}

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
