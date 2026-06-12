import type { User } from '@/types';
import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/router';
import Avatar from 'react-avatar';
import routes from '@/config/routes';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import ActiveLink from '@/components/ui/links/active-link';
import { useLogout, useMe } from '@/data/user';
import { Menu } from '@/components/ui/dropdown';
import { Transition } from '@/components/ui/transition';
import { UserIcon } from '@/components/icons/user-icon';
import SearchInput from '@/components/search/search-input';
import CartButton from '@/components/cart/cart-button';
import Hamburger from '@/components/ui/hamburger';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useSwapBodyClassOnScrollDirection } from '@/lib/hooks/use-swap-body-class';
import { useDynamicHeader } from '@/lib/hooks/use-dynamic-header';
import { useModalAction } from '@/components/modal-views/context';
import { useDrawer } from '@/components/drawer-views/context';
import Button from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { LayoutGrid } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import DropdownCategoriesMenu from '@/components/menu/dropdown-categories-menu';
import CreatePlaceModal from '@/components/places/CreatePlaceModal';
import Logo from '@/components/ui/logo';
import { useState } from 'react';
import cn from 'classnames';
import { PlusCircleIcon } from '@/components/icons/plus-circle-icon';
import ChatButton from '@/components/chat/ChatButton';

const AuthorizedMenuItems = [
  {
    label: 'text-auth-profile',
    path: routes.profile,
  },
  {
    label: 'text-auth-purchase',
    path: routes.purchases,
  },
  {
    label: 'text-auth-wishlist',
    path: routes.wishlists,
  },
  {
    label: 'text-followed-authors',
    path: routes.followedShop,
  },
  {
    label: 'text-auth-password',
    path: routes.password,
  },
  {
    label: 'Сообщения',
    path: '/chat',
  },
];

function AuthorizedMenu({ user }: { user: User }) {
  const { mutate: logout } = useLogout();
  const { t } = useTranslation('common');
  return (
    <Menu>
      <Menu.Button className="relative inline-flex h-8 w-8 justify-center rounded-full border border-light-400 bg-light-300 dark:border-dark-500 dark:bg-dark-500">
        {/* @ts-ignore */}
        <Avatar
          size="32"
          round={true}
          name={user.name}
          textSizeRatio={2}
          src={user?.profile?.avatar?.thumbnail}
        />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute top-[84%] z-30 mt-4 w-56 rounded-md bg-light py-1.5 text-dark shadow-dropdown ltr:right-0 ltr:origin-top-right rtl:left-0 rtl:origin-top-left dark:bg-dark-250 dark:text-light">
          {AuthorizedMenuItems.map((item) => (
            <Menu.Item key={item.label}>
              <ActiveLink
                href={item.path}
                className="transition-fill-colors flex w-full items-center px-5 py-2.5 hover:bg-light-400 dark:hover:bg-dark-600"
              >
                {t(item.label)}
              </ActiveLink>
            </Menu.Item>
          ))}
          <Menu.Item>
            <button
              type="button"
              className="transition-fill-colors w-full px-5 py-2.5 hover:bg-light-400 ltr:text-left rtl:text-right dark:hover:bg-dark-600"
              onClick={() => logout()}
            >
              {t('text-logout')}
            </button>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function LoginMenu() {
  const { openModal } = useModalAction();
  const { me, isAuthorized, isLoading } = useMe();
  const isMounted = useIsMounted();
  if (!isMounted) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-light-300 dark:bg-dark-500" />
    );
  }
  if (isAuthorized && me && !isLoading) {
    return <AuthorizedMenu user={me} />;
  }
  return (
    <Button
      variant="icon"
      aria-label="User"
      className="flex"
      onClick={() => openModal('LOGIN_VIEW')}
    >
      <UserIcon className="h-5 w-5" />
    </Button>
  );
}

interface HeaderProps {
  isCollapse?: boolean;
  showHamburger?: boolean;
  onClickHamburger?: () => void;
}

export default function Header({
  isCollapse,
  showHamburger = false,
  onClickHamburger,
}: HeaderProps) {
  const router = useRouter();
  const { asPath } = router;
  const { t } = useTranslation('common');
  const { me, isAuthorized } = useMe();
  const { openDrawer } = useDrawer();
  useSwapBodyClassOnScrollDirection();
  
  // Используем динамический хедер только для мобильных устройств
  const { isCompact, isVisible } = useDynamicHeader();
  
  // Проверяем, находимся ли мы на странице товара
  const isProductPage = asPath?.startsWith('/element/');
  const isMultiLangEnable =
    process.env.NEXT_PUBLIC_ENABLE_MULTI_LANG === 'true' &&
    !!process.env.NEXT_PUBLIC_AVAILABLE_LANGUAGES;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функция для открытия мобильного меню (сайдбара)
  const handleMobileMenuClick = () => {
    // На мобильных устройствах открываем drawer с меню
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      openDrawer('MOBILE_MENU');
    } else {
      // На десктопе используем обычный toggle сайдбара
      onClickHamburger?.();
    }
  };

  // Обработка изменения маршрута для исправления "ghost header" (только для мобильных)
  useEffect(() => {
    // Проверяем, что мы на мобильном устройстве
    if (typeof window === 'undefined' || window.innerWidth >= 640) {
      return;
    }

    const handleRouteChangeComplete = () => {
      // При изменении маршрута пересчитываем состояние хедера
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const scrollEvent = new Event('scroll', { bubbles: true });
          window.dispatchEvent(scrollEvent);
          requestAnimationFrame(() => {
            window.dispatchEvent(scrollEvent);
            if (window.scrollY === 0) {
              window.scrollTo(0, 0);
            }
          });
        }
      }, 50);
    };

    if (router.events) {
      router.events.on('routeChangeComplete', handleRouteChangeComplete);
      router.events.on('routeChangeStart', () => {
        if (typeof window !== 'undefined' && window.scrollY === 0) {
          handleRouteChangeComplete();
        }
      });
    }
    
    handleRouteChangeComplete();

    return () => {
      if (router.events) {
        router.events.off('routeChangeComplete', handleRouteChangeComplete);
      }
    };
  }, [asPath, router]);
  
  return (
    <>
      {/* Desktop: Статичный хедер (без динамики) */}
      <header className="app-header sticky top-0 z-50 w-full border-b border-light-300 bg-light ltr:left-0 rtl:right-0 dark:border-dark-300 dark:bg-dark-250 hidden sm:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Левая часть - логотип и кнопка Каталог */}
            <div className="flex items-center gap-2">
              {showHamburger && (
                <Hamburger
                  isToggle={isCollapse}
                  onClick={onClickHamburger}
                  className="hidden lg:flex"
                />
              )}
              <Logo className="w-30 h-10" />
              <div className="hidden sm:flex">
                <DropdownCategoriesMenu />
              </div>
            </div>

            {/* Центральная часть - поиск */}
            <div className="flex-1 hidden md:flex mx-4">
              <SearchInput className="w-full" />
            </div>

            {/* Правая часть - кнопки и меню */}
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              {asPath !== routes.checkout && (
                <CartButton className="hidden sm:flex" />
              )}
              {isMultiLangEnable ? (
                <div className="ltr:ml-auto rtl:mr-auto">
                  <LanguageSwitcher />
                </div>
              ) : (
                ''
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>{t('text-create')}</span>
              </button>
              <CreatePlaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
              <LoginMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: Динамический хедер (с компактным режимом) */}
      {/* Скрываем на странице товара */}
      <header 
        className={cn(
          "app-header sticky top-0 z-50 w-full border-b border-light-300 bg-light ltr:left-0 rtl:right-0 dark:border-dark-300 dark:bg-dark-250 transition-all duration-300 ease-in-out sm:hidden",
          {
            "transform translate-y-0": isVisible,
            "shadow-sm": isCompact,
            "hidden": isProductPage, // Скрываем на странице товара
          }
        )}
      >
        <div className={cn(
          "container mx-auto px-4 transition-all duration-300 ease-in-out",
          {
            "opacity-100 translate-y-0": isVisible,
            "opacity-95": !isVisible,
          }
        )}>
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Логотип */}
            <div className="flex-shrink-0">
              <Logo className="w-20 h-8" />
            </div>

            {/* Поиск */}
            <div className="flex-1 min-w-0">
              <SearchInput className="w-full" />
            </div>

            {/* Кнопка меню */}
            {showHamburger && (
              <Hamburger
                isToggle={isCollapse}
                onClick={handleMobileMenuClick}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
