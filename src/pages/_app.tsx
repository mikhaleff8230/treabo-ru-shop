import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { appWithTranslation } from 'next-i18next';
import { validateEnvironmentVariables } from '@/config/validate-environment-variables';
import DefaultSeo from '@/layouts/_default-seo';
import MobileThemeSync from '@/components/ui/mobile-theme-sync';

// base css file
import '@/assets/css/scrollbar.css';
import '@/assets/css/swiper-carousel.css';
import '@/assets/css/pagination.css';
import '@/assets/css/globals.css';

import { useRouter } from 'next/router';
import { getDirection } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { trackYandexMetrikaPageView } from '@/lib/yandex-metrika';

const CookieConsent = dynamic(() => import('@/components/common/cookie-consent'), {
  ssr: false,
});

validateEnvironmentVariables();

// Скрипт для установки темы на мобильных устройствах до гидратации React
if (typeof window !== 'undefined') {
  // Проверяем, что это мобильное устройство
  const isMobile = window.innerWidth < 640;
  
  if (isMobile) {
    // Определяем системную тему
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersDark = mediaQuery.matches;
    
    // Проверяем, была ли тема установлена пользователем
    const savedTheme = localStorage.getItem('theme');
    const isUserTheme = savedTheme && savedTheme !== 'system' && savedTheme !== '""' && savedTheme !== '';
    
    // Если пользователь не установил свою тему, устанавливаем системную
    if (!isUserTheme) {
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const { locale } = router;
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 минут
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }));

  // (restored) no extra side-effects here

  const getLayout = Component.getLayout ?? ((page) => page);
  const dir = getDirection(locale);
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  useEffect(() => {
    const handleRouteChange = (url: string) => trackYandexMetrikaPageView(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
    }

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => undefined);
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="theme"
        >
          <MobileThemeSync />
          <DefaultSeo />
          {getLayout(<Component {...pageProps} />)}
          {!Component.hideCookieConsent && <CookieConsent />}
          <Toaster containerClassName="!top-16 sm:!top-3.5 !bottom-16 sm:!bottom-3.5" />
        </ThemeProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}

export default appWithTranslation(CustomApp);
