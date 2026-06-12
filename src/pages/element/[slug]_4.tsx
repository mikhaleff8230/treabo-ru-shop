import placeholder from '@/assets/images/placeholders/product.svg';
import { LongArrowIcon } from '@/components/icons/long-arrow-icon';
import ProductDetailsPaper from '@/components/product/product-details-paper';
import ProductInformation from '@/components/product/product-information';
import ProductSocialShare from '@/components/product/product-social-share';
import ProductQuestions from '@/components/questions/product-questions';
import SimilarProducts from '@/components/product/similar-products';
import ProductBreadcrumbs from '@/components/product/product-breadcrumbs';
import ProductImageSlider from '@/components/product/product-image-slider';
import ProductAttributes from '@/components/product/product-attributes';
import GroupProductVariations from '@/components/product/group-product-variations';
import { ProductVariationsErrorBoundary } from '@/components/product/product-variations-error-boundary';
import ProductTags from '@/components/product/product-tags';
import ProductPriceBlock from '@/components/product/product-price-block';
import ProductDeliveryBlock from '@/components/product/product-delivery-block';
import AverageRatings from '@/components/review/average-ratings';
import ProductReviews from '@/components/review/product-reviews';
import ProductMobileBuyBar from '@/components/product/product-mobile-buybar';
import { TitleSeo } from '@/components/seo/title-seo';
import Image from '@/components/ui/image';
import routes from '@/config/routes';
import client from '@/data/client';
import Layout from '@/layouts/_layout';
import {
  fadeInBottom,
  fadeInBottomWithScaleX,
  fadeInBottomWithScaleY,
} from '@/lib/framer-motion/fade-in-bottom';
import { staggerTransition } from '@/lib/framer-motion/stagger-transition';
import type { NextPageWithLayout, Product } from '@/types';
import { motion } from 'framer-motion';
import isEmpty from 'lodash/isEmpty';
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
} from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState, useMemo, useEffect } from 'react';

// Dynamic rendering - no static generation
export const getServerSideProps: GetServerSideProps = async ({ params, locale, req, res }) => {
  const { slug } = params!;
  const language = locale || 'ru';
  
  try {
    // Получаем полный URL для API (учитываем production/development)
    // Используем NEXT_PUBLIC_REST_API_ENDPOINT если есть, иначе формируем из req
    let apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;
    
    if (!apiUrl) {
      const protocol = req.headers['x-forwarded-proto'] || (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');
      const host = req.headers.host || 'localhost:3000';
      // Если host содержит порт 3000, заменяем на 8000 для API
      apiUrl = host.includes(':3000') 
        ? `${protocol}://${host.replace(':3000', ':8000')}`
        : `${protocol}://${host}`;
    }
    
    // Убираем trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');
    
    // Строим полный URL к API с language параметром
    const fullUrl = `${apiUrl}/api/element/${slug}?language=${language}`;
    
    console.log('[SSR] Fetching product:', {
      slug,
      language,
      apiUrl,
      fullUrl,
    });
    
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // timeout для SSR - увеличиваем до 15 секунд
      signal: AbortSignal.timeout(15000),
    });

    // Проверяем статус ответа
    if (response.status === 301 || response.status === 302) {
      // Если редирект (канонический URL), получаем новый URL
      try {
        const data = await response.json();
        const redirectUrl = data.redirect;
        
        if (redirectUrl) {
          console.log('[SSR] Redirect detected:', redirectUrl);
          
          // Делаем новый запрос по каноническому URL
          const redirectFullUrl = redirectUrl.startsWith('http') 
            ? `${redirectUrl}?language=${language}`
            : `${apiUrl}${redirectUrl}?language=${language}`;
            
          const redirectResponse = await fetch(redirectFullUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(15000),
          });
          
          if (redirectResponse.ok) {
            const result = await redirectResponse.json();
            
            if (result.success && result.data) {
              console.log('[SSR] Product loaded after redirect:', {
                id: result.data.id,
                name: result.data.name,
              });
              
              return {
                props: {
                  ...(await serverSideTranslations(language, [
                    'common',
                    'forms',
                    'menu',
                    'footer',
                  ])),
                  product: result.data,
                  meta: result.meta || {},
                },
              };
            }
          } else {
            console.error('[SSR] Redirect response not OK:', redirectResponse.status);
          }
        }
      } catch (redirectError) {
        console.error('[SSR] Error processing redirect:', redirectError);
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[SSR] API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        error: errorText,
      });
      return { notFound: true };
    }

    const result = await response.json();
    
    // Проверяем структуру ответа
    if (!result.success || !result.data) {
      console.error('[SSR] Invalid API response:', {
        success: result.success,
        hasData: !!result.data,
        result: JSON.stringify(result).substring(0, 500),
      });
      return { notFound: true };
    }
    
    // Логируем структуру для отладки
    console.log('[SSR] Product data received:', {
      id: result.data.id,
      name: result.data.name,
      slug: result.data.slug,
      hasImages: !!result.data.images,
      imagesCount: Array.isArray(result.data.images) ? result.data.images.length : 'not array',
      hasMeta: !!result.meta,
      canonical: result.meta?.canonical,
      hasGroupKey: !!result.data.group_key,
      groupKey: result.data.group_key,
      hasAttributeValues: !!result.data.attribute_values,
      attributeValues: result.data.attribute_values,
    });

    return {
      props: {
        ...(await serverSideTranslations(language, [
          'common',
          'forms',
          'menu',
          'footer',
        ])),
        product: result.data,
        meta: result.meta || {},
      },
    };
  } catch (error: any) {
    console.error('[SSR] Error fetching product:', {
      slug,
      language,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return { notFound: true };
  }
};

// Безопасная функция получения превью
function getPreviews(gallery: any[], image: any) {
  // Если gallery существует и это массив с элементами
  if (gallery && Array.isArray(gallery) && gallery.length > 0) {
    return gallery.filter(item => item && (item.url || item.thumbnail || item.original));
  }
  
  // Если есть основное изображение
  if (image && (image.url || image.thumbnail || image.original)) {
    return [image];
  }
  
  // Возвращаем заглушку
  return [{
    id: 0,
    url: placeholder.src,
    thumbnail: placeholder.src,
    original: placeholder.src,
  }];
}

// Компонент описания товара с раскрытием
function ProductDescription({ description }: { description: string }) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [textLength, setTextLength] = useState(0);
  
  // Подсчитываем длину текста без HTML тегов
  useEffect(() => {
    if (!description) {
      setTextLength(0);
      return;
    }
    const div = document.createElement('div');
    div.innerHTML = description;
    const text = div.textContent || div.innerText || '';
    setTextLength(text.length);
  }, [description]);
  
  // Фиксированная высота примерно на 200-250 символов (примерно 3-4 строки при маленьком шрифте)
  const maxHeight = '120px'; // Фиксированная высота для свернутого состояния
  const shouldShowExpand = textLength > 200; // Показываем кнопку если больше 200 символов
  
  return (
    <div className="relative">
      <div 
        className="text-xs leading-relaxed text-dark dark:text-light prose prose-xs max-w-none dark:prose-invert overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isExpanded ? 'none' : maxHeight,
        }}
        dangerouslySetInnerHTML={{ 
          __html: description || t('text-no-description') 
        }}
      />
      
      {/* Градиент для плавного перехода (только когда свернуто) */}
      {!isExpanded && shouldShowExpand && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none bg-gradient-to-b from-transparent to-light-100 dark:to-dark-200"
        />
      )}
      
      {/* Кнопка "Показать полностью" - вынесена за границу градиента */}
      {shouldShowExpand && (
        <div className="mt-4 pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-brand hover:text-brand/80 font-medium transition-colors underline decoration-brand/50 hover:decoration-brand"
          >
            {isExpanded ? 'Скрыть' : 'Показать полностью...'}
          </button>
        </div>
      )}
    </div>
  );
}

const ProductPage: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ product, meta }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  
  // Безопасная деструктуризация с дефолтными значениями
  const {
    id = '',
    name = 'Товар',
    slug = '',
    image = {},
    gallery = [],
    description = '',
    created_at = '',
    updated_at = '',
    ratings = 0,
    rating_count = [],
    total_reviews = 0,
    tags = [],
    type = {},
    price = 0,
    sale_price = null,
    status = 'draft',
    shop = {},
    categories = [],
    attributes = [],
    variations = [],
    variation_options = [],
    related_products = [],
    // Гарантируем images
    images = [],
  } = product || {};

  // Используем images если есть, иначе gallery
  const productImages = images && Array.isArray(images) && images.length > 0 
    ? images 
    : (gallery && Array.isArray(gallery) ? gallery : []);
  
  const previews = getPreviews(productImages, image);
  
  // Если товара нет - показываем заглушку
  if (!product || !id) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Товар не найден</h1>
            <p className="mt-2">Попробуйте поискать другой товар</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              На главную
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Формируем canonical URL если его нет в meta
  // ВАЖНО: canonical URL должен быть в формате /element/{slug}-{id} БЕЗ языкового префикса
  // Товары не имеют языковых версий
  let canonicalUrl = meta?.canonical;
  
  const baseUrl = 'https://sancan.ru';
  
  // Если canonical нет в meta или он неправильный (только домен), формируем сами
  if (!canonicalUrl || canonicalUrl === 'https://sancan.ru' || canonicalUrl === 'https://sancan.rv' || !canonicalUrl.includes('/element/')) {
    if (slug && id) {
      // Всегда без языкового префикса: /element/{slug}-{id}
      canonicalUrl = `${baseUrl}/element/${slug}-${id}`;
    } else if (slug) {
      canonicalUrl = `${baseUrl}/element/${slug}`;
    } else if (typeof window !== 'undefined') {
      // Клиентская сторона - убираем языковой префикс из текущего URL если есть
      const pathname = window.location.pathname.replace(/^\/[a-z]{2}\//, '/');
      canonicalUrl = window.location.origin + pathname;
    }
  }
  
  // Логируем для отладки
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductPage] Canonical URL:', {
      fromMeta: meta?.canonical,
      final: canonicalUrl,
      slug,
      id,
    });
  }

  // Формируем описание для SEO
  const seoDescription = meta?.description || (description ? description.substring(0, 160).replace(/<[^>]*>/g, '') : '');
  const ogImage = meta?.og_image || (previews[0]?.original || previews[0]?.url || '');

  // Логируем canonical URL для отладки
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductPage] Passing to TitleSeo:', {
      canonical: canonicalUrl,
      hasCanonical: !!canonicalUrl,
      metaCanonical: meta?.canonical,
    });
  }

  return (
    <>
      {/* SEO теги из meta данных API */}
      <TitleSeo 
        title={meta?.title || name}
        description={seoDescription}
        canonical={canonicalUrl}
        hreflang={meta?.hreflang}
        ogImage={ogImage}
        ogType="product"
        productPrice={price > 0 ? price : undefined}
        productCurrency="RUB"
      />
      
      <div className="relative">
        <div className="h-full min-h-screen p-4 md:px-6 lg:px-8 lg:pt-6">
          {/* Хлебные крошки */}
          <div className="mb-6">
            <ProductBreadcrumbs product={product} />
          </div>
          
          {/* Проверка загрузки данных */}
          {status !== 'publish' && (
            <div className="mb-4 rounded bg-yellow-100 p-3 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Этот товар находится в черновике
            </div>
          )}
          
          {/* Трехколоночная структура */}
          <motion.div
            variants={staggerTransition()}
            className="grid gap-6 lg:grid-cols-12 lg:gap-8"
          >
            {/* Левая колонка - Слайдер изображений */}
            <motion.div
              variants={fadeInBottomWithScaleX()}
              className="lg:col-span-5"
            >
              <ProductImageSlider 
                product={product}
                images={previews}
              />
            </motion.div>

            {/* Средняя колонка - Информация о товаре */}
            <motion.div
              variants={fadeInBottom()}
              className="lg:col-span-4 space-y-6"
            >
              {/* Описание товара */}
              <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
                <ProductDescription description={description} />
              </div>

              {/* Варианты товара (если товар в группе) */}
              <ProductVariationsErrorBoundary>
                <GroupProductVariations product={product} />
              </ProductVariationsErrorBoundary>

              {/* Характеристики товара */}
              <ProductAttributes product={product} />

              {/* Теги товара */}
              {tags && tags.length > 0 && (
                <ProductTags tags={tags} />
              )}
            </motion.div>

            {/* Правая колонка - Покупка и доставка */}
            <motion.div
              variants={fadeInBottom()}
              className="lg:col-span-3 space-y-6"
            >
              {/* Блок с ценой */}
              <ProductPriceBlock 
                price={price}
                sale_price={sale_price}
                product={product}
              />
              
              {/* Блок с информацией о доставке */}
              <ProductDeliveryBlock product={product} />
              
            </motion.div>
          </motion.div>

          {/* Нижняя часть - Отзывы и вопросы */}
          <motion.div
            variants={fadeInBottom()}
            className="mt-12 space-y-8"
          >
            {/* Отзывы */}
            <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
              <AverageRatings
                ratingCount={rating_count}
                totalReviews={total_reviews}
                ratings={ratings}
              />
              <ProductReviews productId={id} />
            </div>

            {/* Вопросы */}
            <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
              <ProductQuestions
                productId={id}
                shopId={shop?.id}
              />
            </div>

            {/* Поделиться */}
            <ProductSocialShare
              productSlug={slug}
              className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg"
            />
          </motion.div>

          {/* Похожие товары */}
          {related_products && related_products.length > 0 && (
            <motion.div
              variants={fadeInBottom()}
              className="mt-8"
            >
              <SimilarProducts 
                currentProductSlug={slug}
                relatedProducts={related_products}
              />
            </motion.div>
          )}
        </div>
        
        {/* Статичная панель внизу (десктоп) */}
        <motion.div
          variants={fadeInBottomWithScaleY()}
          className="sticky bottom-0 right-0 z-10 hidden h-[100px] w-full border-t border-light-500 bg-light-100 px-8 py-5 dark:border-dark-400 dark:bg-dark-200 lg:flex 3xl:h-[120px]"
        >
          <ProductDetailsPaper product={product} />
        </motion.div>
        
        {/* Мобильная фиксированная панель */}
        <ProductMobileBuyBar product={product} />
      </div>
    </>
  );
};

ProductPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProductPage;