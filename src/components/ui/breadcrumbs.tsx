import Link from 'next/link';
import { ChevronRight } from '@/components/icons/chevron-right';
import { HomeIcon } from '@/components/icons/home-icon';
import { useTranslation } from 'next-i18next';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const { t } = useTranslation('common');

  return (
    <div 
      className={`w-full max-w-full min-w-0 overflow-x-auto scrollbar-hide ${className}`} 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <nav 
        className="flex items-center gap-1.5 sm:gap-1 text-xs sm:text-sm text-gray-500 whitespace-nowrap min-w-max" 
        aria-label="Breadcrumb"
      >
        {/* Мобильная версия: плашка для главной */}
        <Link 
          href="/" 
          className="flex items-center justify-center px-2.5 sm:px-0 py-1.5 sm:py-0 h-7 sm:h-auto bg-gray-100 sm:bg-transparent hover:bg-gray-200 sm:hover:bg-transparent rounded-full sm:rounded-none text-gray-600 sm:text-gray-400 hover:text-gray-700 sm:hover:text-gray-600 transition-all duration-150 flex-shrink-0 touch-manipulation min-w-[32px] sm:min-w-0"
        >
          <HomeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sr-only">{t('text-home')}</span>
        </Link>
        
        {items.map((item, index) => {
          return (
            <div key={index} className="flex items-center flex-shrink-0 gap-1.5 sm:gap-1">
              {/* Разделитель - только на десктопе */}
              <ChevronRight className="hidden sm:block h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
              
              {/* Мобильная версия: плашка */}
              {item.href ? (
                <Link 
                  href={item.href}
                  className="px-2.5 sm:px-0 py-1.5 sm:py-0 h-7 sm:h-auto bg-gray-100 sm:bg-transparent hover:bg-gray-200 sm:hover:bg-transparent rounded-full sm:rounded-none text-gray-600 sm:text-gray-500 hover:text-gray-700 sm:hover:text-gray-700 transition-all duration-150 flex items-center justify-center flex-shrink-0 touch-manipulation text-xs sm:text-sm font-medium sm:font-normal"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="px-2.5 sm:px-0 py-1.5 sm:py-0 h-7 sm:h-auto bg-brand sm:bg-transparent rounded-full sm:rounded-none text-dark-900 sm:text-gray-900 font-semibold sm:font-medium flex items-center justify-center flex-shrink-0 text-xs sm:text-sm">
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}