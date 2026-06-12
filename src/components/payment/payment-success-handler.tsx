import { useEffect } from 'react';
import { useCart } from '@/components/cart/lib/cart.context';
import { PaymentStatus } from '@/types';
import { useTranslation } from 'next-i18next';
import toast from 'react-hot-toast';

interface PaymentSuccessHandlerProps {
  paymentStatus: PaymentStatus | string | undefined;
  orderId?: string;
  showToast?: boolean;
  onSuccess?: () => void;
}

/**
 * Компонент для обработки успешных платежей
 * Автоматически очищает корзину при успешном платеже
 */
export const PaymentSuccessHandler: React.FC<PaymentSuccessHandlerProps> = ({
  paymentStatus,
  orderId,
  showToast = true,
  onSuccess
}) => {
  const { resetCart } = useCart();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (paymentStatus === PaymentStatus.SUCCESS || paymentStatus === 'payment-success') {
      // Очищаем корзину
      resetCart();
      
      // Показываем уведомление об успехе
      if (showToast) {
        toast.success(t('payment-success'));
      }
      
      // Вызываем дополнительный callback
      if (onSuccess) {
        onSuccess();
      }
      
      console.log(`Корзина очищена после успешного платежа${orderId ? ` для заказа ${orderId}` : ''}`);
    }
  }, [paymentStatus, resetCart, orderId, showToast, onSuccess, t]);

  return null; // Этот компонент не рендерит ничего
};

/**
 * Хук для обработки успешных платежей
 */
export const usePaymentSuccessHandler = (
  paymentStatus: PaymentStatus | string | undefined,
  orderId?: string,
  showToast = true,
  onSuccess?: () => void
) => {
  const { resetCart } = useCart();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (paymentStatus === PaymentStatus.SUCCESS || paymentStatus === 'payment-success') {
      // Очищаем корзину
      resetCart();
      
      // Показываем уведомление об успехе
      if (showToast) {
        toast.success(t('payment-success'));
      }
      
      // Вызываем дополнительный callback
      if (onSuccess) {
        onSuccess();
      }
      
      console.log(`Корзина очищена после успешного платежа${orderId ? ` для заказа ${orderId}` : ''}`);
    }
  }, [paymentStatus, resetCart, orderId, showToast, onSuccess, t]);
}; 