import { useState } from 'react';

export default function TinkoffPaymentBlock() {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    // Здесь должен быть вызов API для создания заказа и получения payment_url
    // Например:
    const res = await fetch('/api/custom-tinkoff-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // body: JSON.stringify({ ... }) // Передайте нужные данные заказа
    });
    const data = await res.json();
    setLoading(false);
    if (data.payment_url) {
      window.location.href = data.payment_url;
    } else {
      alert('Ошибка: ' + (data.message || 'Не удалось создать платёж'));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 border border-light-400 max-w-md mx-auto flex flex-col gap-2">
      <div>
        <span className="font-semibold text-base text-[#8B5CF6]">Оплата через Тинькофф</span>
      </div>
      <button
        className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-2 px-2 rounded-lg text-sm transition-colors mt-4"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? 'Создание оплаты...' : 'Перейти к оплате'}
      </button>
    </div>
  );
} 