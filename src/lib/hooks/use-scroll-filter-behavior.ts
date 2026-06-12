import { useState, useEffect } from 'react';

export function useScrollFilterBehavior() {
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Показываем фильтр если мы в самом верху страницы
      if (currentScrollY < 10) {
        setIsFilterVisible(true);
        setIsScrolling(false);
      } 
      // Скрываем фильтр при скролле вниз (только если прокрутили больше 100px)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsFilterVisible(false);
        setIsScrolling(true);
      }
      // При скролле вверх - показываем фильтр (но скрываем во время скролла)
      else if (currentScrollY < lastScrollY && currentScrollY > 10) {
        setIsScrolling(true);
        // Планируем показать фильтр после остановки скролла
      }
      
      setLastScrollY(currentScrollY);

      // Сбрасываем флаг скроллинга через 150ms после остановки
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsScrolling(false);
        // Показываем фильтр после остановки скролла (кроме самого верха)
        if (currentScrollY > 10) {
          setIsFilterVisible(true);
        }
      }, 150);
    };

    // Добавляем слушатель с небольшим throttling для производительности
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

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(scrollTimer);
    };
  }, [lastScrollY]);

  return {
    isFilterVisible,
    isScrolling,
    shouldShowFilter: isFilterVisible && !isScrolling
  };
}
