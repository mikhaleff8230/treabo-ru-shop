import { useSettings } from '@/data/settings';
import { NextSeo as NextDefaultSeo } from 'next-seo';
type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  hreflang?: Array<{ hreflang: string; href: string }>;
  ogImage?: string;
  ogType?: string;
  productPrice?: number;
  productCurrency?: string;
};

export const TitleSeo = (props: Props) => {
  const { settings } = useSettings();

  return (
    <NextDefaultSeo
      additionalMetaTags={[
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1 maximum-scale=1',
        },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'theme-color',
          content: '#ffffff',
        },
        ...(props.productPrice ? [
          {
            property: 'product:price:amount',
            content: props.productPrice.toString(),
          },
          {
            property: 'product:price:currency',
            content: props.productCurrency || 'RUB',
          },
        ] : []),
      ]}
      additionalLinkTags={[
        {
          rel: 'apple-touch-icon',
          href: 'icons/apple-icon-180.png',
        },
        {
          rel: 'manifest',
          href: '/manifest.json',
        },
      ]}
      title={props.title ?? settings?.seo?.metaTitle}
      titleTemplate={`%s | ${
        settings?.seo?.metaTitle ||
        settings?.siteTitle ||
        'Платформа для продажи авторских вещей, брендов и хендмейда.'
      }`}
      defaultTitle="Treabo — маркетплейс услуг и специалистов"
      description={props.description || settings?.seo?.metaDescription || settings?.siteSubtitle}
      // Используем только переданный canonical, без fallback на settings
      // чтобы избежать дублирования с DefaultSeo
      canonical={props.canonical}
      languageAlternates={props.hreflang ? props.hreflang.map(tag => ({
        hrefLang: tag.hreflang,
        href: tag.href,
      })) : undefined}
      openGraph={{
        url: props.canonical || settings?.seo?.canonicalUrl,
        title: props.title || settings?.seo?.ogTitle,
        description: props.description || settings?.seo?.ogDescription,
        type: props.ogType || 'website',
        locale: 'ru_RU',
        site_name: settings?.siteTitle,
        images: [
          {
            url: props.ogImage || settings?.seo?.ogImage?.original ?? '',
            width: 800,
            height: 600,
            alt: props.title || settings?.seo?.ogTitle,
          },
        ],
      }}
      twitter={{
        handle: settings?.seo?.twitterHandle,
        site: settings?.siteTitle,
        cardType: settings?.seo?.twitterCardType,
      }}
    />
  );
};
