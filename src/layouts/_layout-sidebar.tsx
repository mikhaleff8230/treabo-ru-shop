import cn from 'classnames';
import routes from '@/config/routes';
import ActiveLink from '@/components/ui/links/active-link';
import { DiscoverIcon } from '@/components/icons/discover-icon';
import { HomeIcon } from '@/components/icons/home-icon';
import { SettingIcon } from '@/components/icons/setting-icon';
import { CloseIcon } from '@/components/icons/close-icon';
import { useDrawer } from '@/components/drawer-views/context';
import { ProductIcon } from '@/components/icons/product-icon';
import { PeopleIcon } from '@/components/icons/people-icon';
import { PaperPlaneIcon } from '@/components/icons/paper-plane-icon';
import Scrollbar from '@/components/ui/scrollbar';
import Copyright from '@/layouts/_copyright';
import { UserFollowingIcon } from '@/components/icons/user-following-icon';
import { useMe } from '@/data/user';
import { FeedIcon } from '@/components/icons/feed-icon';
import { LayoutIcon } from '@/components/icons/layout-icon';
import { CollectionIcon } from '@/components/icons/collection-icon';
import { ShopIcon } from '@/components/icons/shop-icon';
import { CartIcon } from '@/components/icons/cart-icon';
import { useCart } from '@/components/cart/lib/cart.context';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useTranslation } from 'next-i18next';
import { LocationWithModal } from '@/components/GeoLocation/LocationWithModal';
import Logo from '@/components/ui/logo';
import { PlusCircleIcon } from '@/components/icons/plus-circle-icon';
import CreatePlaceModal from '@/components/places/CreatePlaceModal';
import { useState } from 'react';

interface NavLinkProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  isCollapse?: boolean;
}

function NavLink({ href, icon, title, isCollapse }: NavLinkProps) {
  return (
    <ActiveLink
      href={href}
      className="my-0.5 flex items-center gap-1 px-4 py-3 hover:bg-light-300 hover:dark:bg-dark-300 xs:px-6 sm:my-1 sm:gap-1.5 sm:px-7 lg:gap-2 xl:my-0.5"
      activeClassName="text-dark-100 active-text-dark dark:active-text-light dark:text-light-400 font-medium bg-light-400 dark:bg-dark-400 hover:bg-light-600 hover:dark:bg-dark-500"
    >
      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-start',
          isCollapse ? 'w-8 xl:w-auto' : 'w-auto xl:w-8'
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'text-dark-100 dark:text-light-400 text-[15px]',
          isCollapse ? 'inline-flex xl:hidden' : 'hidden xl:inline-flex'
        )}
      >
        {title}
      </span>
    </ActiveLink>
  );
}

function CartNavLink({ isCollapse }: { isCollapse?: boolean }) {
  const { t } = useTranslation('common');
  const { openDrawer } = useDrawer();
  const { totalItems } = useCart();
  const isMounted = useIsMounted();
  
  return (
    <button
      onClick={() => openDrawer('CART_VIEW')}
      className="my-0.5 flex items-center gap-1 px-4 py-3 hover:bg-light-300 hover:dark:bg-dark-300 xs:px-6 sm:my-1 sm:gap-1.5 sm:px-7 lg:gap-2 xl:my-0.5 w-full text-left"
    >
      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-start relative',
          isCollapse ? 'w-8 xl:w-auto' : 'w-auto xl:w-8'
        )}
      >
        <span className="relative">
          <CartIcon className="h-[18px] w-[18px] text-current" />
          {isMounted && totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex min-h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-light-100 bg-brand px-0.5 text-[10px] font-bold leading-none text-light dark:border-dark-250">
              {totalItems}
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'text-dark-100 dark:text-light-400 text-[15px]',
          isCollapse ? 'inline-flex xl:hidden' : 'hidden xl:inline-flex'
        )}
      >
        Корзина
      </span>
    </button>
  );
}

export function Sidebar({
  isCollapse,
  className = 'hidden sm:flex fixed bottom-0 z-20 pt-[82px]',
  onToggle,
}: {
  isCollapse?: boolean;
  className?: string;
  onToggle?: () => void;
}) {
  const { t } = useTranslation('common');
  const { me } = useMe();

  return (
    <aside
      className={cn(
        'h-full flex-col justify-between overflow-y-auto border-r border-light-400 bg-light-100 text-dark-900 dark:border-0 dark:bg-dark-200',
        isCollapse ? 'sm:w-60 xl:w-[75px]' : 'sm:w-[75px] xl:w-60',
        className
      )}
    >
      <Scrollbar className="relative h-full w-full">
        <div className="flex h-full w-full flex-col">
          <nav className="flex flex-col">
          <NavLink
              title="Главная"
              href={routes.home}
              isCollapse={isCollapse}
              icon={<HomeIcon className="h-[18px] w-[18px] text-current" />}
            />
          <NavLink
              title={t('text-places')}
              href={routes.placesFeed}
              isCollapse={isCollapse}
              icon={<LayoutIcon className="h-[18px] w-[18px] text-current" />}
            />
            <NavLink
              title="Коллекция"
              href={routes.feed}
              isCollapse={isCollapse}
              icon={<CollectionIcon className="h-[22px] w-[22px] text-current" />}
            />
            <NavLink
              title={t('text-top-authors')}
              href={routes.authors}
              isCollapse={isCollapse}
              icon={<HomeIcon className="h-[18px] w-[18px] text-current" />}
            />
            
          </nav>

            
    

          <nav className="mt-auto flex flex-col pb-4">
            <CartNavLink isCollapse={isCollapse} />
            <NavLink
              title="Профиль"
              href={routes.profile}
              isCollapse={isCollapse}
              icon={<SettingIcon className="h-[18px] w-[18px] text-current" />}
            />
            {/* Компонент геолокации как пункт меню */}
            <div className="my-0.5 px-4 py-3 hover:bg-light-300 hover:dark:bg-dark-300 xs:px-6 sm:my-1 sm:px-7">
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                  {/* Иконка локации */}
                  <span
                    className={cn(
                      'flex flex-shrink-0 items-center justify-start',
                      isCollapse ? 'w-8 xl:w-auto' : 'w-auto xl:w-8'
                    )}
                  >
                    <svg 
                      className="h-[18px] w-[18px] text-current" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  </span>

                  {/* Текст местоположения */}
                  <div
                    className={cn(
                      'text-dark-100 dark:text-light-400 text-[15px]',
                      isCollapse ? 'inline-flex xl:hidden' : 'hidden xl:inline-flex'
                    )}
                  >
                         <LocationWithModal isCollapse={isCollapse} />
                  </div>
                </div>
              </div>
          </nav>
        </div>
      </Scrollbar>

      <footer
        className={cn(
          'flex-col border-t border-light-400 pt-3 pb-4 text-center dark:border-dark-400',
          isCollapse ? 'flex xl:hidden' : 'hidden xl:flex'
        )}
      >
        <nav className="flex items-center justify-center gap-5 pb-1.5 text-13px font-medium tracking-[0.2px]">
          <ActiveLink
            href="https://sancan.ru/help"
            className="block py-2 text-dark-700 hover:text-dark-100 dark:hover:text-brand text-[12px]"
          >Частые вопросы и поддержка
          </ActiveLink>
          
        </nav>
        <Copyright className="text-xs font-medium text-dark-800/80 dark:text-dark-700" />
      </footer>
    </aside>
  );
}

export default function SidebarDrawerView() {
  const { closeDrawer } = useDrawer();
  const { t } = useTranslation('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <div className="relative z-50 h-full flex flex-col">
        <div className="flex h-[70px] items-center justify-between py-2 px-5 xs:px-7 relative z-50">
          <Logo />
          <div className="ml-3 flex h-7 items-center gap-2">
            {/* Кнопка создания плейса */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                closeDrawer();
              }}
              className="p-2 text-dark-900 outline-none transition-all hover:text-dark dark:text-dark-800 hover:dark:text-light-200 touch-manipulation"
              aria-label={t('text-create')}
            >
              <PlusCircleIcon className="h-5 w-5" />
            </button>
            {/* Кнопка закрытия */}
            <button
              type="button"
              className="-m-2 p-2 text-dark-900 outline-none transition-all hover:text-dark dark:text-dark-800 hover:dark:text-light-200 touch-manipulation"
              onClick={closeDrawer}
            >
              <span className="sr-only">{t('text-close-panel')}</span>
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative z-50 overflow-hidden">
          <Sidebar isCollapse={true} className="flex text-13px relative z-50" />
        </div>
      </div>
      <CreatePlaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
