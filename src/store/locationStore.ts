import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Region = {
  id: number;
  name: string;
  slug: string;
  type: 'country' | 'region' | 'city' | 'district';
  parent_id?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export const currentRegionAtom = atom<Region | null>(null);
export const currentGeoPointAtom = atom<GeoPoint | null>(null);
export const shopDefaultRegionAtom = atom<Region | null>(null);

export const locationAtom = atom(
  (get) => ({
    currentRegion: get(currentRegionAtom),
    currentGeoPoint: get(currentGeoPointAtom),
    shopDefaultRegion: get(shopDefaultRegionAtom),
  }),
  (get, set, update: Partial<{
    currentRegion: Region | null;
    currentGeoPoint: GeoPoint | null;
    shopDefaultRegion: Region | null;
  }>) => {
    if (update.currentRegion !== undefined) set(currentRegionAtom, update.currentRegion);
    if (update.currentGeoPoint !== undefined) set(currentGeoPointAtom, update.currentGeoPoint);
    if (update.shopDefaultRegion !== undefined) set(shopDefaultRegionAtom, update.shopDefaultRegion);
  }
);

export function useLocationStore() {
  // В будущем можно добавить useAtomValue/useSetAtom
  return {
    currentRegion: currentRegionAtom,
    currentGeoPoint: currentGeoPointAtom,
    shopDefaultRegion: shopDefaultRegionAtom,
  };
}

export const getDefaultMapCenter = (region?: Region | null): [number, number] => {
  if (region?.coordinates?.lat && region?.coordinates?.lng) {
    return [region.coordinates.lat, region.coordinates.lng];
  }
  // Москва по умолчанию
  return [55.7558, 37.6173];
};

export const getUserOrShopRegion = (current?: Region | null, shopDefault?: Region | null): Region | null => {
  return current || shopDefault || null;
};
