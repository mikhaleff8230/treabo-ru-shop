import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/data/client';
import { useMe } from '@/data/user';
import { useModalAction } from '@/components/modal-views/context';
import Button from '@/components/ui/button';
import { CommentIcon } from '@/components/icons/comment-icon';
import { PaperPlaneIcon } from '@/components/icons/paper-plane-icon';
import toast from 'react-hot-toast';

interface ChatButtonProps {
  shopId?: string;
  shopSlug?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function ChatButton({ 
  shopId, 
  shopSlug, 
  variant = 'button',
  className = '' 
}: ChatButtonProps) {
  const router = useRouter();
  const { me, isAuthorized } = useMe();
  const { openModal } = useModalAction();
  const queryClient = useQueryClient();

  // Mutation для создания диалога
  const createConversationMutation = useMutation(
    (shopId: string) => client.chat.createConversation(shopId),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['chat-conversations']);
        
        // HttpClient.get/post возвращает response.data, поэтому response уже содержит данные
        // API возвращает { id, user_id, shop_id, ... }
        const conversationId = response?.id || response?.data?.id;
        
        if (conversationId) {
          router.push(`/chat?id=${conversationId}`);
        } else {
          console.error('Conversation ID not found in response:', response);
          toast.error('Ошибка: не удалось получить ID диалога');
        }
      },
      onError: (error: any) => {
        console.error('Error creating conversation:', error);
        toast.error(error?.response?.data?.message || 'Ошибка при создании диалога');
      },
    }
  );

  const handleChatClick = async () => {
    // Если не авторизован - показываем форму входа
    if (!isAuthorized) {
      openModal('LOGIN_VIEW');
      return;
    }

    // Если есть shopId - создаем диалог
    if (shopId) {
      try {
        // Сначала проверяем, есть ли уже диалог с этим магазином
        const conversationsResponse = await client.chat.conversations();
        // Обрабатываем разные структуры ответа
        const conversationsList = conversationsResponse?.data?.data || 
                                  conversationsResponse?.data || 
                                  conversationsResponse?.conversations || 
                                  conversationsResponse || [];
        const conversations = Array.isArray(conversationsList) ? conversationsList : [];
        
        const existingConversation = conversations.find(
          (conv: any) => conv.shop_id === shopId || conv.shop_id === parseInt(shopId)
        );

        if (existingConversation && existingConversation.id) {
          // Если диалог уже есть - переходим к нему
          router.push(`/chat?id=${existingConversation.id}`);
        } else {
          // Создаем новый диалог
          createConversationMutation.mutate(shopId);
        }
      } catch (error) {
        console.error('Error checking conversations:', error);
        // Если ошибка - все равно пытаемся создать диалог
        createConversationMutation.mutate(shopId);
      }
    } else {
      // Если нет shopId - просто переходим в чат
      router.push('/chat');
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="icon"
        aria-label="Chat"
        className={className}
        onClick={handleChatClick}
      >
        <CommentIcon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      className={className}
      onClick={handleChatClick}
      disabled={createConversationMutation.isLoading}
    >
      <PaperPlaneIcon className="h-4 w-4 mr-2" />
      {createConversationMutation.isLoading ? 'Открываем...' : 'Написать продавцу'}
    </Button>
  );
}

