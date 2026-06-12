import { useState, useEffect } from 'react';

export function useScrollHideHeader() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Показываем хедер только если мы в самом верху страницы
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } 
      // Скрываем хедер при скролле вниз (только если прокрутили больше 100px)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      // Не показываем хедер при скролле вверх, если мы не в самом верху
      else if (currentScrollY < lastScrollY && currentScrollY > 10) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
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
    };
  }, [lastScrollY]);

  return isHeaderVisible;
}
