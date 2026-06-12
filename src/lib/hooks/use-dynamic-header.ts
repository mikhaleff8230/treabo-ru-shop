import { useState, useEffect, useCallback } from 'react';

export interface DynamicHeaderState {
  isCompact: boolean;
  isVisible: boolean;
  scrollDirection: 'up' | 'down' | null;
}

export function useDynamicHeader() {
  // Начальное состояние: хедер всегда видимый при загрузке (только для мобильных)
  const [state, setState] = useState<DynamicHeaderState>(() => {
    // При инициализации проверяем, что мы на мобильном устройстве
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return {
        isCompact: true, // На мобильных всегда компактный
        isVisible: true, // Всегда видимый при загрузке
        scrollDirection: null,
      };
    }
    return {
      isCompact: true,
      isVisible: true,
      scrollDirection: null,
    };
  });
  const [lastScrollY, setLastScrollY] = useState(() => {
    return typeof window !== 'undefined' ? window.scrollY : 0;
  });

  // Функция для обновления состояния хедера на основе текущей позиции скролла
  // Используется только для мобильных устройств
  const updateHeaderState = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 640) {
      // На десктопе не используем динамический хедер
      return;
    }
    
    const currentScrollY = window.scrollY;
    
    // Mobile поведение - всегда компактный и видимый
    setState({
      isCompact: true,
      isVisible: true,
      scrollDirection: null,
    });
    
    setLastScrollY(currentScrollY);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;
      const isScrollingDown = scrollDifference > 0;
      const isScrollingUp = scrollDifference < 0;
      
      // Порог для переключения режимов (50px для плавности)
      const threshold = 50;
      
      // Хук используется только для мобильных устройств (< 640px)
      // Desktop хедер статичный, без динамики
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        // Mobile поведение
        if (currentScrollY < 10) {
          // В самом верху - видимый компактный хедер
          setState({
            isCompact: true,
            isVisible: true,
            scrollDirection: null,
          });
        } else if (isScrollingDown && currentScrollY > 100) {
          // Скролл вниз - оставляем видимым, но компактным
          setState({
            isCompact: true,
            isVisible: true,
            scrollDirection: 'down',
          });
        } else if (isScrollingUp) {
          // Скролл вверх - показываем компактный хедер
          setState({
            isCompact: true,
            isVisible: true,
            scrollDirection: 'up',
          });
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttling для производительности
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    if (typeof window !== 'undefined') {
      // Инициализация при монтировании - сразу обновляем состояние
      updateHeaderState();
      
      // Небольшая задержка для гарантии, что DOM готов
      const initTimeout = setTimeout(() => {
        updateHeaderState();
      }, 0);
      
      // Дополнительная проверка после полной загрузки страницы
      const loadTimeout = setTimeout(() => {
        updateHeaderState();
      }, 100);
      
      window.addEventListener('scroll', throttledHandleScroll, { passive: true });
      
      // Также слушаем событие load для гарантии правильной инициализации
      window.addEventListener('load', updateHeaderState, { once: true });
      
      return () => {
        clearTimeout(initTimeout);
        clearTimeout(loadTimeout);
        window.removeEventListener('scroll', throttledHandleScroll);
        window.removeEventListener('load', updateHeaderState);
      };
    }
  }, [lastScrollY, updateHeaderState]);

  // Эффект для обработки изменения маршрута (SPA навигация)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Функция для обновления хедера при изменении маршрута
    const handleRouteChange = () => {
      // Небольшая задержка для того, чтобы Next.js успел обновить DOM
      setTimeout(() => {
        updateHeaderState();
        // Триггерим событие скролла для пересчета позиции
        const scrollEvent = new Event('scroll', { bubbles: true });
        window.dispatchEvent(scrollEvent);
        // Также вызываем через requestAnimationFrame для гарантии
        requestAnimationFrame(() => {
          window.dispatchEvent(scrollEvent);
        });
      }, 50);
    };

    // Слушаем события изменения маршрута
    // Используем событие popstate для браузерной навигации (назад/вперед)
    window.addEventListener('popstate', handleRouteChange);
    
    // Также слушаем событие для программной навигации через history.pushState
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
    };
  }, [updateHeaderState]);

  return state;
}

