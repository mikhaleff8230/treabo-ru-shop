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

// Dynamic rendering - no static generation
type PageProps = {
  product: Product;
};

export const getServerSideProps: GetServerSideProps<
  PageProps
> = async ({ params, locale, res }) => {
  const { productSlug } = params!;
  
  // Редирект на новый формат URL /element/{slug} для обратной совместимости
  return {
    redirect: {
      destination: `/element/${productSlug}`,
      permanent: true, // 301 редирект для SEO
    },
  };
};

function getPreviews(gallery: any[], image: any) {
  if (!isEmpty(gallery) && Array.isArray(gallery)) return gallery;
  if (!isEmpty(image)) return [image, {}];
  return [{}, {}];
}

const ProductPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ product }) => {
  const { t } = useTranslation('common');
  const {
    id,
    name,
    slug,
    image,
    gallery,
    description,
    created_at,
    updated_at,
    ratings,
    rating_count,
    total_reviews,
    tags,
    type,
  } = product;
  const router = useRouter();
  const previews = getPreviews(gallery, image);

  return (
    <>
      <TitleSeo title={name} />
      <div className="relative">
        <div className="h-full min-h-screen p-4 md:px-6 lg:px-8 lg:pt-6">
          {/* Хлебные крошки */}
          <div className="mb-6">
            <ProductBreadcrumbs product={product} />
          </div>
          {/* Трехколоночная структура в стиле Озона */}
          <motion.div
            variants={staggerTransition()}
            className="grid gap-6 lg:grid-cols-12 lg:gap-8"
          >
            {/* Левая колонка - Слайдер изображений */}
            <motion.div
              variants={fadeInBottomWithScaleX()}
              className="lg:col-span-5"
            >
              <ProductImageSlider product={product} />
            </motion.div>

            {/* Средняя колонка - Информация о товаре */}
            <motion.div
              variants={fadeInBottom()}
              className="lg:col-span-4 space-y-6"
            >
              {/* Описание товара - первая плашка */}
              <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-dark dark:text-light mb-4">
                  {t('text-description')}
                </h3>
                <div 
                  className="text-sm leading-relaxed text-dark dark:text-light prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: description || '' }}
                />
              </div>

              {/* Характеристики товара (атрибуты) */}
              <ProductAttributes product={product} />

              {/* Теги товара */}
              <ProductTags tags={product.tags} />
            </motion.div>

            {/* Правая колонка - Покупка и доставка */}
            <motion.div
              variants={fadeInBottom()}
              className="lg:col-span-3 space-y-6"
            >
              {/* Блок с ценой и кнопками */}
              <ProductPriceBlock product={product} />
              
              {/* Блок с информацией о доставке */}
              <ProductDeliveryBlock product={product} />
            </motion.div>
          </motion.div>

          {/* Нижняя часть - Отзывы и вопросы */}
          <motion.div
            variants={fadeInBottom()}
            className="mt-12 space-y-8"
          >
            <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
              <AverageRatings
                ratingCount={rating_count}
                totalReviews={total_reviews}
                ratings={ratings}
              />
              <ProductReviews productId={id} />
            </div>
            
            <div className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg">
              <ProductQuestions
                productId={product?.id}
                shopId={product?.shop?.id}
              />
            </div>

                      <ProductSocialShare
            productSlug={slug}
            className="bg-light-100 dark:bg-dark-200 p-6 rounded-lg"
          />
        </motion.div>

        {/* Блок "Рекомендуем также" */}
        <motion.div
          variants={fadeInBottom()}
          className="mt-8"
        >
          <SimilarProducts currentProductSlug={slug} />
        </motion.div>
      </div>
        
        <motion.div
          variants={fadeInBottomWithScaleY()}
          className="sticky bottom-0 right-0 z-10 hidden h-[100px] w-full border-t border-light-500 bg-light-100 px-8 py-5 dark:border-dark-400 dark:bg-dark-200 lg:flex 3xl:h-[120px]"
        >
          <ProductDetailsPaper product={product} />
        </motion.div>
      {/* Мобильная фиксированная панель покупки */}
      <ProductMobileBuyBar product={product} />
      </div>
    </>
  );
};

ProductPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProductPage;
