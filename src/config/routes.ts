import { taskSlugFromTitle } from '@/lib/treabo/slug';

const routes = {
  home: '/',
  authors: '/authors',
  explore: '/',
  products: '/products',
  shops: '/shops',
  popularProducts: '/popular-products',
  about: '/about-us',
  contact: '/contact-us',
  purchases: '/purchases',
  wishlists: '/wishlists',
  reports: '/reports',
  questions: '/questions',
  profile: '/profile',
  checkout: '/checkout',
  help: '/help',
  return: '/help/return',
  knowledgeBase: '/help/knowledge-base',
  marketplace: '/marketplace',
  earn: '/earn',
  licensing: '/licensing',
  refund: '/refund',
  terms: '/terms',
  privacy: '/privacy',
  password: '/password',
  feed: '/feed',
  placesFeed: '/places',
  wallet: '/wallet',
  followedShop: '/followed-authors',
  orderUrl: (tracking_number: string) =>
    `/orders/${encodeURIComponent(tracking_number)}`,
  productUrl: (slugOrUrl: string, id?: number | string) => {
    // Если это уже готовый URL (начинается с /element/), возвращаем как есть
    if (slugOrUrl.startsWith('/element/')) {
      return slugOrUrl;
    }
    // ВАЖНО: Для новых товаров slug уже содержит полный путь с 12-значным кодом
    // Не добавляем ID, так как код уже в slug
    // Для старых товаров (обратная совместимость) используем ID только если slug не содержит код
    const hasCode = /-\d{12}$/.test(slugOrUrl);
    if (hasCode) {
      // Slug уже содержит 12-значный код - используем как есть
      return `/element/${slugOrUrl}`;
    }
    // Для старых товаров без кода используем ID (обратная совместимость)
    return id ? `/element/${slugOrUrl}-${id}` : `/element/${slugOrUrl}`;
  },
  works: '/works',
  taskUrl: (
    taskOrSlug: string | number | { id: string | number; title?: string | null },
  ) => {
    if (typeof taskOrSlug === 'object') {
      const slug = taskSlugFromTitle(taskOrSlug.title || 'task', taskOrSlug.id);
      return `/tasks/${encodeURIComponent(slug)}`;
    }
    return `/tasks/${encodeURIComponent(String(taskOrSlug))}`;
  },
  categoryUrl: (slug: string) => `/categories/${slug}`,
  tagUrl: (slug: string) => `/products/tags/${slug}`,
  placeHashtagUrl: (slug: string) => `/places/element/${slug}`,
  shopUrl: (slug: string) => `/authors/${slug}`,
  product: (slug: string) => {
    return `/element/${encodeURIComponent(slug)}`;
  },
  cards: '/cards',
  promo: '/promo',
  telegram: 'https://t.me/sancan_seller',

  art: '/?category=art',
  tovarydoma: '/?category=tovary-dlya-doma',
  mebel: '/?category=mebel',
  interer: '/?category=dom-i-interer',
  fashion: '/?category=fashion',
  handmade: '/?category=handmade',
  hobbi: '/?category=hobbi-i-tvorchestvo',
  ukrasheniya: '/?category=ukrasheniya',
  seller: 'https://seller.sancan.ru/register',


};
export default routes;
