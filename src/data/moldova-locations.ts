import { getTreaboApiBase } from '@/data/treabo-auth';

export type MoldovaLocationType =
  | 'country'
  | 'municipality'
  | 'district'
  | 'city'
  | 'town'
  | 'commune'
  | 'village'
  | 'sector';

export type MoldovaLocation = {
  id: number | string;
  cuatm_code?: string | null;
  name_ru: string;
  ascii_name: string;
  district_ru: string;
  type: MoldovaLocationType;
  lat?: number | null;
  lng?: number | null;
  aliases?: string[];
};

export type StoredTreaboLocation = {
  id: number | string;
  cuatm_code?: string | null;
  name_ru: string;
  lat?: number | null;
  lng?: number | null;
};

export const DEFAULT_MOLDOVA_LOCATION_ID = 'chisinau';
export const TREABO_LOCATION_STORAGE_KEY = 'treabo:selected-location';

export const moldovaLocations: MoldovaLocation[] = [
  { id: 'chisinau', cuatm_code: '0100000', name_ru: 'Кишинёв', ascii_name: 'Chisinau', district_ru: 'мун. Кишинёв', type: 'municipality', lat: 47.0105, lng: 28.8638, aliases: ['Кишинев', 'Кишинэу'] },
  { id: 'balti', cuatm_code: '0200000', name_ru: 'Бельцы', ascii_name: 'Balti', district_ru: 'мун. Бельцы', type: 'municipality', lat: 47.7539, lng: 27.9184, aliases: ['Бэлць'] },
  { id: 'bender', cuatm_code: '0300000', name_ru: 'Бендеры', ascii_name: 'Bender', district_ru: 'мун. Бендеры', type: 'municipality', lat: 46.8316, lng: 29.4777, aliases: ['Tighina', 'Тигина'] },
  { id: 'tiraspol', cuatm_code: '0400000', name_ru: 'Тирасполь', ascii_name: 'Tiraspol', district_ru: 'Левобережье Днестра', type: 'municipality', lat: 46.8403, lng: 29.6433 },
  { id: 'cahul', cuatm_code: '0500000', name_ru: 'Кагул', ascii_name: 'Cahul', district_ru: 'Кагул', type: 'city', lat: 45.9042, lng: 28.1993 },
  { id: 'ungheni', cuatm_code: '0600000', name_ru: 'Унгены', ascii_name: 'Ungheni', district_ru: 'Унгены', type: 'city', lat: 47.2108, lng: 27.8005 },
  { id: 'soroca', cuatm_code: '0700000', name_ru: 'Сороки', ascii_name: 'Soroca', district_ru: 'Сороки', type: 'city', lat: 48.1566, lng: 28.2849 },
  { id: 'orhei', cuatm_code: '0800000', name_ru: 'Оргеев', ascii_name: 'Orhei', district_ru: 'Оргеев', type: 'city', lat: 47.3831, lng: 28.8231 },
  { id: 'comrat', cuatm_code: '0900000', name_ru: 'Комрат', ascii_name: 'Comrat', district_ru: 'АТО Гагаузия', type: 'city', lat: 46.2946, lng: 28.6565 },
  { id: 'straseni', cuatm_code: '1000000', name_ru: 'Страшены', ascii_name: 'Straseni', district_ru: 'Страшены', type: 'city', lat: 47.1411, lng: 28.6077 },
  { id: 'ceadir-lunga', cuatm_code: '1100000', name_ru: 'Чадыр-Лунга', ascii_name: 'Ceadir-Lunga', district_ru: 'АТО Гагаузия', type: 'city', lat: 46.0617, lng: 28.8303, aliases: ['Ceadâr-Lunga'] },
  { id: 'causeni', cuatm_code: '1200000', name_ru: 'Каушаны', ascii_name: 'Causeni', district_ru: 'Каушаны', type: 'city', lat: 46.6367, lng: 29.4111 },
  { id: 'edinet', cuatm_code: '1300000', name_ru: 'Единцы', ascii_name: 'Edinet', district_ru: 'Единцы', type: 'city', lat: 48.1721, lng: 27.3034 },
  { id: 'hincesti', cuatm_code: '1400000', name_ru: 'Хынчешты', ascii_name: 'Hincesti', district_ru: 'Хынчешты', type: 'city', lat: 46.8305, lng: 28.5906, aliases: ['Hancesti'] },
  { id: 'drochia', cuatm_code: '1500000', name_ru: 'Дрокия', ascii_name: 'Drochia', district_ru: 'Дрокия', type: 'city', lat: 48.0355, lng: 27.8129 },
  { id: 'ialoveni', cuatm_code: '1600000', name_ru: 'Яловены', ascii_name: 'Ialoveni', district_ru: 'Яловены', type: 'city', lat: 46.9434, lng: 28.7823 },
  { id: 'falesti', cuatm_code: '1700000', name_ru: 'Фалешты', ascii_name: 'Falesti', district_ru: 'Фалешты', type: 'city', lat: 47.5767, lng: 27.7126 },
  { id: 'floresti', cuatm_code: '1800000', name_ru: 'Флорешты', ascii_name: 'Floresti', district_ru: 'Флорешты', type: 'city', lat: 47.8914, lng: 28.2931 },
  { id: 'singerei', cuatm_code: '1900000', name_ru: 'Сынжерей', ascii_name: 'Singerei', district_ru: 'Сынжерей', type: 'city', lat: 47.6363, lng: 28.1423 },
  { id: 'nisporeni', cuatm_code: '2000000', name_ru: 'Ниспорены', ascii_name: 'Nisporeni', district_ru: 'Ниспорены', type: 'city', lat: 47.0812, lng: 28.1785 },
  { id: 'calarsi', cuatm_code: '2100000', name_ru: 'Калараш', ascii_name: 'Calarasi', district_ru: 'Калараш', type: 'city', lat: 47.2556, lng: 28.3099 },
  { id: 'rezina', cuatm_code: '2200000', name_ru: 'Резина', ascii_name: 'Rezina', district_ru: 'Резина', type: 'city', lat: 47.7493, lng: 28.9622 },
  { id: 'riscani', cuatm_code: '2300000', name_ru: 'Рышканы', ascii_name: 'Riscani', district_ru: 'Рышканы', type: 'city', lat: 47.9479, lng: 27.5638 },
  { id: 'briceni', cuatm_code: '2400000', name_ru: 'Бричаны', ascii_name: 'Briceni', district_ru: 'Бричаны', type: 'city', lat: 48.3563, lng: 27.7036 },
  { id: 'glodeni', cuatm_code: '2500000', name_ru: 'Глодяны', ascii_name: 'Glodeni', district_ru: 'Глодяны', type: 'city', lat: 47.7708, lng: 27.5167 },
  { id: 'ocnita', cuatm_code: '2600000', name_ru: 'Окница', ascii_name: 'Ocnita', district_ru: 'Окница', type: 'city', lat: 48.3828, lng: 27.4381 },
  { id: 'donduseni', cuatm_code: '2700000', name_ru: 'Дондюшаны', ascii_name: 'Donduseni', district_ru: 'Дондюшаны', type: 'city', lat: 48.2427, lng: 27.6101 },
  { id: 'leova', cuatm_code: '2800000', name_ru: 'Леова', ascii_name: 'Leova', district_ru: 'Леова', type: 'city', lat: 46.4789, lng: 28.2552 },
  { id: 'cantemir', cuatm_code: '2900000', name_ru: 'Кантемир', ascii_name: 'Cantemir', district_ru: 'Кантемир', type: 'city', lat: 46.2774, lng: 28.2027 },
  { id: 'basarabeasca', cuatm_code: '3000000', name_ru: 'Бессарабка', ascii_name: 'Basarabeasca', district_ru: 'Бессарабка', type: 'city', lat: 46.3317, lng: 28.9636 },
  { id: 'cimislia', cuatm_code: '3100000', name_ru: 'Чимишлия', ascii_name: 'Cimislia', district_ru: 'Чимишлия', type: 'city', lat: 46.5268, lng: 28.7644 },
  { id: 'soldanesti', cuatm_code: '3200000', name_ru: 'Шолданешты', ascii_name: 'Soldanesti', district_ru: 'Шолданешты', type: 'city', lat: 47.8153, lng: 28.7972 },
  { id: 'stefan-voda', cuatm_code: '3300000', name_ru: 'Штефан-Водэ', ascii_name: 'Stefan Voda', district_ru: 'Штефан-Водэ', type: 'city', lat: 46.5153, lng: 29.6631 },
  { id: 'taraclia', cuatm_code: '3400000', name_ru: 'Тараклия', ascii_name: 'Taraclia', district_ru: 'Тараклия', type: 'city', lat: 45.9027, lng: 28.6682 },
  { id: 'telenesti', cuatm_code: '3500000', name_ru: 'Теленешты', ascii_name: 'Telenesti', district_ru: 'Теленешты', type: 'city', lat: 47.5011, lng: 28.3654 },
  { id: 'vulcanesti', cuatm_code: '3600000', name_ru: 'Вулканешты', ascii_name: 'Vulcanesti', district_ru: 'АТО Гагаузия', type: 'city', lat: 45.6849, lng: 28.4028 },
  { id: 'criuleni', cuatm_code: '3700000', name_ru: 'Криуляны', ascii_name: 'Criuleni', district_ru: 'Криуляны', type: 'city', lat: 47.2131, lng: 29.1593 },
  { id: 'anenii-noi', cuatm_code: '3800000', name_ru: 'Новые Анены', ascii_name: 'Anenii Noi', district_ru: 'Новые Анены', type: 'city', lat: 46.8784, lng: 29.2348 },
  { id: 'cricova', cuatm_code: '0101000', name_ru: 'Крикова', ascii_name: 'Cricova', district_ru: 'мун. Кишинёв', type: 'town', lat: 47.1386, lng: 28.8619 },
  { id: 'codru', cuatm_code: '0102000', name_ru: 'Кодру', ascii_name: 'Codru', district_ru: 'мун. Кишинёв', type: 'town', lat: 46.9752, lng: 28.8191 },
  { id: 'durlesti', cuatm_code: '0103000', name_ru: 'Дурлешты', ascii_name: 'Durlesti', district_ru: 'мун. Кишинёв', type: 'town', lat: 47.0206, lng: 28.7586 },
  { id: 'singera', cuatm_code: '0104000', name_ru: 'Сынжера', ascii_name: 'Singera', district_ru: 'мун. Кишинёв', type: 'town', lat: 46.9131, lng: 28.9672 },
  { id: 'vadul-lui-voda', cuatm_code: '0105000', name_ru: 'Вадул-луй-Водэ', ascii_name: 'Vadul lui Voda', district_ru: 'мун. Кишинёв', type: 'town', lat: 47.0917, lng: 29.0756 },
  { id: 'vatra', cuatm_code: '0106000', name_ru: 'Ватра', ascii_name: 'Vatra', district_ru: 'мун. Кишинёв', type: 'town', lat: 47.0732, lng: 28.7355 },
  { id: 'stauceni', cuatm_code: '0107000', name_ru: 'Ставчены', ascii_name: 'Stauceni', district_ru: 'мун. Кишинёв', type: 'commune', lat: 47.0964, lng: 28.8701 },
  { id: 'truseni', cuatm_code: '0108000', name_ru: 'Трушены', ascii_name: 'Truseni', district_ru: 'мун. Кишинёв', type: 'commune', lat: 47.0552, lng: 28.6701 },
  { id: 'gratiesti', cuatm_code: '0109000', name_ru: 'Гратиешты', ascii_name: 'Gratiesti', district_ru: 'мун. Кишинёв', type: 'commune', lat: 47.0994, lng: 28.8178 },
  { id: 'bacioi', cuatm_code: '0110000', name_ru: 'Бачой', ascii_name: 'Bacioi', district_ru: 'мун. Кишинёв', type: 'commune', lat: 46.9129, lng: 28.8672 },
  { id: 'ciorescu', cuatm_code: '0111000', name_ru: 'Чореску', ascii_name: 'Ciorescu', district_ru: 'мун. Кишинёв', type: 'commune', lat: 47.1306, lng: 28.8883 },
  { id: 'bubuieci', cuatm_code: '0112000', name_ru: 'Бубуечь', ascii_name: 'Bubuieci', district_ru: 'мун. Кишинёв', type: 'commune', lat: 47.0046, lng: 28.9858 },
];

type MoldovaLocationApiItem = {
  id: number;
  cuatm_code?: string | null;
  name: string;
  name_ru: string;
  ascii_name?: string | null;
  district?: string | null;
  district_ru?: string | null;
  type: string;
  lat?: number | null;
  lng?: number | null;
};

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[ă]/g, 'a')
    .replace(/[îâ]/g, 'i')
    .trim();

function mapApiItem(item: MoldovaLocationApiItem): MoldovaLocation {
  return {
    id: item.id,
    cuatm_code: item.cuatm_code,
    name_ru: item.name_ru,
    ascii_name: item.ascii_name || item.name_ru,
    district_ru: item.district_ru || item.district || '',
    type: (item.type as MoldovaLocationType) || 'city',
    lat: item.lat,
    lng: item.lng,
  };
}

function getLocationsApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/treabo';
  }

  return getTreaboApiBase();
}

export function getMoldovaLocationById(id?: string | number | null) {
  if (id == null || id === '') {
    return moldovaLocations[0];
  }

  const byId = moldovaLocations.find((location) => String(location.id) === String(id));
  if (byId) return byId;

  const byCuatm = moldovaLocations.find((location) => location.cuatm_code === String(id));
  return byCuatm || moldovaLocations[0];
}

export function getLocationDisplayName(location: MoldovaLocation, _locale?: string) {
  return location.name_ru;
}

export function toStoredTreaboLocation(location: MoldovaLocation): StoredTreaboLocation {
  return {
    id: location.id,
    cuatm_code: location.cuatm_code,
    name_ru: location.name_ru,
    lat: location.lat,
    lng: location.lng,
  };
}

export function readStoredTreaboLocation(): MoldovaLocation {
  if (typeof window === 'undefined') {
    return getMoldovaLocationById(DEFAULT_MOLDOVA_LOCATION_ID);
  }

  try {
    const raw = window.localStorage.getItem(TREABO_LOCATION_STORAGE_KEY);
    if (!raw) {
      return getMoldovaLocationById(DEFAULT_MOLDOVA_LOCATION_ID);
    }

    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw) as StoredTreaboLocation;
      const fallback = getMoldovaLocationById(parsed.id);
      return {
        ...fallback,
        ...parsed,
        id: parsed.id ?? fallback.id,
        name_ru: parsed.name_ru || fallback.name_ru,
      };
    }

    return getMoldovaLocationById(raw);
  } catch {
    return getMoldovaLocationById(DEFAULT_MOLDOVA_LOCATION_ID);
  }
}

export function searchMoldovaLocations(query: string, limit = 12) {
  const needle = normalizeSearch(query);

  if (!needle) {
    return moldovaLocations.slice(0, limit);
  }

  return moldovaLocations
    .filter((location) => {
      const haystack = [
        location.name_ru,
        location.ascii_name,
        location.district_ru,
        ...(location.aliases || []),
      ].map(normalizeSearch);

      return haystack.some((value) => value.includes(needle));
    })
    .slice(0, limit);
}

export async function searchMoldovaLocationsRemote(
  query: string,
  options?: { limit?: number; locale?: string },
): Promise<MoldovaLocation[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  params.set('limit', String(options?.limit ?? 12));

  const response = await fetch(`${getLocationsApiBase()}/locations/moldova/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Locations API unavailable');
  }

  const payload = (await response.json()) as { success?: boolean; data?: MoldovaLocationApiItem[] };
  if (!payload?.data?.length) {
    return searchMoldovaLocations(query, options?.limit ?? 12);
  }

  return payload.data.map(mapApiItem);
}

export async function searchMoldovaLocationsWithFallback(
  query: string,
  options?: { limit?: number; locale?: string },
): Promise<MoldovaLocation[]> {
  try {
    return await searchMoldovaLocationsRemote(query, options);
  } catch {
    return searchMoldovaLocations(query, options?.limit ?? 12);
  }
}
