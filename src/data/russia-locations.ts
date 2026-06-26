import { getTreaboApiBase } from '@/data/treabo-auth';

export type RussiaLocationType = 'capital' | 'administrative_centre' | 'city' | 'town' | 'settlement';

export type RussiaLocation = {
  id: number | string;
  geoname_id?: number | null;
  name_ru: string;
  ascii_name?: string | null;
  region_ru: string;
  type: RussiaLocationType;
  population?: number | null;
  lat?: number | null;
  lng?: number | null;
  source?: 'geonames' | 'dadata' | 'fallback';
};

export type StoredTreaboLocation = {
  id: number | string;
  geoname_id?: number | null;
  country_code: 'RU';
  name_ru: string;
  region_ru?: string;
  lat?: number | null;
  lng?: number | null;
};

export const DEFAULT_RUSSIA_LOCATION_ID = 'moscow';
export const TREABO_LOCATION_STORAGE_KEY = 'treabo:selected-location';

// Used only while the API/database is unavailable. Full search comes from russia_locations.
export const russiaLocations: RussiaLocation[] = [
  { id: 'moscow', geoname_id: 524901, name_ru: 'Москва', ascii_name: 'Moscow', region_ru: 'Москва', type: 'capital', population: 13010112, lat: 55.7522, lng: 37.6156, source: 'fallback' },
  { id: 'saint-petersburg', geoname_id: 498817, name_ru: 'Санкт-Петербург', ascii_name: 'Saint Petersburg', region_ru: 'Санкт-Петербург', type: 'city', population: 5601911, lat: 59.9386, lng: 30.3141, source: 'fallback' },
  { id: 'novosibirsk', name_ru: 'Новосибирск', ascii_name: 'Novosibirsk', region_ru: 'Новосибирская область', type: 'city', lat: 55.0415, lng: 82.9346, source: 'fallback' },
  { id: 'yekaterinburg', name_ru: 'Екатеринбург', ascii_name: 'Yekaterinburg', region_ru: 'Свердловская область', type: 'city', lat: 56.8519, lng: 60.6122, source: 'fallback' },
  { id: 'kazan', name_ru: 'Казань', ascii_name: 'Kazan', region_ru: 'Республика Татарстан', type: 'city', lat: 55.7887, lng: 49.1221, source: 'fallback' },
  { id: 'nizhny-novgorod', name_ru: 'Нижний Новгород', ascii_name: 'Nizhny Novgorod', region_ru: 'Нижегородская область', type: 'city', lat: 56.3287, lng: 44.002, source: 'fallback' },
  { id: 'krasnoyarsk', name_ru: 'Красноярск', ascii_name: 'Krasnoyarsk', region_ru: 'Красноярский край', type: 'city', lat: 56.0184, lng: 92.8672, source: 'fallback' },
  { id: 'chelyabinsk', name_ru: 'Челябинск', ascii_name: 'Chelyabinsk', region_ru: 'Челябинская область', type: 'city', lat: 55.154, lng: 61.4291, source: 'fallback' },
  { id: 'samara', name_ru: 'Самара', ascii_name: 'Samara', region_ru: 'Самарская область', type: 'city', lat: 53.2001, lng: 50.15, source: 'fallback' },
  { id: 'ufa', name_ru: 'Уфа', ascii_name: 'Ufa', region_ru: 'Республика Башкортостан', type: 'city', lat: 54.7431, lng: 55.9678, source: 'fallback' },
  { id: 'rostov-on-don', name_ru: 'Ростов-на-Дону', ascii_name: 'Rostov-on-Don', region_ru: 'Ростовская область', type: 'city', lat: 47.2313, lng: 39.7233, source: 'fallback' },
  { id: 'krasnodar', name_ru: 'Краснодар', ascii_name: 'Krasnodar', region_ru: 'Краснодарский край', type: 'city', lat: 45.0448, lng: 38.976, source: 'fallback' },
];

type RussiaLocationApiItem = {
  id: number | string;
  geoname_id?: number | null;
  name?: string;
  name_ru: string;
  ascii_name?: string | null;
  region?: string | null;
  region_ru?: string | null;
  type?: string;
  population?: number | null;
  lat?: number | null;
  lng?: number | null;
  source?: 'geonames' | 'dadata';
};

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function mapApiItem(item: RussiaLocationApiItem): RussiaLocation {
  return {
    id: item.id,
    geoname_id: item.geoname_id,
    name_ru: item.name_ru || item.name || '',
    ascii_name: item.ascii_name,
    region_ru: item.region_ru || item.region || '',
    type: (item.type as RussiaLocationType) || 'city',
    population: item.population,
    lat: item.lat,
    lng: item.lng,
    source: item.source,
  };
}

function getLocationsApiBase() {
  return typeof window !== 'undefined' ? '/api/treabo' : getTreaboApiBase();
}

export function getRussiaLocationById(id?: string | number | null) {
  if (id == null || id === '') return russiaLocations[0];
  return russiaLocations.find((location) => String(location.id) === String(id)) ||
    russiaLocations.find((location) => String(location.geoname_id) === String(id)) ||
    russiaLocations[0];
}

export function getLocationDisplayName(location: RussiaLocation, _locale?: string) {
  return location.name_ru;
}

export function toStoredTreaboLocation(location: RussiaLocation): StoredTreaboLocation {
  return { id: location.id, geoname_id: location.geoname_id, country_code: 'RU', name_ru: location.name_ru, region_ru: location.region_ru, lat: location.lat, lng: location.lng };
}

export function readStoredTreaboLocation(): RussiaLocation {
  const fallback = getRussiaLocationById(DEFAULT_RUSSIA_LOCATION_ID);
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(TREABO_LOCATION_STORAGE_KEY);
    if (!raw?.startsWith('{')) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredTreaboLocation>;
    // Moldova selections from the previous classifier did not have country_code.
    if (parsed.country_code !== 'RU' || !parsed.name_ru) return fallback;
    return { ...fallback, ...parsed, id: parsed.id ?? fallback.id, name_ru: parsed.name_ru, region_ru: parsed.region_ru || '', source: 'fallback' };
  } catch {
    return fallback;
  }
}

export function searchRussiaLocations(query: string, limit = 12) {
  const needle = normalizeSearch(query);
  if (!needle) return russiaLocations.slice(0, limit);
  return russiaLocations
    .filter((location) => [location.name_ru, location.ascii_name || '', location.region_ru].map(normalizeSearch).some((value) => value.includes(needle)))
    .slice(0, limit);
}

export async function searchRussiaLocationsRemote(query: string, options?: { limit?: number }): Promise<RussiaLocation[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  params.set('limit', String(options?.limit ?? 12));
  const response = await fetch(`${getLocationsApiBase()}/locations/russia/search?${params.toString()}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Russia locations API unavailable');

  const payload = (await response.json()) as { success?: boolean; data?: RussiaLocationApiItem[] };
  if (!payload?.data?.length) return searchRussiaLocations(query, options?.limit ?? 12);
  return payload.data.map(mapApiItem);
}

export async function searchRussiaLocationsWithFallback(query: string, options?: { limit?: number }): Promise<RussiaLocation[]> {
  try {
    return await searchRussiaLocationsRemote(query, options);
  } catch {
    return searchRussiaLocations(query, options?.limit ?? 12);
  }
}
