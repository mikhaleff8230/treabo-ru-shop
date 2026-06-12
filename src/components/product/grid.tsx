import type { Product } from '@/types';
import { motion } from 'framer-motion';
import cn from 'classnames';
import Button from '@/components/ui/button';
import Card from '@/components/product/card';
import ProductCardLoader from '@/components/product/product-loader';
import { useGridSwitcher } from '@/components/product/grid-switcher';
import ItemNotFound from '@/components/ui/item-not-found';
import rangeMap from '@/lib/range-map';
import { staggerTransition } from '@/lib/framer-motion/stagger-transition';
import { useTranslation } from 'next-i18next';
import { useDynamicProducts } from '@/data/product-dynamic';

interface GridProps {
  products?: Product[];
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  isLoading?: boolean;
  limit?: number;
  // Новые пропсы для динамического режима
  useDynamic?: boolean;
  filters?: Record<string, any>;
}

export default function Grid({
  products,
  onLoadMore,
  hasNextPage,
  isLoadingMore,
  isLoading,
  limit = 45,
  useDynamic = false,
  filters = {},
}: GridProps) {
  const { isGridCompact } = useGridSwitcher();
  const { t } = useTranslation('common');
  
  // Динамический режим
  const dynamicProducts = useDynamicProducts({
    limit,
    ...filters,
  });

  // Выбираем источник данных
  const finalProducts = useDynamic ? dynamicProducts.products : products;
  const finalIsLoading = useDynamic ? dynamicProducts.isLoading : isLoading;
  const finalLoadMore = useDynamic ? dynamicProducts.loadMore : onLoadMore;
  const finalHasNextPage = useDynamic ? dynamicProducts.hasNextPage : hasNextPage;
  const finalIsLoadingMore = useDynamic ? dynamicProducts.isLoadingMore : isLoadingMore;

  if (!finalIsLoading && !finalProducts?.length) {
    return (
      <ItemNotFound
        title={t('text-no-products-found')}
        message={t('text-no-products-found-message')}
        className="px-4 pt-5 pb-10 md:px-6 md:pt-6 lg:px-7 lg:pb-12 3xl:px-8"
      />
    );
  }
  return (
    <div className="w-full px-4 pt-5 pb-9 md:px-6 md:pb-10 md:pt-6 lg:px-7 lg:pb-12 3xl:px-8">
      <motion.div
        variants={staggerTransition(0.025)}
        className={cn(
          'grid grid-cols-2 gap-5 xs:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] lg:gap-6 3xl:gap-7',
          {
            '2xl:grid-cols-4 3xl:grid-cols-7 4xl:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]':
              isGridCompact,
            '2xl:grid-cols-3 3xl:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] 4xl:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]':
              !isGridCompact,
          }
        )}
      >
        {finalIsLoading && !finalProducts?.length
          ? rangeMap(limit, (i) => (
              <ProductCardLoader key={i} uniqueKey={`product-${i}`} />
            ))
          : finalProducts?.map((product) => (
              <Card key={product.id} product={product} />
            ))}
      </motion.div>

      {finalHasNextPage && (
        <div className="mt-8 grid place-content-center md:mt-10">
          <Button
            onClick={finalLoadMore}
            disabled={finalIsLoadingMore}
            isLoading={finalIsLoadingMore}
          >
            {t('text-loadmore')}
          </Button>
        </div>
      )}
    </div>
  );
}
