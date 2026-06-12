import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { StarIcon } from '@/components/icons/star-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShoppingCartIcon } from '@/components/icons/shopping-cart-icon';
import { DownloadIcon } from '@/components/icons/download-icon';
import { isFree } from '@/lib/is-free';
import usePrice from '@/lib/hooks/use-price';
import type { Product } from '@/types';
import AddToCart from '@/components/cart/add-to-cart';
import FreeDownloadButton from '@/components/product/free-download-button';
import FavoriteButton from '@/components/favorite/favorite-button';
import Link from 'next/link';

interface ProductPriceBlockProps {
  product: Product;
  className?: string;
}

export default function ProductPriceBlock({ 
  product, 
  className = '' 
}: ProductPriceBlockProps) {
  const { t } = useTranslation('common');
  const { price, basePrice } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price,
    baseAmount: product.price,
  });
  const isFreeItem = isFree(product?.sale_price ?? product?.price);

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      {/* Название товара */}
      <h1 className="text-2xl font-bold text-dark dark:text-light mb-3">
        {product.name}
      </h1>

      {/* Рейтинг и отзывы - динамический */}
      <div className="flex items-center space-x-2 mb-4">
        {product.ratings && product.ratings > 0 ? (
          <>
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span className="ml-1 text-sm font-medium text-dark dark:text-light">
                {product.ratings.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-light-600 dark:text-dark-600">
              {product.total_reviews > 0 ? (
                `(${product.total_reviews} ${t('text-reviews')})`
              ) : (
                `(${t('text-no-reviews')})`
              )}
            </span>
          </>
        ) : (
          <span className="text-sm text-light-600 dark:text-dark-600">
            {t('text-no-rating')}
          </span>
        )}
      </div>

      {/* Цена */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-dark dark:text-light">
            {isFreeItem ? t('text-free') : price}
          </span>
          {!isFreeItem && basePrice && basePrice !== price && (
            <span className="text-lg text-light-600 dark:text-dark-600 line-through">
              {basePrice}
            </span>
          )}
        </div>
        {!isFreeItem && basePrice && basePrice !== price && (
          <span className="text-sm text-green-600 font-medium">
            -{Math.round(((parseFloat(basePrice.replace(/[^\d.]/g, '')) - parseFloat(price.replace(/[^\d.]/g, ''))) / parseFloat(basePrice.replace(/[^\d.]/g, ''))) * 100)}% {t('text-discount')}
          </span>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {product.is_external ? (
            <Link
              href={product.external_product_url}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base leading-6 tracking-normal"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {product.external_product_button_text || t('text-add-to-cart')}
            </Link>
          ) : !isFreeItem ? (
            <AddToCart
              item={product}
              withPrice={false}
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base leading-6 tracking-normal"
            />
          ) : (
            <FreeDownloadButton
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base leading-6 tracking-normal"
            />
          )}
          {/* Иконка избранного в той же строке справа */}
          <FavoriteButton 
            productId={product.id}
            className="flex items-center justify-center w-12 h-12 text-light-600 dark:text-dark-600 hover:text-brand dark:hover:text-brand transition-colors"
          />
        </div>
      </div>

      {/* Кнопка ссылки на маркетплейс */}
      {product.preview_url && (
        <div className="mt-6 pt-4 border-t border-light-300 dark:border-dark-400">
          {(() => {
            const previewUrl = product.preview_url;
            const previewUrlLower = previewUrl.toLowerCase();
            const isOzon = previewUrlLower.includes('ozon.ru') || previewUrlLower.includes('ozon.com');
            const isWildberries = previewUrlLower.includes('wildberries.ru') || previewUrlLower.includes('wildberries.com');
            
            let platformName = 'Внешний магазин';
            let faviconUrl = '';
            
            if (isOzon) {
              platformName = 'Ozon';
              faviconUrl = 'https://www.ozon.ru/favicon.ico';
            } else if (isWildberries) {
              platformName = 'Wildberries';
              faviconUrl = 'https://www.wildberries.ru/favicon.ico';
            } else {
              try {
                const url = new URL(previewUrl);
                platformName = url.hostname.replace('www.', '');
                faviconUrl = `${url.protocol}//${url.hostname}/favicon.ico`;
              } catch (e) {
                platformName = 'Внешний магазин';
              }
            }
            
            const linkText = `Смотреть на ${platformName}`;
            
            return (
              <Link
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-lg bg-light dark:bg-dark-200 hover:bg-light-200 dark:hover:bg-dark-300 transition-all duration-200 group cursor-pointer border border-transparent hover:border-light-300 dark:hover:border-dark-400"
              >
                {/* Иконка (favicon) */}
                {faviconUrl && (
                  <div className="flex-shrink-0 w-5 h-5 relative">
                    <img
                      src={faviconUrl}
                      alt={platformName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Текст ссылки */}
                <span className="text-sm font-medium text-dark dark:text-light group-hover:text-brand transition-colors">
                  {linkText}
                </span>
              </Link>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
} 