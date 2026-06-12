'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { currentRegionAtom, currentGeoPointAtom, getDefaultMapCenter } from '@/store/locationStore';
import { Product } from '@/types';
import { YMaps, Map, Placemark, Clusterer, withYMaps } from 'react-yandex-maps';
import { Loader2 } from 'lucide-react';

const DEMO_CENTER: [number, number] = [55.855, 37.415];

const MAP_TITLE_MAX_LEN = 20;

/** Короткий заголовок для маркера карты (как на ЦИАН / маркетплейсах) */
export function truncateMapTitle(text: string | undefined | null, maxLength = MAP_TITLE_MAX_LEN): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type MapPlacemarksProps = {
  ymaps?: any;
  products: any[];
  onMarkerClick: (product: any) => void;
};

/** Маркеры с ценой и усечённым названием (templateLayoutFactory) */
const MapProductPlacemarksInner = React.memo(function MapProductPlacemarksInner({
  ymaps,
  products,
  onMarkerClick,
}: MapPlacemarksProps) {
  const iconLayoutClass = useMemo(() => {
    if (!ymaps || !(ymaps as any).templateLayoutFactory) return null;
    const tf = (ymaps as any).templateLayoutFactory;
    return tf.createClass(
      [
        '<div class="product-marker">',
        '<div class="product-marker__price">$[properties.priceLabel]</div>',
        '<div class="product-marker__title">$[properties.shortTitle]</div>',
        '</div>',
      ].join(''),
    );
  }, [ymaps]);

  if (!iconLayoutClass) return null;

  return (
    <>
      {products.map((product: any) => {
        const lat = Number(product.lat);
        const lng = Number(product.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const rawTitle = String(product.title || product.name || '');
        const numericPrice = Number(product.price);
        const priceLabel = Number.isFinite(numericPrice)
          ? `${numericPrice.toLocaleString('ru-RU')} ₽`
          : 'Цена по запросу';

        const shortTitle = escapeHtml(truncateMapTitle(rawTitle, MAP_TITLE_MAX_LEN));
        const safePriceLabel = escapeHtml(priceLabel);
        const safeFullTitle = escapeHtml(rawTitle);
        const safeBalloonPrice = escapeHtml(priceLabel);

        const balloonContent = [
          '<div style="padding:12px;max-width:260px;font-family:system-ui,-apple-system,sans-serif;">',
          `<div style="font-weight:600;margin-bottom:8px;font-size:15px;line-height:1.35;">${safeFullTitle}</div>`,
          `<div style="color:var(--color-accent);font-size:17px;font-weight:700;margin-bottom:10px;">${safeBalloonPrice}</div>`,
          product.address
            ? `<div style="color:#666;font-size:13px;margin-bottom:12px;">${escapeHtml(String(product.address))}</div>`
            : '',
          product.slug
            ? `<a href="/products/${escapeHtml(String(product.slug))}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#3b82f6;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">Перейти к товару →</a>`
            : '',
          '</div>',
        ].join('');

        return (
          <Placemark
            key={product.id}
            geometry={[lat, lng]}
            properties={{
              priceLabel: safePriceLabel,
              shortTitle,
              hintContent: rawTitle,
              balloonContent,
            }}
            options={{
              iconLayout: iconLayoutClass,
              iconOffset: [0, -36],
              iconShape: {
                type: 'Rectangle',
                coordinates: [
                  [-72, -40],
                  [72, 4],
                ],
              },
            }}
            onClick={() => onMarkerClick(product)}
          />
        );
      })}
    </>
  );
});

const MapProductPlacemarks = withYMaps(MapProductPlacemarksInner, true, ['templateLayoutFactory']);

interface ProductMapViewProps {
  filters?: {
    categories?: string;
    tags?: string;
    shop_id?: string;
    price?: string;
    name?: string;
    orderBy?: string;
    sortedBy?: string;
    attribute_values?: Record<string, string[]>;
  };
  onProductClick?: (product: Product) => void;
  className?: string;
}

/**
 * Компонент карты для отображения товаров с геопривязкой.
 * 
 * - Центр по умолчанию: Москва или регион пользователя/магазина
 * - Автоматическая подгрузка товаров по bbox при перемещении/зуме карты
 * - Использует endpoint /products/map?bbox=minLat,minLng,maxLat,maxLng
 * - Clusterer для группировки маркеров
 * - Маркер: цена + усечённое название (templateLayoutFactory, стиль маркетплейса)
 * - Балун: полное название, цена, ссылка на товар
 * - Поддержка тёмной темы
 */
export default function ProductMapView({ 
  filters = {}, 
  onProductClick,
  className = '' 
}: ProductMapViewProps) {
  const router = useRouter();
  const locale = router?.locale || 'ru';
  const currentRegion = useAtomValue(currentRegionAtom);
  const currentGeoPoint = useAtomValue(currentGeoPointAtom);

  const catalogQueryKey = useMemo(
    () =>
      JSON.stringify({
        categories: filters.categories ?? null,
        tags: filters.tags ?? null,
        shop_id: filters.shop_id ?? null,
        price: filters.price ?? null,
        name: filters.name ?? null,
        attribute_values: filters.attribute_values ?? null,
      }),
    [filters]
  );
  
  const defaultCenter = useMemo<[number, number]>(() => {
    if (currentGeoPoint?.lat && currentGeoPoint?.lng) {
      return [currentGeoPoint.lat, currentGeoPoint.lng];
    }
    const regionCenter = getDefaultMapCenter(currentRegion);
    // Для демо-набора: если регион не определен и используется дефолт Москвы,
    // переключаемся на координаты тестовых товаров, чтобы маркеры были сразу видны.
    if (regionCenter[0] === 55.7558 && regionCenter[1] === 37.6173) {
      return DEMO_CENTER;
    }
    return regionCenter;
  }, [currentGeoPoint, currentRegion]);

  const [bbox, setBbox] = useState<string>('');
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  /** Текущий bbox без включения в deps onBoundsChange — иначе карта ломает жесты и debounce */
  const bboxRef = useRef<string>('');

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_REST_API_ENDPOINT?.replace(/\/$/, '') || '';

  const buildMapSearchParams = useCallback(
    (bboxStr: string) => {
      const params = new URLSearchParams();
      params.set('bbox', bboxStr);
      params.set('limit', '120');
      params.set('language', locale);
      if (filters.categories) params.set('categories', String(filters.categories));
      if (filters.tags) params.set('tags', String(filters.tags));
      if (filters.shop_id) params.set('shop_id', String(filters.shop_id));
      if (filters.price) params.set('price', String(filters.price));
      if (filters.name) params.set('name', String(filters.name));
      if (
        filters.attribute_values &&
        typeof filters.attribute_values === 'object' &&
        Object.keys(filters.attribute_values).length > 0
      ) {
        params.set('attribute_values', JSON.stringify(filters.attribute_values));
      }
      return params.toString();
    },
    [locale, filters]
  );

  // Отдельный /products/map — те же фильтры каталога, что и у /products/dynamic
  const { data: mapProductsData, isLoading: isProductsLoading } = useQuery(
    ['map-products', locale, catalogQueryKey, bbox],
    async () => {
      if (!bbox) return { data: [] as any[] };
      
      setIsLoadingMap(true);
      try {
        const url = `${apiBaseUrl}/products/map?${buildMapSearchParams(bbox)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Map API failed: ${response.status}`);
        }
        const payload = await response.json();
        const source = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        const normalized = source
          .map((item: any) => {
            const lat = Number(item.lat ?? item.geo_point?.lat ?? item.geoPoint?.lat);
            const lng = Number(item.lng ?? item.geo_point?.lng ?? item.geoPoint?.lng);
            return {
              ...item,
              lat,
              lng,
            };
          })
          .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

        return { ...payload, data: normalized };
      } catch (error: any) {
        console.error('❌ Ошибка загрузки товаров для карты:', error?.response?.data || error?.message || error);
        return { data: [] as any[] };
      } finally {
        setIsLoadingMap(false);
      }
    },
    {
      enabled: !!bbox && bbox.length > 20,
      staleTime: 120000,
      cacheTime: 300000,
      retry: 1,
    }
  );

  const products = mapProductsData?.data || [];

  useEffect(() => {
    bboxRef.current = bbox;
  }, [bbox]);

  // Обработчик изменения видимой области карты (debounced)
  const handleBoundsChange = useCallback(() => {
    const map = mapRef.current;
    if (!map || typeof map.getBounds !== 'function') return;

    try {
      const bounds = map.getBounds();
      if (!bounds || !Array.isArray(bounds) || bounds.length !== 2) return;

      const [[minLat, minLng], [maxLat, maxLng]] = bounds;
      const newBbox = `${minLat.toFixed(6)},${minLng.toFixed(6)},${maxLat.toFixed(6)},${maxLng.toFixed(6)}`;

      if (newBbox !== bboxRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          setBbox(newBbox);
        }, 350);
      }
    } catch (err) {
      console.warn('Не удалось получить bounds карты:', err);
    }
  }, []);

  // Инициализируем bbox сразу после первого рендера карты (без ожидания drag/zoom)
  useEffect(() => {
    if (!isMapReady || !mapRef.current || bbox) return;
    handleBoundsChange();
  }, [handleBoundsChange, bbox, isMapReady]);

  // Смена региона — сброс bbox (состояние в родителе, иначе после remount карты остаётся старый viewport)
  const prevRegionIdRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    const id = currentRegion?.id ?? null;
    if (prevRegionIdRef.current === undefined) {
      prevRegionIdRef.current = id;
      return;
    }
    if (prevRegionIdRef.current === id) return;
    prevRegionIdRef.current = id;
    setBbox('');
    bboxRef.current = '';
  }, [currentRegion]);

  /**
   * Remount только при локали/центре/регионе — не при смене фильтров каталога
   * (фильтры меняют только запрос товаров, иначе сбрасывается pan/zoom).
   */
  const mapInstanceKey = useMemo(
    () =>
      `${locale}|${defaultCenter[0].toFixed(4)},${defaultCenter[1].toFixed(4)}|${String(currentRegion?.id ?? 'none')}`,
    [locale, defaultCenter, currentRegion]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePlacemarkClick = (product: any) => {
    if (onProductClick) {
      onProductClick(product);
    } else if (product.slug) {
      window.open(`/products/${product.slug}`, '_blank');
    }
  };

  const isLoading = isProductsLoading || isLoadingMap;

  return (
    <div className={`relative w-full h-[600px] rounded-2xl overflow-hidden border border-light-200 dark:border-dark-400 bg-light-100 dark:bg-dark-100 ${className}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .product-marker {
              background: #ffffff;
              border-radius: 12px;
              padding: 6px 10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
              min-width: 80px;
              max-width: 148px;
              box-sizing: border-box;
              border: 1px solid rgba(0,0,0,0.06);
            }
            html.dark .product-marker {
              background: #1e293b;
              border-color: rgba(255,255,255,0.08);
              box-shadow: 0 2px 12px rgba(0,0,0,0.45);
            }
            .product-marker__price {
              font-weight: 700;
              font-size: 14px;
              color: #0f172a;
              line-height: 1.2;
              margin-bottom: 2px;
            }
            html.dark .product-marker__price {
              color: #f1f5f9;
            }
            .product-marker__title {
              font-size: 12px;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.25;
              max-width: 128px;
            }
            html.dark .product-marker__title {
              color: #94a3b8;
            }
          `,
        }}
      />
      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '', lang: 'ru_RU' }}>
        <Map
          key={mapInstanceKey}
          defaultState={{
            center: defaultCenter,
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
          }}
          modules={['control.ZoomControl', 'control.FullscreenControl', 'control.GeolocationControl']}
          onBoundsChange={handleBoundsChange}
          instanceRef={(ref: any) => {
            mapRef.current = ref;
            if (ref) {
              setIsMapReady(true);
              setTimeout(() => {
                handleBoundsChange();
              }, 50);
            } else {
              setIsMapReady(false);
            }
          }}
          className="w-full h-full"
          options={{
            suppressMapOpenBlock: true,
          }}
        >
          {/* Clusterer для группировки близко расположенных маркеров */}
          <Clusterer
            options={{
              preset: 'islands#invertedVioletClusterIcons',
              groupByCoordinates: false,
              hasBalloon: true,
              hasHint: true,
              zoomOnClick: true,
              minZoom: 10,
              maxZoom: 18,
            }}
          >
            <MapProductPlacemarks products={products} onMarkerClick={handlePlacemarkClick} />
          </Clusterer>
        </Map>
      </YMaps>

      {/* Оверлей загрузки */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="flex flex-col items-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium">Загрузка товаров на карту...</p>
            <p className="text-xs opacity-70 mt-1">Перемещайте карту для обновления</p>
          </div>
        </div>
      )}

      {/* Индикатор количества маркеров */}
      {products.length > 0 && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-dark-100 px-4 py-2 rounded-xl shadow-lg text-xs font-medium border border-light-200 dark:border-dark-400 flex items-center gap-2 z-20">
          <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
          Найдено {products.length} товаров
        </div>
      )}

      {/* Подсказка для пользователя */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-dark-100/95 backdrop-blur-md px-4 py-3 rounded-2xl text-xs shadow-xl border border-light-200 dark:border-dark-400 max-w-[260px] z-20">
        <div className="font-semibold mb-1.5">Как использовать карту</div>
        <div className="text-dark-400 dark:text-light-400 text-[10px] leading-tight space-y-1">
          <div>• Перемещайте и масштабируйте карту</div>
          <div>• Товары подгружаются автоматически по видимой области</div>
          <div>• Клик по маркеру открывает товар</div>
        </div>
        {products.length === 0 && !isLoading && (
          <div className="mt-3 text-amber-600 dark:text-amber-400 text-[10px]">
            Товаров с координатами в этой области пока нет
          </div>
        )}
      </div>
    </div>
  );
}
