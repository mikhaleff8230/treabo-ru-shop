import DynamicProductGrid from '@/components/product/dynamic-grid';
import { TitleSeo } from '@/components/seo/title-seo';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import Layout from '@/layouts/_layout';
import type { NextPageWithLayout, Tag } from '@/types';
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
} from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { dehydrate, QueryClient } from '@tanstack/react-query';

// Dynamic rendering - no static generation
type PageProps = {
  tag: Tag;
};

export const getServerSideProps: GetServerSideProps<
  PageProps
> = async ({ params, locale, res }) => {
  const { tagSlug } = params!;
  
  // Set cache headers for better performance
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
  
  const queryClient = new QueryClient();
  try {
    const [tag] = await Promise.all([
      client.tags.get({ slug: tagSlug as string, language: locale }),
    ]);
    return {
      props: {
        tag,
        dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
        ...(await serverSideTranslations(locale!, ['common'])),
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
const TagPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ tag }) => {
  const { t } = useTranslation('common');
  
  const filters = {
    tags: tag.slug,
  };

  // Формируем canonical URL для страницы тега товара
  const baseUrl = 'https://sancan.ru';
  const canonicalUrl = `${baseUrl}/products/tags/${tag.slug}`;

  return (
    <>
      <TitleSeo 
        title={tag.name}
        canonical={canonicalUrl}
      />
      <div className="flex flex-col items-center justify-between gap-1.5 px-4 pt-5 pb-6 xs:flex-row md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <h2 className="font-medium capitalize text-dark-100 dark:text-light">
          #{tag.name}
        </h2>
      </div>
      <DynamicProductGrid
        limit={45}
        filters={filters}
        showLoadMore={true}
      />
    </>
  );
};

TagPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
export default TagPage;
