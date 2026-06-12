import { HttpClient } from '@/data/client/http-client';
import { PLACES_ENDPOINTS } from './places.endpoints';

export async function fetchPlacesFeed(params: {
  limit?: number;
  cursor?: string;
}) {
  return HttpClient.get(PLACES_ENDPOINTS.FEED, params);
}

export async function fetchPlacesByHashtag(params: {
  hashtag_slug: string;
  page?: number;
  limit?: number;
}) {
  return HttpClient.get(`${PLACES_ENDPOINTS.HASHTAG}/${params.hashtag_slug}`, {
    page: params.page,
    limit: params.limit,
  });
}

export async function fetchFavoritesPlaces(params: {
  favorited_by: string;
  page?: number;
  limit?: number;
}) {
  return HttpClient.get(PLACES_ENDPOINTS.FAVORITES, params);
}

export async function fetchSimilarPlaces(params: {
  place_id: string;
  limit?: number;
}) {
  return HttpClient.get(PLACES_ENDPOINTS.SIMILAR, params);
}

export async function fetchMyPlaces(params: {
  page?: number;
  limit?: number;
}) {
  return HttpClient.get(PLACES_ENDPOINTS.MY_PLACES, params);
}
