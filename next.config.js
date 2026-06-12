/** @type {import('next').NextConfig} */
const runtimeCaching = require('./pwa-runtime-caching');
const { i18n } = require('./next-i18next.config');

const withPWA = require('next-pwa')({
  disable: process.env.DISABLE_PWA === 'true' || process.env.NODE_ENV === 'development',
  dest: 'public',
  runtimeCaching,
  // Не вешать отдельный NetworkFirst на document "/" — иначе те же no-response при сбое сети
  cacheStartUrl: false,
});

module.exports = withPWA({
  reactStrictMode: true,
  i18n,
  webpack: (config, { isServer }) => {
    // Исключаем Node.js модули из клиентского бандла
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/treabo/:path*',
        destination: `${process.env.TREABO_API_ENDPOINT || process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT || 'http://127.0.0.1:8001/api'}/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || process.env.NEXT_PUBLIC_API_URL || 'https://api.sancan.ru'}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/explore', destination: '/', permanent: true, locale: false },
      { source: '/explore/:path*', destination: '/', permanent: true, locale: false },
    ];
  },
  images: {
    // Allow displaying images from any external host by disabling optimization
    // This avoids Next.js host checks for remote images from imports
    unoptimized: true,
    domains: [
      'localhost',
      '127.0.0.1:8000',
      'maps.googleapis.com',
      's3.amazonaws.com',
      'sancan.ru',
      'api.sancan.ru', // добавлен API домен для изображений
      'pixarlaravel.s3.ap-southeast-1.amazonaws.com',
      'pickbazarlaravel.s3.ap-southeast-1.amazonaws.com',
      '45.10.41.84', // добавлен API-домен
      's3.twcstorage.ru', // добавлен Timeweb S3 домен
      'svetlanashtefan.com', // временно для импортированных товаров
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '45.10.41.84',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'sancan.ru',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.sancan.ru',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 's3.twcstorage.ru',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'svetlanashtefan.com',
        pathname: '/**',
      },
    ],
  },
  ...(process.env.APPLICATION_MODE === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
});
