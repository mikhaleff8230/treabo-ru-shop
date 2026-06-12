import { useSettings } from '@/data/settings';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function formatPrice({
  amount,
  currencyCode,
  locale,
  fractions = 0,
}: {
  amount: number;
  currencyCode: string;
  locale: string;
  fractions?: number;
}) {
  const formatCurrency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: fractions || 0,
    minimumFractionDigits: fractions === 0 ? 0 : undefined,
  });

  return formatCurrency.format(amount);
}

export function formatVariantPrice({
  amount,
  baseAmount,
  currencyCode,
  locale,
  fractions = 0,
}: {
  baseAmount: number;
  amount: number;
  currencyCode: string;
  locale: string;
  fractions?: number;
}) {
  const hasDiscount = baseAmount > amount;
  const formatDiscount = new Intl.NumberFormat(locale, { style: 'percent' });
  const discount = hasDiscount
    ? formatDiscount.format((baseAmount - amount) / baseAmount)
    : null;

  const price = formatPrice({ amount, currencyCode, locale, fractions });
  const basePrice = hasDiscount
    ? formatPrice({ amount: baseAmount, currencyCode, locale, fractions })
    : null;

  return { price, basePrice, discount };
}

export default function usePrice(
  data?: {
    amount: number;
    baseAmount?: number;
    currencyCode?: string;
  } | null
) {
  const { settings } = useSettings();
  const { locale: currentLocale } = useRouter();
  const {
    amount,
    baseAmount,
    currencyCode = settings?.currency ?? 'RUB',
  } = data ?? {};
  
  const fractions = settings?.currencyOptions?.fractions ?? 0;
  
  const value = useMemo(() => {
    if (typeof amount !== 'number' || !currencyCode) return '';
    const locale = currentLocale ?? 'ru';
    return baseAmount
      ? formatVariantPrice({ amount, baseAmount, currencyCode, locale, fractions })
      : formatPrice({ amount, currencyCode, locale, fractions });
  }, [amount, baseAmount, currencyCode, currentLocale, fractions]);
  return typeof value === 'string'
    ? { price: value, basePrice: null, discount: null }
    : value;
}
