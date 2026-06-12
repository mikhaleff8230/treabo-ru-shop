import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import YooKassaPaymentBlock from '@/components/payment/yookassa/yookassa-payment-block';
import GeneralLayout from '@/layouts/_general-layout';
import type { NextPageWithLayout } from '@/types';

const YooKassaPaymentPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем данные заказа из localStorage
    const orderData = localStorage.getItem('yookassa_order');
    if (!orderData) {
      setError('Не найдены данные заказа');
      setLoading(false);
      return;
    }

    try {
      const data = JSON.parse(orderData);
      if (data.confirmation_token) {
        setConfirmationToken(data.confirmation_token);
      } else {
        setError('Токен подтверждения не получен');
      }
    } catch (e) {
      setError('Ошибка при обработке данных заказа');
    }

    setLoading(false);
  }, []);

  const handleSuccess = () => {
    // Очищаем localStorage
    localStorage.removeItem('yookassa_order');
    // Редирект на страницу успеха
    router.push('/payment/success');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4AA] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка формы оплаты...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="text-red-600 text-center">
            <div className="mb-2 text-4xl">⚠️</div>
            <div className="font-semibold text-lg mb-2">Ошибка загрузки</div>
            <div className="text-sm mb-4">{error}</div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Вернуться к оплате
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Оплата через ЮKassa
            </h1>
            <p className="text-gray-600">
              Безопасная оплата банковской картой, СБП, ЮMoney
            </p>
          </div>

          {confirmationToken && (
            <YooKassaPaymentBlock
              confirmationToken={confirmationToken}
              returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : '/payment/success'}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/checkout')}
              className="text-gray-500 hover:text-gray-700 underline text-sm"
            >
              ← Вернуться к оформлению заказа
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

YooKassaPaymentPage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

export default YooKassaPaymentPage;

