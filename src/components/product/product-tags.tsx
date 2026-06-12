import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import AnchorLink from '@/components/ui/links/anchor-link';
import routes from '@/config/routes';
import type { Tag } from '@/types';

interface ProductTagsProps {
  tags?: Tag[];
  className?: string;
}

export default function ProductTags({ 
  tags, 
  className = '' 
}: ProductTagsProps) {
  const { t } = useTranslation('common');

  // Отладка
  console.log('[ProductTags] Tags received:', tags);

  if (!tags || tags.length === 0) {
    console.log('[ProductTags] No tags, returning null');
    return null;
  }

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
        {t('text-tags')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <AnchorLink
            key={tag.id}
            href={routes.tagUrl(tag.slug)}
            className="inline-flex items-center justify-center rounded border border-light-600 px-3 py-1.5 text-sm font-medium text-light-base transition-all hover:bg-light-200 hover:text-dark-300 dark:border-dark-500 dark:text-light-600 dark:hover:bg-dark-400 hover:dark:text-light"
          >
            {tag.name}
          </AnchorLink>
        ))}
      </div>
    </motion.div>
  );
}

