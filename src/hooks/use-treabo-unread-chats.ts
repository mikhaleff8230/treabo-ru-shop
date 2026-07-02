import { useEffect, useMemo, useState } from 'react';
import Pusher from 'pusher-js';
import { fetchTreaboChats, type TreaboChat } from '@/data/treabo';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('treabo_token');
}

function getPusherOptions(token: string) {
  const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME || 'https';
  const port = Number(process.env.NEXT_PUBLIC_PUSHER_PORT || (scheme === 'https' ? 443 : 6001));
  const forceTLS = scheme === 'https' || port === 443;

  return {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || 'api.treabo.ru',
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: forceTLS ? ['wss'] : ['ws', 'wss'],
    authEndpoint:
      process.env.NEXT_PUBLIC_TREABO_BROADCAST_AUTH_ENDPOINT ||
      (typeof window !== 'undefined' && window.location.hostname.includes('treabo.ru')
        ? 'https://api.treabo.ru/api/broadcasting/auth'
        : 'http://127.0.0.1:8001/api/broadcasting/auth'),
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  };
}

export function useTreaboUnreadChats(active = true) {
  const [chats, setChats] = useState<TreaboChat[]>([]);

  const unreadCount = useMemo(
    () => chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0),
    [chats],
  );

  async function refresh() {
    const token = getToken();
    if (!token || !active) {
      setChats([]);
      return;
    }
    try {
      setChats(await fetchTreaboChats(token));
    } catch {
      // Header badges should never break page rendering.
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const token = getToken();
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    if (!token || !key || !active || chats.length === 0) return undefined;

    const pusher = new Pusher(key, getPusherOptions(token));
    const channels = chats.map((chat) => {
      const channel = pusher.subscribe(`private-proffi.chat.${chat.id}`);
      const onMessage = () => refresh();
      const onRead = () => refresh();
      channel.bind('message.sent', onMessage);
      channel.bind('.message.sent', onMessage);
      channel.bind('messages.read', onRead);
      channel.bind('.messages.read', onRead);
      return { id: chat.id, channel };
    });

    return () => {
      channels.forEach(({ id, channel }) => {
        channel.unbind_all();
        pusher.unsubscribe(`private-proffi.chat.${id}`);
      });
      pusher.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, chats.map((chat) => chat.id).join('|')]);

  return { unreadCount, refresh };
}
