import Layout from '@/layouts/_layout';
import DynamicProductGrid from '@/components/product/dynamic-grid';
import { TitleSeo } from '@/components/seo/title-seo';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import ProductFilterBar from '@/components/product/product-filter-bar';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps } from 'next';
import type { NextPageWithLayout } from '@/types';
import { useState, useEffect } from 'react';
import { SearchIcon } from '@/components/icons/search-icon';
import Button from '@/components/ui/button';

interface SearchPageProps {
  initialQuery?: string;
}

const SearchPage: NextPageWithLayout<SearchPageProps> = ({ initialQuery = '' }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  // Получаем поисковый запрос из URL
  useEffect(() => {
    const { q } = router.query;
    if (q && typeof q === 'string') {
      setSearchQuery(q);
      setCurrentQuery(q);
    }
  }, [router.query]);

  // Обработка поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`, undefined, { shallow: true });
    }
  };

  // Фильтры для поиска
  const filters = {
    name: currentQuery,
  };

  // Хлебные крошки для поиска
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Поиск', href: '/search' },
    ...(currentQuery ? [{ label: `"${currentQuery}"`, href: `/search?q=${encodeURIComponent(currentQuery)}` }] : []),
  ];

  return (
    <>
      <TitleSeo 
        title={currentQuery ? `Поиск: ${currentQuery}` : 'Поиск товаров'} 
        description={currentQuery ? `Результаты поиска по запросу "${currentQuery}"` : 'Поиск товаров на Sancan'}
      />
      
      {/* Хлебные крошки */}
      <div className="flex flex-col items-start justify-between gap-1.5 px-4 pt-5 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Заголовок и поисковая строка */}
      <div className="flex flex-col items-center justify-between gap-1.5 px-4 pt-5 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <h1 className="text-2xl font-bold text-dark-100 dark:text-light">
          {currentQuery ? `Поиск: "${currentQuery}"` : 'Поиск товаров'}
        </h1>
      </div>


      {/* Панель фильтров товаров */}
      {currentQuery && <ProductFilterBar />}

      {/* Сетка товаров */}
      {currentQuery ? (
        <DynamicProductGrid
          limit={45}
          filters={filters}
          showLoadMore={true}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2 text-gray-500">Введите поисковый запрос</h3>
          <p className="text-sm text-gray-400">
            Используйте поисковую строку выше для поиска товаров
          </p>
        </div>
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query, locale }) => {
  const { q } = query;
  
  return {
    props: {
      initialQuery: (q && typeof q === 'string') ? q : '',
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

SearchPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default SearchPage;
