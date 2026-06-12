import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

interface Conversation {
  id: string;
  title?: string;
  type: 'private' | 'group';
  latest_message?: {
    id: string;
    body: string;
    created_at: string;
    user?: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  shop?: {
    id: string;
    name: string;
  };
  unseen?: number;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  loading,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.user?.name.toLowerCase().includes(query) ||
      conv.shop?.name.toLowerCase().includes(query) ||
      conv.latest_message?.body.toLowerCase().includes(query)
    );
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.type === 'private') {
      return conv.user?.name || conv.shop?.name || 'Безымянный диалог';
    }
    return 'Групповой чат';
  };

  const getConversationAvatar = (conv: Conversation) => {
    // Простой аватар на основе имени
    const name = getConversationName(conv);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Сообщения</h2>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Поиск диалогов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            {searchQuery ? (
              <div className="text-gray-500">
                <p className="text-sm">Диалоги не найдены</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет диалогов</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs">
                  Начните общение с продавцом, перейдя на страницу его магазина и нажав кнопку "Написать продавцу"
                </p>
                <a
                  href="/authors"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Перейти к магазинам
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                      {getConversationAvatar(conv)}
                    </div>
                    {conv.unseen && conv.unseen > 0 && (
                      <div className="relative -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unseen > 9 ? '9+' : conv.unseen}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getConversationName(conv)}
                      </p>
                      {conv.latest_message && (
                        <p className="text-xs text-gray-500 ml-2">
                          {dayjs(conv.latest_message.created_at).fromNow()}
                        </p>
                      )}
                    </div>
                    {conv.latest_message && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conv.latest_message.user?.name && (
                          <span className="font-medium">
                            {conv.latest_message.user.name}:{' '}
                          </span>
                        )}
                        {conv.latest_message.body}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}









