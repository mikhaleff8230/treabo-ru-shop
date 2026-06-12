import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Компонент для синхронизации темы с системной на мобильных устройствах
 * Работает только на мобильных (< 640px)
 */
export default function MobileThemeSync() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    // Проверяем, что это мобильное устройство
    const checkMobile = () => window.innerWidth < 640;
    
    if (!checkMobile()) return;

    // Определяем системную тему
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Функция для установки темы на основе системной
    const updateThemeFromSystem = () => {
      // Проверяем, была ли тема установлена пользователем вручную
      const savedTheme = localStorage.getItem('theme');
      const isUserTheme = savedTheme && savedTheme !== 'system' && savedTheme !== '""' && savedTheme !== '';
      
      // Если пользователь не установил свою тему, используем системную
      if (!isUserTheme) {
        const isDark = mediaQuery.matches;
        const systemTheme = isDark ? 'dark' : 'light';
        // Принудительно устанавливаем тему
        setTheme(systemTheme);
        // Также устанавливаем класс напрямую для немедленного эффекта
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Устанавливаем тему при монтировании (с небольшой задержкой для гарантии)
    const timeoutId = setTimeout(() => {
      updateThemeFromSystem();
    }, 50);

    // Слушаем изменения системной темы
    const handleChange = (e: MediaQueryListEvent) => {
      // Обновляем только если пользователь не установил свою тему
      const currentSavedTheme = localStorage.getItem('theme');
      const isStillUserTheme = currentSavedTheme && currentSavedTheme !== 'system' && currentSavedTheme !== '""' && currentSavedTheme !== '';
      
      if (!isStillUserTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        // Также обновляем класс напрямую
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Подписываемся на изменения
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - для старых браузеров
      mediaQuery.addListener(handleChange);
    }

    return () => {
      clearTimeout(timeoutId);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - для старых браузеров
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [isMounted, setTheme]);

  return null;
}

