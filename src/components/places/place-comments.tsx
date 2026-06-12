import { useState } from 'react';
import { useMe } from '@/data/user';
import { usePlaceComments, useCreatePlaceComment, useUpdatePlaceComment, useDeletePlaceComment, PlaceComment } from '@/data/place-comments';
import { useModalAction } from '@/components/modal-views/context';
import Image from 'next/image';
import avatarPlaceholder from '@/assets/images/placeholders/avatar.svg';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/text-area';
import Loader from '@/components/ui/loader/spinner/spinner';

interface PlaceCommentsProps {
  placeId: string | number;
}

// ✅ ПРОБЛЕМА №1 ИСПРАВЛЕНА: Валидация placeId ДО вызова хуков
export default function PlaceComments(props: PlaceCommentsProps) {
  const placeIdStr = String(props.placeId || '');

  // ✅ Логируем для отладки
  console.log('PlaceComments: компонент рендерится', {
    placeId: props.placeId,
    placeIdStr,
    type: typeof props.placeId,
  });

  // Ранняя валидация - если placeId невалиден, возвращаем null БЕЗ вызова хуков
  if (
    !props.placeId ||
    placeIdStr === 'undefined' ||
    placeIdStr === 'null' ||
    placeIdStr === '' ||
    isNaN(Number(placeIdStr)) ||
    Number(placeIdStr) <= 0
  ) {
    console.warn('PlaceComments: placeId невалиден, компонент не рендерится', {
      placeId: props.placeId,
      placeIdStr,
    });
    return null;
  }

  console.log('PlaceComments: placeId валиден, рендерим PlaceCommentsInner', {
    placeId: placeIdStr,
  });

  // Только если placeId валиден, рендерим внутренний компонент с хуками
  return <PlaceCommentsInner placeId={placeIdStr} />;
}

// ✅ ПРОБЛЕМА №2 ИСПРАВЛЕНА: useMe() должен быть защищен внутри самого хука
function PlaceCommentsInner({ placeId }: { placeId: string }) {
  // ✅ Логируем для отладки
  console.log('PlaceCommentsInner: компонент рендерится', {
    placeId,
    type: typeof placeId,
  });

  // useMe должен быть защищен от SSR внутри самого хука useMe()
  const { me, isAuthorized } = useMe();
  const { openModal } = useModalAction();

  // ✅ Теперь хуки вызываются ТОЛЬКО с валидным placeId (не пустой строкой)
  console.log('PlaceCommentsInner: вызываем usePlaceComments', {
    placeId,
    enabled: true,
  });
  
  const { comments, isLoading, error, refetch } = usePlaceComments(placeId, true);
  
  console.log('PlaceCommentsInner: usePlaceComments результат', {
    placeId,
    isLoading,
    hasError: !!error,
    commentsCount: comments?.length || 0,
    errorMessage: error?.message,
  });
  const { createComment, isLoading: isCreating } = useCreatePlaceComment(placeId);
  const { updateComment, isLoading: isUpdating } = useUpdatePlaceComment(placeId);
  const { deleteComment, isLoading: isDeleting } = useDeletePlaceComment(placeId);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    if (!isAuthorized) {
      openModal('LOGIN_VIEW');
      return;
    }

    const commentText = newComment.trim();
    setNewComment('');
    createComment({ comment: commentText } as any);
  };

  // ✅ ПРОБЛЕМА №5 ИСПРАВЛЕНА: Приводим comment.id к строке
  const handleEdit = (comment: PlaceComment) => {
    setEditingId(String(comment.id));
    setEditText(comment.comment || '');
  };

  const handleUpdate = (commentId: string | number) => {
    if (!editText.trim()) return;
    
    const commentText = editText.trim();
    setEditingId(null);
    setEditText('');
    updateComment({ comment_id: String(commentId), comment: commentText } as any);
  };

  const handleDelete = (commentId: string | number) => {
    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      deleteComment(String(commentId) as any);
    }
  };

  // ✅ ПРОБЛЕМА №3 ИСПРАВЛЕНА: Безопасный formatDate
  const formatDate = (date?: string | null) => {
    if (!date) return '';
    try {
      const dateObj = dayjs(date);
      if (!dateObj.isValid()) return '';
      return dateObj.fromNow();
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader showText={false} />
      </div>
    );
  }

  // Логируем ошибку, но не блокируем интерфейс
  if (error) {
    console.error('PlaceComments error:', error);
    console.error('Error details:', {
      message: error?.message,
      response: (error as any)?.response?.data,
      status: (error as any)?.response?.status,
    });
  }

  return (
    <div className="space-y-6">
      {/* Показываем ошибку, если есть, но не блокируем интерфейс */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Ошибка загрузки комментариев. {error?.message || 'Попробуйте обновить страницу.'}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Форма добавления комментария */}
      {isAuthorized ? (
        <div className="space-y-3">
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            rows={3}
            className="w-full"
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isCreating}
            className="ml-auto"
          >
            {isCreating ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-light-base dark:text-dark-base mb-3">
            Войдите, чтобы оставить комментарий
          </p>
          <Button onClick={() => openModal('LOGIN_VIEW')}>
            Войти
          </Button>
        </div>
      )}

      {/* Список комментариев */}
      <div className="space-y-4">
        {!comments || !Array.isArray(comments) || comments.length === 0 ? (
          <p className="text-center text-light-base dark:text-dark-base py-8">
            Пока нет комментариев. Будьте первым!
          </p>
        ) : (
          comments
            .filter((comment) => comment && comment.id) // Фильтруем некорректные комментарии
            .map((comment) => (
            <CommentItem
              key={String(comment.id)} // ✅ ПРОБЛЕМА №5: Приводим к строке
              comment={comment}
              currentUserId={me?.id}
              isAuthorized={isAuthorized}
              isEditing={editingId === String(comment.id)} // ✅ ПРОБЛЕМА №5: Сравниваем строки
              editText={editText}
              onEditTextChange={setEditText}
              onEdit={() => handleEdit(comment)}
              onUpdate={() => handleUpdate(comment.id)}
              onCancel={() => {
                setEditingId(null);
                setEditText('');
              }}
              onDelete={() => handleDelete(comment.id)}
              formatDate={formatDate}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: PlaceComment;
  currentUserId?: string;
  isAuthorized: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onEdit: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  onDelete: () => void;
  formatDate: (date?: string | null) => string;
  isDeleting: boolean;
}

// ✅ ПРОБЛЕМА №4 ИСПРАВЛЕНА: Безопасный Image src
function getSafeAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar || typeof avatar !== 'string') {
    return avatarPlaceholder;
  }
  
  // Проверяем, что это валидный URL (http/https)
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // Если это относительный путь, можно разрешить (но лучше использовать placeholder)
  // Для безопасности используем placeholder
  return avatarPlaceholder;
}

function CommentItem({
  comment,
  currentUserId,
  isAuthorized,
  isEditing,
  editText,
  onEditTextChange,
  onEdit,
  onUpdate,
  onCancel,
  onDelete,
  formatDate,
  isDeleting,
}: CommentItemProps) {
  // Защита от некорректных данных
  if (!comment || !comment.id) {
    return null;
  }
  
  const isOwner = currentUserId === comment.user_id;
  const safeAvatar = getSafeAvatarUrl(comment.user?.avatar);

  return (
    <div className="border-b border-light-300 dark:border-dark-400 pb-4 last:border-0">
      <div className="flex gap-3">
        {/* Аватар */}
        <div className="w-10 h-10 rounded-full bg-light-300 dark:bg-dark-400 flex items-center justify-center overflow-hidden flex-shrink-0">
          <Image
            src={safeAvatar}
            alt={comment.user?.name || 'avatar'}
            width={40}
            height={40}
            className="object-cover w-10 h-10 rounded-full"
          />
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-dark dark:text-light text-sm">
                {comment.user?.name || 'Аноним'}
              </p>
              <p className="text-xs text-light-base dark:text-dark-base">
                {formatDate(comment.created_at)}
              </p>
            </div>

            {/* Действия */}
            {isAuthorized && isOwner && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={onEdit}
                      className="text-xs text-brand hover:text-brand-dark"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onUpdate}
                      className="text-xs text-brand hover:text-brand-dark"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={onCancel}
                      className="text-xs text-light-base dark:text-dark-base"
                    >
                      Отмена
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Текст комментария */}
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <TextArea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
          ) : (
            <p className="text-sm text-dark dark:text-light whitespace-pre-wrap break-words">
              {comment.comment || ''}
            </p>
          )}

          {/* Ответы (если есть) */}
          {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 space-y-3 border-l-2 border-light-300 dark:border-dark-400 pl-4">
              {comment.replies
                .filter((reply) => reply && reply.id && reply.user) // Фильтруем некорректные ответы
                .map((reply) => {
                  const safeReplyAvatar = getSafeAvatarUrl(reply.user?.avatar);
                  return (
                    <div key={String(reply.id)} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-light-300 dark:bg-dark-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image
                          src={safeReplyAvatar}
                          alt={reply.user?.name || 'avatar'}
                          width={32}
                          height={32}
                          className="object-cover w-8 h-8 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark dark:text-light text-xs">
                          {reply.user?.name || 'Аноним'}
                        </p>
                        <p className="text-xs text-light-base dark:text-dark-base mb-1">
                          {formatDate(reply.created_at)}
                        </p>
                        <p className="text-sm text-dark dark:text-light whitespace-pre-wrap break-words">
                          {reply.comment || ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
