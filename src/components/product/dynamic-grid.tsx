import { useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { useDynamicProducts } from '@/data/product-dynamic';
import { Product } from '@/types';
import ProductCard from '@/components/product/card';
import ProductCardLoader from '@/components/product/product-loader';
import Button from '@/components/ui/button';
import cn from 'classnames';
import { useViewMode } from '@/components/product/grid-switcher';

interface DynamicGridProps {
  limit?: number;
  showLoadMore?: boolean;
  className?: string;
  filters?: {
    categories?: string;
    tags?: string;
    shop_id?: string;
    price?: string;
    name?: string;
    orderBy?: string;
    sortedBy?: string;
  };
  onProductClick?: (product: Product) => void;
}

export default function DynamicProductGrid({
  limit = 20,
  showLoadMore = true,
  className = '',
  filters = {},
  onProductClick,
}: DynamicGridProps) {
  const { t } = useTranslation('common');
  const { viewMode } = useViewMode();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useRef<HTMLDivElement>(null);

  // Определяем параметры сортировки
  const getSortParams = () => {
    if (filters?.orderBy && filters?.sortedBy) {
      return {
        orderBy: filters.orderBy,
        sortedBy: filters.sortedBy,
      };
    }
    // По умолчанию сортировка по обновлению
    return {
      orderBy: 'updated_at',
      sortedBy: 'desc',
    };
  };

  const { 
    products, 
    paginatorInfo, 
    isLoading, 
    error, 
    hasNextPage, 
    isFetching, 
    isLoadingMore, 
    loadMore 
  } = useDynamicProducts({
    limit,
    ...filters,
    ...getSortParams(),
  });

  // Intersection Observer для автолоада (только на клиенте)
  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (lastProductElementRef.current) {
      observer.current.observe(lastProductElementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasNextPage, isFetching, loadMore, isLoading]);

  // Анимация появления
  const staggerTransition = {
    animate: {
      transition: {
        staggerChildren: 0.025,
      },
    },
  };

  const itemTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-sm mb-4">
            {error?.message || 'Произошла ошибка при загрузке товаров'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="px-6 py-2"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && (!products || products.length === 0)) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <ProductCardLoader uniqueKey="loading-initial" />
          <p className="mt-4 text-sm text-gray-600">Загружаем товары...</p>
        </div>
      </div>
    );
  }

  if ((!products || products.length === 0) && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Товары не найдены</h3>
          <p className="text-sm">
            Попробуйте изменить фильтры или поисковый запрос
          </p>
        </div>
      </div>
    );
  }

  // Определяем классы для grid или list вида
  const gridClasses = viewMode === 'list' 
    ? 'flex flex-col gap-4' // Список - вертикальная колонка
    : 'grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'; // Сетка - 2 колонки на мобильных

  return (
    <div className={cn('w-full px-4 pt-5 pb-9 md:px-6 md:pb-10 md:pt-6 lg:px-7 lg:pb-12 3xl:px-8', className)}>
      <motion.div
        variants={staggerTransition}
        initial="initial"
        animate="animate"
        className={gridClasses}
      >
        {products?.map((product, index) => (
          <motion.div
            key={`${product.id}-${index}`}
            variants={itemTransition}
            ref={index === (products?.length || 0) - 1 ? lastProductElementRef : null}
            onClick={() => onProductClick?.(product)}
            className={cn(
              'cursor-pointer',
              viewMode === 'list' && 'p-4 border border-light-400 dark:border-dark-400 rounded-lg hover:bg-light-50 dark:hover:bg-dark-200 transition-colors'
            )}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {/* Загрузчик */}
      {isLoading && products && products.length > 0 && (
        <div className="flex justify-center py-8">
          <ProductCardLoader uniqueKey="loading-more" />
        </div>
      )}

      {/* Кнопка загрузить еще */}
      {showLoadMore && hasNextPage && !isLoading && (
        <div className="mt-8 grid place-content-center md:mt-10">
          <Button
            onClick={loadMore}
            disabled={isFetching}
            isLoading={isFetching}
            className="px-8 py-3"
          >
            {isFetching ? 'Загружаем...' : t('text-loadmore')}
          </Button>
        </div>
      )}

      {/* Индикатор окончания списка */}
      {!hasNextPage && products && products.length > 0 && (
        <div className="text-center py-8 text-light-base dark:text-dark-base text-sm">
          Все товары загружены
        </div>
      )}

      {/* Информация о загруженных товарах */}
      {paginatorInfo && (
        <div className="text-center py-4 text-sm text-gray-500">
          Показано {products?.length || 0} из {paginatorInfo.total} товаров
        </div>
      )}
    </div>
  );
}