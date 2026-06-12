// ВРЕМЕННЫЙ ТЕСТОВЫЙ КОМПОНЕНТ - для проверки отображения
import { motion } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface ProductVariationsTestProps {
  product?: any;
  className?: string;
  onVariantChange?: (variantProduct: any) => void;
}

export default function ProductVariationsTest({ 
  product,
  className = '',
  onVariantChange 
}: ProductVariationsTestProps) {
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  // ЗАХАРДКОЖЕННЫЕ ДАННЫЕ для теста
  const testProducts = [
    {
      id: 5919,
      name: 'Товар 1',
      group_key: '1766783637041',
      attribute_values: { '84': 'Город' },
    },
    {
      id: 5921,
      name: 'Товар 2',
      group_key: '1766783637041',
      attribute_values: { '84': 'Пейзаж' },
    },
    {
      id: 5923,
      name: 'Товар 3',
      group_key: '1766783637041',
      attribute_values: { '84': 'Абстракция' },
    },
  ];

  const commonAttributes = [84]; // Атрибут ID 84
  const attributeOptions: Record<number, string[]> = {
    84: ['Город', 'Пейзаж', 'Абстракция'],
  };

  const handleAttributeSelect = (attrId: number, value: string) => {
    const newSelected = { ...selectedAttributes, [attrId]: value };
    setSelectedAttributes(newSelected);
    
    // Находим товар по выбранным атрибутам
    const variant = testProducts.find((p: any) => {
      return Object.entries(newSelected).every(([id, val]) => {
        return p.attribute_values?.[id] === val;
      });
    });
    
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
        🧪 ТЕСТ: Варианты товара
      </h3>
      
      <div className="space-y-4">
        {commonAttributes.map((attrId) => {
          const options = attributeOptions[attrId] || [];
          const selectedValue = selectedAttributes[attrId];
          
          return (
            <div key={attrId} className="space-y-2">
              <label className="text-sm font-medium text-dark dark:text-light">
                Жанр:
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
      
      <div className="mt-4 text-xs text-gray-500">
        Товаров в группе: {testProducts.length} | Текущий товар: {product?.id || 'N/A'}
      </div>
    </motion.div>
  );
}

