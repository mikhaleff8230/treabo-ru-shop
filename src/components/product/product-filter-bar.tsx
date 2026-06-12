import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'next-i18next';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { ChevronRight } from '@/components/icons/chevron-right';
import { NormalGridIcon } from '@/components/icons/normal-grid-icon';
import { CompactGridIcon } from '@/components/icons/compact-grid-icon';
import { useScrollableSlider } from '@/lib/hooks/use-scrollable-slider';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { getColorHex } from '@/lib/utils/color-utils';
import { useViewMode } from '@/components/product/grid-switcher';

interface FilterItemProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  icon?: string;
}

interface AttributeFilterItemProps {
  attribute: any;
  isActive: boolean;
  selectedValues: string[];
  onValueSelect: (attributeId: string, valueId: string) => void;
  onReset?: (attributeId: string) => void;
  onMobileOpen?: (attribute: any, type: 'attribute' | 'range') => void;
}

interface RangeFilterItemProps {
  attribute: any;
  isActive: boolean;
  selectedRange: { min?: string; max?: string } | null;
  onRangeSelect: (attributeId: string, min: string, max: string) => void;
  onReset?: (attributeId: string) => void;
  onMobileOpen?: (attribute: any, type: 'attribute' | 'range') => void;
}

interface ToggleFilterItemProps {
  attribute: any;
  isActive: boolean;
  selectedValues: string[];
  onValueSelect: (attributeId: string, valueId: string) => void;
}

interface ProductFilterBarProps {
  categoryId?: number;
  onSortChange?: (orderBy: string, sortedBy: string) => void;
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

function FilterItem({ name, isActive, onClick, icon }: FilterItemProps) {
  return (
    <button
      onClick={onClick}
      className={`h-[30px] shrink-0 !rounded-full border py-1.5 px-3.5 text-xs font-medium outline-none flex items-center gap-2 ${
        isActive
          ? 'border-dark-100 bg-dark-100 text-light-100 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 dark:border-light dark:bg-light dark:text-dark-100'
          : 'border-light-500 bg-light-400 text-dark-100 hover:bg-light-500 dark:border-dark-500 dark:bg-dark-400 dark:text-light-100 hover:dark:bg-dark-500 hover:dark:text-light'
      }`}
    >
      {icon && <span className="h-4 w-4 flex items-center justify-center">{icon}</span>}
      {name}
      <ChevronRight className="h-3 w-3 rotate-90" />
    </button>
  );
}

/**
 * Компонент для отображения диапазона "От-До" (как на Wildberries)
 */
function RangeFilterItem({ attribute, isActive, selectedRange, onRangeSelect, onReset, onMobileOpen }: RangeFilterItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [minValue, setMinValue] = useState(selectedRange?.min || '');
  const [maxValue, setMaxValue] = useState(selectedRange?.max || '');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Получаем min/max из атрибута или используем дефолтные значения
  const minLimit = attribute?.min_value != null ? Number(attribute.min_value) : 0;
  const maxLimit = attribute?.max_value != null ? Number(attribute.max_value) : 1000000;

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isHovered) {
      updateDropdownPosition();
    }
  }, [isHovered]);

  useEffect(() => {
    if (isHovered) {
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isHovered]);

  // Обновляем локальные значения при изменении selectedRange
  useEffect(() => {
    setMinValue(selectedRange?.min || '');
    setMaxValue(selectedRange?.max || '');
  }, [selectedRange]);

  const handleApply = () => {
    if (minValue || maxValue) {
      const finalMin = minValue || String(minLimit);
      const finalMax = maxValue || String(maxLimit);
      onRangeSelect(attribute.id.toString(), finalMin, finalMax);
    }
    setIsHovered(false);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinValue('');
    setMaxValue('');
    if (onReset) {
      onReset(attribute.id.toString());
    }
    setIsHovered(false);
  };

  const hasActiveRange = selectedRange && (selectedRange.min || selectedRange.max);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setTimeout(() => {
          if (!dropdownRef.current?.matches(':hover')) {
            setIsHovered(false);
          }
        }, 150);
      }}
    >
      <button
        ref={buttonRef}
        onClick={() => {
          // В мобильной версии открываем панель
          if (typeof window !== 'undefined' && window.innerWidth < 640 && onMobileOpen) {
            onMobileOpen(attribute, 'range');
            return;
          }
        }}
        className={`h-[30px] shrink-0 !rounded-full border py-1.5 px-3.5 text-xs font-medium outline-none flex items-center gap-2 ${
          isActive || hasActiveRange
            ? 'border-dark-100 bg-dark-100 text-light-100 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 dark:border-light dark:bg-light dark:text-dark-100'
            : 'border-light-500 bg-light-400 text-dark-100 hover:bg-light-500 dark:border-dark-500 dark:bg-dark-400 dark:text-light-100 hover:dark:bg-dark-500 hover:dark:text-light'
        }`}
      >
        {attribute.name}
        {hasActiveRange && (
          <span className="ml-1 text-xs opacity-75">
            {selectedRange?.min || String(minLimit)} - {selectedRange?.max || String(maxLimit)}
          </span>
        )}
        <ChevronRight className="h-3 w-3 rotate-90" />
      </button>

      {/* Выпадающий список с полями От-До */}
      {isHovered && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-light-100 dark:bg-dark-100 border border-light-400 dark:border-dark-400 rounded-lg shadow-lg p-4 min-w-[280px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Заголовок */}
          <div className="text-sm font-semibold text-dark-100 dark:text-light-100 mb-3">
            {attribute.name}
          </div>

          {/* Поля От-До */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-dark-400 dark:text-light-400 mb-1.5">
                От
              </label>
              <input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                placeholder={String(minLimit)}
                min={minLimit}
                max={maxLimit}
                className="w-full px-3 py-2 text-sm border border-light-400 dark:border-dark-400 rounded-md bg-light-100 dark:bg-dark-200 text-dark-100 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-dark-400 dark:text-light-400 mb-1.5">
                До
              </label>
              <input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                placeholder={String(maxLimit)}
                min={minLimit}
                max={maxLimit}
                className="w-full px-3 py-2 text-sm border border-light-400 dark:border-dark-400 rounded-md bg-light-100 dark:bg-dark-200 text-dark-100 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Кнопка "Готово" */}
          <button
            onClick={handleApply}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
          >
            Готово
          </button>

          {/* Кнопка "Сбросить" (если есть выбранный диапазон) */}
          {hasActiveRange && (
            <button
              onClick={handleReset}
              className="w-full mt-2 py-2 px-4 text-sm text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * Компонент для отображения переключателя (Toggle Switch)
 */
function ToggleFilterItem({ attribute, isActive, selectedValues, onValueSelect }: ToggleFilterItemProps) {
  const hasValues = attribute?.values && Array.isArray(attribute.values) && attribute.values.length > 0;
  
  // Для toggle обычно используется первое значение из списка, или "true" для boolean
  const toggleValue = hasValues ? attribute.values[0] : null;
  const valueId = toggleValue?.id?.toString() || toggleValue?.value || 'true';
  const isToggled = selectedValues.includes(valueId) || isActive;

  const handleToggle = () => {
    // Для toggle переключаем состояние: если включено - выключаем, если выключено - включаем
    // onValueSelect уже обрабатывает добавление/удаление значения
    onValueSelect(attribute.id.toString(), valueId);
  };

  return (
    <div className="flex items-center justify-between h-auto shrink-0">
      {/* Название атрибута */}
      <span className="text-base font-semibold text-dark-100 dark:text-light-100 flex-1 mr-2">
        {attribute.name}
      </span>
      
      {/* Toggle Switch */}
      <button
        type="button"
        onClick={handleToggle}
        className={`
          relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${isToggled 
            ? 'bg-purple-600 dark:bg-purple-500' 
            : 'bg-light-500 dark:bg-dark-500'
          }
        `}
        role="switch"
        aria-checked={isToggled}
        aria-label={`${attribute.name}: ${isToggled ? 'включено' : 'выключено'}`}
      >
        {/* Кружочек переключателя */}
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0
            transition duration-200 ease-in-out
            ${isToggled ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

/**
 * Компонент для отображения цветовых образцов (как на Ozon)
 */
function ColorSwatchFilterItem({ attribute, isActive, selectedValues, onValueSelect }: AttributeFilterItemProps) {
  const [showAll, setShowAll] = useState(false);
  const hasValues = attribute?.values && Array.isArray(attribute.values) && attribute.values.length > 0;

  const handleColorClick = (valueId: string) => {
    onValueSelect(attribute.id.toString(), valueId);
  };

  if (!hasValues) {
    return null;
  }

  // Показываем максимум 8 образцов (2 ряда по 4), остальные по кнопке "Показать все"
  const maxVisible = 8;
  const visibleValues = showAll ? attribute.values : attribute.values.slice(0, maxVisible);
  const hasMore = attribute.values.length > maxVisible;

  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      {/* Название атрибута */}
      <div className="text-xs font-semibold text-dark-100 dark:text-light-100 mb-0.5">
        {attribute.name}
      </div>
      
      {/* Цветовые образцы - компактная сетка 2x4 */}
      <div className="grid grid-cols-4 gap-1.5 w-full max-w-[140px]">
        {visibleValues.map((value: any) => {
          const valueId = value.id?.toString() || value.value;
          const isSelected = selectedValues.includes(valueId);
          const colorHex = getColorHex(value.value);
          
          // Для светлых цветов используем темную границу, для темных - светлую
          const isLightColor = colorHex && (
            colorHex === '#FFFFFF' || 
            colorHex === '#FFFDD0' || 
            colorHex === '#F5F5DC' ||
            colorHex === '#FFC0CB' ||
            colorHex === '#E6E6FA' ||
            colorHex === '#98FF98' ||
            colorHex === '#90EE90' ||
            colorHex === '#87CEEB'
          );
          
          return (
            <button
              key={value.id || value.value}
              onClick={() => handleColorClick(valueId)}
              className={`
                relative w-8 h-8 rounded-full transition-all duration-200
                flex items-center justify-center
                ${isSelected 
                  ? 'scale-110 shadow-md ring-2 ring-offset-1 ring-offset-light-100 dark:ring-offset-dark-100' 
                  : 'hover:scale-105 hover:shadow-sm'
                }
              `}
              style={{ 
                backgroundColor: colorHex,
                border: isSelected 
                  ? '2px solid #000' 
                  : isLightColor 
                    ? '1.5px solid #E5E5E5' 
                    : '1.5px solid rgba(0,0,0,0.1)'
              }}
              title={value.value}
              aria-label={`${attribute.name}: ${value.value}`}
            >
              {/* Индикатор выбора - галочка */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className={`w-3.5 h-3.5 drop-shadow-md ${isLightColor ? 'text-gray-800' : 'text-white'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Кнопка "Показать все" / "Скрыть" */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors mt-0.5"
        >
          {showAll ? 'Скрыть' : `+${attribute.values.length - maxVisible} еще`}
        </button>
      )}
      
      {/* Счетчик выбранных значений */}
      {selectedValues.length > 0 && (
        <div className="text-xs text-dark-400 dark:text-light-400 mt-0.5">
          Выбрано: {selectedValues.length}
        </div>
      )}
    </div>
  );
}

function AttributeFilterItem({ attribute, isActive, selectedValues, onValueSelect, onReset, onMobileOpen }: AttributeFilterItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasValues = attribute?.values && Array.isArray(attribute.values) && attribute.values.length > 0;

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isHovered) {
      updateDropdownPosition();
    }
  }, [isHovered]);

  useEffect(() => {
    if (isHovered) {
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isHovered]);

  // Определяем тип атрибута: multiselect или select
  const isMultiselect = attribute?.type === 'multiselect';
  const attributeType = attribute?.type || 'select';
  
  // Проверяем, является ли атрибут цветовым
  const isColorAttribute = attribute?.display_type === 'color_swatch' || 
                          attribute?.name?.toLowerCase().includes('цвет') ||
                          attribute?.name?.toLowerCase().includes('color');

  const handleValueClick = (valueId: string) => {
    // Для обычного select (не multiselect) - заменяем выбранное значение
    // Для multiselect - добавляем/удаляем значение
    // Передаем информацию о типе атрибута в onValueSelect
    // Но так как onValueSelect не принимает этот параметр, используем простую логику
    onValueSelect(attribute.id.toString(), valueId);
  };

  // Обработчик сброса фильтров
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Вызываем callback для сброса фильтров
    if (onReset) {
      onReset(attribute.id.toString());
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (hasValues) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (hasValues) {
          // Небольшая задержка для возможности перехода на dropdown
          setTimeout(() => {
            if (!dropdownRef.current?.matches(':hover')) {
              setIsHovered(false);
            }
          }, 150);
        }
      }}
    >
      <button
        ref={buttonRef}
        onClick={() => {
          // В мобильной версии открываем панель
          if (typeof window !== 'undefined' && window.innerWidth < 640 && hasValues && onMobileOpen) {
            onMobileOpen(attribute, 'attribute');
            return;
          }
          // Если нет значений - просто переключаем атрибут
          if (!hasValues) {
            onValueSelect(attribute.id.toString(), '');
          }
        }}
        className={`h-[30px] shrink-0 !rounded-full border py-1.5 px-3.5 text-xs font-medium outline-none flex items-center gap-2 ${
          isActive || selectedValues.length > 0
            ? 'border-dark-100 bg-dark-100 text-light-100 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 dark:border-light dark:bg-light dark:text-dark-100'
            : 'border-light-500 bg-light-400 text-dark-100 hover:bg-light-500 dark:border-dark-500 dark:bg-dark-400 dark:text-light-100 hover:dark:bg-dark-500 hover:dark:text-light'
        }`}
      >
        {attribute.name}
        {hasValues && <ChevronRight className="h-3 w-3 rotate-90" />}
        {selectedValues.length > 0 && (
          <span className="ml-1 text-xs opacity-75">({selectedValues.length})</span>
        )}
      </button>

      {/* Выпадающий список со значениями */}
      {isHovered && hasValues && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-light-100 dark:bg-dark-100 border border-light-400 dark:border-dark-400 rounded-lg shadow-lg py-2 max-h-[300px] overflow-y-auto min-w-[200px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {attribute.values.map((value: any) => {
            const valueId = value.id?.toString() || value.value;
            const isValueSelected = selectedValues.includes(valueId);
            
            // Для цветовых атрибутов получаем hex код цвета
            const colorHex = isColorAttribute ? getColorHex(value.value) : null;
            const isLightColor = colorHex && (
              colorHex === '#FFFFFF' || 
              colorHex === '#FFFDD0' || 
              colorHex === '#F5F5DC' ||
              colorHex === '#FFC0CB' ||
              colorHex === '#E6E6FA' ||
              colorHex === '#98FF98' ||
              colorHex === '#90EE90' ||
              colorHex === '#87CEEB'
            );
            
            return (
              <button
                key={value.id || value.value}
                onClick={() => handleValueClick(valueId)}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-light-400 dark:hover:bg-dark-400 transition-colors flex items-center gap-3 group"
              >
                {/* Checkbox для multiselect или Radio для select */}
                {isMultiselect ? (
                  // Скругленный квадратик с галочкой (checkbox)
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                    ${isValueSelected
                      ? 'bg-purple-600 border-purple-600 dark:bg-purple-500 dark:border-purple-500'
                      : 'border-light-500 dark:border-dark-500 bg-light-100 dark:bg-dark-200 group-hover:border-purple-400'
                    }
                  `}>
                    {isValueSelected && (
                      <svg 
                        className="w-3.5 h-3.5 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    )}
                  </div>
                ) : (
                  // Кружочек (radio button)
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                    ${isValueSelected
                      ? 'border-purple-600 dark:border-purple-500'
                      : 'border-light-500 dark:border-dark-500 bg-light-100 dark:bg-dark-200 group-hover:border-purple-400'
                    }
                  `}>
                    {isValueSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-500" />
                    )}
                  </div>
                )}
                
                {/* Для цветовых атрибутов - цветной кружочек и название */}
                {isColorAttribute && colorHex ? (
                  <>
                    {/* Цветной кружочек */}
                    <div 
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-full transition-all duration-200
                        ${isValueSelected 
                          ? 'scale-110 shadow-md ring-2 ring-offset-1 ring-offset-light-100 dark:ring-offset-dark-100 ring-purple-600 dark:ring-purple-500' 
                          : 'hover:scale-105 hover:shadow-sm'
                        }
                      `}
                      style={{ 
                        backgroundColor: colorHex,
                        border: isValueSelected 
                          ? '2px solid #000' 
                          : isLightColor 
                            ? '1.5px solid #E5E5E5' 
                            : '1.5px solid rgba(0,0,0,0.1)'
                      }}
                      title={value.value}
                    />
                    {/* Название цвета (без hex-кода) */}
                    <span className={`
                      flex-1
                      ${isValueSelected
                        ? 'text-dark-100 dark:text-light-100 font-medium'
                        : 'text-dark-100 dark:text-light-100'
                      }
                    `}>
                      {value.value}
                    </span>
                  </>
                ) : (
                  /* Для нецветовых атрибутов - только текст */
                  <span className={`
                    flex-1
                    ${isValueSelected
                      ? 'text-dark-100 dark:text-light-100 font-medium'
                      : 'text-dark-100 dark:text-light-100'
                    }
                  `}>
                    {value.value}
                    {value.meta && (
                      <span className="ml-2 text-xs opacity-60">({value.meta})</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Кнопка "Сбросить" в конце списка */}
          {selectedValues.length > 0 && (
            <div className="border-t border-light-400 dark:border-dark-400 mt-1 pt-1">
              <button
                onClick={handleReset}
                className="w-full text-left px-4 py-2.5 text-sm text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 hover:bg-light-400 dark:hover:bg-dark-400 transition-colors"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ProductFilterBar({ categoryId, onSortChange, onFilterChange }: ProductFilterBarProps) {
  const { t } = useTranslation('common');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  // Храним выбранные значения атрибутов: { attributeId: [valueId1, valueId2, ...] }
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>({});
  // Храним выбранные диапазоны для атрибутов типа range: { attributeId: { min: string, max: string } }
  const [selectedRanges, setSelectedRanges] = useState<Record<string, { min: string; max: string }>>({});
  const [sortBy, setSortBy] = useState('popularity');
  const { viewMode, setViewMode } = useViewMode();
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false); // Показывать/скрывать фильтры справа (по умолчанию скрыты)
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Состояние для мобильной панели фильтров
  const [mobileFilterPanel, setMobileFilterPanel] = useState<{
    isOpen: boolean;
    attribute: any | null;
    type: 'attribute' | 'range' | 'sort' | null;
  }>({
    isOpen: false,
    attribute: null,
    type: null,
  });

  const {
    sliderEl,
    sliderPrevBtn,
    sliderNextBtn,
    scrollToTheRight,
    scrollToTheLeft,
  } = useScrollableSlider();

  // Получаем атрибуты категории через API
  const { data: attributesData, isLoading: attributesLoading, error: attributesError } = useQuery(
    ['category-attributes', categoryId],
    async () => {
      if (!categoryId) {
        return null;
      }
      try {
        const response = await client.categories.getAttributes(categoryId);
        return response;
      } catch (error: any) {
        // Тихая обработка ошибок - не вызываем перезагрузку страницы
        // Игнорируем ошибки 401/403/404 для публичного endpoint
        if (error?.response?.status !== 401 && error?.response?.status !== 403 && error?.response?.status !== 404) {
          console.error('[Attributes] Error fetching attributes:', error);
        }
        // Возвращаем null вместо ошибки, чтобы не вызывать перезагрузку
        return null;
      }
    },
    {
      enabled: !!categoryId && !isNaN(Number(categoryId)),
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      // Предотвращаем проброс ошибки в useQuery, чтобы не вызывать перезагрузку
      throwOnError: false,
      onError: (error: any) => {
        // Тихая обработка ошибок - не пробрасываем дальше
        if (error?.response?.status !== 401 && error?.response?.status !== 403 && error?.response?.status !== 404) {
          console.error('Category attributes query error:', error);
        }
      },
    }
  );

  // Формируем список атрибутов для отображения
  // API возвращает: { success: true, data: [...], required_attributes: [...], optional_attributes: [...] }
  // HttpClient.get() уже извлекает response.data, поэтому attributesData - это ответ API напрямую
  const categoryAttributes = useMemo(() => {
    if (!attributesData) {
      return [];
    }
    
    // HttpClient.get() возвращает response.data от axios
    // API возвращает: { success: true, data: [...], required_attributes: [...], optional_attributes: [...] }
    let attributes = [];
    
    // Проверяем структуру ответа API
    if (attributesData?.success && Array.isArray(attributesData?.data)) {
      // Стандартная структура ответа: { success: true, data: [...] }
      attributes = attributesData.data;
    } else if (Array.isArray(attributesData?.data)) {
      // Альтернативная структура: { data: [...] }
      attributes = attributesData.data;
    } else if (Array.isArray(attributesData)) {
      // Если ответ - массив напрямую
      attributes = attributesData;
    } else {
      return [];
    }
    
    // API уже фильтрует активные атрибуты, но на всякий случай проверяем
    // (на случай если поле is_active не существует в БД)
    const filtered = attributes.filter((attr: any) => {
      // Если поле is_active существует - фильтруем только активные
      // Если поля нет - пропускаем все атрибуты
      if (attr.hasOwnProperty('is_active')) {
        return attr.is_active === true || attr.is_active === 1 || attr.is_active === '1';
      }
      // Если поля is_active нет - считаем все атрибуты активными
      return true;
    });
    
    // Сортируем по sort_order из pivot таблицы (category_attribute)
    filtered.sort((a: any, b: any) => {
      const sortA = a?.pivot?.sort_order ?? a?.sort_order ?? 999;
      const sortB = b?.pivot?.sort_order ?? b?.sort_order ?? 999;
      return sortA - sortB;
    });
    
    return filtered;
  }, [attributesData, attributesLoading, attributesError]);

  const sortOptions = [
    { value: 'popularity', label: 'По популярности', orderBy: 'orders_count', sortedBy: 'desc' },
    { value: 'price-asc', label: 'Дешевле', orderBy: 'price', sortedBy: 'asc' },
    { value: 'price-desc', label: 'Дороже', orderBy: 'price', sortedBy: 'desc' },
    { value: 'newest', label: 'Сначала новые', orderBy: 'created_at', sortedBy: 'desc' },
    { value: 'rating', label: 'По рейтигу', orderBy: 'ratings', sortedBy: 'desc' }
  ];

  const handleFilterToggle = (filterValue: string) => {
    setActiveFilters((prev: string[]) =>
      prev.includes(filterValue)
        ? prev.filter((f: string) => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  // Обработка выбора диапазона для атрибутов типа range
  const handleRangeSelect = (attributeId: string, min: string, max: string) => {
    setSelectedRanges((prev) => {
      const updated = {
        ...prev,
        [attributeId]: { min, max },
      };
      
      // Вызываем callback для обновления фильтров товаров
      // Для диапазонов передаем в формате "min-max"
      if (onFilterChange) {
        // Объединяем с обычными фильтрами
        const allFilters = { ...selectedAttributeValues };
        // Добавляем все диапазоны в формате "min-max"
        Object.entries(updated).forEach(([attrId, range]) => {
          allFilters[attrId] = [`${range.min}-${range.max}`];
        });
        // Удаляем пустые фильтры
        Object.keys(allFilters).forEach(key => {
          if (!allFilters[key] || allFilters[key].length === 0) {
            delete allFilters[key];
          }
        });
        onFilterChange(allFilters);
      }
      
      return updated;
    });
  };

  // Обработка выбора значения атрибута
  const handleAttributeValueSelect = (attributeId: string, valueId: string, isSelectType?: boolean) => {
    setSelectedAttributeValues((prev) => {
      const currentValues = prev[attributeId] || [];
      
      // Определяем тип атрибута из списка атрибутов
      const attribute = categoryAttributes.find((attr: any) => attr.id?.toString() === attributeId);
      const isMultiselect = attribute?.type === 'multiselect';
      const isSelect = isSelectType !== undefined ? isSelectType : !isMultiselect;
      
      let newValues: string[];
      
      if (isSelect) {
        // Для select (radio) - заменяем все значения на одно новое
        if (currentValues.includes(valueId)) {
          // Если уже выбрано - снимаем выбор
          newValues = [];
        } else {
          // Выбираем только новое значение (заменяем все)
          newValues = [valueId];
        }
      } else {
        // Для multiselect - добавляем/удаляем значение
        newValues = valueId
          ? (currentValues.includes(valueId)
              ? currentValues.filter((id) => id !== valueId)
              : [...currentValues, valueId])
          : []; // Если valueId пустой - очищаем все значения
      }
      
      const updated = {
        ...prev,
        [attributeId]: newValues.length > 0 ? newValues : undefined,
      };
      
      // Удаляем атрибут из объекта, если нет выбранных значений
      if (newValues.length === 0) {
        delete updated[attributeId];
      }
      
      // Вызываем callback для обновления фильтров товаров
      // Объединяем с диапазонами, если они есть
      if (onFilterChange) {
        const allFilters = { ...updated };
        // Добавляем диапазоны в формате "min-max"
        Object.entries(selectedRanges).forEach(([attrId, range]) => {
          allFilters[attrId] = [`${range.min}-${range.max}`];
        });
        // Удаляем пустые фильтры
        Object.keys(allFilters).forEach(key => {
          if (!allFilters[key] || allFilters[key].length === 0) {
            delete allFilters[key];
          }
        });
        onFilterChange(allFilters);
      }
      
      return updated;
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const selectedOption = sortOptions.find(opt => opt.value === value);
    if (selectedOption && onSortChange) {
      onSortChange(selectedOption.orderBy, selectedOption.sortedBy);
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };


  // Вычисление позиции dropdown при наведении
  const updateDropdownPosition = () => {
    if (sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8, // 8px отступ
        left: rect.left + window.scrollX,
      });
    }
  };

  // Вычисление позиции dropdown
  useEffect(() => {
    if (isSortDropdownOpen) {
      updateDropdownPosition();
    }
  }, [isSortDropdownOpen]);

  // Обновление позиции при скролле
  useEffect(() => {
    if (isSortDropdownOpen) {
      const handleScroll = () => {
        updateDropdownPosition();
      };
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isSortDropdownOpen]);

  // Функции для мобильной панели
  const openMobileFilterPanel = (attribute: any, type: 'attribute' | 'range' | 'sort') => {
    setMobileFilterPanel({
      isOpen: true,
      attribute,
      type,
    });
    // Блокируем скролл body при открытии панели
    document.body.style.overflow = 'hidden';
  };

  const closeMobileFilterPanel = () => {
    setMobileFilterPanel({
      isOpen: false,
      attribute: null,
      type: null,
    });
    // Разблокируем скролл body
    document.body.style.overflow = '';
  };

  return (
    <>
      <div className="app-category-filter-bar relative flex min-h-[64px] w-full border-b border-light-400 bg-light-100 px-4 py-4 dark:border-dark-300 dark:bg-dark-100 sm:min-h-[70px] sm:px-5 sm:py-5 md:px-6 lg:px-7 3xl:px-8">
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
          {/* Сортировка с выпадающим списком (открывается при наведении) */}
          <div 
            className="relative"
            onMouseEnter={() => {
              if (sortButtonRef.current) {
                const rect = sortButtonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 8,
                  left: rect.left + window.scrollX,
                });
              }
              setIsSortDropdownOpen(true);
            }}
            onMouseLeave={() => {
              // Небольшая задержка для возможности перехода на dropdown
              const timeoutId = setTimeout(() => {
                setIsSortDropdownOpen(false);
              }, 150);
              
              // Отменяем закрытие если вернулись на кнопку или dropdown
              const checkMouse = () => {
                if (sortButtonRef.current?.matches(':hover') || sortDropdownRef.current?.matches(':hover')) {
                  clearTimeout(timeoutId);
                }
              };
              
              setTimeout(checkMouse, 50);
            }}
          >
            <button
              ref={sortButtonRef}
              onClick={() => {
                // В мобильной версии открываем панель
                if (window.innerWidth < 640) {
                  openMobileFilterPanel(null, 'sort');
                }
              }}
              className={`h-[30px] shrink-0 !rounded-full border py-1.5 px-3.5 text-xs font-medium outline-none flex items-center gap-2 ${
                isSortDropdownOpen
                  ? 'border-dark-100 bg-dark-100 text-light-100 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 dark:border-light dark:bg-light dark:text-dark-100'
                  : 'border-light-500 bg-light-400 text-dark-100 hover:bg-light-500 dark:border-dark-500 dark:bg-dark-400 dark:text-light-100 hover:dark:bg-dark-500 hover:dark:text-light'
              }`}
            >
              {sortOptions.find(opt => opt.value === sortBy)?.label || 'По популярности'}
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
            
            {/* Выпадающий список через портал */}
            {isSortDropdownOpen && typeof window !== 'undefined' && createPortal(
              <div
                ref={sortDropdownRef}
                className="fixed z-[9999] bg-light-100 dark:bg-dark-100 border border-light-400 dark:border-dark-400 rounded-lg shadow-lg py-1"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: 'fit-content',
                  minWidth: 'max-content',
                }}
                onMouseEnter={() => setIsSortDropdownOpen(true)}
                onMouseLeave={() => setIsSortDropdownOpen(false)}
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleSortChange(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm whitespace-nowrap hover:bg-light-400 dark:hover:bg-dark-400 transition-colors ${
                      sortBy === option.value
                        ? 'bg-light-500 dark:bg-dark-500 font-medium text-dark-100 dark:text-light-100'
                        : 'text-dark-100 dark:text-light-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* Все фильтры - кнопка переключения видимости */}
          <FilterItem
            name="Все фильтры"
            isActive={showAllFilters}
            onClick={() => setShowAllFilters(!showAllFilters)}
            icon="☰"
          />

          {/* Атрибуты категории (реальные данные из API) - скрываются/показываются кнопкой "Все фильтры" */}
          {showAllFilters && (
            <>
              {categoryAttributes.length > 0 ? (
                categoryAttributes.map((attr: any) => {
                  const hasValues = attr?.values && Array.isArray(attr.values) && attr.values.length > 0;
                  const selectedValues = selectedAttributeValues[attr.id?.toString()] || [];
                  const selectedRange = selectedRanges[attr.id?.toString()] || null;
                  const displayType = attr?.display_type || 'dropdown';
                  const isSelectType = attr?.type === 'select' || attr?.type !== 'multiselect';
                  
                  // Создаем обертку для handleAttributeValueSelect с информацией о типе
                  const handleValueSelect = (attributeId: string, valueId: string) => {
                    handleAttributeValueSelect(attributeId, valueId, isSelectType);
                  };
                  
                  // Выбираем компонент в зависимости от display_type
                  // Toggle Switch для атрибутов с display_type: 'toggle'
                  if (displayType === 'toggle') {
                    // Для toggle используем логику select (не multiselect)
                    const handleToggleValueSelect = (attributeId: string, valueId: string) => {
                      handleAttributeValueSelect(attributeId, valueId, true); // true = isSelectType
                    };
                    
                    return (
                      <ToggleFilterItem
                        key={attr.id}
                        attribute={attr}
                        isActive={activeFilters.includes(attr.id?.toString()) || selectedValues.length > 0}
                        selectedValues={selectedValues}
                        onValueSelect={handleToggleValueSelect}
                      />
                    );
                  }
                  
                  // Диапазон (От-До) для number атрибутов
                  if (displayType === 'range' && attr?.type === 'number') {
                    return (
                      <RangeFilterItem
                        key={attr.id}
                        attribute={attr}
                        isActive={activeFilters.includes(attr.id?.toString()) || !!selectedRange}
                        selectedRange={selectedRange}
                        onRangeSelect={handleRangeSelect}
                        onMobileOpen={openMobileFilterPanel}
                        onReset={(attributeId) => {
                          setSelectedRanges((prev) => {
                            const updated = { ...prev };
                            delete updated[attributeId];
                            if (onFilterChange) {
                              // Обновляем фильтры без этого диапазона
                              const allFilters = { ...selectedAttributeValues };
                              // Добавляем оставшиеся диапазоны в формате "min-max"
                              Object.entries(updated).forEach(([attrId, range]) => {
                                allFilters[attrId] = [`${range.min}-${range.max}`];
                              });
                              // Удаляем пустые фильтры
                              Object.keys(allFilters).forEach(key => {
                                if (!allFilters[key] || allFilters[key].length === 0) {
                                  delete allFilters[key];
                                }
                              });
                              onFilterChange(allFilters);
                            }
                            return updated;
                          });
                        }}
                      />
                    );
                  }
                  
                  if (hasValues) {
                    // Обычный выпадающий список для всех атрибутов (включая цвета)
                    return (
                      <AttributeFilterItem
                        key={attr.id}
                        attribute={attr}
                        isActive={activeFilters.includes(attr.id?.toString()) || selectedValues.length > 0}
                        selectedValues={selectedValues}
                        onValueSelect={handleValueSelect}
                        onMobileOpen={openMobileFilterPanel}
                        onReset={(attributeId) => {
                          setSelectedAttributeValues((prev) => {
                            const updated = { ...prev };
                            delete updated[attributeId];
                            if (onFilterChange) {
                              // Объединяем с диапазонами
                              const allFilters = { ...updated };
                              // Добавляем диапазоны в формате "min-max"
                              Object.entries(selectedRanges).forEach(([attrId, range]) => {
                                allFilters[attrId] = [`${range.min}-${range.max}`];
                              });
                              // Удаляем пустые фильтры
                              Object.keys(allFilters).forEach(key => {
                                if (!allFilters[key] || allFilters[key].length === 0) {
                                  delete allFilters[key];
                                }
                              });
                              onFilterChange(allFilters);
                            }
                            return updated;
                          });
                        }}
                      />
                    );
                  }
                  
                  // Если значений нет - используем обычный FilterItem
                  return (
                    <FilterItem
                      key={attr.id}
                      name={attr.name}
                      isActive={activeFilters.includes(attr.id?.toString())}
                      onClick={() => handleFilterToggle(attr.id?.toString())}
                    />
                  );
                })
              ) : attributesLoading ? (
                // Показываем заглушку при загрузке
                <div className="flex items-center gap-2">
                  <div className="h-[30px] w-24 bg-gray-200 animate-pulse rounded-full"></div>
                </div>
              ) : null}
            </>
          )}

          {/* Переключатель вида */}
          <div className="flex items-center ml-auto">
            <button
              onClick={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded bg-light-400 text-dark-100 hover:bg-light-500 dark:bg-dark-400 dark:text-light-100 dark:hover:bg-dark-500 transition-colors"
              title={viewMode === 'grid' ? 'Переключить на список' : 'Переключить на сетку'}
              aria-label={viewMode === 'grid' ? 'Переключить на список' : 'Переключить на сетку'}
            >
              {viewMode === 'grid' ? (
                <CompactGridIcon className="h-4 w-4" />
              ) : (
                <NormalGridIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        title={t('text-next')}
        ref={sliderNextBtn}
        onClick={() => scrollToTheRight()}
        className="invisible absolute top-1/2 right-2 z-[1] -mt-3 flex h-6 w-6 items-center justify-end rounded-full text-dark-800 opacity-0 after:pointer-events-none after:absolute after:-top-2 after:right-1 after:-z-[1] after:block after:h-9 after:w-9 after:bg-gradient-to-l after:from-light-100 after:via-light-100 after:content-[''] hover:text-dark focus:text-dark dark:after:from-dark-100 dark:after:via-dark-100 dark:hover:text-light dark:focus:text-light sm:right-3 md:left-4 lg:left-6"
      >
        <ChevronRight className="h-[18px] w-[18px]" />
      </button>
    </div>

    {/* Мобильная панель фильтров с оверлеем */}
    {mobileFilterPanel.isOpen && typeof window !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[10000] sm:hidden">
        {/* Оверлей с затемнением */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          onClick={closeMobileFilterPanel}
        />
        
        {/* Панель фильтров (снизу) */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-light-100 dark:bg-dark-100 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Шапка панели */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-light-400 dark:border-dark-400 flex-shrink-0">
            <button
              onClick={closeMobileFilterPanel}
              className="flex items-center justify-center w-10 h-10 -ml-2 text-gray-700 dark:text-gray-300 hover:text-brand transition-colors focus:outline-none touch-manipulation"
              aria-label="Закрыть"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold flex-1 text-center">
              {mobileFilterPanel.type === 'sort' 
                ? 'Сортировка'
                : mobileFilterPanel.attribute?.name || 'Фильтр'}
            </h3>
            <div className="w-10" /> {/* Для центрирования заголовка */}
          </div>

          {/* Контент панели */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {mobileFilterPanel.type === 'sort' ? (
              /* Панель сортировки */
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleSortChange(option.value);
                      closeMobileFilterPanel();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                      sortBy === option.value
                        ? 'bg-brand text-dark-900 font-semibold'
                        : 'bg-light-200 dark:bg-dark-200 text-dark-100 dark:text-light-100 hover:bg-light-300 dark:hover:bg-dark-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : mobileFilterPanel.type === 'range' && mobileFilterPanel.attribute ? (
              /* Панель диапазона */
              <MobileRangePanel
                attribute={mobileFilterPanel.attribute}
                selectedRange={selectedRanges[mobileFilterPanel.attribute.id?.toString()] || null}
                onRangeSelect={(min, max) => {
                  handleRangeSelect(mobileFilterPanel.attribute.id.toString(), min, max);
                  closeMobileFilterPanel();
                }}
                onReset={() => {
                  setSelectedRanges((prev) => {
                    const updated = { ...prev };
                    delete updated[mobileFilterPanel.attribute.id.toString()];
                    if (onFilterChange) {
                      const allFilters = { ...selectedAttributeValues };
                      Object.entries(updated).forEach(([attrId, range]) => {
                        allFilters[attrId] = [`${range.min}-${range.max}`];
                      });
                      Object.keys(allFilters).forEach(key => {
                        if (!allFilters[key] || allFilters[key].length === 0) {
                          delete allFilters[key];
                        }
                      });
                      onFilterChange(allFilters);
                    }
                    return updated;
                  });
                  closeMobileFilterPanel();
                }}
              />
            ) : mobileFilterPanel.attribute ? (
              /* Панель атрибутов */
              <MobileAttributePanel
                attribute={mobileFilterPanel.attribute}
                selectedValues={selectedAttributeValues[mobileFilterPanel.attribute.id?.toString()] || []}
                onValueSelect={(valueId) => {
                  const isSelectType = mobileFilterPanel.attribute?.type === 'select' || mobileFilterPanel.attribute?.type !== 'multiselect';
                  handleAttributeValueSelect(mobileFilterPanel.attribute.id.toString(), valueId, isSelectType);
                  // Для select (не multiselect) закрываем панель после выбора
                  if (isSelectType) {
                    closeMobileFilterPanel();
                  }
                }}
                onReset={() => {
                  setSelectedAttributeValues((prev) => {
                    const updated = { ...prev };
                    delete updated[mobileFilterPanel.attribute.id.toString()];
                    if (onFilterChange) {
                      const allFilters = { ...updated };
                      Object.entries(selectedRanges).forEach(([attrId, range]) => {
                        allFilters[attrId] = [`${range.min}-${range.max}`];
                      });
                      Object.keys(allFilters).forEach(key => {
                        if (!allFilters[key] || allFilters[key].length === 0) {
                          delete allFilters[key];
                        }
                      });
                      onFilterChange(allFilters);
                    }
                    return updated;
                  });
                  closeMobileFilterPanel();
                }}
              />
            ) : null}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

// Компонент мобильной панели для диапазона
function MobileRangePanel({ attribute, selectedRange, onRangeSelect, onReset }: {
  attribute: any;
  selectedRange: { min?: string; max?: string } | null;
  onRangeSelect: (min: string, max: string) => void;
  onReset: () => void;
}) {
  const [minValue, setMinValue] = useState(selectedRange?.min || '');
  const [maxValue, setMaxValue] = useState(selectedRange?.max || '');
  const minLimit = attribute?.min_value != null ? Number(attribute.min_value) : 0;
  const maxLimit = attribute?.max_value != null ? Number(attribute.max_value) : 1000000;

  useEffect(() => {
    setMinValue(selectedRange?.min || '');
    setMaxValue(selectedRange?.max || '');
  }, [selectedRange]);

  const handleApply = () => {
    const finalMin = minValue || String(minLimit);
    const finalMax = maxValue || String(maxLimit);
    onRangeSelect(finalMin, finalMax);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-dark-100 dark:text-light-100 mb-2">
            От
          </label>
          <input
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            placeholder={String(minLimit)}
            min={minLimit}
            max={maxLimit}
            className="w-full px-4 py-3 text-base border border-light-400 dark:border-dark-400 rounded-lg bg-light-100 dark:bg-dark-200 text-dark-100 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-100 dark:text-light-100 mb-2">
            До
          </label>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            placeholder={String(maxLimit)}
            min={minLimit}
            max={maxLimit}
            className="w-full px-4 py-3 text-base border border-light-400 dark:border-dark-400 rounded-lg bg-light-100 dark:bg-dark-200 text-dark-100 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>
      <button
        onClick={handleApply}
        className="w-full py-3 px-4 bg-brand hover:bg-brand-600 text-dark-900 text-base font-semibold rounded-lg transition-colors"
      >
        Применить
      </button>
      {selectedRange && (selectedRange.min || selectedRange.max) && (
        <button
          onClick={onReset}
          className="w-full py-3 px-4 text-base text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}

// Компонент мобильной панели для атрибутов
function MobileAttributePanel({ attribute, selectedValues, onValueSelect, onReset }: {
  attribute: any;
  selectedValues: string[];
  onValueSelect: (valueId: string) => void;
  onReset: () => void;
}) {
  const hasValues = attribute?.values && Array.isArray(attribute.values) && attribute.values.length > 0;
  const isMultiselect = attribute?.type === 'multiselect';
  const isColorAttribute = attribute?.display_type === 'color_swatch' || 
                          attribute?.name?.toLowerCase().includes('цвет') ||
                          attribute?.name?.toLowerCase().includes('color');

  if (!hasValues) {
    return (
      <div className="text-center py-8 text-dark-400 dark:text-light-400">
        Нет доступных значений
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attribute.values.map((value: any) => {
        const valueId = value.id?.toString() || value.value;
        const isValueSelected = selectedValues.includes(valueId);
        const colorHex = isColorAttribute ? getColorHex(value.value) : null;
        const isLightColor = colorHex && (
          colorHex === '#FFFFFF' || 
          colorHex === '#FFFDD0' || 
          colorHex === '#F5F5DC' ||
          colorHex === '#FFC0CB' ||
          colorHex === '#E6E6FA' ||
          colorHex === '#98FF98' ||
          colorHex === '#90EE90' ||
          colorHex === '#87CEEB'
        );

        return (
          <button
            key={value.id || value.value}
            onClick={() => onValueSelect(valueId)}
            className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors flex items-center gap-3 ${
              isValueSelected
                ? 'bg-brand text-dark-900 font-semibold'
                : 'bg-light-200 dark:bg-dark-200 text-dark-100 dark:text-light-100 hover:bg-light-300 dark:hover:bg-dark-300'
            }`}
          >
            {/* Checkbox или Radio */}
            {isMultiselect ? (
              <div className={`
                flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                ${isValueSelected
                  ? 'bg-dark-900 border-dark-900 dark:bg-light dark:border-light'
                  : 'border-light-500 dark:border-dark-500 bg-light-100 dark:bg-dark-200'
                }
              `}>
                {isValueSelected && (
                  <svg 
                    className="w-3.5 h-3.5 text-light dark:text-dark-900" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                )}
              </div>
            ) : (
              <div className={`
                flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                ${isValueSelected
                  ? 'border-dark-900 dark:border-light'
                  : 'border-light-500 dark:border-dark-500 bg-light-100 dark:bg-dark-200'
                }
              `}>
                {isValueSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-dark-900 dark:bg-light" />
                )}
              </div>
            )}
            
            {/* Цветовой кружочек или текст */}
            {isColorAttribute && colorHex ? (
              <>
                <div 
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full transition-all duration-200
                    ${isValueSelected 
                      ? 'scale-110 shadow-md ring-2 ring-offset-1 ring-offset-light-100 dark:ring-offset-dark-100 ring-brand' 
                      : ''
                    }
                  `}
                  style={{ 
                    backgroundColor: colorHex,
                    border: isValueSelected 
                      ? '2px solid #000' 
                      : isLightColor 
                        ? '1.5px solid #E5E5E5' 
                        : '1.5px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span className="flex-1">{value.value}</span>
              </>
            ) : (
              <span className="flex-1">{value.value}</span>
            )}
          </button>
        );
      })}
      
      {selectedValues.length > 0 && (
        <button
          onClick={onReset}
          className="w-full py-3 px-4 mt-4 text-base text-dark-400 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors border border-light-400 dark:border-dark-400 rounded-lg"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
