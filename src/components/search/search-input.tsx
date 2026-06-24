import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInOut } from '@/lib/framer-motion/fade-in-out';
import cn from 'classnames';

interface SearchInputProps {
  className?: string;
  placeholder?: string;
}

// Функции для получения подсказок через API
  const getSearchSuggestions = async (query: string) => {
    if (query.length < 2) return { products: [], tags: [], categories: [] };
    
    try {
      console.log('🔍 Загружаем подсказки для:', query);
      const response = await fetch(`https://api.treabo.md/search/suggestions?q=${encodeURIComponent(query)}`);
      console.log('📡 Ответ API suggestions:', response.status);
      
      if (!response.ok) {
        console.warn('⚠️ API suggestions недоступен, используем заглушку');
        // Заглушка для тестирования
        return {
          products: [`${query} товар`, `${query} аксессуар`],
          tags: [`${query} тег`, `${query} стиль`],
          categories: [`${query} категория`]
        };
      }
      
      const data = await response.json();
      console.log('📋 Получены подсказки:', data);
      return data.suggestions || { products: [], tags: [], categories: [] };
    } catch (error) {
      console.error('❌ Ошибка получения подсказок:', error);
      // Заглушка при ошибке
      return {
        products: [`${query} товар`],
        tags: [`${query} тег`],
        categories: [`${query} категория`]
      };
    }
  };

const getHorizontalSuggestions = async (query: string) => {
  if (query.length < 2) return [];
  
  try {
    console.log('🔍 Загружаем горизонтальные подсказки для:', query);
    const response = await fetch(`https://api.treabo.md/search/autocomplete?q=${encodeURIComponent(query)}`);
    console.log('📡 Ответ API autocomplete:', response.status);
    
    if (!response.ok) {
      console.warn('⚠️ API autocomplete недоступен, используем заглушку');
      // Заглушка для тестирования
      return ['новый', 'популярный', 'стильный', 'качественный', 'уникальный'];
    }
    
    const data = await response.json();
    console.log('📋 Получены горизонтальные подсказки:', data);
    return data.suggestions || [];
  } catch (error) {
    console.error('❌ Ошибка получения горизонтальных подсказок:', error);
    // Заглушка при ошибке
    return ['новый', 'популярный', 'стильный'];
  }
};

export default function SearchInput({
  className = '',
  placeholder = 'Искать на Treabo',
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{
    products: string[];
    tags: string[];
    categories: string[];
  }>({
    products: [],
    tags: [],
    categories: [],
  });
  const [horizontalSuggestions, setHorizontalSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Показываем результаты только при фокусе и наличии запроса
  useEffect(() => {
    // Показываем подсказки при фокусе и наличии запроса (минимум 2 символа для подсказок)
    setShowResults(isFocused && searchQuery.length > 0);
  }, [isFocused, searchQuery]);

  // Загружаем подсказки при изменении запроса
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsLoadingSuggestions(true);
      
      // Загружаем подсказки с задержкой (debounce)
      const timeoutId = setTimeout(async () => {
        try {
          const [suggestions, horizontal] = await Promise.all([
            getSearchSuggestions(searchQuery),
            getHorizontalSuggestions(searchQuery)
          ]);
          
          setSearchSuggestions(suggestions);
          setHorizontalSuggestions(horizontal);
        } catch (error) {
          console.error('Ошибка загрузки подсказок:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300); // Задержка 300мс

      return () => clearTimeout(timeoutId);
    } else {
      setSearchSuggestions({ products: [], tags: [], categories: [] });
      setHorizontalSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  }, [searchQuery]);

  // Закрываем результаты при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
      setIsFocused(false);
    }
  };

  // Обработка поиска
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
      setIsFocused(false);
    }
  };

  // Обработка клика по подсказке
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowResults(false);
    setIsFocused(false);
  };

  // Обработка клика по горизонтальной подсказке
  const handleHorizontalSuggestionClick = (suggestion: string) => {
    const newQuery = searchQuery + ' ' + suggestion;
    setSearchQuery(newQuery);
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    setShowResults(false);
    setIsFocused(false);
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Поле ввода */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex w-full h-10 px-3 py-2 pr-4 rounded-full border-input border-0 text-base md:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-1 focus-visible:ring-[#C45A4A] ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-all duration-200"
          style={{ backgroundColor: '#f3F5F7' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
      </div>

      {/* Выпадающие результаты */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial="exit"
            animate="enter"
            exit="exit"
            variants={fadeInOut()}
            ref={resultsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-300 border border-gray-200 dark:border-dark-500 rounded-lg shadow-xl z-50 overflow-hidden max-h-[500px] overflow-y-auto"
            style={{ minWidth: '600px', maxWidth: '100%' }}
          >
            {/* Индикатор загрузки */}
            {isLoadingSuggestions && (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C45A4A] mx-auto"></div>
                <p className="mt-2 text-sm">Загружаем подсказки...</p>
              </div>
            )}

            {/* Горизонтальные подсказки */}
            {!isLoadingSuggestions && horizontalSuggestions.length > 0 && (
              <div className="p-4 border-b border-gray-100 dark:border-dark-500 bg-gray-50 dark:bg-dark-400">
                <div className="flex flex-wrap gap-2">
                  {horizontalSuggestions.slice(0, 8).map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleHorizontalSuggestionClick(suggestion)}
                      className="px-4 py-2 bg-white dark:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-[#C45A4A] hover:text-white dark:hover:bg-[#C45A4A] transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Вертикальные подсказки */}
            {!isLoadingSuggestions && (searchSuggestions.products.length > 0 || searchSuggestions.tags.length > 0 || searchSuggestions.categories.length > 0) && (
              <div className="py-2">
                {/* Товары */}
                {searchSuggestions.products.length > 0 && (
                  <div className="px-2">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Товары
                    </div>
                    {searchSuggestions.products.slice(0, 5).map((suggestion, index) => (
                      <motion.button
                        key={`product-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-dark-400 rounded-lg transition-colors flex items-center space-x-3 group"
                      >
                        <svg className="h-5 w-5 text-[#C45A4A] flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
                
                {/* Теги */}
                {searchSuggestions.tags.length > 0 && (
                  <div className="px-2 mt-2">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Теги
                    </div>
                    {searchSuggestions.tags.slice(0, 5).map((suggestion, index) => (
                      <motion.button
                        key={`tag-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (searchSuggestions.products.length + index) * 0.03 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-dark-400 rounded-lg transition-colors flex items-center space-x-3 group"
                      >
                        <span className="h-5 w-5 text-[#C45A4A] flex-shrink-0 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">#</span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
                
                {/* Категории */}
                {searchSuggestions.categories.length > 0 && (
                  <div className="px-2 mt-2">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Категории
                    </div>
                    {searchSuggestions.categories.slice(0, 5).map((suggestion, index) => (
                      <motion.button
                        key={`category-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (searchSuggestions.products.length + searchSuggestions.tags.length + index) * 0.03 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-dark-400 rounded-lg transition-colors flex items-center space-x-3 group"
                      >
                        <svg className="h-5 w-5 text-[#C45A4A] flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Кнопка "Показать все результаты" */}
            {searchQuery.trim() && (
              <div className="border-t border-gray-100 dark:border-dark-500 p-3 bg-gray-50 dark:bg-dark-400">
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setShowResults(false);
                    setIsFocused(false);
                  }}
                  className="w-full text-center text-sm text-[#C45A4A] hover:text-[#A0483A] py-2 font-semibold flex items-center justify-center space-x-2 hover:underline transition-all"
                >
                  <span>Показать все результаты для</span>
                  <span className="font-bold">"{searchQuery}"</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Сообщение если нет результатов */}
            {searchQuery.length > 0 && searchSuggestions.products.length === 0 && searchSuggestions.tags.length === 0 && searchSuggestions.categories.length === 0 && horizontalSuggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">Попробуйте другой запрос</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
