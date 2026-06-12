import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { Product } from '@/types';

interface ProductAutocompleteProps {
  shopId?: string;
  value: Product | null;
  onChange: (product: Product | null) => void;
  error?: string;
  placeholder?: string;
}

export default function ProductAutocomplete({
  shopId,
  value,
  onChange,
  error,
  placeholder = "Начните вводить название товара..."
}: ProductAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  // Используем новый API endpoint для поиска товаров
  const { data, isLoading, error: queryError } = useQuery(
    [
      'places-search-products',
      search,
      shopId,
      showList
    ],
    () => {
      if (!search.trim()) return Promise.resolve({ data: [] });

      console.log('Searching products with query:', { q: search, limit: 10, shop_id: shopId });
      return client.places.searchProducts({
        q: search,
        limit: 10,
        shop_id: shopId
      });
    },
    {
      enabled: showList && search.trim().length > 0,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );

  const products: Product[] = data?.data || [];

  console.log('ProductAutocomplete state:', {
    search,
    showList,
    isLoading,
    queryError,
    productsCount: products.length,
    enabled: showList && search.trim().length > 0,
    productsData: products.map(p => ({ id: p.id, name: p.name, image: p.image }))
  });

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          className={`flex-1 border rounded px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={placeholder}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
        />
        <a
          href="http://seller.sancan.ru/"
          target="_blank"
          rel="noopener noreferrer"
          className="sm:ml-2 px-3 py-2 bg-brand hover:bg-brand-dark text-white rounded hover:bg-brand-700 transition whitespace-nowrap text-center sm:text-left"
        >
          Добавить товар
        </a>
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      {queryError && <div className="text-xs text-red-500 mt-1">Ошибка поиска: {queryError.message}</div>}
      {showList && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {isLoading && <div className="p-2 text-gray-500">Загрузка...</div>}
          {!isLoading && search.trim().length === 0 && (
            <div className="p-2 text-gray-500">Начните вводить название товара</div>
          )}
          {!isLoading && search.trim().length > 0 && products.length === 0 && (
            <div className="p-2 text-gray-500">Нет товаров</div>
          )}
          {products.map(product => (
            <div
              key={product.id}
              className="p-2 hover:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onMouseDown={() => {
                onChange(product);
                setSearch(product.name);
                setShowList(false);
              }}
            >
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.slug}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}