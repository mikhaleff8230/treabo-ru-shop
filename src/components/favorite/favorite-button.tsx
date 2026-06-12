import { useModalAction } from '@/components/modal-views/context';
import { useInWishlist, useToggleWishlist } from '@/data/wishlist';
import { useMe } from '@/data/user';
import classNames from 'classnames';
import { HeartFillIcon } from '@/components/icons/heart-fill';
import { HeartOutlineIcon } from '@/components/icons/heart-outline';
import { LoaderIcon } from 'react-hot-toast';

export default function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  variationId?: string;
  className?: string;
}) {
  const { isAuthorized } = useMe();
  const { toggleWishlist, isLoading: adding } = useToggleWishlist(productId);
  const { inWishlist, isLoading: checking } = useInWishlist({
    enabled: isAuthorized && !!productId,
    product_id: productId,
  });

  const { openModal } = useModalAction();

  function toggle() {
    if (!isAuthorized) {
      openModal('LOGIN_VIEW');
      return;
    }
    toggleWishlist({ product_id: productId });
  }

  const isLoading = adding || (isAuthorized && checking);
  
  // Если пользователь не авторизован, показываем кнопку сразу
  if (!isAuthorized) {
    return (
      <button
        type="button"
        className={classNames(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-light-400 dark:border-dark-500 bg-light dark:bg-dark-300 text-light-600 dark:text-dark-600 hover:border-brand hover:text-brand transition-all duration-200 hover:scale-105',
          className
        )}
        onClick={toggle}
        title="Добавить в избранное"
      >
        <HeartOutlineIcon className="h-5 w-5" />
      </button>
    );
  }

  if (isLoading) {
    return (
      <div
        className={classNames(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-light-400 dark:border-dark-500 bg-light dark:bg-dark-300',
          className
        )}
      >
        <LoaderIcon className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }
  return (
    <button
      type="button"
      className={classNames(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105',
        {
          'border-brand bg-brand/10 text-brand': inWishlist,
          'border-light-400 dark:border-dark-500 bg-light dark:bg-dark-300 text-light-600 dark:text-dark-600 hover:border-brand hover:text-brand': !inWishlist,
        },
        className
      )}
      onClick={toggle}
      title={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {inWishlist ? (
        <HeartFillIcon className="h-5 w-5" />
      ) : (
        <HeartOutlineIcon className="h-5 w-5" />
      )}
    </button>
  );
}
