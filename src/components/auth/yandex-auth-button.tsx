import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import useAuth from './use-auth';
import toast from 'react-hot-toast';

interface YandexAuthButtonProps {
  /**
   * Режим использования:
   * - 'login' - для авторизации (полная авторизация через Яндекс)
   * - 'register' - для регистрации (получение данных для автозаполнения)
   * - 'seller' - для регистрации селлера (получение данных + SMS проверка)
   */
  mode?: 'login' | 'register' | 'seller';
  /**
   * Callback для получения данных пользователя после авторизации
   * Используется для автозаполнения полей в форме регистрации
   */
  onUserDataReceived?: (userData: {
    email: string;
    name: string;
    real_name?: string;
    yandex_id?: string;
    yandex_login?: string;
    avatar?: string;
  }) => void;
  /**
   * Дополнительные CSS классы
   */
  className?: string;
}

/**
 * Компонент кнопки авторизации через Яндекс
 * 
 * Поддерживает три режима:
 * 1. login - полная авторизация для обычных пользователей
 * 2. register - получение данных для автозаполнения формы регистрации
 * 3. seller - получение данных для регистрации селлера (с SMS проверкой)
 */
export default function YandexAuthButton({
  mode = 'login',
  onUserDataReceived,
  className = '',
}: YandexAuthButtonProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { authorize } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработка клика по кнопке Яндекс авторизации
   */
  const handleYandexAuth = () => {
    setIsLoading(true);

    // Сохраняем режим в localStorage для обработки после callback
    localStorage.setItem('yandex_auth_mode', mode);

    // Сохраняем текущий URL для возврата после авторизации
    const currentUrl = window.location.href;
    localStorage.setItem('yandex_redirect_uri', currentUrl);

    // Маршрут /auth/yandex находится в web.php на api.sancan.ru
    // Используем полный URL бэкенда, так как window.location.href не работает с Next.js rewrites
    const backendUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';
    const authUrl = `${backendUrl}/auth/yandex?mode=${mode}&redirect_uri=${encodeURIComponent(currentUrl)}`;

    // Перенаправляем на страницу авторизации Яндекса с параметром режима
    // URL будет обработан на бэкенде и перенаправит на Яндекс
    window.location.href = authUrl;
  };

  /**
   * Получение данных пользователя с бэкенда после callback
   */
  const fetchUserDataFromBackend = async () => {
    try {
      // Запрашиваем данные пользователя с бэкенда
      // Используем полный URL бэкенда
      const backendUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';
      const response = await fetch(`${backendUrl}/auth/yandex/user-data`, {
        method: 'GET',
        credentials: 'include', // Важно для передачи cookies/session
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  /**
   * Проверка callback от Яндекса после авторизации
   * Вызывается только для режимов register/seller (не для login)
   * Для режима login callback обрабатывается на странице /auth/success
   */
  const checkYandexCallback = async () => {
    // Для режима login не обрабатываем callback здесь - это делает страница /auth/success
    if (mode === 'login') {
      setIsLoading(false);
      return;
    }

    // Проверяем, есть ли данные в URL (после callback от Яндекса)
    const urlParams = new URLSearchParams(window.location.search);
    const yandexAuth = urlParams.get('yandex_auth');
    const error = urlParams.get('error');
    const callbackMode = urlParams.get('mode');

    if (error) {
      toast.error(<b>Ошибка авторизации через Яндекс</b>, {
        className: '-mt-10 xs:mt-0',
      });
      // Очищаем URL от параметров ошибки
      window.history.replaceState({}, '', window.location.pathname);
      setIsLoading(false);
      return;
    }

    // Обрабатываем только для режимов register/seller
    if (yandexAuth === 'success' && (mode === 'register' || mode === 'seller')) {
      const savedMode = callbackMode || localStorage.getItem('yandex_auth_mode') || mode;
      localStorage.removeItem('yandex_auth_mode');

      // Режим регистрации - получаем данные для автозаполнения
      const userData = await fetchUserDataFromBackend();
      
      if (userData && onUserDataReceived) {
        onUserDataReceived({
          email: userData.email,
          name: userData.name || userData.real_name,
          real_name: userData.real_name,
          yandex_id: userData.yandex_id,
          yandex_login: userData.yandex_login,
          avatar: userData.avatar,
        });
      }

      // Очищаем URL от параметров
      window.history.replaceState({}, '', window.location.pathname);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  // Проверяем callback при монтировании компонента (только для register/seller)
  useEffect(() => {
    if (typeof window !== 'undefined' && mode !== 'login') {
      checkYandexCallback();
    } else {
      setIsLoading(false);
    }
  }, [mode]);

  return (
    <Button
      type="button"
      onClick={handleYandexAuth}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 bg-[#FC3F1D] hover:bg-[#E02E0C] text-white ${className}`}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Подключение...</span>
        </>
      ) : (
        <>
          {/* Иконка Яндекс */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="currentColor"
            />
            <path
              d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
              fill="currentColor"
            />
          </svg>
          <span>
            {mode === 'login'
              ? 'Войти через Яндекс'
              : mode === 'seller'
              ? 'Заполнить через Яндекс'
              : 'Заполнить через Яндекс'}
          </span>
        </>
      )}
    </Button>
  );
}

