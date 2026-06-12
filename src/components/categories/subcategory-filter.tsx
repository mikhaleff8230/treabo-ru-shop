import { useRouter } from 'next/router';
import cn from 'classnames';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { ChevronRight } from '@/components/icons/chevron-right';
import { useScrollableSlider } from '@/lib/hooks/use-scrollable-slider';
import { useTranslation } from 'next-i18next';
import type { Category } from '@/types';

interface SubcategoryItemProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}

function SubcategoryItem({ category, isActive, onClick }: SubcategoryItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-[30px] shrink-0 !rounded-full border py-1.5 px-3.5 text-xs font-medium outline-none',
        {
          'border-dark-100 bg-dark-100 text-light-100 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 dark:border-light dark:bg-light dark:text-dark-100':
            isActive,
          'border-light-500 bg-light-400 text-dark-100 hover:bg-light-500 dark:border-dark-500 dark:bg-dark-400 dark:text-light-100 hover:dark:bg-dark-500 hover:dark:text-light':
            !isActive,
        }
      )}
    >
      {category.name}
    </button>
  );
}

interface SubcategoryFilterProps {
  subcategories: Category[];
  currentCategorySlug?: string;
}

export default function SubcategoryFilter({ 
  subcategories, 
  currentCategorySlug 
}: SubcategoryFilterProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  
  const {
    sliderEl,
    sliderPrevBtn,
    sliderNextBtn,
    scrollToTheRight,
    scrollToTheLeft,
  } = useScrollableSlider();

  function handleClick(categorySlug: string) {
    router.push(`/categories/${categorySlug}`);
  }

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Строка подкатегорий */}
      <div className="app-category-filter-bar relative flex min-h-[64px] w-full overflow-hidden border-b border-light-400 bg-light-100 px-4 py-4 dark:border-dark-300 dark:bg-dark-100 sm:min-h-[70px] sm:px-5 sm:py-5 md:px-6 lg:px-7 3xl:px-8">
        <button
          title={t('text-prev')}
          ref={sliderPrevBtn}
          onClick={() => scrollToTheLeft()}
          className="invisible absolute top-1/2 left-2 z-[1] -mt-3 flex h-6 w-6 items-center justify-start rounded-full text-dark-800 opacity-0 before:pointer-events-none before:absolute before:-top-2 before:left-1 before:-z-[1] before:block before:h-9 before:w-9 before:bg-gradient-to-r before:from-light-100 before:via-light-100 before:content-[''] hover:text-dark focus:text-dark dark:before:from-dark-100 dark:before:via-dark-100 dark:hover:text-light dark:focus:text-light sm:left-3 md:left-4 lg:left-6"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        
        <div className="-mb-4 flex items-start w-full min-w-0">
          <div
            className="-mb-7 flex w-full max-w-full min-w-0 gap-3 overflow-x-auto scroll-smooth pb-7 scrollbar-hide"
            ref={sliderEl}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {subcategories.map((subcategory) => (
              <SubcategoryItem
                key={subcategory.id}
                category={subcategory}
                isActive={subcategory.slug === currentCategorySlug}
                onClick={() => handleClick(subcategory.slug)}
              />
            ))}
          </div>
        </div>
        
        <button
          title={t('text-next')}
          ref={sliderNextBtn}
          onClick={() => scrollToTheRight()}
          className="invisible absolute top-1/2 right-2 z-[1] -mt-3 flex h-6 w-6 items-center justify-end rounded-full text-dark-800 opacity-0 after:pointer-events-none after:absolute after:-top-2 after:right-1 after:-z-[1] after:block after:h-9 after:w-9 after:bg-gradient-to-l after:from-light-100 after:via-light-100 after:content-[''] hover:text-dark focus:text-dark dark:after:from-dark-100 dark:after:via-dark-100 dark:hover:text-light dark:focus:text-light sm:right-3 md:right-4 lg:right-6"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}