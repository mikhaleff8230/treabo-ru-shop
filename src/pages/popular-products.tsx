import Grid from '@/components/product/grid';
import { TitleSeo } from '@/components/seo/title-seo';
import ButtonGroup from '@/components/ui/button-group';
import { usePopularProducts } from '@/data/product';
import Layout from '@/layouts/_layout';
import type { NextPageWithLayout } from '@/types';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState } from 'react';

const MAP_RANGE_FILTER = [
  {
    label: 'text-weekly',
    range: 7,
  },
  {
    label: 'text-monthly',
    range: 30,
  },
  {
    label: 'text-yearly',
    range: 365,
  },
];

function Products() {
  let [selected, setRange] = useState(MAP_RANGE_FILTER[2]);
  const { popularProducts, isLoading } = usePopularProducts({
    range: selected.range,
  });
  const { t } = useTranslation('common');
  return (
    <>
      <div className="flex flex-col-reverse flex-wrap items-center justify-between px-4 pt-5 pb-4 xs:flex-row xs:space-x-4 md:px-6 md:pt-6 lg:px-7 3xl:px-8">
        <div className="pt-3 xs:pt-0">
          {t('text-total')} {popularProducts.length} {t('text-product-found')}
        </div>
        <ButtonGroup
          items={MAP_RANGE_FILTER}
          selectedValue={selected}
          onChange={setRange}
        />
      </div>
      <Grid
        products={popularProducts}
        hasNextPage={false}
        isLoadingMore={false}
        isLoading={isLoading}
      />
    </>
  );
}

const PopularProductsPage: NextPageWithLayout = () => {
  return (
    <>
      <TitleSeo title={'Top Products'} />
      <Products />
    </>
  );
};

PopularProductsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60, // In seconds
  };
};

export default PopularProductsPage;
