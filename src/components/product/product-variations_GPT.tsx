import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

interface ProductVariationsProps {
  product: any;
  className?: string;
  onVariantChange?: (variantProduct: any) => void;
}

export default function ProductVariations({
  product,
  className = '',
  onVariantChange,
}: ProductVariationsProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const groupKey = product?.group_key ? String(product.group_key) : null;

  // -----------------------------
  // API QUERY
  // -----------------------------
  const { data: groupProducts = [], isLoading } = useQuery(
    ['product-group', groupKey],
    async () => {
      if (!groupKey) return [];

      const response = await client.products.getByGroupKey(groupKey);

      // Универсальная нормализация
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;

      return [];
    },
    {
      enabled: !!groupKey,
      staleTime: 5 * 60 * 1000,
    }
  );

  // -----------------------------
  // БАЗОВАЯ ПРОВЕРКА
  // -----------------------------
  if (!product?.id || !groupKey) return null;
  if (isLoading) return null;
  if (!groupProducts.length || groupProducts.length < 2) return null;

  // -----------------------------
  // ОБЩИЕ АТРИБУТЫ
  // -----------------------------
  const commonAttributes = useMemo(() => {
    const map: Record<number, Set<string>> = {};

    groupProducts.forEach((p: any) => {
      if (!p.attribute_values) return;

      Object.entries(p.attribute_values).forEach(([key, value]) => {
        const id = Number(key);
        if (!id || !value) return;

        if (!map[id]) map[id] = new Set();
        map[id].add(String(value));
      });
    });

    return Object.entries(map)
      .filter(([_, values]) => values.size > 1)
      .map(([id]) => Number(id));
  }, [groupProducts]);

  if (!commonAttributes.length) return null;

  // -----------------------------
  // ИНИЦИАЛИЗАЦИЯ ВЫБОРА
  // -----------------------------
  useEffect(() => {
    if (!product?.attribute_values) return;

    const init: Record<string, string> = {};
    commonAttributes.forEach(id => {
      const value = product.attribute_values[id];
      if (value) init[id] = String(value);
    });

    setSelectedAttributes(init);
  }, [product, commonAttributes]);

  // -----------------------------
  // АТРИБУТЫ КАТЕГОРИИ
  // -----------------------------
  const { data: categoryAttributes } = useQuery(
    ['category-attributes', product?.categories?.[0]?.id],
    () => client.categories.getAttributes(product.categories[0].id),
    {
      enabled: !!product?.categories?.[0]?.id,
    }
  );

  const getAttributeName = (id: number) => {
    return (
      categoryAttributes?.data?.attributes?.find((a: any) => a.id === id)?.name ||
      `Атрибут ${id}`
    );
  };

  // -----------------------------
  // ДОСТУПНЫЕ ЗНАЧЕНИЯ
  // -----------------------------
  const attributeOptions = useMemo(() => {
    const result: Record<number, string[]> = {};

    commonAttributes.forEach(attrId => {
      const values = new Set<string>();
      groupProducts.forEach(p => {
        const v = p.attribute_values?.[attrId];
        if (v) values.add(String(v));
      });
      result[attrId] = Array.from(values);
    });

    return result;
  }, [groupProducts, commonAttributes]);

  // -----------------------------
  // ПОИСК ВАРИАНТА
  // -----------------------------
  const findVariant = (attrs: Record<string, string>) =>
    groupProducts.find(p =>
      Object.entries(attrs).every(
        ([k, v]) => String(p.attribute_values?.[k]) === v
      )
    );

  const handleSelect = (attrId: number, value: string) => {
    const next = { ...selectedAttributes, [attrId]: value };
    setSelectedAttributes(next);

    const variant = findVariant(next);
    if (variant?.slug) {
      router.push(`/element/${variant.slug}`);
      onVariantChange?.(variant);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <motion.div
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4">Выберите вариант</h3>

      {commonAttributes.map(attrId => (
        <div key={attrId} className="mb-4">
          <div className="mb-2 font-medium">
            {getAttributeName(attrId)}
          </div>

          <div className="flex flex-wrap gap-2">
            {attributeOptions[attrId]?.map(value => {
              const active = selectedAttributes[attrId] === value;

              return (
                <button
                  key={value}
                  onClick={() => handleSelect(attrId, value)}
                  className={`px-4 py-2 rounded border transition ${
                    active
                      ? 'bg-brand text-white border-brand'
                      : 'border-gray-300 hover:border-brand'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
