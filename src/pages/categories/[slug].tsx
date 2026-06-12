import Layout from '@/layouts/_layout';
import DynamicProductGrid from '@/components/product/dynamic-grid';
import { TitleSeo } from '@/components/seo/title-seo';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import SubcategoryFilter from '@/components/categories/subcategory-filter';
import ProductFilterBar from '@/components/product/product-filter-bar';
import { useCategoryBySlug, useCategoryBreadcrumbs } from '@/data/category-hooks';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps } from 'next';
import type { NextPageWithLayout } from '@/types';
import React, { useState } from 'react';

interface CategoryPageProps {
  categorySlug: string;
}

const CategoryPage: NextPageWithLayout<CategoryPageProps> = ({ categorySlug }) => {
  const { t } = useTranslation('common');
  const { category, isLoading: categoryLoading } = useCategoryBySlug(categorySlug);
  const breadcrumbs = useCategoryBreadcrumbs(category);
  const [sortParams, setSortParams] = useState({ orderBy: 'orders_count', sortedBy: 'desc' });
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string[]>>({});

  const filters = {
    categories: categorySlug,
    ...sortParams,
    // Добавляем фильтры по атрибутам
    attribute_values: attributeFilters,
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    console.log('[CategoryPage] Filter change:', filters);
    setAttributeFilters(filters);
  };

  // Логирование фильтров для отладки
  React.useEffect(() => {
    console.log('[CategoryPage] Current filters:', filters);
    console.log('[CategoryPage] Attribute filters:', attributeFilters);
  }, [filters, attributeFilters]);

  // Формируем canonical URL для страницы категории
  const baseUrl = 'https://sancan.ru';
  const canonicalUrl = category 
    ? `${baseUrl}/categories/${category.slug}` 
    : `${baseUrl}/categories/${categorySlug}`;

  if (categoryLoading) {
    return (
      <>
        <TitleSeo 
          title="Загрузка..."
          canonical={canonicalUrl}
        />
        <div className="flex flex-col items-center justify-between gap-1.5 px-4 pt-5 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <TitleSeo 
          title="Категория не найдена"
          canonical={canonicalUrl}
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Категория не найдена</h1>
          <p className="text-gray-600">Запрашиваемая категория не существует или была удалена.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleSeo 
        title={category.name}
        canonical={canonicalUrl}
      />
      
      {/* Хлебные крошки */}
      <div className="flex flex-col items-start justify-between gap-1.5 px-4 pt-5 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Название категории */}
      <div className="flex flex-col items-center justify-between gap-1.5 px-4 pt-5 pb-6 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <h1 className="text-2xl font-bold text-dark-100 dark:text-light">
          {category.name}
        </h1>
      </div>

      {/* Фильтр подкатегорий */}
      {category.children && category.children.length > 0 && (
        <SubcategoryFilter 
          subcategories={category.children} 
          currentCategorySlug={categorySlug}
        />
      )}

      {/* Панель фильтров товаров */}
      <ProductFilterBar 
        categoryId={category?.id ? Number(category.id) : undefined}
        onSortChange={(orderBy, sortedBy) => setSortParams({ orderBy, sortedBy })}
        onFilterChange={handleFilterChange}
      />

      {/* Сетка товаров */}
      <DynamicProductGrid
        limit={45}
        filters={filters}
        showLoadMore={true}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const { slug } = params!;
  const categorySlug = Array.isArray(slug) ? slug[0] : slug;

  return {
    props: {
      categorySlug: categorySlug || '',
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

CategoryPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CategoryPage;