import type { User, Shop } from '@/types';
import useAuth from '@/components/auth/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import client from './client';
import { API_ENDPOINTS } from './client/endpoints';

export function useMe() {
  const { isAuthorized, unauthorize, getToken, isInitialized } = useAuth();
  const queryClient = useQueryClient();

  // Проверяем наличие токена перед запросом
  const token = getToken();
  const hasToken = Boolean(token);

  // КРИТИЧНО: enabled должен быть строго false, если:
  // 1. Токена нет
  // 2. isAuthorized = false (isAuthorized теперь проверяет токен из cookie даже до инициализации)
  // isInitialized больше не нужен, так как isAuthorized уже проверяет cookie напрямую
  const shouldFetch = hasToken && isAuthorized;

  const { data, isLoading, error } = useQuery<User, Error>(
    // Добавляем токен в ключ, чтобы при изменении токена запрос отменялся
    [API_ENDPOINTS.USERS_ME, token],
    client.users.me,
    {
      // КРИТИЧНО: enabled должен быть строго false, если токена нет
      // Это предотвращает запросы даже из кэша
      enabled: shouldFetch,
      retry: false, // Не повторяем запрос при ошибке
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      cacheTime: 10 * 60 * 1000, // 10 минут - кэш хранится
      // ВАЖНО: refetchOnMount, refetchOnWindowFocus, refetchOnReconnect должны быть false
      // если shouldFetch = false, чтобы не делать запросы из кэша
      refetchOnMount: false, // Не делаем refetch при монтировании - используем кэш
      refetchOnWindowFocus: false, // Не делаем refetch при фокусе окна
      refetchOnReconnect: false, // Не делаем refetch при переподключении
      onError: (err: any) => {
        // Игнорируем ошибки отмены (axios.isCancel или Cancel)
        if (axios.isCancel && axios.isCancel(err)) {
          // Запрос был отменен - это нормально, не обрабатываем
          return;
        }
        if (err?.message?.includes('cancelled') || err?.message?.includes('No token')) {
          // Запрос был отменен из-за отсутствия токена - это нормально
          return;
        }
        
        // Если получили 401, обновляем состояние авторизации и очищаем кэш
        if (err?.response?.status === 401) {
          unauthorize();
          // Очищаем кэш запроса, чтобы не было повторных попыток
          queryClient.removeQueries([API_ENDPOINTS.USERS_ME]);
        }
      },
    }
  );

  return {
    me: data,
    isLoading: shouldFetch ? isLoading : false, // Не показываем загрузку, если токена нет
    error,
    isAuthorized: hasToken && isAuthorized,
  };
}

export function useMyShops() {
  const { isAuthorized, getToken } = useAuth();
  const token = getToken();
  const hasToken = Boolean(token);
  
  // КРИТИЧНО: enabled должен быть строго false, если токена нет или пользователь не авторизован
  const shouldFetch = hasToken && isAuthorized;
  
  const { data, isLoading, error } = useQuery<Shop[], Error>(
    [API_ENDPOINTS.MY_SHOPS, token], // Добавляем токен в ключ для правильного кэширования
    client.shops.my,
    {
      enabled: shouldFetch,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false, // НЕ повторяем запрос при ошибке
      onError: (err: any) => {
        // Игнорируем ошибки отмены и отсутствия токена
        if (axios.isCancel && axios.isCancel(err)) {
          return;
        }
        if (err?.cancelled || err?.message?.includes('No token')) {
          return;
        }
        // Для остальных ошибок можно добавить логирование
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMyShops] Error:', err);
        }
      },
    }
  );
  return {
    shops: data || [],
    isLoading: shouldFetch ? isLoading : false, // Не показываем загрузку, если токена нет
    error: shouldFetch ? error : undefined, // Не показываем ошибку, если токена нет
  };
}

export function useLogout() {
  const { unauthorize } = useAuth();
  const queryClient = useQueryClient();
  return useMutation(client.users.logout, {
    onSuccess: () => {
      unauthorize();
      queryClient.resetQueries(API_ENDPOINTS.USERS_ME);
    },
  });
}
