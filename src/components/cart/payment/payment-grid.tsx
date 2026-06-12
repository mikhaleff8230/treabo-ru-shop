import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { PaymentGateway } from '@/types';
import { RadioGroup } from '@/components/ui/radio-group';
import { paymentGatewayAtom } from '@/components/cart/lib/checkout';
import PaymentOnline from '@/components/cart/payment/payment-online';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import { useSettings } from '@/data/settings';
import Alert from '@/components/ui/alert';
import { StripeIcon } from '@/components/icons/payment-gateways/stripe';
import { PayPalIcon } from '@/components/icons/payment-gateways/paypal';
import { RazorPayIcon } from '@/components/icons/payment-gateways/razorpay';
import { MollieIcon } from '@/components/icons/payment-gateways/mollie';
import { PayStack } from '@/components/icons/payment-gateways/paystack';
import BitpayIcon from '@/components/icons/payment-gateways/bitpay';
import { PayPalDarkIcon } from '@/components/icons/payment-gateways/paypal-dark';
import BitpayDarkIcon from '@/components/icons/payment-gateways/bitpay-dark';
import { MollieDarkIcon } from '@/components/icons/payment-gateways/mollie-dark';
import { PayStackDark } from '@/components/icons/payment-gateways/paystack-dark';
import { RazorPayDarkIcon } from '@/components/icons/payment-gateways/razorpay-dark';
import { useAtom } from 'jotai';
import CoinbaseIcon from '@/components/icons/payment-gateways/coinbase';


interface PaymentMethodInformation {
  name: string;
  value: PaymentGateway;
  icon: any;
  darkIcon?: any;
  component: React.FunctionComponent;
  width: number;
  height: number;
}

interface PaymentGroupOptionProps {
  payment: PaymentMethodInformation;
  theme?: string;
}

export const PaymentGroupOption: React.FC<PaymentGroupOptionProps> = ({
  payment: { name, darkIcon, value, icon },
  theme,
}) => {
  const { isDarkMode } = useIsDarkMode();
  return (
    <RadioGroup.Option value={value} key={value}>
      {({ checked }) => (
        <div
          className={cn(
            'relative flex h-[5.625rem] w-full cursor-pointer items-center justify-center rounded border bg-light-300 py-3 text-center dark:border-[#3A3A3A] dark:bg-[#303030]',
            checked && 'border-brand dark:border-brand-dark'
            // {
            //   'shadow-600 !border-gray-800 bg-light': theme === 'bw' && checked,
            // }
          )}
        >
          {icon || darkIcon ? (
            isDarkMode ? (
              darkIcon
            ) : (
              icon
            )
          ) : (
            <span className="text-heading text-xs font-semibold">{name}</span>
          )}
        </div>
      )}
    </RadioGroup.Option>
  );
};

const SafePaymentComponent: React.FC = () => (
  <div style={{color: 'red', padding: 16, textAlign: 'center'}}>
    Компонент оплаты не найден или не определён.
  </div>
);

const PaymentGrid: React.FC<{ className?: string; theme?: 'bw' }> = ({
  className,
  theme,
}) => {
  const [gateway, setGateway] = useAtom(paymentGatewayAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation('common');
  const { settings, isLoading } = useSettings();

  const [defaultGateway, setDefaultGateway] = useState(
    settings?.defaultPaymentGateway?.toUpperCase() || ''
  );

  const [availableGateway, setAvailableGateway] = useState(
    settings?.paymentGateway || []
  );

  // FixME
  // @ts-ignore
  const AVAILABLE_PAYMENT_METHODS_MAP: Record<
    PaymentGateway,
    PaymentMethodInformation
  > = {
    STRIPE: {
      name: 'Stripe',
      value: PaymentGateway.STRIPE,
      icon: <StripeIcon />,
      darkIcon: <StripeIcon />,
      component: PaymentOnline,
      width: 40,
      height: 28,
    },
    CASH: {
      name: 'Cash',
      value: PaymentGateway.CASH,
      // icon: <StripeIcon />,
      // darkIcon: <StripeIcon />,
      // component: PaymentOnline,
      width: 40,
      height: 28,
    },
    YOOKASSA: {
      name: 'Yookassa',
      value: PaymentGateway.YOOKASSA,
      icon: (
        <svg width="82" height="21" viewBox="0 0 82 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="82" height="21" rx="4" fill="#00D4AA"/>
          <text x="41" y="14" textAnchor="middle" fontSize="12" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">ЮKassa</text>
        </svg>
      ),
      darkIcon: (
        <svg width="82" height="21" viewBox="0 0 82 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="82" height="21" rx="4" fill="#00D4AA"/>
          <text x="41" y="14" textAnchor="middle" fontSize="12" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">ЮKassa</text>
        </svg>
      ),
      component: PaymentOnline,
      width: 82,
      height: 21,
    },
    INTELLECT_MONEY: {
      name: 'IntellectMoney',
      value: PaymentGateway.INTELLECT_MONEY,
      icon: <PayPalIcon />,
      darkIcon: <PayPalDarkIcon />,
      component: PaymentOnline,
      width: 82,
      height: 21,
    },
    PAYPAL: {
      name: 'Paypal',
      value: PaymentGateway.PAYPAL,
      icon: <PayPalIcon />,
      darkIcon: <PayPalDarkIcon />,
      component: PaymentOnline,
      width: 82,
      height: 21,
    },
    RAZORPAY: {
      name: 'RazorPay',
      value: PaymentGateway.RAZORPAY,
      icon: <RazorPayIcon />,
      darkIcon: <RazorPayDarkIcon />,
      component: PaymentOnline,
      width: 82,
      height: 40,
    },
    MOLLIE: {
      name: 'Mollie',
      value: PaymentGateway.MOLLIE,
      icon: <MollieIcon />,
      darkIcon: <MollieDarkIcon />,
      component: PaymentOnline,
      width: 100,
      height: 52,
    },
    PAYSTACK: {
      name: 'Paystack',
      value: PaymentGateway.PAYSTACK,
      icon: <PayStack />,
      darkIcon: <PayStackDark />,
      component: PaymentOnline,
      width: 100,
      height: 52,
    },
    BITPAY: {
      name: 'Bitpay',
      value: PaymentGateway.BITPAY,
      icon: <BitpayIcon />,
      darkIcon: <BitpayDarkIcon />,
      component: PaymentOnline,
      width: 100,
      height: 52,
    },
    COINBASE: {
      name: 'Coinbase',
      value: PaymentGateway.COINBASE,
      icon: <CoinbaseIcon className="w-32" />,
      darkIcon: <CoinbaseIcon className="w-32" />,
      component: PaymentOnline,
      width: 100,
      height: 52,
    },
    TEST: {
      name: 'Test',
      value: PaymentGateway.TEST,
      icon: <MollieIcon />,
      darkIcon: <MollieDarkIcon />,
      component: PaymentOnline,
      width: 100,
      height: 52,
    },




  };

  useEffect(() => {
    if (settings && availableGateway) {
      setGateway(
        settings?.defaultPaymentGateway?.toUpperCase() as PaymentGateway
      );
    }
  }, [isLoading, defaultGateway, availableGateway]);

  // Безопасный fallback
  const PaymentMethod = AVAILABLE_PAYMENT_METHODS_MAP[gateway?.toUpperCase()] || {
    name: 'Unknown',
    value: gateway,
    icon: null,
    component: SafePaymentComponent,
    width: 40,
    height: 28,
  };
  const Component = PaymentMethod.component || SafePaymentComponent;

  if (!gateway || !AVAILABLE_PAYMENT_METHODS_MAP[gateway?.toUpperCase()]) {
    return (
      <div style={{color: 'red', padding: 16, textAlign: 'center'}}>
        Не выбран или не найден способ оплаты. Проверьте настройки.
      </div>
    );
  }

  let renderedComponent;
  try {
    renderedComponent = typeof Component === 'function' ? <Component /> : <SafePaymentComponent />;
  } catch (error) {
    renderedComponent = <SafePaymentComponent />;
  }

  // Заменяем TINKOFF на YOOKASSA автоматически
  if (gateway === PaymentGateway.TINKOFF) {
    gateway = PaymentGateway.YOOKASSA;
  }
  
  if (gateway === PaymentGateway.YOOKASSA) {
    return (
      <div className="bg-white rounded-xl shadow p-6 border border-light-400">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="mr-2">
              <rect width="24" height="24" rx="6" fill="#00D4AA"/>
              <path d="M7 12h10M7 16h10M7 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-semibold text-base text-[#00D4AA]">ЮKassa - безопасная оплата</span>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Оплата картами Visa, MasterCard, МИР и другими способами
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-[220px]">
            {/* ЮKassa поддерживает сохранённые карты */}
          </div>
          <div className="flex-1 min-w-[220px] border border-light-300 rounded-lg p-4">
            {/* Новая карта */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {errorMessage ? (
        <Alert
          message={t(`common:${errorMessage}`)}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}

      <RadioGroup value={gateway} onChange={setGateway}>
        <RadioGroup.Label className="mb-5 block text-13px font-medium dark:text-white">
          {t('text-choose-payment')}
        </RadioGroup.Label>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {settings?.useEnableGateway &&
            availableGateway &&
            availableGateway.map((gateway: any, index: any) => {
              return (
                <Fragment key={index}>
                  <PaymentGroupOption
                    theme={theme}
                    payment={
                      AVAILABLE_PAYMENT_METHODS_MAP[
                        gateway?.name.toUpperCase() as PaymentGateway
                      ]
                    }
                  />
                </Fragment>
              );
            })}
          {/* {settings?.paymentGateway && (
            <PaymentGroupOption
              theme={theme}
              payment={
                AVAILABLE_PAYMENT_METHODS_MAP[
                  settings?.paymentGateway?.toUpperCase() as PaymentGateway
                ]
              }
            />
          )} */}
        </div>
      </RadioGroup>
      <div className="mb-5">
        {renderedComponent}
      </div>
    </div>
  );
};

export default PaymentGrid;
