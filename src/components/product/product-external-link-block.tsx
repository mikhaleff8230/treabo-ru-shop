import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import Link from 'next/link';

interface ProductExternalLinkBlockProps {
  product: any;
  className?: string;
}

export default function ProductExternalLinkBlock({ 
  product, 
  className = '' 
}: ProductExternalLinkBlockProps) {
  // Проверяем наличие preview_url
  const previewUrl = product?.preview_url;
  if (!previewUrl) {
    return null;
  }

  // Определяем платформу по URL
  const previewUrlLower = previewUrl.toLowerCase();
  const isOzon = previewUrlLower.includes('ozon.ru') || previewUrlLower.includes('ozon.com');
  const isWildberries = previewUrlLower.includes('wildberries.ru') || previewUrlLower.includes('wildberries.com');
  
  // Определяем данные в зависимости от платформы
  let platformName = 'Внешний магазин';
  let faviconUrl = '';
  
  if (isOzon) {
    platformName = 'Ozon';
    faviconUrl = 'https://www.ozon.ru/favicon.ico';
  } else if (isWildberries) {
    platformName = 'Wildberries';
    faviconUrl = 'https://www.wildberries.ru/favicon.ico';
  } else {
    // Для других платформ пытаемся извлечь домен
    try {
      const url = new URL(previewUrl);
      platformName = url.hostname.replace('www.', '');
      // Пробуем получить favicon с домена
      faviconUrl = `${url.protocol}//${url.hostname}/favicon.ico`;
    } catch (e) {
      // Если не удалось распарсить URL, используем дефолтные значения
      platformName = 'Внешний магазин';
    }
  }
  
  const linkText = `Смотреть на ${platformName}`;

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <Link
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3.5 rounded-lg bg-light dark:bg-dark-200 hover:bg-light-200 dark:hover:bg-dark-300 transition-all duration-200 group cursor-pointer border border-transparent hover:border-light-300 dark:hover:border-dark-400"
      >
        {/* Иконка (favicon) */}
        <div className="flex-shrink-0 w-5 h-5 relative">
          <img
            src={faviconUrl}
            alt={platformName}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback на пустую иконку если favicon не загрузился
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        {/* Текст ссылки */}
        <span className="text-sm font-medium text-dark dark:text-light group-hover:text-brand transition-colors">
          {linkText}
        </span>
      </Link>
    </motion.div>
  );
}

