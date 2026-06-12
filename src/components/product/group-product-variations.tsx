import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from '@/components/ui/image';
import placeholder from '@/assets/images/placeholders/product.svg';

interface GroupProductVariationsProps {
  product: any;
  className?: string;
  onVariantChange?: (variantProduct: any) => void;
}

/**
 * Компонент для отображения вариаций группового товара
 * Показывает атрибуты (цвет, размер и т.д.) и позволяет переключаться между вариантами
 */
export default function GroupProductVariations({ 
  product, 
  className = '',
  onVariantChange
}: GroupProductVariationsProps) {
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Получаем group_key из товара
  const groupKey = (product as any)?.group_key ? String((product as any).group_key) : null;

  // Нормализация ответа API - обрабатывает разные форматы
  const normalizeProducts = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  };

  // Загружаем товары группы (с атрибутами для получения их названий)
  const { data: groupProducts = [], isLoading, error } = useQuery(
    ['group-product-variations', groupKey],
    async () => {
      if (!groupKey) return [];
      
      try {
        const response = await client.products.getByGroupKey(groupKey, {
          with: 'shop;type;categories;attributes', // Включаем атрибуты для получения их названий
        });
        const products = normalizeProducts(response);
        
        // Фильтруем только опубликованные товары с нужным group_key
        return products.filter((p: any) => 
          p?.status === 'publish' && String(p?.group_key) === String(groupKey)
        );
      } catch (err) {
        console.error('[GroupProductVariations] Ошибка загрузки товаров группы:', err);
        return [];
      }
    },
    {
      enabled: !!groupKey && !!product?.id,
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 1,
      retryDelay: 1000,
    }
  );

  // Находим общие атрибуты (которые есть у всех товаров и имеют разные значения)
  const commonAttributes = useMemo(() => {
    if (!groupProducts.length || groupProducts.length < 2) {
      return [];
    }

    const attributeMap: Record<number, Set<string>> = {};
    
    // Собираем все атрибуты из всех товаров
    groupProducts.forEach((p: any) => {
      if (p.attribute_values && typeof p.attribute_values === 'object') {
        Object.entries(p.attribute_values).forEach(([key, value]) => {
          const attrId = Number(key);
          
          // Обрабатываем разные форматы значения
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
          }
        });
      }
    });

    // Оставляем только те атрибуты, которые есть у ВСЕХ товаров И имеют хотя бы 2 разных значения
    const common: number[] = [];
    Object.entries(attributeMap).forEach(([attrId, values]) => {
      const id = Number(attrId);
      
      // Проверяем, что атрибут есть у всех товаров
      const hasInAll = groupProducts.every((p: any) => {
        let val = p.attribute_values?.[id] || p.attribute_values?.[String(id)];
        
        if (val && typeof val === 'object' && 'value' in val) {
          val = (val as any).value;
        }
        
        return val && String(val).trim() !== '';
      });
      
      // Атрибут должен быть у всех товаров И иметь хотя бы 2 разных значения
      if (hasInAll && values.size >= 2) {
        common.push(id);
      }
    });

    return common;
  }, [groupProducts]);

  // Инициализируем выбранные атрибуты из текущего товара
  useEffect(() => {
    if (product?.attribute_values && commonAttributes.length > 0) {
      const initial: Record<string, string> = {};
      commonAttributes.forEach(attrId => {
        let value = product.attribute_values?.[attrId] || product.attribute_values?.[String(attrId)];
        
        if (value && typeof value === 'object' && 'value' in value) {
          value = (value as any).value;
        }
        
        if (value) {
          initial[String(attrId)] = String(value);
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
        const response = await client.categories.getAttributes(product.categories[0].id);
        
        // Логируем структуру ответа для отладки
        if (process.env.NODE_ENV === 'development') {
          console.log('[GroupProductVariations] Ответ getAttributes:', {
            responseType: typeof response,
            isArray: Array.isArray(response),
            hasSuccess: !!(response as any)?.success,
            hasData: !!(response as any)?.data,
            dataIsArray: Array.isArray((response as any)?.data),
            keys: response && typeof response === 'object' ? Object.keys(response) : [],
            sample: response,
          });
        }
        
        return response;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[GroupProductVariations] Ошибка загрузки атрибутов категории:', err);
        }
        return null;
      }
    },
    {
      enabled: !!product?.categories?.[0]?.id,
      staleTime: 10 * 60 * 1000, // 10 минут
    }
  );

  // Получаем название атрибута по ID
  // Пробуем несколько источников: товары группы, категория, текущий товар
  const getAttributeName = (attrId: number): string => {
    // 1. Пробуем найти в атрибутах товаров группы (если они загружены)
    if (groupProducts.length > 0) {
      for (const p of groupProducts) {
        if (p.attributes && Array.isArray(p.attributes)) {
          const attr = p.attributes.find((a: any) => {
            const aId = Number(a?.id);
            return !isNaN(aId) && aId === attrId;
          });
          if (attr?.name) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[GroupProductVariations] Найдено название атрибута ${attrId} в товарах группы:`, attr.name);
            }
            return attr.name;
          }
        }
      }
    }

    // 2. Пробуем найти в атрибутах текущего товара
    if (product?.attributes && Array.isArray(product.attributes)) {
      const attr = product.attributes.find((a: any) => {
        const aId = Number(a?.id);
        return !isNaN(aId) && aId === attrId;
      });
      if (attr?.name) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[GroupProductVariations] Найдено название атрибута ${attrId} в текущем товаре:`, attr.name);
        }
        return attr.name;
      }
    }

    // 3. Пробуем найти в атрибутах категории (обрабатываем разные форматы ответа API)
    if (categoryAttributes) {
      let attributes: any[] = [];
      
      // Формат 1: { success: true, data: [...] }
      if (categoryAttributes?.success && Array.isArray(categoryAttributes?.data)) {
        attributes = categoryAttributes.data;
      }
      // Формат 2: { data: [...] }
      else if (Array.isArray(categoryAttributes?.data)) {
        attributes = categoryAttributes.data;
      }
      // Формат 3: { data: { attributes: [...] } }
      else if (categoryAttributes?.data?.attributes && Array.isArray(categoryAttributes.data.attributes)) {
        attributes = categoryAttributes.data.attributes;
      }
      // Формат 4: Массив напрямую
      else if (Array.isArray(categoryAttributes)) {
        attributes = categoryAttributes;
      }

      if (process.env.NODE_ENV === 'development' && attributes.length > 0) {
        console.log(`[GroupProductVariations] Загружено атрибутов из категории:`, attributes.length, 'Ищем атрибут:', attrId);
      }

      // Ищем атрибут по ID
      const attr = attributes.find((a: any) => {
        const aId = Number(a?.id);
        return !isNaN(aId) && aId === attrId;
      });

      if (attr?.name) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[GroupProductVariations] Найдено название атрибута ${attrId} в категории:`, attr.name);
        }
        return attr.name;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GroupProductVariations] Атрибут ${attrId} не найден в категории. Доступные ID:`, attributes.map((a: any) => a?.id));
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GroupProductVariations] categoryAttributes не загружены для атрибута ${attrId}`);
      }
    }

    // Fallback: если не нашли - возвращаем ID
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[GroupProductVariations] Не удалось найти название атрибута ${attrId}, используем fallback`);
    }
    return `Атрибут ${attrId}`;
  };

  // Получаем уникальные значения для каждого атрибута
  const attributeOptions = useMemo(() => {
    const options: Record<number, string[]> = {};
    commonAttributes.forEach(attrId => {
      const values = new Set<string>();
      groupProducts.forEach((p: any) => {
        let value = p.attribute_values?.[attrId] || p.attribute_values?.[String(attrId)];
        
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
        let productValue = p.attribute_values?.[attrId] || p.attribute_values?.[String(attrId)];
        
        if (productValue && typeof productValue === 'object' && 'value' in productValue) {
          productValue = (productValue as any).value;
        }
        
        return String(productValue) === value;
      });
    });
  };

  // Получаем изображение товара (thumbnail)
  const getProductImage = (product: any): string | null => {
    // Сначала пробуем главное изображение
    if (product?.image) {
      if (typeof product.image === 'string') {
        return product.image;
      }
      if (typeof product.image === 'object') {
        return product.image?.thumbnail || product.image?.original || null;
      }
    }
    
    // Если нет главного, пробуем первое из галереи
    if (product?.gallery && Array.isArray(product.gallery) && product.gallery.length > 0) {
      const firstImage = product.gallery[0];
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      if (typeof firstImage === 'object') {
        return firstImage?.thumbnail || firstImage?.original || null;
      }
    }
    
    return null;
  };

  // Получаем товар для конкретного значения атрибута
  // Учитываем все выбранные атрибуты, но для текущего атрибута используем переданное значение
  const getVariantForAttributeValue = (attrId: number, value: string) => {
    // Создаем объект атрибутов с текущим выбранным значением для этого атрибута
    // и сохраняем другие выбранные атрибуты
    const testAttributes = { ...selectedAttributes, [String(attrId)]: value };
    
    // Ищем товар, который соответствует всем выбранным атрибутам
    const variant = findVariant(testAttributes);
    
    // Если не нашли с учетом всех атрибутов, пробуем найти только по текущему атрибуту
    // (на случай, если другие атрибуты еще не выбраны)
    if (!variant) {
      return groupProducts.find((p: any) => {
        let productValue = p.attribute_values?.[attrId] || p.attribute_values?.[String(attrId)];
        
        if (productValue && typeof productValue === 'object' && 'value' in productValue) {
          productValue = (productValue as any).value;
        }
        
        return String(productValue) === value;
      });
    }
    
    return variant;
  };

  // Обработчик выбора атрибута
  const handleAttributeSelect = (attrId: number, value: string) => {
    const newSelected = { ...selectedAttributes, [String(attrId)]: value };
    setSelectedAttributes(newSelected);

    // Находим товар с выбранными атрибутами
    const variant = findVariant(newSelected);
    
    if (variant?.slug) {
      // Переключаемся на другой товар группы
      router.push(`/element/${variant.slug}`);
    }
    
    // Вызываем callback если передан
    if (onVariantChange && variant) {
      onVariantChange(variant);
    }
  };

  // Если нет product или group_key - не показываем
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
        <div className="text-sm text-dark-600 dark:text-light-600">Загрузка...</div>
      </motion.div>
    );
  }

  // Если ошибка - не показываем
  if (error) {
    return null;
  }

  // Если нет товаров в группе или меньше 2 - не показываем
  if (!groupProducts.length || groupProducts.length < 2) {
    return null;
  }

  // Если нет общих атрибутов - не показываем
  if (commonAttributes.length === 0) {
    return null;
  }

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <div className="space-y-4">
        {commonAttributes.map((attrId) => {
          const attributeName = getAttributeName(attrId);
          const options = attributeOptions[attrId] || [];
          const selectedValue = selectedAttributes[String(attrId)];

          if (options.length === 0) return null;

          return (
            <div key={attrId} className="space-y-2">
              <label className="text-sm font-medium text-dark dark:text-light">
                {attributeName}:
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((value) => {
                  const isSelected = selectedValue === value;
                  const variantProduct = getVariantForAttributeValue(attrId, value);
                  const productImage = variantProduct ? getProductImage(variantProduct) : null;
                  
                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(attrId, value)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md border-2 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand font-medium'
                          : 'border-light-400 dark:border-dark-500 hover:border-brand/50 text-dark dark:text-light'
                      }`}
                    >
                      <div className="w-8 h-8 flex-shrink-0 rounded overflow-hidden border border-light-400 dark:border-dark-500 bg-light-200 dark:bg-dark-300">
                        <Image
                          src={productImage || placeholder}
                          alt={value}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <span>{value}</span>
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

