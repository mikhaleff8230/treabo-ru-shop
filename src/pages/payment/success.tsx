import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import GeneralLayout from '@/layouts/_general-layout';
import type { NextPageWithLayout } from '@/types';

const PaymentSuccessPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем номер заказа из localStorage или URL
    const orderData = localStorage.getItem('yookassa_order');
    
    if (orderData) {
      try {
        const data = JSON.parse(orderData);
        if (data.order_id) {
          setOrderNumber(data.order_id);
        }
      } catch (e) {
        console.error('Error parsing order data:', e);
      }
    }
    
    // Очищаем localStorage после получения данных
    if (orderData) {
      localStorage.removeItem('yookassa_order');
    }
    
    setLoading(false);
  }, []);

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleViewOrders = () => {
    window.location.href = 'https://sancan.ru/purchases';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4AA] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl w-full mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Иконка успеха */}
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Оплата успешно завершена!
          </h1>

          {/* Описание */}
          <p className="text-lg text-gray-600 mb-6">
            Спасибо за ваш заказ. Мы получили оплату и приступили к его обработке.
          </p>

          {/* Номер заказа */}
          {orderNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 mb-2">Номер заказа:</p>
              <p className="text-2xl font-bold text-green-900">{orderNumber}</p>
            </div>
          )}

          {/* Что дальше */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">Что дальше?</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Мы отправили вам подтверждение на email</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Мы начинаем комплектовать ваш заказ</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Как только заказ будет готов к отправке, мы уведомим вас</span>
              </li>
            </ul>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewOrders}
              className="flex-1 px-6 py-3 bg-[#00D4AA] text-white font-semibold rounded-lg hover:bg-[#00C49A] transition-colors"
            >
              Посмотреть мои заказы
            </button>
            <button
              onClick={handleContinueShopping}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Продолжить покупки
            </button>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Если у вас возникли вопросы, пожалуйста,{' '}
              <a href="/contact" className="text-[#00D4AA] hover:underline">
                свяжитесь с нами
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

PaymentSuccessPage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

export default PaymentSuccessPage;

