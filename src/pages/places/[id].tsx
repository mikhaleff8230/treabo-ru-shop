import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import { TitleSeo } from '@/components/seo/title-seo';
import { Fragment, useEffect, useState, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MenuDotsHorizontalIcon } from '@/components/icons/menu-dots-horizontal-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { LinkIcon } from '@/components/icons/link-icon';
import { ExternalIcon } from '@/components/icons/external-icon';
import { ChevronLeft } from '@/components/icons/chevron-left';
import PlaceImageSlider from '@/components/places/place-image-slider';
import cn from 'classnames';
import { useMe } from '@/data/user';
import { useIsPlaceLiked, useTogglePlaceLike } from '@/data/place-like';
import { useTogglePlaceWishlist, useInPlaceWishlist } from '@/data/place-wishlist';
import { useDeletePlace } from '@/data/place-delete';
import { useModalAction } from '@/components/modal-views/context';
import { extractMediaUrls } from '@/data/utils/media-utils';
import SimilarPlaces from '@/components/places/similar-places';
import PlaceComments from '@/components/places/place-comments';
import { Component, ReactNode } from 'react';

// Обертка для обработки ошибок в компоненте комментариев
class PlaceCommentsWrapper extends Component<{ placeId: string | number }, { hasError: boolean }> {
  constructor(props: { placeId: string | number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('PlaceComments error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="text-center py-4 text-sm text-light-base dark:text-dark-base">
          Ошибка загрузки комментариев
        </div>
      );
    }

    return <PlaceComments placeId={this.props.placeId} />;
  }
}
import Image from 'next/image';
import avatarPlaceholder from '@/assets/images/placeholders/avatar.svg';
import { formatPlaceDate } from '@/data/utils/format';
import CreatePlaceModal from '@/components/places/CreatePlaceModal';
import { usePlace } from '@/data/place';
import Loader from '@/components/ui/loader/spinner/spinner';
import Link from 'next/link';
import routes from '@/components/config/routes';
import FollowButton from '@/components/follow/follow-button';
import { useQuery } from '@tanstack/react-query';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import { HttpClient } from '@/data/client/http-client';

function isValidImageUrl(url: string) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

interface PlaceDetailProps {
  place?: any;
  meta?: any;
  error?: string;
}

const PlaceDetailPage = ({ place: initialPlace, meta: initialMeta, error: initialError }: PlaceDetailProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const id = router.query.id as string;
  
  // Используем SSR данные, если они есть, иначе загружаем через хук
  const { place: hookPlace, isLoading: placeLoading, error: placeError } = usePlace(id || '');
  const place = initialPlace || hookPlace;
  const error = initialError || placeError;
  
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { me, isAuthorized } = useMe();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openModal } = useModalAction();
  const { liked, isLoading: likeLoading, refetch: refetchLiked } = useIsPlaceLiked(place?.id || '', true);
  const { togglePlaceLike, isLoading: toggling, data: toggleData } = useTogglePlaceLike(place?.id || '');
  const { toggleWishlist, isLoading: wishlistToggling } = useTogglePlaceWishlist(place?.id || '');
  const { inWishlist, isLoading: wishlistChecking } = useInPlaceWishlist({
    enabled: isAuthorized && !!place?.id,
    place_id: place?.id || '',
  });
  const { deletePlace, isLoading: deleteLoading } = useDeletePlace();
  const [localLiked, setLocalLiked] = useState(liked);
  const [localLikes, setLocalLikes] = useState(place?.likes_count || 0);
  const [localInWishlist, setLocalInWishlist] = useState(inWishlist);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  
  // Получаем магазин пользователя (автора плейса)
  const userId = place?.user?.id;
  const { data: userShops, isLoading: shopsLoading } = useQuery(
    ['user-shops', userId],
    () => client.shops.all({ 
      search: HttpClient.formatSearchParams({ owner_id: userId }),
      searchJoin: 'and'
    } as any),
    {
      enabled: !!userId && isAuthorized,
    }
  );
  const userShop = userShops?.data?.[0]; // Берем первый магазин пользователя
  
  useEffect(() => { setLocalLiked(liked); }, [liked]);
  useEffect(() => { setLocalLikes(place?.likes_count || 0); }, [place?.likes_count]);
  useEffect(() => { setLocalInWishlist(inWishlist); }, [inWishlist]);
  
  // Обновляем состояние после успешного переключения лайка
  useEffect(() => {
    if (toggleData) {
      setLocalLiked(toggleData.liked);
      setLocalLikes(toggleData.likes_count);
      refetchLiked(); // Обновляем статус лайка
    }
  }, [toggleData, refetchLiked]);
  
  const handleLike = () => {
    // Оптимистичное обновление UI
    setLocalLiked((prev: boolean) => !prev);
    setLocalLikes((prev: number) => prev + (localLiked ? -1 : 1));
    togglePlaceLike();
  };

  // Обработчик двойного нажатия для мобильных устройств (как в Instagram)
  const handleDoubleTap = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // Задержка между нажатиями в мс
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      
      // Показываем анимацию сердца
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 600);
      
      // Ставим лайк, если еще не поставлен
      if (!localLiked && !toggling && !likeLoading) {
        handleLike();
      }
      
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleWishlist = () => {
    if (!isAuthorized) {
      openModal('LOGIN_VIEW');
      return;
    }
    // Оптимистичное обновление UI
    setLocalInWishlist((prev: boolean) => !prev);
    toggleWishlist({ place_id: place?.id || '' });
  };


  // Показываем загрузку только если нет SSR данных и идет загрузка
  if (!initialPlace && placeLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader showText={false} />
      </div>
    );
  }

  if ((error || placeError) && !place) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-light-base dark:text-dark-base">
        {t('text-place-not-found')}
      </div>
    );
  }

  if (!place) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-light-base dark:text-dark-base">
        {t('text-place-not-found')}
      </div>
    );
  }

  // Извлекаем URL из объектов изображений
  const images: string[] = extractMediaUrls(place.images);
  
  // Для видео извлекаем не только URL, но и thumbnail/poster для отображения
  // Бэкенд возвращает видео с полями: url, thumbnail, poster, preview
  const videos = place.videos && Array.isArray(place.videos) 
    ? place.videos.map((video: any) => {
        if (typeof video === 'string') {
          return video;
        }
        if (video && typeof video === 'object') {
          // Возвращаем объект с url и poster для использования в PlaceImageSlider
          return {
            url: video.url || video.video_url || null,
            poster: video.poster || video.poster_url || video.thumbnail || video.thumbnail_url || null,
            thumbnail: video.thumbnail || video.thumbnail_url || null,
          };
        }
        return null;
      }).filter((v: any) => v && (typeof v === 'string' || (v.url || v.poster)))
    : [];

  // Отладка для медиа и хештегов
  console.log('Place [id] data:', {
    placeId: place.id,
    rawImages: place.images,
    processedImages: images,
    rawVideos: place.videos,
    processedVideos: videos,
    rawHashtags: place.hashtags,
    hashtagsIsArray: Array.isArray(place.hashtags),
    hashtagsLength: place.hashtags?.length || 0,
    imagesType: typeof place.images,
    videosType: typeof place.videos,
    imagesIsArray: Array.isArray(place.images),
    videosIsArray: Array.isArray(place.videos)
  });

  // Проверка прав - автор и супер-админ могут редактировать/удалять плейсы
  const isSuperAdmin = me?.role === 'super_admin' || me?.user_permissions?.includes('super_admin');
  const canEditOrDelete = isAuthorized && me && (me.id === (place.user && typeof place.user === 'object' ? place.user.id : undefined) || isSuperAdmin);

  // Функция для копирования ссылки
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.title,
          text: place.description,
          url: window.location.href,
        });
      } catch (err) {
        // Пользователь отменил шаринг или произошла ошибка
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: копируем в буфер обмена
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Функция для открытия в новой вкладке
  const handleExternalLink = () => {
    window.open(window.location.href, '_blank');
  };

  // Формируем canonical URL
  // Плейсы не имеют языковых версий, поэтому canonical URL всегда без языкового префикса
  const baseUrl = 'https://treabo.md';
  
  let canonicalUrl = initialMeta?.canonical;
  if (!canonicalUrl || !canonicalUrl.includes('/places/')) {
    if (place?.id) {
      // Всегда без языкового префикса: /places/{id}
      canonicalUrl = `${baseUrl}/places/${place.id}`;
    } else if (typeof window !== 'undefined') {
      // Убираем языковой префикс из текущего URL если есть
      const pathname = window.location.pathname.replace(/^\/[a-z]{2}\//, '/');
      canonicalUrl = window.location.origin + pathname;
    }
  }

  // Формируем описание для SEO
  const seoDescription = initialMeta?.description || (place?.description ? place.description.substring(0, 160).replace(/<[^>]*>/g, '') : '');
  const ogImage = initialMeta?.og_image || (place?.images && place.images.length > 0 ? (place.images[0]?.url || place.images[0]?.thumbnail) : null);

  // Формируем Schema.org JSON-LD структурированные данные
  const getSchemaOrgData = () => {
    if (!place) return null;

    // Получаем главное изображение
    const mainImage = images.length > 0 
      ? (images[0]?.startsWith('http') ? images[0] : `${baseUrl}${images[0]}`)
      : null;

    // Очищаем описание от HTML тегов
    const cleanDescription = place.description 
      ? place.description.replace(/<[^>]*>/g, '').substring(0, 500)
      : '';

    // Базовый объект Schema.org
    const schemaData: any = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: place.title || '',
      url: canonicalUrl || `${baseUrl}/places/${place.id}`,
    };

    // Добавляем описание, если есть
    if (cleanDescription) {
      schemaData.description = cleanDescription;
    }

    // Добавляем изображение, если есть
    if (mainImage) {
      schemaData.image = mainImage;
    }

    // Добавляем автора (создателя плейса)
    if (place.user && place.user.name) {
      schemaData.author = {
        '@type': 'Person',
        name: place.user.name,
      };
    }

    // Добавляем дату создания
    if (place.created_at) {
      schemaData.dateCreated = place.created_at;
    }

    return schemaData;
  };

  const schemaOrgData = getSchemaOrgData();

  return (
    <>
      {/* SEO теги */}
      <TitleSeo 
        title={initialMeta?.title || place?.title || 'Плейс'}
        description={seoDescription}
        canonical={canonicalUrl}
        hreflang={initialMeta?.hreflang}
        ogImage={ogImage}
        ogType="article"
      />
      
      {/* Schema.org структурированные данные */}
      {schemaOrgData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaOrgData, null, 2),
          }}
        />
      )}
      
    <div className="relative w-full min-h-screen bg-light dark:bg-dark">
      {/* CSS анимация для сердца */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes heartPulse {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          15% {
            transform: scale(1.2);
            opacity: 1;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .heart-animation {
          animation: heartPulse 0.6s ease-out;
        }
      `}} />
      {/* ===== CENTER DETAILED PLACE (Desktop) ===== */}
      <div className="hidden lg:flex lg:justify-center w-full min-h-screen py-8">
        {/* Контейнер с Card */}
        <div className="container max-w-6xl mx-auto px-4 md:px-8 w-full">
          <div className="rounded-lg border-none shadow-lg bg-white dark:bg-dark-300 overflow-hidden w-full h-[85vh]">
            <div className="grid md:grid-cols-[2fr_1fr] gap-0 h-full">
              {/* Image Section - Левая колонка (максимальный размер) */}
              <div className="relative bg-light-200 dark:bg-dark-300 h-full">
            {images.length > 0 || videos.length > 0 ? (
              <PlaceImageSlider 
                images={images}
                videos={videos}
                title={place.title || t('text-place')}
                    maxHeight="100%"
                className="h-full w-full"
              />
            ) : (
                  <div className="w-full h-full flex items-center justify-center bg-light-200 dark:bg-dark-300">
                <span className="text-light-base dark:text-dark-base">Нет изображений</span>
              </div>
            )}
          </div>
          
              {/* Content Section - Правая колонка */}
              <div className="p-6 md:p-8 flex flex-col bg-white dark:bg-dark-300 h-full overflow-y-auto">
                {/* Actions - Верхняя секция действий */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {canEditOrDelete && (
                      <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200">
                          <MenuDotsHorizontalIcon className="w-5 h-5" />
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
                          <Menu.Items className="absolute left-0 mt-2 w-40 origin-top-left rounded-md bg-white dark:bg-dark-300 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => setShowEditModal(true)}
                                    className={`${active ? 'bg-light-200 dark:bg-dark-400' : ''} w-full text-left px-4 py-2 text-sm text-dark dark:text-light`}
                                  >
                                    {t('text-edit')}
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className={`${active ? 'bg-light-200 dark:bg-dark-400' : ''} w-full text-left px-4 py-2 text-sm text-red-600`}
                                  >
                                    {t('text-delete')}
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )}
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200"
                      aria-label="Поделиться"
                    >
                      <LinkIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleExternalLink}
                      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200"
                      aria-label="Открыть в новой вкладке"
                    >
                      <ExternalIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleWishlist}
                    className={`rounded-full px-6 py-2 font-semibold transition-colors ${
                      localInWishlist 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-light-200 dark:bg-dark-400 hover:bg-light-300 dark:hover:bg-dark-500 text-dark dark:text-light'
                    } ${wishlistToggling || wishlistChecking ? 'pointer-events-none opacity-60' : ''}`}
                    aria-label={localInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    {localInWishlist ? '❤️ Сохранено' : 'Сохранить'}
                  </button>
                </div>

                {/* Title and Description */}
                <div className="flex-1">
                  {/* H1 - единственный на странице, видимый на desktop */}
                  <h1 className="text-[1.8rem] font-bold mb-4 text-dark dark:text-light">
                    {place.title}
                  </h1>
                  {place.description && (
                    <div className="mb-6">
                      <p className={`text-[0.8rem] text-light-base dark:text-dark-base leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                        {place.description}
                      </p>
                      {place.description && place.description.length > 150 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm text-brand hover:text-brand-dark font-medium transition-colors"
                        >
                          {isDescriptionExpanded ? 'Свернуть' : 'Читать далее'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* User Info */}
                  {place.user && (
                    <div className="flex items-center gap-3 mb-6 p-4 rounded-lg hover:bg-light-100 dark:hover:bg-dark-400 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-light-300 dark:bg-dark-400 flex items-center justify-center overflow-hidden border-2 border-light-400 dark:border-dark-500">
                        {place.user.avatar ? (
                          <Image
                            src={place.user.avatar}
                            alt={place.user.name || 'avatar'}
                            width={48}
                            height={48}
                            className="object-cover w-12 h-12 rounded-full"
                          />
                        ) : (
                          <Image
                            src={avatarPlaceholder}
                            alt="avatar placeholder"
                            width={48}
                            height={48}
                            className="object-cover w-12 h-12 rounded-full"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark dark:text-light">{place.user.name}</p>
                        {place.user.followers_count !== undefined && (
                          <p className="text-sm text-light-base dark:text-dark-base">
                            {place.user.followers_count} followers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Хештеги */}
                  {place.hashtags && Array.isArray(place.hashtags) && place.hashtags.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {place.hashtags
                          .filter((tag) => {
                            if (typeof tag === 'string') return tag.trim().length > 0;
                            if (typeof tag === 'object' && tag !== null) return tag?.name && tag.name.trim().length > 0;
                            return false;
                          })
                          .map((tag, index) => {
                            const tagName = typeof tag === 'string' ? tag.trim() : (tag?.name?.trim() || '');
                            const tagId = typeof tag === 'string' ? `tag-${index}` : (tag?.id ? String(tag.id) : `tag-${index}`);
                            
                            if (!tagName) return null;
                            
                            let tagSlug: string;
                            if (typeof tag === 'object' && tag?.slug) {
                              tagSlug = tag.slug;
                            } else {
                              tagSlug = tagName
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/[^a-z0-9а-яё-]/g, '')
                                .replace(/-+/g, '-')
                                .replace(/^-|-$/g, '');
                            }
                            
                            if (!tagSlug) {
                              tagSlug = tagId;
                            }
                            
                            return (
                              <Link
                                key={tagId}
                                href={routes.placeHashtagUrl(tagSlug)}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors inline-block"
                              >
                                #{tagName}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between gap-6 text-sm text-light-base dark:text-dark-base mb-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 group focus:outline-none transition-colors ${localLiked ? 'text-red-500' : 'text-light-base dark:text-dark-base hover:text-red-500'} ${toggling || likeLoading ? 'pointer-events-none opacity-60' : ''}`}
                      aria-label={localLiked ? t('text-unlike') : t('text-like')}
                    >
                      <HeartIcon
                        className={`w-4 h-4 transition-transform duration-200 ${localLiked ? 'fill-red-500' : 'fill-none stroke-current'}`}
                        strokeWidth={localLiked ? 0 : 1.5}
                        fill={localLiked ? 'currentColor' : 'none'}
                      />
                      <span>{localLikes} лайков</span>
                    </button>
                    {/* Кнопка перехода к товару или Follow */}
                    {place.products && place.products.length > 0 ? (
                      <button
                        onClick={() => {
                          const productSlug = place.products[0].slug;
                          router.push(`/element/${productSlug}`);
                        }}
                        className="float-right px-4 py-2 bg-light-200 dark:bg-dark-400 hover:bg-light-300 dark:hover:bg-dark-500 text-dark dark:text-light rounded-full transition-colors text-sm font-medium"
                      >
                        {t('text-go-to-product')}
                      </button>
                    ) : (
                      userShop && isAuthorized && (
                        <div className="float-right">
                          <FollowButton shop_id={userShop.id} />
                        </div>
                      )
                    )}
                  </div>

                  {/* Comments Section */}
                  {place?.id && (
                    <div className="border-t border-light-300 dark:border-dark-400 pt-6">
                      <h3 className="font-semibold mb-4 text-dark dark:text-light">
                        {t('text-comments')}
                      </h3>
                      <PlaceCommentsWrapper placeId={place.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE VERSION (Tablets & Phones) ===== */}
      <div className="lg:hidden w-full overflow-x-hidden">
        {/* Фото с оригинальным соотношением сторон */}
        <div 
          className="w-full relative select-none"
          onTouchStart={handleDoubleTap}
          onDoubleClick={handleDoubleTap}
          style={{ touchAction: 'manipulation' }}
        >
          {/* Кнопка "Назад" для мобильных (поверх изображения) */}
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className={cn(
              "absolute top-4 left-4 z-30 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg transition-all duration-200",
              "hover:bg-white active:scale-95 touch-manipulation",
              "flex items-center justify-center",
              "min-w-[48px] min-h-[48px]", // Минимальная зона нажатия для пальца
            )}
            aria-label="Назад"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft className="h-6 w-6 text-dark dark:text-light" />
          </button>

          {images.length > 0 || videos.length > 0 ? (
            <>
              <PlaceImageSlider 
                images={images}
                videos={videos}
                title={place.title || t('text-place')}
                className="w-full"
                preserveAspectRatio={true}
              />
              {/* Анимация сердца при двойном нажатии (как в Instagram) */}
              {showHeartAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                  <div className="heart-animation">
                    <HeartIcon className="w-24 h-24 text-red-500 fill-red-500" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-[400px] flex items-center justify-center bg-light-200 dark:bg-dark-300">
              <span className="text-light-base dark:text-dark-base">Нет изображений</span>
            </div>
          )}
        </div>

        {/* Информация на весь экран */}
        <div className="w-full bg-white dark:bg-dark-300">
          <div className="p-4 md:p-6 flex flex-col">
            {/* Actions - Верхняя секция действий */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {canEditOrDelete && (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200">
                      <MenuDotsHorizontalIcon className="w-5 h-5" />
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
                      <Menu.Items className="absolute left-0 mt-2 w-40 origin-top-left rounded-md bg-white dark:bg-dark-300 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setShowEditModal(true)}
                                className={`${active ? 'bg-light-200 dark:bg-dark-400' : ''} w-full text-left px-4 py-2 text-sm text-dark dark:text-light`}
                              >
                                {t('text-edit')}
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className={`${active ? 'bg-light-200 dark:bg-dark-400' : ''} w-full text-left px-4 py-2 text-sm text-red-600`}
                              >
                                {t('text-delete')}
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200"
                  aria-label="Поделиться"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExternalLink}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-light-200 dark:hover:bg-dark-400 text-dark dark:text-light focus:outline-none transition-all duration-200"
                  aria-label="Открыть в новой вкладке"
                >
                  <ExternalIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleWishlist}
                className={`rounded-full px-6 py-2 font-semibold transition-colors ${
                  localInWishlist 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-light-200 dark:bg-dark-400 hover:bg-light-300 dark:hover:bg-dark-500 text-dark dark:text-light'
                } ${wishlistToggling || wishlistChecking ? 'pointer-events-none opacity-60' : ''}`}
                aria-label={localInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                {localInWishlist ? '❤️ Сохранено' : 'Сохранить'}
              </button>
          </div>
          
            {/* Title and Description */}
            <div className="flex-1">
              {/* H2 для mobile - чтобы избежать дублирования H1 (H1 уже есть в desktop версии выше) */}
              <h2 className="text-[1.8rem] font-bold mb-4 text-dark dark:text-light">
                    {place.title}
                  </h2>
                  {place.description && (
                <div className="mb-6">
                  <p className={`text-[0.8rem] text-light-base dark:text-dark-base leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                        {place.description}
                      </p>
                  {place.description && place.description.length > 150 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm text-brand hover:text-brand-dark font-medium transition-colors"
                        >
                          {isDescriptionExpanded ? 'Свернуть' : 'Читать далее'}
                        </button>
                      )}
                    </div>
                  )}

              {/* User Info */}
                {place.user && (
                <div className="flex items-center gap-3 mb-6 p-4 rounded-lg hover:bg-light-100 dark:hover:bg-dark-400 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-light-300 dark:bg-dark-400 flex items-center justify-center overflow-hidden border-2 border-light-400 dark:border-dark-500">
                      {place.user.avatar ? (
                        <Image
                          src={place.user.avatar}
                          alt={place.user.name || 'avatar'}
                          width={48}
                          height={48}
                          className="object-cover w-12 h-12 rounded-full"
                        />
                      ) : (
                        <Image
                          src={avatarPlaceholder}
                          alt="avatar placeholder"
                          width={48}
                          height={48}
                          className="object-cover w-12 h-12 rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                    <p className="font-semibold text-dark dark:text-light">{place.user.name}</p>
                    {place.user.followers_count !== undefined && (
                      <p className="text-sm text-light-base dark:text-dark-base">
                        {place.user.followers_count} followers
                      </p>
                    )}
                    </div>
                  </div>
                )}

                {/* Хештеги */}
                {place.hashtags && Array.isArray(place.hashtags) && place.hashtags.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {place.hashtags
                        .filter((tag) => {
                          if (typeof tag === 'string') return tag.trim().length > 0;
                          if (typeof tag === 'object' && tag !== null) return tag?.name && tag.name.trim().length > 0;
                          return false;
                        })
                        .map((tag, index) => {
                          const tagName = typeof tag === 'string' ? tag.trim() : (tag?.name?.trim() || '');
                          const tagId = typeof tag === 'string' ? `tag-${index}` : (tag?.id ? String(tag.id) : `tag-${index}`);
                          
                          if (!tagName) return null;
                          
                          let tagSlug: string;
                          if (typeof tag === 'object' && tag?.slug) {
                            tagSlug = tag.slug;
                          } else {
                            tagSlug = tagName
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9а-яё-]/g, '')
                              .replace(/-+/g, '-')
                              .replace(/^-|-$/g, '');
                          }
                          
                          if (!tagSlug) {
                            tagSlug = tagId;
                          }
                          
                          return (
                            <Link
                              key={tagId}
                              href={routes.placeHashtagUrl(tagSlug)}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors inline-block"
                            >
                              #{tagName}
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Stats */}
              <div className="flex items-center justify-between gap-6 text-sm text-light-base dark:text-dark-base mb-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 group focus:outline-none transition-colors ${localLiked ? 'text-red-500' : 'text-light-base dark:text-dark-base hover:text-red-500'} ${toggling || likeLoading ? 'pointer-events-none opacity-60' : ''}`}
                      aria-label={localLiked ? t('text-unlike') : t('text-like')}
                    >
                      <HeartIcon
                        className={`w-4 h-4 transition-transform duration-200 ${localLiked ? 'fill-red-500' : 'fill-none stroke-current'}`}
                        strokeWidth={localLiked ? 0 : 1.5}
                        fill={localLiked ? 'currentColor' : 'none'}
                      />
                      <span>{localLikes} лайков</span>
                    </button>
                  </div>
                  {/* Кнопка перехода к товару или Follow */}
                  {place.products && place.products.length > 0 ? (
                    <button
                      onClick={() => {
                        const productSlug = place.products[0].slug;
                        router.push(`/products/${productSlug}`);
                      }}
                      className="float-right px-4 py-2 bg-light-200 dark:bg-dark-400 hover:bg-light-300 dark:hover:bg-dark-500 text-dark dark:text-light rounded-full transition-colors text-sm font-medium"
                    >
                      {t('text-go-to-product')}
                    </button>
                  ) : (
                    userShop && isAuthorized && (
                      <div className="float-right">
                        <FollowButton shop_id={userShop.id} />
                      </div>
                    )
                  )}
                </div>

              {/* Comments Section */}
                {place?.id && (
                  <div className="border-t border-light-300 dark:border-dark-400 pt-6">
                    <h3 className="font-semibold mb-4 text-dark dark:text-light">
                      {t('text-comments')}
                    </h3>
                    <PlaceCommentsWrapper placeId={place.id} />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== SIMILAR PLACES GRID (Full Width Below) ===== */}
      <main className="w-full px-4 py-0 lg:px-8 lg:py-6">

        {/* Masonry — прям как Pinterest */}
        <SimilarPlaces
          currentPlaceId={String(place.id || '')}
          currentPlaceTitle={place.title || ''}
        />
      </main>
      
      {/* Модальные окна на уровне всего документа */}
      {showEditModal && (
        <CreatePlaceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={place}
          mode="edit"
        />
      )}
      
      {/* Отладочная информация */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'black', color: 'white', padding: '10px', zIndex: 10000, fontSize: '12px' }}>
          <div>Modal Open: {showEditModal.toString()}</div>
          <div>Place ID: {place?.id}</div>
          <div>Place Title: {place?.title}</div>
          <div>Images: {place?.images?.length || 0}</div>
          <div>Hashtags: {place?.hashtags?.length || 0}</div>
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-dark-300 rounded-lg p-6 shadow-lg">
            <div className="mb-4 text-lg font-semibold">{t('text-confirm-delete')}</div>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 rounded bg-light-200 dark:bg-dark-400 text-dark dark:text-light"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('text-cancel')}
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => { 
                  setShowDeleteConfirm(false); 
                  deletePlace(place.id);
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? t('text-deleting') : t('text-delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

PlaceDetailPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const locale = context.locale || context.defaultLocale || 'ru';
  const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.treabo.md';
  
  try {
    // Добавляем timeout для fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout
    
    const res = await fetch(`${apiUrl}/places/${id}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`API вернул статус ${res.status}: ${res.statusText}`);
    }
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e, 'Response text:', text);
      return { 
        props: { 
          error: 'API вернул невалидный JSON',
          ...(await serverSideTranslations(locale, ['common']))
        } 
      };
    }
    
    // Проверяем, что data существует и имеет нужную структуру
    if (!data) {
      throw new Error('API вернул пустые данные');
    }
    
    return {
      props: {
        place: data.data || data,
        meta: data.meta || {},
        ...(await serverSideTranslations(locale, ['common']))
      },
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    
    // Обрабатываем разные типы ошибок
    let errorMessage = 'Произошла ошибка при загрузке данных';
    if (error.name === 'AbortError') {
      errorMessage = 'Превышено время ожидания ответа от сервера';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      props: { 
        error: errorMessage,
        ...(await serverSideTranslations(locale, ['common']))
      } 
    };
  }
};

export default PlaceDetailPage; 