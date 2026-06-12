import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { isFree } from '@/lib/is-free';
import type { Product } from '@/types';
import Button from '@/components/ui/button';
import { useCart } from '@/components/cart/lib/cart.context';
import { generateCartItem } from '@/components/cart/lib/generate-cart-item';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';

interface Props {
  product: Product;
}

export default function ProductMobileBuyBar({ product }: Props) {
  const { t } = useTranslation('common');
  const { addItemToCart, updateCartLanguage, language, isInStock } = useCart();
  const [addToCartLoader, setAddToCartLoader] = useState(false);
  const queryClient = useQueryClient();
  const isFreeItem = isFree(product?.sale_price ?? product?.price);

  const { mutate: downloadProduct, isLoading: isDownloading } = useMutation(
    client.products.download,
    {
      onSuccess: (data) => {
        function download(fileUrl: string, fileName: string) {
          var a = document.createElement('a');
          a.href = fileUrl;
          a.setAttribute('download', fileName);
          a.click();
        }
        download(data, product.name);
      },
      onSettled: () => {
        queryClient.invalidateQueries([API_ENDPOINTS.PRODUCTS, product.slug]);
      },
    }
  );

  function handleAddToCart() {
    setAddToCartLoader(true);
    setTimeout(() => {
      setAddToCartLoader(false);
      if (product?.language !== language) {
        updateCartLanguage(product?.language);
      }
      addItemToCart(generateCartItem(product), 1);
      toast.success(<b>{t('text-add-to-cart-message')}</b>);
    }, 650);
  }

  function handleFreeDownload() {
    downloadProduct({ product_id: product.id.toString() });
  }

  const isLoading = addToCartLoader || isDownloading;
  const disabled = isInStock(product?.id);

  return (
    <div className="fixed left-0 right-0 z-40 bottom-[56px] xs:bottom-[72px] sm:bottom-0 lg:hidden border-t border-light-400/20 bg-light-100/50 backdrop-blur-sm dark:border-dark-400/20 dark:bg-dark-200/50">
      <div className="mx-auto max-w-screen-lg px-4 py-3">
        {product.is_external ? (
          <Link
            href={product.external_product_url}
            target="_blank"
            className="flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 font-semibold hover:bg-brand-dark text-base leading-6 tracking-normal"
            style={{ color: '#232323' }}
          >
            В корзину
          </Link>
        ) : !isFreeItem ? (
          <Button
            onClick={handleAddToCart}
            isLoading={isLoading}
            disabled={disabled}
            className="w-full rounded-lg bg-brand px-4 py-3 font-semibold hover:bg-brand-dark text-base leading-6 tracking-normal"
            style={{ color: '#232323' }}
          >
            В корзину
          </Button>
        ) : (
          <Button
            onClick={handleFreeDownload}
            isLoading={isLoading}
            disabled={disabled}
            className="w-full rounded-lg bg-brand px-4 py-3 font-semibold hover:bg-brand-dark text-base leading-6 tracking-normal"
            style={{ color: '#232323' }}
          >
            В корзину
          </Button>
        )}
      </div>
    </div>
  );
}