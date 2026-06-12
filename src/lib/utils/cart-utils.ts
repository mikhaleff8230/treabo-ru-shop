import { CART_KEY } from '@/lib/constants';

/**
 * Очищает корзину из localStorage
 */
export const clearCartFromStorage = (): void => {
  try {
    localStorage.removeItem(CART_KEY);
    console.log('Корзина очищена из localStorage');
  } catch (error) {
    console.error('Ошибка при очистке корзины из localStorage:', error);
  }
};

/**
 * Очищает корзину из sessionStorage
 */
export const clearCartFromSessionStorage = (): void => {
  try {
    sessionStorage.removeItem(CART_KEY);
    console.log('Корзина очищена из sessionStorage');
  } catch (error) {
    console.error('Ошибка при очистке корзины из sessionStorage:', error);
  }
};

/**
 * Очищает корзину из всех хранилищ
 */
export const clearCartFromAllStorage = (): void => {
  clearCartFromStorage();
  clearCartFromSessionStorage();
};

/**
 * Проверяет, нужно ли очистить корзину на основе статуса платежа
 */
export const shouldClearCart = (paymentStatus: string | undefined): boolean => {
  const successStatuses = [
    'payment-success',
    'payment_success',
    'success',
    'completed',
    'paid',
    'succeeded'
  ];
  
  return paymentStatus ? successStatuses.includes(paymentStatus.toLowerCase()) : false;
};

/**
 * Очищает корзину при успешном платеже
 */
export const clearCartOnPaymentSuccess = (
  paymentStatus: string | undefined,
  orderId?: string
): void => {
  if (shouldClearCart(paymentStatus)) {
    clearCartFromAllStorage();
    console.log(`Корзина очищена после успешного платежа${orderId ? ` для заказа ${orderId}` : ''}`);
  }
};

/**
 * Получает данные корзины из localStorage
 */
export const getCartFromStorage = (): any => {
  try {
    const cartData = localStorage.getItem(CART_KEY);
    return cartData ? JSON.parse(cartData) : null;
  } catch (error) {
    console.error('Ошибка при получении корзины из localStorage:', error);
    return null;
  }
};

/**
 * Сохраняет данные корзины в localStorage
 */
export const saveCartToStorage = (cartData: any): void => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  } catch (error) {
    console.error('Ошибка при сохранении корзины в localStorage:', error);
  }
}; 