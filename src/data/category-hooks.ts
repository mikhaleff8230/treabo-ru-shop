import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import type { Category } from '@/types';
import { useCategoriesForMenu } from './category';

// Хук для получения категории по slug
export function useCategoryBySlug(slug: string) {
  const { locale } = useRouter();

  const {
    data: category,
    isLoading,
    error,
  } = useQuery<Category>(
    ['category', slug, locale],
    () => client.categories.get({ slug, language: locale }),
    {
      enabled: !!slug,
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
    }
  );

  return {
    category,
    isLoading,
    error,
  };
}

// Хук для получения хлебных крошек категории
export function useCategoryBreadcrumbs(category: Category | undefined) {
  const { categories } = useCategoriesForMenu();
  
  const buildBreadcrumbs = (cat: Category, allCategories: Category[]): Array<{ name: string; href: string }> => {
    const breadcrumbs: Array<{ name: string; href: string }> = [];
    
    // Функция для поиска родительской категории
    const findParent = (childId: string | number, categories: Category[]): Category | null => {
      for (const cat of categories) {
        if (cat.children) {
          const found = cat.children.find(child => child.id === childId);
          if (found) return cat;
          
          // Рекурсивный поиск в подкатегориях
          const parent = findParent(childId, cat.children);
          if (parent) return parent;
        }
      }
      return null;
    };

    // Строим цепочку от текущей категории к корню
    let currentCategory = cat;
    const breadcrumbChain: Category[] = [currentCategory];

    while (currentCategory) {
      const parent = findParent(currentCategory.id, allCategories);
      if (parent) {
        breadcrumbChain.unshift(parent);
        currentCategory = parent;
      } else {
        break;
      }
    }

    // Преобразуем в хлебные крошки
    return breadcrumbChain.map(cat => ({
      name: cat.name,
      href: `/categories/${cat.slug}`,
    }));
  };

  if (!category) return [];

  return buildBreadcrumbs(category, categories);
}