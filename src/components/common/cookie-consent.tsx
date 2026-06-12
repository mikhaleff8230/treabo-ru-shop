import { useState, useEffect } from 'react';
import cn from 'classnames';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Проверяем, дал ли пользователь согласие ранее
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setIsMounted(true);
        // Показываем окно через небольшую задержку для лучшего UX
        setTimeout(() => setIsVisible(true), 500);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      // Сохраняем согласие в localStorage
      localStorage.setItem('cookieConsent', 'accepted');
      // Добавляем дату принятия для возможного использования в будущем
      localStorage.setItem('cookieConsentDate', new Date().toISOString());
    }
    
    // Плавно скрываем окно
    setIsVisible(false);
    // Убираем компонент из DOM после анимации
    setTimeout(() => setIsMounted(false), 300);
  };

  if (!isMounted) return null;

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[9999] flex items-end justify-center p-4 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Затемнение фона */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleAccept}
        aria-hidden="true"
      />
      {/* Модальное окно */}
      <div 
        className={cn(
          'relative bg-black dark:bg-dark-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transition-all duration-300',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <h3 
          id="cookie-consent-title"
          className="text-white dark:text-light text-xl font-bold mb-4"
        >
          Используем куки и рекомендательные технологии
        </h3>
        <div className="space-y-3 mb-6">
          <p className="text-white dark:text-light text-sm">
            Это чтобы сайт работал лучше.
          </p>
          <p className="text-white dark:text-light text-sm">
            Оставаясь с нами, вы соглашаетесь на использование файлов куки.
          </p>
          <a 
            href="#" 
            className="text-white dark:text-light text-sm underline hover:no-underline block transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Здесь можно добавить логику открытия страницы с информацией о cookies
              console.log('Открыть информацию о рекомендательных технологиях');
            }}
          >
            А ещё можно почитать, что такое рекомендательные технологии
          </a>
        </div>
        <button
          onClick={handleAccept}
          className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 hover:opacity-90"
          style={{ backgroundColor: '#7177f8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5d63e6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#7177f8';
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;

