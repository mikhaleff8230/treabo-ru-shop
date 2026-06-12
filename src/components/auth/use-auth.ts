import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { getAuthToken } from '@/data/client/token.utils';
import { authTokenAtom, isAuthorizedAtom } from '@/store/auth-store';

export default function useAuth() {
  // Используем атомы из store
  // authTokenAtom - это authTokenAtomWithSync с синхронизацией
  const [token, setTokenAtom] = useAtom(authTokenAtom);
  const isAuthorized = useAtomValue(isAuthorizedAtom);
  
  // Состояние инициализации - важно для предотвращения запросов до загрузки токена
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация: загружаем токен из cookie при монтировании компонента
  // ВАЖНО: запускаем только один раз при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const cookieToken = getAuthToken();
      // Синхронизируем атом с cookie - это критично для правильной работы
      if (cookieToken) {
        // Если токен в cookie есть, но атом пустой или отличается - синхронизируем
        // Это нужно для того, чтобы атом был синхронизирован с cookie
        setTokenAtom(cookieToken);
      } else {
        // Если токена в cookie нет, очищаем атом
        setTokenAtom(null);
      }
      
      // Помечаем как инициализированное после первой проверки
      setIsInitialized(true);
    }
  }, []); // Запускаем только один раз при монтировании

  return {
    // Получить токен (из атома или cookie)
    getToken: () => {
      return token || getAuthToken();
    },
    
    // Установить токен (обновляет и атом, и cookie через setter)
    setToken: (newToken: string) => {
      setTokenAtom(newToken); // Это обновит и cookie, и атом
    },
    
    // Состояние авторизации - проверяем токен напрямую из cookie, если еще не инициализировано
    // Это важно: если токен есть в cookie, но isInitialized = false, все равно считаем авторизованным
    isAuthorized: isInitialized ? isAuthorized : (!!getAuthToken()),
    
    // Состояние инициализации
    isInitialized,
    
    // Авторизовать (устанавливает токен и обновляет состояние)
    authorize(token: string) {
      setTokenAtom(token); // Это обновит и cookie, и атом
    },
    
    // Выйти (удаляет токен и обновляет состояние)
    unauthorize() {
      setTokenAtom(null); // Это удалит и из cookie, и из атома
    },
  };
}
