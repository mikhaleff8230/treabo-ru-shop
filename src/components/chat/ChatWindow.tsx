import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/data/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { usePusher } from '@/hooks/usePusher';
import { useMe } from '@/data/user';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);
dayjs.locale('ru');

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  body: string;
  read_at: string | null;
  attachments?: Array<{
    id: string;
    file_path: string;
    file_type: string;
    file_name: string;
    file_size: number;
  }>;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  title?: string;
  type: 'private' | 'group';
  user?: {
    id: string;
    name: string;
  };
  shop?: {
    id: string;
    name: string;
  };
}

interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation;
  messages: Message[];
  loading?: boolean;
}

export default function ChatWindow({
  conversationId,
  conversation,
  messages,
  loading,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { me } = useMe();

  // Subscribe to Pusher channel
  usePusher(`conversation.${conversationId}`, 'message.sent', (data: Message) => {
    queryClient.setQueryData(['chat-messages', conversationId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        messages: [...oldData.messages, data],
      };
    });
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation(
    (data: { body?: string; attachments?: File[] }) =>
      client.chat.sendMessage({
        conversation_id: conversationId,
        body: data.body,
        attachments: data.attachments,
      }),
    {
      onSuccess: () => {
        setMessageText('');
        setSelectedFiles([]);
        queryClient.invalidateQueries(['chat-messages', conversationId]);
        queryClient.invalidateQueries(['chat-conversations']);
      },
      onError: (error: any) => {
        console.error('Error sending message:', error);
        toast.error(error?.response?.data?.message || 'Ошибка при отправке сообщения');
      },
    }
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем валидность conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      console.error('Invalid conversationId:', conversationId);
      toast.error('Ошибка: неверный ID диалога');
      return;
    }
    
    if (!messageText.trim() && selectedFiles.length === 0) return;

    sendMessageMutation.mutate({
      body: messageText,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getConversationName = () => {
    if (conversation?.title) return conversation.title;
    if (conversation?.type === 'private') {
      return conversation.user?.name || conversation.shop?.name || 'Безымянный диалог';
    }
    return 'Групповой чат';
  };

  const currentUserId = me?.id;

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">{getConversationName()}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Нет сообщений. Начните общение!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {message.user.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="mt-2">
                          {attachment.file_type === 'image' ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/storage/${attachment.file_path}`}
                              alt={attachment.file_name}
                              className="max-w-full rounded-lg"
                            />
                          ) : (
                            <a
                              href={`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/storage/${attachment.file_path}`}
                              download
                              className="text-sm underline hover:no-underline"
                            >
                              📎 {attachment.file_name}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-75">
                    {dayjs(message.created_at).format('HH:mm')}
                    {message.read_at && isOwn && ' ✓✓'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center space-x-2"
              >
                <span>{file.name}</span>
                <button
                  onClick={() =>
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
          >
            📎
          </label>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sendMessageMutation.isLoading || (!messageText.trim() && selectedFiles.length === 0)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

