import { useEffect, useState } from 'react';
import { useMe } from '@/data/user';
import { useModalAction } from '@/components/modal-views/context';
import { useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';

/**
 * Компонент для автоматического предложения установить PIN-код
 * после первой авторизации или регистрации
 */
export default function PinSetupPrompt() {
  // Временно отключено для отладки
  return null;
  
  /* ВРЕМЕННО ЗАКОММЕНТИРОВАНО
  const { me, isAuthorized } = useMe();
  const { openModal } = useModalAction();
  const queryClient = useQueryClient();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Проверяем только если пользователь авторизован и данные загружены
    if (!isAuthorized || !me || hasChecked || hasShownPrompt) {
      return;
    }

    // Безопасная проверка profile
    try {
      // Проверяем, установлен ли PIN-код
      const hasPinCode = me?.profile?.pin_code;
      
      // Проверяем, не показывали ли мы уже предложение в этой сессии
      const promptShown = typeof window !== 'undefined' ? sessionStorage.getItem('pin_setup_prompt_shown') : null;
      
      if (!hasPinCode && !promptShown) {
        // Небольшая задержка для лучшего UX (после загрузки страницы)
        const timer = setTimeout(() => {
          try {
            openModal('SET_PIN', {
              isFirstTime: true,
              onSuccess: () => {
                queryClient.invalidateQueries([API_ENDPOINTS.USERS_ME]);
                setHasShownPrompt(true);
              },
              onSkip: () => {
                // Сохраняем в sessionStorage, чтобы не показывать снова в этой сессии
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('pin_setup_prompt_shown', 'true');
                }
                setHasShownPrompt(true);
              },
            });
            setHasChecked(true);
          } catch (error) {
            console.error('Error opening PIN setup modal:', error);
            setHasChecked(true);
          }
        }, 2000); // Увеличена задержка до 2 секунд

        return () => clearTimeout(timer);
      }

      setHasChecked(true);
    } catch (error) {
      console.error('Error in PinSetupPrompt:', error);
      setHasChecked(true);
    }
  }, [isAuthorized, me, hasChecked, hasShownPrompt, openModal, queryClient]);
  */

  // return null; // Компонент не рендерит ничего видимого
}

