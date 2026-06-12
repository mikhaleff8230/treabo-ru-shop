import { atom } from 'jotai';
import {
  checkHasAuthToken,
  getAuthToken,
  removeAuthToken,
  setAuthToken,
} from '@/data/client/token.utils';

// Атом для хранения токена в памяти (реактивный)
// Инициализируем как null, токен загрузится через authTokenAtomWithSync
const authTokenAtomBase = atom<string | null>(null);

// Атом с синхронизацией с cookies (read-write)
export const authTokenAtom = atom(
  // Read: возвращаем токен из атома, если null - проверяем cookie
  (get) => {
    const token = get(authTokenAtomBase);
    if (token) return token;
    // Если токен в памяти null, проверяем cookie
    if (typeof window !== 'undefined') {
      const cookieToken = getAuthToken();
      if (cookieToken) {
        // Возвращаем токен из cookie (атом обновится через setter при следующем изменении)
        return cookieToken;
      }
    }
    return null;
  },
  // Write: сохраняем токен и в атом, и в cookie
  (get, set, newToken: string | null) => {
    if (newToken) {
      // Сохраняем в cookie
      setAuthToken(newToken);
      // Обновляем атом
      set(authTokenAtomBase, newToken);
    } else {
      // Удаляем из cookie
      removeAuthToken();
      // Очищаем атом
      set(authTokenAtomBase, null);
    }
  }
);

// Атом для состояния авторизации (вычисляемый из токена)
// Используем authTokenAtom для чтения токена (с синхронизацией с cookie)
export const isAuthorizedAtom = atom<boolean>((get) => {
  // Читаем токен из синхронизированного атома
  const token = get(authTokenAtom);
  return !!token;
});

// Утилиты для работы с авторизацией (для обратной совместимости)
export const authStore = {
  // Получить токен (из cookie, для использования вне React компонентов)
  getToken: () => {
    return getAuthToken();
  },

  // Установить токен (обновляет cookie, атом обновится через authTokenAtom setter)
  setToken: (token: string) => {
    setAuthToken(token);
    // Примечание: для обновления атома нужно использовать useSetAtom(authTokenAtom)
  },

  // Удалить токен
  removeToken: () => {
    removeAuthToken();
    // Примечание: для обновления атома нужно использовать useSetAtom(authTokenAtom)
  },

  // Проверить наличие токена
  hasToken: () => {
    return checkHasAuthToken();
  },
};
