import { getTreaboPublicApiBase } from '@/data/treabo';

export type GeoAddressResult = {
  city: string | null;
  region: string | null;
  country: string | null;
  address: string | null;
  full_address: string | null;
  lat: number | null;
  lng: number | null;
  fias_id?: string | null;
  kladr_id?: string | null;
  source: 'browser' | 'dadata' | 'maxmind' | 'yandex' | 'manual' | 'cache' | string;
  provider?: 'dadata' | 'maxmind' | 'yandex' | 'browser' | null;
  accuracy?: number | null;
  needs_confirmation: boolean;
};

export type SaveAddressPayload = {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  address?: string | null;
  full_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  fias_id?: string | null;
  kladr_id?: string | null;
  source?: string;
};

export interface GeoLocationData {
  ip: string;
  location: {
    ip: string;
    country: string;
    iso_code: string;
    city: string | null;
    state: string | null;
    state_name: string | null;
    postal_code: string | null;
    lat: number;
    lon: number;
    timezone: string;
    continent: string;
    currency: string;
  };
}

export interface CountryInfo {
  country: string;
  is_russian: boolean;
  ip: string;
}

export interface UserLocation {
  id?: number;
  user_id?: number;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ip_address: string;
  is_auto_detected: boolean;
  created_at?: string;
  updated_at?: string;
}

function apiBase(): string {
  return getTreaboPublicApiBase();
}

async function geoFetch<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  const { token, headers, ...rest } = init || {};
  const response = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.error || payload?.message || 'Geo API request failed';
    throw new Error(typeof detail === 'string' ? detail : 'Geo API request failed');
  }

  return payload as T;
}

export function getBrowserCoordinates(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Геолокация недоступна в браузере'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

export async function detectByIp(): Promise<GeoAddressResult> {
  return geoFetch<GeoAddressResult>('/geo/detect', { method: 'GET' });
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  accuracy?: number | null,
): Promise<GeoAddressResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (accuracy != null) {
    params.set('accuracy', String(accuracy));
  }

  return geoFetch<GeoAddressResult>(`/geo/reverse?${params.toString()}`, { method: 'GET' });
}

export async function suggestAddresses(
  query: string,
  options?: { city?: string; count?: number },
): Promise<GeoAddressResult[]> {
  const params = new URLSearchParams({ query });
  if (options?.city) params.set('city', options.city);
  if (options?.count) params.set('count', String(options.count));

  const payload = await geoFetch<{ addresses?: GeoAddressResult[] }>(
    `/addresses/search?${params.toString()}`,
    { method: 'GET' },
  );

  return payload.addresses || [];
}

export async function saveConfirmedAddress(
  payload: SaveAddressPayload,
  token?: string | null,
): Promise<GeoAddressResult> {
  const result = await geoFetch<{ address: GeoAddressResult }>('/address/save', {
    method: 'POST',
    token,
    body: JSON.stringify({ ...payload, source: payload.source || 'manual' }),
  });

  return result.address;
}

export async function getSavedAddress(token?: string | null): Promise<GeoAddressResult | null> {
  const result = await geoFetch<{ address: GeoAddressResult | null }>('/address/saved', {
    method: 'GET',
    token,
  });

  return result.address;
}

function toUserLocation(result: GeoAddressResult | null, autoDetected = false): UserLocation | null {
  if (!result) return null;

  return {
    city: result.city || 'Москва',
    region: result.region || '',
    country: result.country || 'Россия',
    latitude: result.lat ?? 55.7558,
    longitude: result.lng ?? 37.6176,
    timezone: 'Europe/Moscow',
    ip_address: '',
    is_auto_detected: autoDetected,
  };
}

export async function getCurrentLocation(): Promise<GeoLocationData> {
  const result = await detectByIp();

  return {
    ip: '',
    location: {
      ip: '',
      country: result.country || 'Россия',
      iso_code: 'RU',
      city: result.city,
      state: result.region,
      state_name: result.region,
      postal_code: null,
      lat: result.lat ?? 55.7558,
      lon: result.lng ?? 37.6176,
      timezone: 'Europe/Moscow',
      continent: 'Europe',
      currency: 'RUB',
    },
  };
}

export async function getCountryInfo(): Promise<CountryInfo> {
  const result = await detectByIp();
  const country = result.country || 'Россия';

  return {
    country,
    is_russian: country.toLowerCase().includes('рос') || country.toLowerCase().includes('russia'),
    ip: '',
  };
}

export async function isRussianUser(): Promise<boolean> {
  return getCountryInfo()
    .then((info) => info.is_russian)
    .catch(() => true);
}

export async function getRussianCity(): Promise<string | null> {
  return detectByIp()
    .then((result) => result.city)
    .catch(() => null);
}

export async function getCoordinates(): Promise<{ lat: number; lon: number } | null> {
  return detectByIp()
    .then((result) => (
      result.lat != null && result.lng != null
        ? { lat: result.lat, lon: result.lng }
        : null
    ))
    .catch(() => null);
}

export async function getUserLocation(_userId: number): Promise<UserLocation | null> {
  const saved = await getSavedAddress().catch(() => null);
  return toUserLocation(saved, false);
}

export async function autoDetectAndSaveLocation(_userId: number): Promise<UserLocation | null> {
  const { result, gpsUsed } = await autoDetectAddress();

  await saveConfirmedAddress({
    city: result.city,
    region: result.region,
    country: result.country,
    address: result.address,
    full_address: result.full_address,
    lat: result.lat,
    lng: result.lng,
    fias_id: result.fias_id,
    kladr_id: result.kladr_id,
    source: gpsUsed ? 'browser' : 'manual',
  }).catch(() => null);

  return toUserLocation(result, true);
}

export async function getLocationForMap(userId: number): Promise<{ lat: number; lon: number; city: string } | null> {
  const location = await getUserLocation(userId)
    .catch(() => null)
    || await autoDetectAndSaveLocation(userId).catch(() => null);

  return {
    lat: location?.latitude ?? 55.7558,
    lon: location?.longitude ?? 37.6176,
    city: location?.city || 'Москва',
  };
}

export async function setUserCity(
  _userId: number,
  _cityId: string,
  cityName: string,
  region: string,
): Promise<UserLocation> {
  const saved = await saveConfirmedAddress({
    city: cityName,
    region,
    country: 'Россия',
    source: 'manual',
  }).catch(() => null);

  return toUserLocation(saved || {
    city: cityName,
    region,
    country: 'Россия',
    address: null,
    full_address: null,
    lat: null,
    lng: null,
    source: 'manual',
    needs_confirmation: false,
  }, false)!;
}

/**
 * Полный flow: IP → GPS → reverse geocode.
 * При отказе в GPS возвращает IP-подсказку (город/регион).
 */
export async function autoDetectAddress(): Promise<{
  result: GeoAddressResult;
  gpsUsed: boolean;
}> {
  const ipHint = await detectByIp().catch(() => ({
    city: null,
    region: null,
    country: 'Россия',
    address: null,
    full_address: null,
    lat: null,
    lng: null,
    source: 'maxmind' as const,
    needs_confirmation: true,
  }));

  try {
    const position = await getBrowserCoordinates();
    const { latitude, longitude, accuracy } = position.coords;
    const reversed = await reverseGeocode(latitude, longitude, accuracy);

    return {
      result: {
        ...reversed,
        city: reversed.city || ipHint.city,
        region: reversed.region || ipHint.region,
        country: reversed.country || ipHint.country,
        source: 'browser',
        provider: reversed.provider || 'dadata',
        accuracy: accuracy ?? reversed.accuracy ?? null,
        needs_confirmation: true,
      },
      gpsUsed: true,
    };
  } catch {
    return {
      result: {
        ...ipHint,
        needs_confirmation: true,
      },
      gpsUsed: false,
    };
  }
}

// Legacy exports for совместимости
export const geoLocationService = {
  detectByIp,
  reverseGeocode,
  suggestAddresses,
  saveConfirmedAddress,
  getSavedAddress,
  autoDetectAddress,
  getBrowserCoordinates,
  getCurrentLocation,
  getCountryInfo,
  isRussianUser,
  getRussianCity,
  getCoordinates,
  getUserLocation,
  autoDetectAndSaveLocation,
  getLocationForMap,
  setUserCity,
};

export default geoLocationService;
