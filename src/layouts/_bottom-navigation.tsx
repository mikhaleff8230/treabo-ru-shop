import { useRouter } from 'next/router';
import routes from '@/config/routes';
import Button from '@/components/ui/button';
import { HomeIcon } from '@/components/icons/home-icon';
import { PlusCircleIcon } from '@/components/icons/plus-circle-icon';
import { HeartOutlineIcon } from '@/components/icons/heart-outline';
import DropdownCategoriesMenu from '@/components/menu/dropdown-categories-menu';
import { useMe } from '@/data/user';
import Avatar from 'react-avatar';
import { useState } from 'react';
import CreatePlaceModal from '@/components/places/CreatePlaceModal';
import { useTranslation } from 'next-i18next';
import { UserIcon } from '@/components/icons/user-icon';

export default function BottomNavigation() {
  const router = useRouter();
  const { me, isAuthorized } = useMe();
  const { t } = useTranslation('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      {/* 🌌 SYSTEM GLOW — АНИМИРОВАННЫЙ ФОН ПОД НАВИГАЦИЕЙ */}
      <div className="system-glow pointer-events-none" />
      
      <nav className="bottom-menu fixed bottom-0 left-0 right-0 z-30 grid h-14 w-full grid-cols-5 items-center justify-items-center text-center shadow-bottom-nav backdrop-blur-xl bg-light/90 dark:bg-dark-300/90 sm:hidden" style={{ margin: 0, padding: 0 }}>
        {/* Домой */}
        <Button
          variant="icon"
          aria-label="Home"
          onClick={() => router.push(routes.home)}
          className="flex h-full w-full items-center justify-center"
        >
          <HomeIcon className="h-6 w-6" />
        </Button>

        {/* Кнопка создания плейса (кружок с плюсом) */}
        <Button
          variant="icon"
          aria-label="Create Place"
          onClick={() => setIsModalOpen(true)}
          className="flex h-full w-full items-center justify-center"
        >
          <PlusCircleIcon className="h-6 w-6" />
        </Button>

        {/* Каталог (посередине) */}
        <div className="flex h-full w-full items-center justify-center">
          <DropdownCategoriesMenu compact={true} />
        </div>

        {/* Избранное (сердечко) */}
        <Button
          variant="icon"
          aria-label="Wishlist"
          onClick={() => router.push(routes.wishlists)}
          className="flex h-full w-full items-center justify-center"
        >
          <HeartOutlineIcon className="h-6 w-6" />
        </Button>

        {/* Профиль/Аватар (справа) */}
        {isAuthorized && me ? (
          <Button
            variant="icon"
            aria-label="Profile"
            onClick={() => router.push(routes.profile)}
            className="relative flex h-full w-full items-center justify-center"
          >
            <Avatar
              size="36"
              round={true}
              name={me.name}
              textSizeRatio={2}
              src={me?.profile?.avatar?.thumbnail}
            />
          </Button>
        ) : (
          <Button
            variant="icon"
            aria-label="Profile"
            onClick={() => router.push(routes.profile)}
            className="flex h-full w-full items-center justify-center"
          >
            <UserIcon className="h-6 w-6" />
          </Button>
        )}
      </nav>
      
      {/* Модальное окно создания плейса */}
      <CreatePlaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
