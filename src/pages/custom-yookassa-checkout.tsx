import React, { useState } from 'react';
import YooKassaPaymentBlock from '@/components/payment/yookassa/yookassa-payment-block';

export default function CustomYooKassaCheckout() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/custom-yookassa-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          email, 
          amount: parseFloat(amount),
          payment_gateway: 'yookassa'
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.confirmation_token) {
        setConfirmationToken(data.confirmation_token);
      } else {
        setError(data.message || 'Не удалось создать платёж');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    alert('Платёж успешно выполнен!');
    // Здесь можно добавить редирект или другую логику
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (confirmationToken) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
        <h2 className="text-2xl font-bold mb-6 text-center">Оплата через ЮKassa</h2>
        <YooKassaPaymentBlock
          confirmationToken={confirmationToken}
          onSuccess={handleSuccess}
          onError={handleError}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => setConfirmationToken(null)}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            ← Вернуться к форме
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 className="text-2xl font-bold mb-6 text-center">Оплата через ЮKassa</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя
          </label>
          <input
            type="text"
            placeholder="Введите ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Телефон
          </label>
          <input
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail для чека
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сумма (₽)
          </label>
          <input
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#00D4AA] hover:bg-[#00B894] disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
        >
          {loading ? 'Создание платежа...' : 'Создать платёж через ЮKassa'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Платежи обрабатываются через ЮKassa</p>
        <p>Безопасно и надёжно</p>
      </div>
    </div>
  );
}

