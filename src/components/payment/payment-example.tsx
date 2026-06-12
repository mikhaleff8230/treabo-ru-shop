import React, { useState } from 'react';
import { useCart } from '@/components/cart/lib/cart.context';
import { PaymentSuccessHandler } from '@/components/payment/payment-success-handler';
import { clearCartOnPaymentSuccess } from '@/lib/utils/cart-utils';

/**
 * Пример компонента, демонстрирующий использование системы очистки корзины
 */
export const PaymentExample: React.FC = () => {
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [orderId, setOrderId] = useState<string>('ORDER-123');
  const { items, resetCart } = useCart();

  // Симуляция успешного платежа
  const simulateSuccessfulPayment = () => {
    setPaymentStatus('payment-success');
    console.log('Симуляция успешного платежа');
  };

  // Симуляция неуспешного платежа
  const simulateFailedPayment = () => {
    setPaymentStatus('payment-failed');
    console.log('Симуляция неуспешного платежа');
  };

  // Ручная очистка корзины
  const manualClearCart = () => {
    resetCart();
    console.log('Корзина очищена вручную');
  };

  // Использование утилиты
  const clearCartWithUtility = () => {
    clearCartOnPaymentSuccess('payment-success', orderId);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Пример системы очистки корзины</h2>
      
      {/* Автоматический обработчик успешных платежей */}
      <PaymentSuccessHandler 
        paymentStatus={paymentStatus}
        orderId={orderId}
        showToast={true}
        onSuccess={() => console.log('Платеж обработан автоматически')}
      />

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Текущий статус платежа:</h3>
          <p className="text-sm text-gray-600">Статус: {paymentStatus}</p>
          <p className="text-sm text-gray-600">Заказ: {orderId}</p>
          <p className="text-sm text-gray-600">Товаров в корзине: {items.length}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Действия:</h3>
          
          <button
            onClick={simulateSuccessfulPayment}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Симулировать успешный платеж
          </button>
          
          <button
            onClick={simulateFailedPayment}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Симулировать неуспешный платеж
          </button>
          
          <button
            onClick={manualClearCart}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Очистить корзину вручную
          </button>
          
          <button
            onClick={clearCartWithUtility}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Очистить корзину через утилиту
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Инструкции:</h4>
          <ol className="text-sm space-y-1">
            <li>1. Нажмите "Симулировать успешный платеж" - корзина очистится автоматически</li>
            <li>2. Нажмите "Симулировать неуспешный платеж" - корзина останется</li>
            <li>3. Используйте ручные кнопки для тестирования</li>
            <li>4. Проверьте консоль браузера для логов</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample; 