import { useEffect } from 'react';
import { useCart } from '@/components/cart/lib/cart.context';
import { PaymentStatus } from '@/types';

/**
 * Хук для очистки корзины после успешного платежа
 * @param paymentStatus - статус платежа
 * @param orderId - ID заказа (опционально, для логирования)
 */
export const useCartClearOnPayment = (
  paymentStatus: PaymentStatus | string | undefined,
  orderId?: string
) => {
  const { resetCart } = useCart();

  useEffect(() => {
    if (paymentStatus === PaymentStatus.SUCCESS || paymentStatus === 'payment-success') {
      resetCart();
    }
  }, [paymentStatus, resetCart, orderId]);
};

/**
 * Хук для очистки корзины при успешном платеже через Stripe
 * @param paymentIntentStatus - статус платежного намерения Stripe
 * @param orderId - ID заказа (опционально, для логирования)
 */
export const useCartClearOnStripeSuccess = (
  paymentIntentStatus: string | undefined,
  orderId?: string
) => {
  const { resetCart } = useCart();

  useEffect(() => {
    if (paymentIntentStatus === 'succeeded') {
      resetCart();
    }
  }, [paymentIntentStatus, resetCart, orderId]);
}; 