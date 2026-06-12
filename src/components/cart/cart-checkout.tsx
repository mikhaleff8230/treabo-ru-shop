import * as React from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import toast from 'react-hot-toast';
import client from '@/data/client';
import usePrice from '@/lib/hooks/use-price';
import Button from '@/components/ui/button';
import { useCart } from '@/components/cart/lib/cart.context';
import {
  calculatePaidTotal,
  calculateTotal,
} from '@/components/cart/lib/cart.utils';
import CartWallet from '@/components/cart/cart-wallet';
import { usePhoneInput } from '@/components/ui/forms/phone-input';
import {
  payableAmountAtom,
  useWalletPointsAtom,
  verifiedTokenAtom,
  checkoutAtom,
} from '@/components/cart/lib/checkout';
import PaymentGrid from '@/components/cart/payment/payment-grid';
import routes from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { PaymentGateway } from '@/types';
import { useSettings } from '@/data/settings';
import { useState, useEffect } from 'react';

interface CartCheckoutProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  clearCart: () => void;
  selectedAddress?: any; // ПВЗ адрес выбранный в верхней форме
  deliveryType: 'pvz' | 'courier';
}

export default function CartCheckout({ name, email, phone, address, note, clearCart, selectedAddress, deliveryType }: CartCheckoutProps) {
  const { settings } = useSettings();
  const router = useRouter();
  const { t } = useTranslation('common');

  const { mutate, isLoading } = useMutation(client.orders.create, {
    onSuccess: (res) => {
      const { tracking_number, payment_gateway, payment_intent } = res;
      if (tracking_number) {
        if (
          [PaymentGateway.FULL_WALLET_PAYMENT].includes(
            payment_gateway as PaymentGateway
          )
        ) {
          return router.push(`${routes.orderUrl(tracking_number)}/payment`);
        }

        if (payment_intent?.payment_intent_info?.is_redirect) {
          return router.push(
            payment_intent?.payment_intent_info?.redirect_url as string
          );
        } else {
          return router.push(`${routes.orderUrl(tracking_number)}/payment`);
        }
      }
    },

    onError: (err: any) => {
      toast.error(<b>{t('text-profile-page-error-toast')}</b>);
    },
  });

  const [{ payment_gateway }] = useAtom(checkoutAtom);
  const [use_wallet_points] = useAtom(useWalletPointsAtom);
  const [payableAmount] = useAtom(payableAmountAtom);
  const [token] = useAtom(verifiedTokenAtom);
  const { items, verifiedResponse } = useCart();

  const available_items = items.filter(
    (item) =>
      !verifiedResponse?.unavailable_products?.includes(item.id.toString())
  );

  // Calculate price
  const { price: tax } = usePrice(
    verifiedResponse && {
      amount: verifiedResponse.total_tax ?? 0,
    }
  );

  const base_amount = calculateTotal(available_items);

  const { price: sub_total } = usePrice(
    verifiedResponse && {
      amount: base_amount,
    }
  );

  const totalPrice = verifiedResponse
    ? calculatePaidTotal(
        {
          totalAmount: base_amount,
          tax: verifiedResponse.total_tax,
          shipping_charge: verifiedResponse.shipping_charge,
        },
        0
      )
    : 0;

  const { price: total } = usePrice(
    verifiedResponse && {
      amount: totalPrice,
    }
  );

  // phone number field
  const { phoneNumber } = usePhoneInput();

  // Состояния для формы
  const [loading, setLoading] = useState(false);
  // selectedCard и saveCard удалены - YooKassa не использует сохраненные карты


  // Создание заказа с поддержкой ПВЗ
  async function createOrder() {
    // Проверяем выбран ли адрес для ПВЗ доставки
    if (deliveryType === 'pvz' && !selectedAddress) {
      toast.error('Выберите пункт выдачи заказов');
      return;
    }

    if (!email || !name || !phone) {
      toast.error('Пожалуйста, заполните все поля!');
      return;
    }

    if (deliveryType === 'courier' && !address) {
      toast.error('Укажите адрес доставки');
      return;
    }

    setLoading(true);
    const amount = calculateTotal(items);

    // Подготавливаем данные адреса доставки
    const shippingAddress = deliveryType === 'pvz' && selectedAddress ? {
      name,
      email,
      phone,
      address: selectedAddress.formatted_address || selectedAddress.address,
      comment: note,
      delivery_type: 'pvz',
      pvz_info: {
        pvz_id: selectedAddress.pvz_id,
        service: selectedAddress.service,
        name: selectedAddress.name,
        city: selectedAddress.city,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        phone: selectedAddress.phone,
        work_time: selectedAddress.work_time,
      }
    } : {
      name,
      email,
      phone,
      address,
      comment: note,
      delivery_type: 'courier',
    };

    const orderPayload: any = {
      amount,
      products: items.map((item: any) => ({
        product_id: item.id,
        order_quantity: item.quantity,
        unit_price: item.price,
      subtotal: item.price * item.quantity,
    })),
    shipping_address: shippingAddress,
    payment_gateway: 'yookassa', // Всегда используем YooKassa
    language: 'ru', // Фиксируем русский язык
  };

    // YooKassa не использует сохраненные карты - убираем эту логику

    try {
      // Всегда используем YooKassa endpoint
      const endpoint = 'https://api.sancan.ru/api/custom-yookassa-order';
      
      console.log('=== CHECKOUT DEBUG ===');
      console.log('Creating order with YooKassa');
      console.log('Endpoint:', endpoint);
      console.log('Payload:', orderPayload);
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      
      console.log('Response status:', res.status);
      
      let data = {};
      const text = await res.text();
      console.log('Response text:', text);
      
      try {
        data = JSON.parse(text);
        console.log('Response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        toast.error('Бэкенд вернул некорректный ответ.');
        setLoading(false);
        return;
      }
      
      // Проверяем статус ответа
      if (!res.ok) {
        console.error('HTTP error:', data);
        toast.error(`Ошибка создания заказа (${res.status}): ${data.message || text}`);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      
      console.log('Processing response:', data);
      console.log('Gateway:', payment_gateway);
      console.log('Has confirmation_token:', !!data.confirmation_token);
      console.log('Has payment_url:', !!data.payment_url);
      
      // Для YooKassa возвращается confirmation_token для виджета
      if (data && data.confirmation_token) {
        console.log('Redirecting to YooKassa widget...');
        // Сохраняем данные для отображения виджета
        localStorage.setItem('yookassa_order', JSON.stringify(data));
        toast.success('Заказ создан! Загружаем форму оплаты...');
        clearCart();
        // Редирект на страницу с виджетом
        setTimeout(() => {
          router.push('/payment/yookassa');
        }, 500);
      } else if (data && data.payment_url) {
        // Для YooKassa может быть возвращена payment_url
        window.location.href = data.payment_url;
      } else {
        toast.success('Заказ создан! Проверьте email.');
        clearCart();
      }
    } catch (err) {
      setLoading(false);
      toast.error('Ошибка соединения с сервером. Проверьте API или работайте в режиме заглушки.');
    }
  }

  return (
    <div className="mt-10 border-t border-light-400 bg-light pt-6 pb-7 dark:border-dark-400 dark:bg-dark-250 sm:bottom-0 sm:mt-12 sm:pt-8 sm:pb-9">
      <div className="mb-6 flex flex-col gap-3 text-dark dark:text-light sm:mb-7">
        <div className="flex justify-between">
          <p>{t('text-subtotal')}</p>
          <strong className="font-semibold">{sub_total}</strong>
        </div>
        <div className="flex justify-between">
          <p>{t('text-tax')}</p>
          <strong className="font-semibold">{tax}</strong>
        </div>
        <div className="mt-4 flex justify-between border-t border-light-400 pt-5 dark:border-dark-400">
          <p>{t('text-total')}</p>
          <strong className="font-semibold">{total}</strong>
        </div>
      </div>

      {verifiedResponse && (
        <CartWallet
          totalPrice={totalPrice}
          walletAmount={verifiedResponse.wallet_amount}
          walletCurrency={verifiedResponse.wallet_currency}
        />
      )}

      {/* {use_wallet_points && !Boolean(payableAmount) ? null : <StripePayment />} */}

      {/* CardSelector удален - YooKassa не использует сохраненные карты */}


      {/* Кнопка оплаты через ЮКассу */}
      <Button
        disabled={loading}
        isLoading={loading}
        onClick={createOrder}
        className="w-full md:h-[50px] md:text-base mt-6 bg-[#00D4AA] hover:bg-[#00C49A] text-white font-bold rounded-xl"
      >
        Оплатить онлайн
      </Button>
    </div>
  );
}
