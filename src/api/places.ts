import { HttpClient } from '@/data/client/http-client';

export async function getPlaces(params?: any) {
  return HttpClient.get('/places', params);
}

export async function getPlace(id: string) {
  return HttpClient.get(`/places/${id}`);
}

export async function createPlace(formData: FormData) {
  return HttpClient.post('/places', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function updatePlace(id: string, formData: FormData) {
  return HttpClient.post(`/places/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deletePlace(id: string) {
  return HttpClient.delete(`/places/${id}`);
}