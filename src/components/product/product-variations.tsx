import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';

interface ProductVariationsProps {
  product: any;
  className?: string;
  onVariantChange?: (variantProduct: any) => void;
}

export default function ProductVariations({ 
  product, 
  className = '',
  onVariantChange
}: ProductVariationsProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // group_key может быть не в деструктуризации product, поэтому берем напрямую
  const groupKey = (product as any)?.group_key ? String((product as any).group_key) : null;

  // Лог для проверки состояния перед запросом
  useEffect(() => {
    console.log('🔵 ProductVariations: состояние перед запросом', {
      hasProduct: !!product,
      productId: product?.id,
      groupKey,
      enabled: !!groupKey && !!product?.id,
    });
  }, [product, groupKey]);

  // ✅ Функция нормализации ответа API
  // Обрабатывает все возможные форматы ответа: массив напрямую или объект с data
  const normalizeProducts = (response: any): any[] => {
    if (Array.isArray(response)) return response;

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ProductVariations] Invalid API response shape:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!(response as any)?.data,
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
        response,
      });
    }
    return [];
  };

  // Загружаем товары группы
  const { data: groupProducts = [], isLoading, error } = useQuery(
    ['product-group', groupKey],
    async () => {
      if (!groupKey) {
        console.log('🔴 useQuery: groupKey отсутствует');
        return [];
      }
      
      console.log('🟡 useQuery: начинаем запрос, groupKey:', groupKey);
      
      try {
        const response = await client.products.getByGroupKey(groupKey);
        
        console.log('🟡 useQuery: response получен:', {
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasData: !!(response as any)?.data,
          dataIsArray: Array.isArray((response as any)?.data),
          dataLength: Array.isArray((response as any)?.data) ? (response as any).data.length : 'not array',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
          fullResponse: response,
        });
        
        // ✅ Нормализуем ответ API
        const products = normalizeProducts(response);
        
        console.log('🟡 useQuery: после normalizeProducts:', {
          productsLength: products.length,
          products: products,
        });
        
        // Фильтруем только товары с нужным group_key
        // Примечание: API уже фильтрует по status=publish на бэкенде
        const filtered = products.filter((p: any) => 
          String(p?.group_key) === String(groupKey)
        );
        
        console.log('🟡 useQuery: после фильтрации:', {
          beforeFilter: products.length,
          afterFilter: filtered.length,
          filteredProducts: filtered.map((p: any) => ({
            id: p?.id,
            group_key: p?.group_key,
            attribute_values: p?.attribute_values,
          })),
        });
        
        return filtered;
      } catch (err: any) {
        console.error('🔴 useQuery: ОШИБКА при запросе:', {
          error: err,
          message: err?.message,
          response: err?.response,
          status: err?.response?.status,
        });
        throw err;
      }
    },
    {
      enabled: !!groupKey && !!product?.id,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
      onError: (err: any) => {
        console.error('🔴 useQuery: onError:', {
          error: err,
          message: err?.message,
          response: err?.response,
        });
      },
    }
  );

  // Лог состояния запроса
  useEffect(() => {
    console.log('🟣 useQuery состояние:', {
      isLoading,
      error: error ? { message: error.message, response: (error as any)?.response } : null,
      groupProductsLength: groupProducts.length,
      groupProductsIsArray: Array.isArray(groupProducts),
    });
  }, [isLoading, error, groupProducts]);

  // Финальный защитный лог для диагностики
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductVariations] [FINAL CHECK]', {
        hasProduct: !!product,
        productId: product?.id,
        groupKey,
        isLoading,
        error: error ? error.message : null,
        groupProductsLength: groupProducts.length,
        groupProductsIsArray: Array.isArray(groupProducts),
        exampleProduct: groupProducts[0] ? {
          id: groupProducts[0].id,
          group_key: groupProducts[0].group_key,
          attribute_values: groupProducts[0].attribute_values,
        } : null,
      });
    }
  }, [groupProducts, isLoading, error, product, groupKey]);

  useEffect(() => {
    console.log('🟢 FINAL PRODUCTS', groupProducts);
  }, [groupProducts]);

  // Проверяем наличие product и group_key ПОСЛЕ хуков
  if (!product?.id || !groupKey) {
    return null;
  }

  // Если загрузка - показываем индикатор
  if (isLoading) {
    return (
      <motion.div 
        variants={fadeInBottom()}
        className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
      >
        <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
          Варианты товара
        </h3>
        <div className="text-sm dark:text-dark-600">Загрузка...</div>
      </motion.div>
    );
  }

  // Если ошибка - не показываем
  if (error) {
    return null;
  }

  // ✅ Упрощенная проверка: groupProducts ВСЕГДА массив (благодаря нормализации)
  if (!groupProducts.length || groupProducts.length < 2) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ProductVariations] Нет товаров в группе или меньше 2 товаров:', {
        length: groupProducts.length,
      });
    }
    return null;
  }

  // Находим общие атрибуты (которые есть у всех товаров)
  const commonAttributes = useMemo(() => {
    console.log('🔵 commonAttributes: начинаем обработку', {
      groupProductsLength: groupProducts.length,
      firstProduct: groupProducts[0] ? {
        id: groupProducts[0].id,
        hasAttributeValues: !!groupProducts[0].attribute_values,
        attributeValuesType: typeof groupProducts[0].attribute_values,
        attributeValues: groupProducts[0].attribute_values,
        attributeValuesKeys: groupProducts[0].attribute_values ? Object.keys(groupProducts[0].attribute_values) : [],
      } : null,
    });

    const attributeMap: Record<number, Set<string>> = {};
    
    // Собираем все атрибуты из всех товаров
    groupProducts.forEach((p: any, index: number) => {
      console.log(`🔵 commonAttributes: обработка товара ${index + 1}/${groupProducts.length}`, {
        productId: p.id,
        hasAttributeValues: !!p.attribute_values,
        attributeValuesType: typeof p.attribute_values,
        attributeValues: p.attribute_values,
        attributeValuesIsObject: p.attribute_values && typeof p.attribute_values === 'object',
        attributeValuesKeys: p.attribute_values ? Object.keys(p.attribute_values) : [],
      });

      if (p.attribute_values && typeof p.attribute_values === 'object') {
        Object.entries(p.attribute_values).forEach(([key, value]) => {
          const attrId = Number(key);
          console.log(`🔵 commonAttributes: обработка атрибута`, {
            key,
            keyType: typeof key,
            attrId,
            value,
            valueType: typeof value,
            valueIsString: typeof value === 'string',
            valueIsObject: typeof value === 'object' && value !== null,
            valueHasValue: value && typeof value === 'object' && 'value' in value,
          });

          // ✅ Обрабатываем как строку напрямую ИЛИ как объект { value: "..." }
          let valueStr: string | null = null;
          if (typeof value === 'string') {
            valueStr = value;
          } else if (value && typeof value === 'object' && 'value' in value) {
            valueStr = String((value as any).value);
          } else if (value !== null && value !== undefined) {
            valueStr = String(value);
          }

          if (!isNaN(attrId) && valueStr) {
            if (!attributeMap[attrId]) {
              attributeMap[attrId] = new Set();
            }
            attributeMap[attrId].add(valueStr);
            console.log(`🔵 commonAttributes: добавлено значение`, {
              attrId,
              valueStr,
              currentSet: Array.from(attributeMap[attrId]),
            });
          }
        });
      }
    });

    // Оставляем только те атрибуты, которые есть у ВСЕХ товаров И имеют разные значения
    const common: number[] = [];
    Object.entries(attributeMap).forEach(([attrId, values]) => {
      const id = Number(attrId);
      const hasInAll = groupProducts.every((p: any) => {
        // ✅ Получаем значение как в ProductAttributes - проверяем разные форматы
        let val = p.attribute_values?.[id] || p.attribute_values?.[String(id)];
        
        // Если значение - объект с value (как в ProductAttributes)
        if (val && typeof val === 'object' && 'value' in val) {
          val = (val as any).value;
        }
        
        return val && String(val).trim() !== '';
      });
      
      console.log(`🔵 commonAttributes: проверка атрибута ${id}`, {
        attrId: id,
        valuesCount: values.size,
        values: Array.from(values),
        hasInAll,
        willInclude: hasInAll && values.size >= 2,
      });
      
      // Атрибут должен быть у всех товаров И иметь хотя бы 2 разных значения
      if (hasInAll && values.size >= 2) {
        common.push(id);
      }
    });

    console.log('🔵 commonAttributes: результат', {
      commonAttributes: common,
      commonAttributesLength: common.length,
    });

    return common;
  }, [groupProducts]);

  // Если нет общих атрибутов - не показываем
  if (commonAttributes.length === 0) {
    return null;
  }

  // Инициализируем выбранные атрибуты из текущего товара
  useEffect(() => {
    if (product?.attribute_values && commonAttributes.length > 0) {
      const initial: Record<string, string> = {};
      commonAttributes.forEach(attrId => {
        // ✅ Получаем значение как в ProductAttributes - проверяем разные форматы
        let value = product.attribute_values?.[attrId] || product.attribute_values?.[String(attrId)];
        
        // Если значение - объект с value (как в ProductAttributes)
        if (value && typeof value === 'object' && 'value' in value) {
          value = (value as any).value;
        }
        
        if (value) {
          initial[attrId] = String(value);
        }
      });
      setSelectedAttributes(initial);
    }
  }, [product, commonAttributes]);

  // Загружаем названия атрибутов из категории
  const { data: categoryAttributes } = useQuery(
    ['category-attributes', product?.categories?.[0]?.id],
    async () => {
      if (!product?.categories?.[0]?.id) return null;
      try {
        return await client.categories.getAttributes(product.categories[0].id);
      } catch (err) {
        return null;
      }
    },
    {
      enabled: !!product?.categories?.[0]?.id,
      staleTime: 10 * 60 * 1000,
    }
  );

  const getAttributeName = (attrId: number): string => {
    if (categoryAttributes?.data?.attributes) {
      const attr = categoryAttributes.data.attributes.find((a: any) => a?.id === attrId);
      return attr?.name || `Атрибут ${attrId}`;
    }
    return `Атрибут ${attrId}`;
  };

  // Получаем уникальные значения для каждого атрибута
  const attributeOptions = useMemo(() => {
    const options: Record<number, string[]> = {};
    commonAttributes.forEach(attrId => {
      const values = new Set<string>();
      groupProducts.forEach((p: any) => {
        // ✅ Получаем значение как в ProductAttributes - проверяем разные форматы
        let value = p.attribute_values?.[attrId] || p.attribute_values?.[String(attrId)];
        
        // Если значение - объект с value (как в ProductAttributes)
        if (value && typeof value === 'object' && 'value' in value) {
          value = (value as any).value;
        }
        
        if (value) {
          values.add(String(value).trim());
        }
      });
      if (values.size > 0) {
        options[attrId] = Array.from(values);
      }
    });
    return options;
  }, [groupProducts, commonAttributes]);

  // Находим товар по выбранным атрибутам
  const findVariant = (attributes: Record<string, string>) => {
    return groupProducts.find((p: any) => {
      return Object.entries(attributes).every(([attrId, value]) => {
        // ✅ Получаем значение как в ProductAttributes - проверяем разные форматы
        let productValue = p.attribute_values?.[attrId] || p.attribute_values?.[String(attrId)];
        
        // Если значение - объект с value (как в ProductAttributes)
        if (productValue && typeof productValue === 'object' && 'value' in productValue) {
          productValue = (productValue as any).value;
        }
        
        return String(productValue) === value;
      });
    });
  };

  // Обработчик выбора атрибута
  const handleAttributeSelect = (attrId: number, value: string) => {
    const newSelected = { ...selectedAttributes, [attrId]: value };
    setSelectedAttributes(newSelected);

    const variant = findVariant(newSelected);
    if (variant?.slug) {
      router.push(`/element/${variant.slug}`);
    }
    
    if (onVariantChange && variant) {
      onVariantChange(variant);
    }
  };

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
        Выберите вариант товара
      </h3>
      
      <div className="space-y-4">
        {commonAttributes.map((attrId) => {
          const attributeName = getAttributeName(attrId);
          const options = attributeOptions[attrId] || [];
          const selectedValue = selectedAttributes[attrId];

          if (options.length === 0) return null;

          return (
            <div key={attrId} className="space-y-2">
              <label className="text-sm font-medium text-dark dark:text-light">
                {attributeName}:
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((value) => {
                  const isSelected = selectedValue === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(attrId, value)}
                      className={`px-4 py-2 text-sm rounded-md border-2 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand font-medium'
                          : 'border-light-400 dark:border-dark-500 hover:border-brand/50 text-dark dark:text-light'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
