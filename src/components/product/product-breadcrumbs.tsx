import { useTranslation } from 'next-i18next';
import { ChevronRight } from '@/components/icons/chevron-right';
import AnchorLink from '@/components/ui/links/anchor-link';
import routes from '@/config/routes';
import type { Product, Category } from '@/types';
import { useMemo } from 'react';

interface ProductBreadcrumbsProps {
  product: Product;
  className?: string;
}

// Функция для построения пути категорий от корня до текущей
function buildCategoryPath(category: Category | null | undefined): Category[] {
  if (!category) return [];
  
  const path: Category[] = [];
  let current: Category | null | undefined = category;
  const visited = new Set<string | number>(); // Защита от циклических ссылок
  
  // Собираем путь от текущей категории к корню
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    
    // Получаем родительскую категорию
    let parent: Category | null | undefined = null;
    
    if (current.parent) {
      if (typeof current.parent === 'object') {
        // Если parent это объект Category
        if ('id' in current.parent && 'name' in current.parent) {
          parent = current.parent as Category;
        } else if ('id' in current.parent) {
          // Если только id, не можем продолжить
          break;
        }
      } else {
        // Если parent это просто id (string или number), не можем продолжить без загрузки
        break;
      }
    } else if (current.parent_id) {
      // Если есть parent_id, но нет parent объекта, не можем продолжить
      break;
    }
    
    current = parent;
  }
  
  return path;
}

export default function ProductBreadcrumbs({ 
  product, 
  className = '' 
}: ProductBreadcrumbsProps) {
  const { t } = useTranslation('common');
  
  // Получаем первую категорию товара (или можно использовать основную)
  const productCategory = useMemo(() => {
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      return product.categories[0];
    }
    return null;
  }, [product.categories]);
  
  // Строим путь категорий
  const categoryPath = useMemo(() => {
    return buildCategoryPath(productCategory);
  }, [productCategory]);
  
  // Формируем хлебные крошки
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ name: string; href: string; isCurrent?: boolean }> = [
      {
        name: t('text-home'),
        href: routes.home,
      },
    ];
    
    // Добавляем путь категорий
    if (categoryPath.length > 0) {
      categoryPath.forEach((category) => {
        items.push({
          name: category.name,
          href: routes.categoryUrl(category.slug),
        });
      });
    } else {
      // Если нет категорий, показываем общий раздел товаров
      items.push({
        name: t('text-products'),
        href: routes.products,
      });
    }
    
    // Добавляем название товара как текущий элемент
    items.push({
      name: product.name,
      href: routes.productUrl((product as any)?.url?.replace(/^\/element\//, '') || (product as any)?.canonical_url?.replace(/^https?:\/\/[^\/]+\/element\//, '') || product.slug, product.id),
      isCurrent: true,
    });
    
    return items;
  }, [categoryPath, product.name, product.slug, t]);
  
  return (
    <div 
      className={`w-full max-w-full min-w-0 overflow-x-auto scrollbar-hide hidden sm:block ${className}`} 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap min-w-max">
        {breadcrumbItems.map((item, index) => {
          return (
            <div key={index} className="flex items-center flex-shrink-0 gap-1.5 sm:gap-2">
              {/* Разделитель - только на десктопе */}
              {index > 0 && (
                <ChevronRight className="hidden sm:block mx-2 h-4 w-4 text-light-600 dark:text-dark-600 flex-shrink-0" />
              )}
              
              {/* Мобильная версия: плашка */}
              {item.isCurrent ? (
                <span className="px-2.5 sm:px-0 py-1.5 sm:py-0 h-7 sm:h-auto bg-brand sm:bg-transparent rounded-full sm:rounded-none text-dark-900 sm:text-dark-900 dark:sm:text-dark-900 font-semibold sm:font-medium flex items-center justify-center flex-shrink-0 text-xs sm:text-sm touch-manipulation">
                  {item.name}
                </span>
              ) : (
                <AnchorLink
                  href={item.href}
                  className="px-2.5 sm:px-0 py-1.5 sm:py-0 h-7 sm:h-auto bg-gray-100 dark:bg-dark-300 sm:bg-transparent hover:bg-gray-200 dark:hover:bg-dark-400 sm:hover:bg-transparent rounded-full sm:rounded-none text-light-600 dark:text-dark-600 sm:text-light-600 hover:text-brand dark:hover:text-brand sm:hover:text-brand transition-all duration-150 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-medium sm:font-normal touch-manipulation"
                >
                  {item.name}
                </AnchorLink>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
} 