import { useState, useEffect } from 'react';

// Объявляем глобальный тип для виджета ЮKassa
declare global {
  interface Window {
    YooMoneyCheckoutWidget: any;
  }
}

interface YooKassaPaymentBlockProps {
  confirmationToken?: string;
  returnUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function YooKassaPaymentBlock({ 
  confirmationToken, 
  returnUrl = window.location.origin + '/payment/success',
  onSuccess,
  onError 
}: YooKassaPaymentBlockProps) {
  const [loading, setLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем скрипт виджета ЮKassa
    const script = document.createElement('script');
    script.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    script.onerror = () => setError('Ошибка загрузки виджета ЮKassa');
    document.head.appendChild(script);

    return () => {
      // Очищаем скрипт при размонтировании
      const existingScript = document.querySelector('script[src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (widgetLoaded && confirmationToken) {
      initializeWidget();
    }
  }, [widgetLoaded, confirmationToken]);

  const initializeWidget = () => {
    if (!window.YooMoneyCheckoutWidget || !confirmationToken) {
      setError('Виджет ЮKassa не загружен или отсутствует токен подтверждения');
      return;
    }

    try {
      const checkout = new window.YooMoneyCheckoutWidget({
        confirmation_token: confirmationToken,
        return_url: returnUrl,
        error_callback: function(error: any) {
          console.error('Ошибка виджета ЮKassa:', error);
          setError('Ошибка инициализации платежа: ' + (error.message || 'Неизвестная ошибка'));
          onError?.(error.message || 'Ошибка инициализации платежа');
        }
      });

      checkout.render('yookassa-widget-container')
        .then(() => {
          console.log('Виджет ЮKassa успешно отображен');
        })
        .catch((error: any) => {
          console.error('Ошибка отображения виджета:', error);
          setError('Ошибка отображения платежной формы');
          onError?.('Ошибка отображения платежной формы');
        });
    } catch (error) {
      console.error('Ошибка создания виджета:', error);
      setError('Ошибка создания платежной формы');
      onError?.('Ошибка создания платежной формы');
    }
  };

  const handlePay = async () => {
    if (!confirmationToken) {
      setLoading(true);
      try {
        // Здесь должен быть вызов API для создания заказа и получения confirmation_token
        const res = await fetch('/api/custom-yookassa-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // body: JSON.stringify({ ... }) // Передайте нужные данные заказа
        });
        const data = await res.json();
        
        if (data.confirmation_token) {
          // Виджет автоматически инициализируется с новым токеном
          setError(null);
        } else {
          setError('Ошибка: ' + (data.message || 'Не удалось создать платёж'));
          onError?.(data.message || 'Не удалось создать платёж');
        }
      } catch (err) {
        setError('Ошибка создания платежа');
        onError?.('Ошибка создания платежа');
      } finally {
        setLoading(false);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 border border-red-200 max-w-md mx-auto">
        <div className="text-red-600 text-center">
          <div className="mb-2">⚠️</div>
          <div className="font-semibold">Ошибка платежа</div>
          <div className="text-sm mt-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-light-400 max-w-md mx-auto">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="mr-2">
            <rect width="24" height="24" rx="6" fill="#00D4AA"/>
            <path d="M7 12h10M7 16h10M7 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-base text-[#00D4AA]">ЮKassa</span>
        </div>
        <p className="text-sm text-gray-600">Безопасная оплата банковской картой</p>
      </div>

      {confirmationToken ? (
        <div>
          <div id="yookassa-widget-container" className="min-h-[200px] flex items-center justify-center">
            {!widgetLoaded && (
              <div className="text-gray-500">Загрузка платежной формы...</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-gray-500 mb-4">Для начала оплаты нажмите кнопку ниже</div>
          <button
            className="w-full bg-[#00D4AA] hover:bg-[#00B894] text-white font-medium py-3 px-4 rounded-lg text-sm transition-colors"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Создание платежа...' : 'Создать платёж'}
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Платежи обрабатываются через ЮKassa
      </div>
    </div>
  );
}

