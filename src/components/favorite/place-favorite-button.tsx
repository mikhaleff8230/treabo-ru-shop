import { useModalAction } from '@/components/modal-views/context';
import { useInPlaceWishlist, useTogglePlaceWishlist } from '@/data/place-wishlist';
import { useMe } from '@/data/user';
import classNames from 'classnames';
import { HeartFillIcon } from '@/components/icons/heart-fill';
import { HeartOutlineIcon } from '@/components/icons/heart-outline';
import { LoaderIcon } from 'react-hot-toast';

export default function PlaceFavoriteButton({
  placeId,
  className,
}: {
  placeId: string;
  className?: string;
}) {
  const { isAuthorized } = useMe();
  const { toggleWishlist, isLoading: adding } = useTogglePlaceWishlist(placeId);
  const { inWishlist, isLoading: checking } = useInPlaceWishlist({
    enabled: isAuthorized && !!placeId,
    place_id: placeId,
  });

  const { openModal } = useModalAction();

  function toggle() {
    if (!isAuthorized) {
      openModal('LOGIN_VIEW');
      return;
    }
    toggleWishlist({ place_id: placeId });
  }

  const isLoading = adding || (isAuthorized && checking);
  
  // Базовые стили по умолчанию
  const defaultStyles = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-light-400 dark:border-dark-500 bg-light dark:bg-dark-300 text-light-600 dark:text-dark-600 hover:border-brand hover:text-brand transition-all duration-200 hover:scale-105';
  
  // Если передан className, используем его как базовые стили (для карточек плейсов)
  const isCustomStyle = className && className.includes('rounded-full');
  const baseStyles = isCustomStyle ? 'flex items-center justify-center' : defaultStyles;
  const iconSize = isCustomStyle ? "h-4 w-4" : "h-5 w-5";
  const iconColor = isCustomStyle ? "text-red-500" : "";
  
  // Если пользователь не авторизован, показываем кнопку сразу
  if (!isAuthorized) {
    return (
      <button
        type="button"
        className={classNames(
          baseStyles,
          className
        )}
        onClick={toggle}
        title="Добавить в избранное"
      >
        <HeartOutlineIcon className={`${iconSize} ${iconColor}`} />
      </button>
    );
  }

  if (isLoading) {
    return (
      <div
        className={classNames(
          baseStyles,
          className
        )}
      >
        <LoaderIcon className={`${iconSize} ${isCustomStyle ? 'text-red-500' : 'text-brand'} animate-spin`} />
      </div>
    );
  }
  
  return (
    <button
      type="button"
      className={classNames(
        baseStyles,
        {
          'border-brand bg-brand/10 text-brand': inWishlist && !isCustomStyle,
          'border-light-400 dark:border-dark-500 bg-light dark:bg-dark-300 text-light-600 dark:text-dark-600 hover:border-brand hover:text-brand': !inWishlist && !isCustomStyle,
        },
        className
      )}
      onClick={toggle}
      title={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {inWishlist ? (
        <HeartFillIcon className={`${iconSize} ${iconColor}`} />
      ) : (
        <HeartOutlineIcon className={`${iconSize} ${iconColor}`} />
      )}
    </button>
  );
}

