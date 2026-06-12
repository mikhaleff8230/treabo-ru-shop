import { useRelatedProducts } from '@/data/product';
import Card from '@/components/product/card';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';

interface SimilarProductsProps {
  currentProductSlug: string;
  className?: string;
}

export default function SimilarProducts({ 
  currentProductSlug, 
  className = '' 
}: SimilarProductsProps) {
  const { t } = useTranslation('common');
  const { products, isLoading, error } = useRelatedProducts(currentProductSlug, 8);

  if (isLoading) {
    return (
      <div className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}>
        <h2 className="text-xl font-semibold text-dark dark:text-light mb-6">
          {t('text-recommended-also')}
        </h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </div>
    );
  }

  if (error || !products || products.length === 0) {
    return null;
  }

  return (
    <div className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}>
      <h2 className="text-xl font-semibold text-dark dark:text-light mb-6">
        {t('text-recommended-also')}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {products.map((product) => (
          <Card key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 