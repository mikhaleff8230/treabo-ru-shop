import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';

export async function fetchPvz(city: string, service: string = 'sdek') {
  const { data } = await axios.get(`${API_BASE_URL}/pvz?service=${service}&city=${encodeURIComponent(city)}`);
  return data;
}

export async function fetchAllPvz(city: string) {
  // Получаем ПВЗ от обеих служб доставки
  try {
    const [sdekData, yandexData] = await Promise.allSettled([
      fetchPvz(city, 'sdek'),
      fetchPvz(city, 'yandex')
    ]);

    const result = [];
    
    if (sdekData.status === 'fulfilled') {
      result.push(...sdekData.value);
    }
    
    if (yandexData.status === 'fulfilled') {
      result.push(...yandexData.value);
    }

    return result;
  } catch (error) {
    console.error('Error fetching PVZ from all services:', error);
    throw error;
  }
} 