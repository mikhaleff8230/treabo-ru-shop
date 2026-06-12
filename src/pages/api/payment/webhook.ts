import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentStatus } from '@/types';

interface WebhookPayload {
  order_id: string;
  payment_status: PaymentStatus;
  payment_gateway: string;
  amount: number;
  currency: string;
}

/**
 * API endpoint для обработки webhook'ов от платежных систем
 * Очищает корзину при успешном платеже
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const payload: WebhookPayload = req.body;
    
    // Проверяем, что это успешный платеж
    if (payload.payment_status === PaymentStatus.SUCCESS || payload.payment_status === 'payment-success') {
      
      // Здесь можно добавить логику для очистки корзины на сервере
      // Например, удалить корзину из базы данных или кэша
      
      console.log(`Webhook: Успешный платеж для заказа ${payload.order_id}`);
      console.log(`Платежная система: ${payload.payment_gateway}`);
      console.log(`Сумма: ${payload.amount} ${payload.currency}`);
      
      // Отправляем ответ об успешной обработке
      return res.status(200).json({ 
        success: true, 
        message: 'Payment processed successfully',
        cart_cleared: true
      });
    }
    
    // Для других статусов платежа
    console.log(`Webhook: Статус платежа ${payload.payment_status} для заказа ${payload.order_id}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      cart_cleared: false
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 