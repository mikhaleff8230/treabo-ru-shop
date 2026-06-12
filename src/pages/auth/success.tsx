import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '@/components/auth/use-auth';
import toast from 'react-hot-toast';
import Layout from '@/layouts/_layout';
import type { NextPageWithLayout } from '@/types';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { getAuthToken } from '@/data/client/token.utils';

const AuthSuccessPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { authorize } = useAuth();
  const queryClient = useQueryClient();
  const { token, yandex_auth, mode } = router.query;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Если есть токен в URL, сохраняем его
    if (token && typeof token === 'string') {
      authorize(token);
      
      // Инвалидируем кэш для useMe, чтобы начать загрузку пользователя
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      
      toast.success(<b>Вы успешно авторизовались через Яндекс!</b>, {
        className: '-mt-10 xs:mt-0',
      });
      
      // Редирект на главную БЕЗ перезагрузки
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else if (yandex_auth === 'success') {
      // Если это успешная авторизация через Яндекс, но токена нет в URL
      // (возможно токен уже в cookie от backend)
      // Загружаем токен из cookie и обновляем атом
      const cookieToken = getAuthToken();
      
      if (cookieToken) {
        authorize(cookieToken);
      }
      
      // Инвалидируем кэш для useMe
      queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
      
      toast.success(<b>Вы успешно авторизовались через Яндекс!</b>, {
        className: '-mt-10 xs:mt-0',
      });
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      // Если нет токена и нет успешной авторизации, редирект на главную
      router.push('/');
    }
  }, [token, yandex_auth, mode, authorize, router, queryClient]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4AA] mx-auto mb-4"></div>
        <p className="text-gray-600">Обработка авторизации...</p>
      </div>
    </div>
  );
};

AuthSuccessPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default AuthSuccessPage;

