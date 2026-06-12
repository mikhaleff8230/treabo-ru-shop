import type { SearchParamOptions } from '@/types';
import axios, { CancelTokenSource } from 'axios';
import { getAuthToken, removeAuthToken } from './token.utils';

// Разумный таймаут для API запросов
const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.treabo.md',
  timeout: 30000, // 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================
// Request interceptor - добавляет токен в headers
// =========================================
Axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    // ВАЖНО: Если данные - это FormData, НЕ устанавливаем Content-Type
    // Браузер сам установит правильный Content-Type с boundary
    // Если установить вручную, boundary не будет установлен и сервер не сможет распарсить данные
    if (config.data instanceof FormData) {
      // Удаляем Content-Type из headers, чтобы браузер установил его автоматически
      // @ts-ignore
      delete config.headers['Content-Type'];
    }
    
    //@ts-ignore
    config.headers = {
      ...config.headers,
      Authorization: token ? `Bearer ${token}` : '',
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================
// Response interceptor - обрабатывает ошибки БЕЗ перезагрузки
// =========================================
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если запрос был отменен из-за отсутствия токена - тихо отклоняем
    if (error?.cancelled && error?.message === 'No token available') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[http-client] Request blocked (no token):', error.config?.url);
      }
      return Promise.reject(error);
    }
    
    const status = error.response?.status;
    const message = error.response?.data?.message || '';
    const url = error.config?.url || '';

    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    // Пути авторизации, на которых НЕЛЬЗЯ обрабатывать 401
    const authPages = [
      '/auth/success',
      '/auth/yandex',
      '/auth/yandex/callback',
      '/login',
      '/register',
    ];

    const currentPath = window.location.pathname;
    const isAuthFlow = authPages.includes(currentPath);

    // Публичные API endpoints, которые не требуют авторизации
    const publicEndpoints = [
      '/categories',
      '/element',
      '/products',
      '/shops',
      '/tags',
      '/types',
      '/settings',
      '/places',
      // Auth endpoints
      '/token',
      '/register',
      '/forget-password',
      '/verify-forget-password-token',
      '/reset-password',
      '/send-otp-code',
      '/verify-otp-code',
      '/otp-login',
      '/verify-pin-code',
      '/social-login-token',
      // Public data endpoints
      '/reviews',
      '/questions',
      '/feedbacks',
      '/authors',
      '/manufacturers',
      '/popular-products',
      '/top-shops',
      '/top-authors',
      '/top-manufacturers',
    ];
    const isPublicEndpoint = publicEndpoints.some((ep) => url.includes(ep));

    // ------------ НЕ обрабатываем 401 для публичных endpoints ------------
    if (isPublicEndpoint) {
      return Promise.reject(error);
    }

    // ------------ НЕ обрабатываем 401 на страницах авторизации ------------
    if (isAuthFlow) {
      return Promise.reject(error);
    }

    // ------------ Обрабатываем только 401 для защищенных endpoints ------------
    if (status === 401 || message === 'PIXER_ERROR.NOT_AUTHORIZED') {
      // Удаляем токен сразу
      removeAuthToken();
      
      // Создаем специальную ошибку, чтобы React Query не делал повторные запросы
      const cancelError = new Error('Unauthorized - token removed');
      //@ts-ignore
      cancelError.isCanceled = true;
      cancelError.response = error.response;
      cancelError.config = error.config;
      
      return Promise.reject(cancelError);
    }

    // ------------ НЕ ДЕЛАЕМ reload при 403 ------------
    if (status === 403) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export class HttpClient {
  static async get<T>(url: string, params?: unknown) {
    // ✅ Логируем запрос для отладки комментариев
    if (url.includes('/comments')) {
      console.log('HttpClient.get: запрос комментариев', {
        url,
        fullUrl: `${Axios.defaults.baseURL}${url}`,
        params,
      });
    }
    
    const response = await Axios.get<T>(url, { params });
    
    // ✅ Логируем ответ для отладки комментариев
    if (url.includes('/comments')) {
      console.log('HttpClient.get: ответ комментариев', {
        url,
        status: response.status,
        dataType: typeof response.data,
        hasData: response.data && typeof response.data === 'object',
      });
    }
    
    return response.data;
  }

  static async post<T>(url: string, data: unknown, options?: any) {
    // Для загрузки видео увеличиваем таймаут до 5 минут (300 секунд)
    const isVideoUpload = data instanceof FormData && (data.has('video') || url.includes('/places'));
    const timeout = isVideoUpload ? 300000 : (options?.timeout || Axios.defaults.timeout);
    
    const response = await Axios.post<T>(url, data, {
      ...options,
      timeout,
    });
    return response.data;
  }

  static async put<T>(url: string, data: unknown, options?: any) {
    // Для загрузки видео увеличиваем таймаут до 5 минут (300 секунд)
    const isVideoUpload = data instanceof FormData && (data.has('video') || url.includes('/places'));
    const timeout = isVideoUpload ? 300000 : (options?.timeout || Axios.defaults.timeout);
    
    const response = await Axios.put<T>(url, data, {
      ...options,
      timeout,
    });
    return response.data;
  }

  static async delete<T>(url: string) {
    const response = await Axios.delete<T>(url);
    return response.data;
  }

  static formatSearchParams(params: Partial<SearchParamOptions>) {
    return Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .map(([k, v]) =>
        ['type', 'categories', 'tags', 'author', 'manufacturer'].includes(k)
          ? `${k}.slug:${v}`
          : `${k}:${v}`
      )
      .join(';');
  }
}

// Экспорт Axios для прямого использования в API функциях
export default Axios;
