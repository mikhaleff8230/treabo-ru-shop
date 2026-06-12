export interface DocsNavItem {
  title: string;
  slug: string;
  description?: string;
}

export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

export const docsNav: DocsNavSection[] = [
  {
    title: 'Для продавцов',
    items: [
      {
        title: 'Регистрация на Sancan',
        slug: 'registration',
        description: 'Как зарегистрироваться и начать работу на маркетплейсе Sancan — пошаговое руководство для продавцов',
      },
      {
        title: 'Самозанятые продавцы',
        slug: 'self-employed-sellers',
        description: 'Всё о работе самозанятых продавцов на Sancan',
      },
      {
        title: 'СДЭК ТК',
        slug: 'sdek_tk',
        description: 'Информация о работе с транспортной компанией СДЭК',
      },
      {
        title: 'Ссылка на маркетплейс из карточки товара',
        slug: 'marketplace-link-from-product-card',
        description: 'Как добавить и настроить ссылку на внешний маркетплейс в карточке товара на Sancan',
      },
    ],
  },
  {
    title: 'Тарифы и комиссии',
    items: [
      {
        title: 'Всё про тарифы Sancan',
        slug: 'sancan-tariffs',
        description: 'Подробная информация о тарифах и комиссиях платформы',
      },
    ],
  },
];

// Функция для получения всех статей из навигации
export function getAllDocsSlugs(): string[] {
  return docsNav.flatMap((section) => section.items.map((item) => item.slug));
}

// Функция для получения статьи по slug
export function getDocBySlug(slug: string): DocsNavItem | undefined {
  for (const section of docsNav) {
    const item = section.items.find((item) => item.slug === slug);
    if (item) return item;
  }
  return undefined;
}

// Функция для получения всех статей
export function getAllDocs(): DocsNavItem[] {
  return docsNav.flatMap((section) => section.items);
}

