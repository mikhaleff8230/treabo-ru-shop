import { Fragment } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout, Order, Product } from '@/types';
import dayjs from 'dayjs';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/_dashboard';
import Image from '@/components/ui/image';
import { Menu } from '@/components/ui/dropdown';
import { Transition } from '@/components/ui/transition';
import { useOrders } from '@/data/order';
import client from '@/data/client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import CartEmpty from '@/components/cart/cart-empty';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import rangeMap from '@/lib/range-map';
import Button from '@/components/ui/button';
import placeholder from '@/assets/images/placeholders/product.svg';
import { useModalAction } from '@/components/modal-views/context';
import { getReview } from '@/lib/get-reviews';
import { OrderStatus } from '@/types';
import Link from '@/components/ui/link';
import routes from '@/config/routes';
import AnchorLink from '@/components/ui/links/anchor-link';

// Компонент для отображения одного товара в заказе
function OrderProductItem({ product, orderId }: { product: Product; orderId: string }) {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  
  // Получаем название товара
  let productName = product.name || 'Товар';
  
  // Если есть variation_option_id, добавляем название вариации
  if ((product as any).pivot?.variation_option_id) {
    const variation = product.variation_options?.find(
      (vo: any) => vo?.id === (product as any).pivot.variation_option_id
    );
    if (variation?.title) {
      productName = `${productName} - ${variation.title}`;
    }
  }
  
  // Получаем изображение товара
  let productImage: string | null = null;
  if (product.image) {
    if (typeof product.image === 'string') {
      productImage = product.image;
    } else if (product.image?.thumbnail) {
      productImage = product.image.thumbnail;
    } else if (product.image?.original) {
      productImage = product.image.original;
    }
  }
  
  // Если есть variation с изображением, используем его
  if (!productImage && (product as any).pivot?.variation_option_id) {
    const variation = product.variation_options?.find(
      (vo: any) => vo?.id === (product as any).pivot.variation_option_id
    );
    if (variation?.image) {
      if (typeof variation.image === 'string') {
        productImage = variation.image;
      } else if (variation.image?.thumbnail) {
        productImage = variation.image.thumbnail;
      } else if (variation.image?.original) {
        productImage = variation.image.original;
      }
    }
  }

  function openReviewModal() {
    openModal('REVIEW_RATING', {
      product_id: product.id,
      shop_id: product.shop_id,
      name: productName,
      image: productImage,
      my_review: getReview(product.my_review, orderId),
      order_id: orderId,
      ...((product as any).pivot?.variation_option_id && {
        variation_option_id: (product as any).pivot.variation_option_id,
      }),
    });
  }

  return (
    <div className="flex items-start gap-4 border-b border-light-400 py-3 last:border-b-0 dark:border-dark-400 sm:gap-5">
      {product.slug ? (
        <AnchorLink href={routes.productUrl((product as any)?.url?.replace(/^\/element\//, '') || (product as any)?.canonical_url?.replace(/^https?:\/\/[^\/]+\/element\//, '') || product.slug, product.id)}>
          <div className="relative aspect-[5/3.4] w-20 flex-shrink-0 border border-light-300 dark:border-0 sm:w-24 md:w-28">
            <Image
              alt={productName}
              fill
              quality={100}
              src={productImage ?? placeholder}
              className="bg-light-400 object-cover dark:bg-dark-400"
            />
          </div>
        </AnchorLink>
      ) : (
        <div className="relative aspect-[5/3.4] w-20 flex-shrink-0 border border-light-300 dark:border-0 sm:w-24 md:w-28">
          <Image
            alt={productName}
            fill
            quality={100}
            src={productImage ?? placeholder}
            className="bg-light-400 object-cover dark:bg-dark-400"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <h4
          className="font-medium text-dark dark:text-light"
          title={productName}
        >
          {product.slug ? (
            <AnchorLink
              href={routes.productUrl((product as any)?.url?.replace(/^\/element\//, '') || (product as any)?.canonical_url?.replace(/^https?:\/\/[^\/]+\/element\//, '') || product.slug, product.id)}
              className="transition-colors hover:text-brand"
            >
              {productName}
            </AnchorLink>
          ) : (
            <span>{productName}</span>
          )}
        </h4>
      </div>
    </div>
  );
}

// Компонент для отображения группы заказа
function OrderGroup({ order }: { order: Order }) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  
  if (!order || !order.products || order.products.length === 0) {
    return null;
  }

  const orderStatus = order.order_status;
  const orderDate = order.created_at;

  // Проверяем, можно ли отменить заказ
  // Кнопка показывается только если заказ НЕ выполнен (COMPLETED)
  // Если заказ уже выполнен (получен), кнопка не показывается
  const canCancelOrder = orderStatus && 
    orderStatus !== OrderStatus.CANCELLED &&
    orderStatus !== OrderStatus.COMPLETED &&
    orderStatus !== OrderStatus.OUT_FOR_DELIVERY;

  // Мутация для отмены заказа
  const { mutate: cancelOrder, isLoading: isCancelling } = useMutation(
    client.orders.cancel,
    {
      onSuccess: () => {
        toast.success(t('text-order-cancelled') || 'Заказ успешно отменен');
        queryClient.refetchQueries([API_ENDPOINTS.ORDERS]);
      },
      onError: (error: any) => {
        // Логируем ошибку для отладки
        console.error('Ошибка при отмене заказа:', {
          error,
          response: error?.response,
          data: error?.response?.data,
          status: error?.response?.status,
          tracking_number: order.tracking_number,
        });

        // Получаем сообщение об ошибке из ответа сервера
        const errorData = error?.response?.data;
        const errorCode = errorData?.error;
        const statusCode = error?.response?.status;

        let errorMessage = errorData?.message || 
                          error?.message || 
                          t('text-order-cancel-error') || 
                          'Ошибка при отмене заказа';

        // Обрабатываем различные типы ошибок
        if (statusCode === 401) {
          errorMessage = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
          // Не выкидываем из авторизации, просто показываем сообщение
        } else if (statusCode === 403) {
          errorMessage = 'У вас нет прав для отмены этого заказа.';
        } else if (statusCode === 404) {
          errorMessage = 'Заказ не найден.';
        } else if (statusCode === 400) {
          // Ошибка уже содержит правильное сообщение от сервера
          errorMessage = errorData?.message || errorMessage;
        } else if (statusCode === 500) {
          errorMessage = 'Произошла ошибка на сервере. Попробуйте позже.';
        }

        toast.error(errorMessage);
      },
    }
  );

  return (
    <div className="mb-6 rounded-lg border border-light-400 bg-light dark:border-dark-400 dark:bg-dark-300">
      {/* Заголовок заказа */}
      <div className="flex items-center justify-between border-b border-light-400 px-4 py-3 dark:border-dark-400">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-dark dark:text-light">
            Заказ № {order.tracking_number}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dayjs(orderDate).format('DD.MM.YYYY HH:mm')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Menu>
              <Menu.Button className="flex items-center space-x-[3px] font-semibold text-brand hover:text-brand-dark sm:h-10 sm:rounded sm:border sm:border-light-500 sm:bg-transparent sm:py-2 sm:px-3 sm:dark:border-dark-600">
                <span className="inline-flex h-1 w-1 shrink-0 rounded-full bg-dark-700 dark:bg-light-800"></span>
                <span className="inline-flex h-1 w-1 shrink-0 rounded-full bg-dark-700 dark:bg-light-800"></span>
                <span className="inline-flex h-1 w-1 shrink-0 rounded-full bg-dark-700 dark:bg-light-800"></span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 top-full z-30 mt-2 w-48 rounded-md bg-light py-1.5 text-dark shadow-dropdown origin-top-right dark:bg-dark-400 dark:text-light">
                  <Menu.Item>
                    <Link
                      href={`${routes.orderUrl(order.tracking_number)}/payment`}
                      className="transition-fill-colors block w-full px-5 py-2.5 font-medium hover:bg-light-400 ltr:text-left rtl:text-right dark:hover:bg-dark-600"
                    >
                      {t('text-order-details')}
                    </Link>
                  </Menu.Item>
                  {canCancelOrder && (
                    <Menu.Item>
                      <button
                        onClick={() => {
                          if (window.confirm(t('text-confirm-cancel-order') || 'Вы уверены, что хотите отменить этот заказ?')) {
                            cancelOrder(order.tracking_number);
                          }
                        }}
                        disabled={isCancelling}
                        className="transition-fill-colors block w-full px-5 py-2.5 text-left font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {isCancelling ? t('text-cancelling') || 'Отмена...' : (t('text-cancel-order') || 'Отменить заказ')}
                      </button>
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
      
      {/* Список товаров в заказе */}
      <div className="px-4 py-3">
        {order.products.map((product) => (
          <OrderProductItem 
            key={product.id + ((product as any).pivot?.variation_option_id || '')} 
            product={product} 
            orderId={order.id}
          />
        ))}
      </div>
    </div>
  );
}

function OrderItemLoader() {
  return (
    <div className="flex animate-pulse items-start gap-4 border-b border-light-400 py-4 last:border-b-0 dark:border-dark-400 sm:items-stretch sm:gap-5">
      <div className="relative aspect-[5/3.4] w-28 flex-shrink-0 bg-light-400 dark:bg-dark-400 sm:w-32 md:w-36" />
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:gap-0">
        <div className="h-full flex-grow border-b border-light-400 pb-3 dark:border-dark-600 sm:border-b-0 sm:pb-0">
          <div className="mb-3 h-2.5 w-1/4 bg-light-400 dark:bg-dark-400" />
          <div className="mb-6 h-2.5 w-2/4 bg-light-400 dark:bg-dark-400" />
          <div className="h-2.5 w-1/5 bg-light-400 dark:bg-dark-400" />
        </div>
        <div className="h-2.5 w-1/3 bg-light-400 dark:bg-dark-400 sm:h-12 sm:w-1/4 sm:rounded md:w-1/6" />
      </div>
    </div>
  );
}

const LIMIT = 10;
const Purchases: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { orders, isLoading, isLoadingMore, hasNextPage, loadMore, error } =
    useOrders({
      limit: LIMIT,
      orderBy: 'created_at',
      sortedBy: 'desc', // desc = новые сверху, старые внизу
    });

  return (
    <motion.div
      variants={fadeInBottom()}
      className="flex min-h-full flex-grow flex-col"
    >
      <h1 className="mb-3 text-15px font-medium text-dark dark:text-light">
        {t('text-my-purchase-list')}
        {!isLoading && orders.length > 0 && (
          <span className="ml-1 text-light-900">
            ({orders.length})
          </span>
        )}
      </h1>

      {error && (
        <div className="my-4 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium">{t('text-error-loading-orders') || 'Ошибка загрузки заказов'}</p>
          <p className="mt-1 text-sm">{error.message || 'Попробуйте обновить страницу'}</p>
        </div>
      )}

      {isLoading &&
        !orders.length &&
        !error &&
        rangeMap(LIMIT, (i) => <OrderItemLoader key={`order-loader-${i}`} />)}

      {!isLoading && !orders.length && !error ? (
        <CartEmpty
          className="my-auto"
          description={t('text-product-purchase-message')}
        />
      ) : !isLoading && orders.length > 0 ? (
        <>
          {orders.map((order) => (
            <OrderGroup
              key={order.tracking_number}
              order={order}
            />
          ))}
        </>
      ) : null}

      {hasNextPage && (
        <div className="mt-10 grid place-content-center">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            isLoading={isLoadingMore}
          >
            {t('text-loadmore')}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

Purchases.authorization = true;
Purchases.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default Purchases;
