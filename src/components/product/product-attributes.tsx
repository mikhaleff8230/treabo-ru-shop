import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { useEffect, useState } from 'react';

interface ProductAttributesProps {
  product: any;
  className?: string;
}

interface Attribute {
  id: string;
  name: string;
  type: string;
  display_type: string;
  values?: Array<{ id: string; value: string }>;
}

export default function ProductAttributes({ 
  product, 
  className = '' 
}: ProductAttributesProps) {
  const { t } = useTranslation('common');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [hasVariations, setHasVariations] = useState(false);

  // Загружаем атрибуты товара
  const { data: attributesData, isLoading, error: attributesError } = useQuery(
    ['product-attributes', product?.id],
    async () => {
      if (!product?.id) return null;
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru'}/api/products/${product.id}/attributes`;
        console.log('[ProductAttributes] Fetching attributes from:', apiUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('[ProductAttributes] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[ProductAttributes] Response data:', data);
          return data.success ? data.data : null;
        } else {
          const errorText = await response.text();
          console.error('[ProductAttributes] API error:', response.status, errorText);
          // Возвращаем пустой объект вместо null, чтобы компонент не зависал
          return { product_attributes: [], category_attributes: [], attribute_values: {} };
        }
      } catch (error: any) {
        console.error('[ProductAttributes] Fetch error:', error);
        if (error.name === 'AbortError') {
          console.error('[ProductAttributes] Request timeout');
        }
        // Возвращаем пустой объект вместо null, чтобы компонент не зависал
        return { product_attributes: [], category_attributes: [], attribute_values: {} };
      }
    },
    {
      enabled: !!product?.id,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
      // Если запрос не завершился за 15 секунд - считаем ошибкой
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    // Приоритет: сначала проверяем данные из API запроса, затем из пропсов
    if (attributesData) {
      // Получаем атрибуты товара
      const productAttributes = attributesData.product_attributes || [];
      setAttributes(productAttributes);
      
      // Получаем значения атрибутов - теперь это объект где ключ attribute_id, значение объект с value
      const values = attributesData.attribute_values || {};
      setAttributeValues(values);
      
      // Проверяем наличие вариаций
      setHasVariations(product?.variation_options && product.variation_options.length > 0);
      
      // Отладка
      console.log('[ProductAttributes] Attributes loaded from API:', {
        attributesCount: productAttributes.length,
        valuesCount: Object.keys(values).length,
        attributes: productAttributes,
        values: values
      });
    } else if (product?.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
      // Если атрибуты уже пришли с товаром
      setAttributes(product.attributes);
      
      // Используем attribute_values из product, если есть
      if (product.attribute_values && typeof product.attribute_values === 'object') {
        setAttributeValues(product.attribute_values);
      } else {
        // Если attribute_values нет, пытаемся извлечь из pivot
        const values: Record<string, any> = {};
        product.attributes.forEach((attr: any) => {
          if (attr.pivot?.value !== null && attr.pivot?.value !== undefined && attr.pivot?.value !== '') {
            const attrId = String(attr.id);
            values[attrId] = {
              value: attr.pivot.value,
              attribute_value_id: attr.pivot.attribute_value_id || null
            };
          }
        });
        setAttributeValues(values);
      }
      
      setHasVariations(product?.variation_options && product.variation_options.length > 0);
      
      // Отладка
      console.log('[ProductAttributes] Attributes from product props:', {
        attributesCount: product.attributes.length,
        valuesCount: Object.keys(product.attribute_values || {}).length,
        hasAttributeValues: !!product.attribute_values,
        attributes: product.attributes
      });
    } else {
      // Если нет атрибутов ни из API, ни из пропсов
      setAttributes([]);
      setAttributeValues({});
      setHasVariations(false);
      
      console.log('[ProductAttributes] No attributes found');
    }
  }, [attributesData, product]);

  // Получаем значение атрибута для товара
  const getAttributeValue = (attributeId: string | number) => {
    // Пробуем разные форматы ID (строка и число)
    const attrIdStr = String(attributeId);
    const attrIdNum = Number(attributeId);
    
    let value = attributeValues[attrIdStr] || attributeValues[attrIdNum] || attributeValues[attributeId];
    
    // Если не нашли, пробуем найти по pivot.value (если атрибуты пришли с товаром)
    if (!value && product?.attributes) {
      const attr = product.attributes.find((a: any) => 
        String(a.id) === attrIdStr || Number(a.id) === attrIdNum || a.id === attributeId
      );
      if (attr?.pivot?.value) {
        value = attr.pivot.value;
      }
    }
    
    if (!value) {
      console.log('[ProductAttributes] No value for attribute:', attributeId, {
        type: typeof attributeId,
        availableKeys: Object.keys(attributeValues),
        attributeValues: attributeValues
      });
      return null;
    }
    
    // Если значение - объект с value
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return value.value;
    }
    
    // Если значение - строка
    if (typeof value === 'string') {
      return value;
    }
    
    // Если значение - число
    if (typeof value === 'number') {
      return String(value);
    }
    
    return null;
  };

  // Отладка перед рендером
  console.log('[ProductAttributes] Render check:', {
    attributesCount: attributes.length,
    hasAttributes: attributes && attributes.length > 0,
    attributeValuesKeys: Object.keys(attributeValues),
    attributeValues: attributeValues,
    isLoading,
    attributesError,
    attributesData
  });

  // Если загрузка длится больше 5 секунд - показываем ошибку
  if (isLoading) {
    // Показываем загрузку только первые 5 секунд
    return (
      <motion.div 
        variants={fadeInBottom()}
        className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
      >
        <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
          {t('text-characteristics')}
        </h3>
        <div className="text-sm dark:text-dark-600">
          Загрузка...
        </div>
      </motion.div>
    );
  }

  // Если есть ошибка загрузки - показываем сообщение вместо скрытия компонента
  if (attributesError) {
    console.error('[ProductAttributes] Error loading attributes:', attributesError);
    // Не возвращаем null, а показываем что данных нет
    return null;
  }

  // Если нет атрибутов, не показываем компонент
  if (!attributes || attributes.length === 0) {
    console.log('[ProductAttributes] No attributes, returning null');
    return null;
  }

  return (
    <motion.div 
      variants={fadeInBottom()}
      className={`bg-light-100 dark:bg-dark-200 p-6 rounded-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
        {t('text-characteristics')}
      </h3>
      
      <div className="space-y-3">
        {attributes
          .map((attr) => {
            const value = getAttributeValue(attr.id);
            console.log('[ProductAttributes] Processing attribute:', {
              attrId: attr.id,
              attrName: attr.name,
              value: value,
              valueType: typeof value
            });
            return { attr, value };
          })
          .filter(({ value }) => {
            const hasValue = value !== null && value !== undefined && value !== '';
            console.log('[ProductAttributes] Filtering attribute:', { value, hasValue });
            return hasValue;
          })
          .map(({ attr, value }) => (
            <div key={attr.id} className="flex items-start justify-between py-2 border-b border-light-300 dark:border-dark-400">
              <span className="text-sm dark:text-dark-600 flex-shrink-0">
                {attr.name}:
              </span>
              <span className="text-sm font-medium text-dark dark:text-light text-right ml-4">
                {String(value)}
              </span>
            </div>
          ))}
        {/* Если есть атрибуты, но нет значений - показываем сообщение */}
        {attributes.length > 0 && attributes.every(attr => !getAttributeValue(attr.id)) && (
          <div className="text-sm dark:text-dark-600 py-2">
            Характеристики пока не заполнены
          </div>
        )}
      </div>

      {/* Варианты товара - показываем только если есть */}
      {hasVariations && product?.variation_options && product.variation_options.length > 0 && (
        <div className="mt-6 p-4 bg-light-200 dark:bg-dark-300 rounded-lg">
          <h4 className="text-sm font-medium text-dark dark:text-light mb-2">
            {t('text-available-variants')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {product.variation_options.map((variant: any) => (
              <button
                key={variant.id}
                className="px-3 py-1 text-xs border border-light-400 dark:border-dark-500 rounded-md hover:border-brand transition-colors"
              >
                {variant.title || variant.name || `Вариант ${variant.id}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
} 